import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
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

  const prompt = `You are LUMI, a wellness AI. Write a 2-3 sentence personal daily insight for ${profile?.name || 'this person'}.

Data: ${totalCals}/${profile?.calorie_goal || 2000} kcal today. Dominant mood: ${dominantMood || 'unknown'}. Themes: ${topPatterns.join(', ') || 'getting started'}.

Be warm, specific, poetic but grounded. Don't start with their name or "Hey".`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
      }),
    });

    const data = await response.json();
    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Every day is a new chance to move forward.';
    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
