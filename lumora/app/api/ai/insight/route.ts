import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'api_key_missing' }, { status: 503 });
  }

  const { profileId } = await req.json();
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const [{ data: profile }, { data: foodLogs }, { data: recentMoods }] = await Promise.all([
    supabase.from('profiles').select('name, ai_memory, calorie_goal').eq('id', profileId).single(),
    supabase.from('food_logs').select('calories').eq('user_id', profileId).gte('logged_at', today),
    supabase.from('journal_entries').select('mood').eq('user_id', profileId).not('mood', 'is', null).order('created_at', { ascending: false }).limit(7),
  ]);

  const totalCals = foodLogs?.reduce((s: number, l: any) => s + (l.calories || 0), 0) || 0;
  const memory = profile?.ai_memory || {};
  const moodCounts: Record<string, number> = {};
  recentMoods?.forEach((m: any) => { if (m.mood) moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topPatterns = Object.entries(memory.patterns || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  const prompt = `Write a 2-3 sentence personal daily wellness insight for ${profile?.name || 'this person'}.
Data: ${totalCals}/${profile?.calorie_goal || 2000} kcal today. Dominant mood: ${dominantMood || 'unknown'}. Main topics: ${topPatterns.join(', ') || 'just starting out'}.
Be warm, specific, and poetic but grounded. Don't start with their name or "Hey".`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || 'Every day is a new chance to move forward.';
    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
