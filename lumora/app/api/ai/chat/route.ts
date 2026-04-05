import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

const LUMI_SYSTEM = (name: string, memory: any) => `
You are LUMI, a compassionate AI wellness companion built into Lumora.

USER: ${name}
Patterns: ${JSON.stringify(memory?.patterns || {})}
Recent moods: ${JSON.stringify(memory?.mood_history?.slice(-5) || [])}

PERSONALITY:
- Warm, honest, direct — never sycophantic
- Reference past patterns naturally
- Adapt tone to emotional state
- ONE follow-up question max per reply
- Under 150 words unless needed
- If crisis: iCall India 9152987821

End every reply with EMOTION:<word> on new line.
Options: happy, calm, sad, anxious, angry, grateful, confused, hopeful, neutral`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'api_key_missing' }, { status: 503 });
  }

  const { userId, message, userName } = await req.json();
  const supabase = createClient();

  const { data: profile } = await supabase.from('profiles').select('ai_memory, name').eq('id', userId).single();
  const memory = profile?.ai_memory || {};
  const name = userName || profile?.name || 'friend';

  const { data: history } = await supabase.from('chat_messages').select('role, content').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
  const conversationHistory = (history || []).reverse();

  const contents = [
    { role: 'user', parts: [{ text: LUMI_SYSTEM(name, memory) }] },
    { role: 'model', parts: [{ text: 'Understood. I am LUMI, ready to support.' }] },
    ...conversationHistory.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 500, temperature: 0.8 } }),
    });

    const data = await response.json();
    const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here with you.";
    const emotionMatch = rawReply.match(/EMOTION:(\w+)/);
    const emotion = emotionMatch ? emotionMatch[1].toLowerCase() : 'neutral';
    const reply = rawReply.replace(/\nEMOTION:\w+/g, '').trim();

    updateMemory(supabase, userId, message, emotion, memory).catch(() => {});
    return NextResponse.json({ reply, emotion });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}

async function updateMemory(supabase: any, userId: string, userMsg: string, emotion: string, currentMemory: any) {
  const moodHistory = currentMemory.mood_history || [];
  moodHistory.push({ emotion, date: new Date().toISOString().split('T')[0], snippet: userMsg.slice(0, 60) });
  if (moodHistory.length > 30) moodHistory.shift();
  const patterns = currentMemory.patterns || {};
  ['work','sleep','anxiety','exercise','diet','family','stress','motivation'].forEach(kw => {
    if (userMsg.toLowerCase().includes(kw)) patterns[kw] = (patterns[kw] || 0) + 1;
  });
  await supabase.from('profiles').update({ ai_memory: { ...currentMemory, mood_history: moodHistory, patterns } }).eq('id', userId);
}
