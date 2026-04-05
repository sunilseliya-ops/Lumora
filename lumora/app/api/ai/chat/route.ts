import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const GEMINI_URL = `https://generativelanguage.googleapis.com//v1/models/gemini-1.5-flash:generateContent`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'api_key_missing' }, { status: 503 });
  }

  const { userId, message, userName } = await req.json();
  const supabase = createClient();

  const { data: profile } = await supabase.from('profiles').select('ai_memory, name').eq('id', userId).single();
  const memory = profile?.ai_memory || {};
  const name = userName || profile?.name || 'friend';

  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(16);

  const conversationHistory = (history || []).reverse();

  // Build alternating user/model messages (Gemini requirement)
  const contents: any[] = [];
  conversationHistory.forEach((m: any) => {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  });
  contents.push({ role: 'user', parts: [{ text: message }] });

  // Use systemInstruction (correct Gemini approach)
  const systemInstruction = {
    parts: [{
      text: `You are LUMI, a warm and honest AI wellness companion in the Lumora app.

User's name: ${name}
Their recent mood patterns: ${JSON.stringify(memory?.mood_history?.slice(-5) || [])}
Topics they often discuss: ${Object.keys(memory?.patterns || {}).join(', ') || 'just getting started'}

How to respond:
- Be warm, caring, and genuine — never robotic
- Keep replies under 120 words
- Reference their patterns naturally when relevant
- Ask ONE thoughtful follow-up question
- If they seem in crisis, share: iCall India 9152987821
- Never just say "I'm here with you" — always engage meaningfully

After your response, on a new line write: EMOTION:<word>
Choose from: happy, calm, sad, anxious, angry, grateful, hopeful, neutral`
    }]
  };

  try {
    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: systemInstruction,
        contents,
        generationConfig: { maxOutputTokens: 400, temperature: 0.85 },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawReply) {
      return NextResponse.json({ reply: "Tell me more — I'm genuinely listening.", emotion: 'neutral' });
    }

    const emotionMatch = rawReply.match(/EMOTION:(\w+)/i);
    const emotion = emotionMatch ? emotionMatch[1].toLowerCase() : 'neutral';
    const reply = rawReply.replace(/\nEMOTION:\w+/gi, '').trim();

    updateMemory(supabase, userId, message, emotion, memory).catch(() => {});
    return NextResponse.json({ reply, emotion });
  } catch (error: any) {
    console.error('LUMI error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}

async function updateMemory(supabase: any, userId: string, userMsg: string, emotion: string, currentMemory: any) {
  const moodHistory = currentMemory.mood_history || [];
  moodHistory.push({ emotion, date: new Date().toISOString().split('T')[0], snippet: userMsg.slice(0, 60) });
  if (moodHistory.length > 30) moodHistory.shift();
  const patterns = currentMemory.patterns || {};
  ['work','sleep','anxiety','exercise','diet','family','stress','motivation','food','health'].forEach(kw => {
    if (userMsg.toLowerCase().includes(kw)) patterns[kw] = (patterns[kw] || 0) + 1;
  });
  await supabase.from('profiles').update({ ai_memory: { ...currentMemory, mood_history: moodHistory, patterns } }).eq('id', userId);
}
