import { NextRequest, NextResponse } from 'next/server';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'api_key_missing' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { message, userName, history, memory } = body;
    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 });

    const name = userName || 'friend';
    const userMemory = memory || {};
    const conversationHistory = history || [];

    const systemPrompt = `You are LUMI, a warm and caring AI wellness companion in the Lumora app.
User: ${name}
Their recent moods: ${JSON.stringify(userMemory?.mood_history?.slice(-3) || [])}
Topics they discuss: ${Object.keys(userMemory?.patterns || {}).slice(0, 5).join(', ') || 'just getting started'}

Be warm, genuine, supportive. Keep replies under 120 words. Ask ONE follow-up question.
If crisis mention: iCall India 9152987821.
End your reply with: EMOTION:<word> (happy/calm/sad/anxious/angry/grateful/hopeful/neutral)`;

    // Build contents — system as first user/model exchange
    const contents: any[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I am LUMI, ready to support you.' }] },
    ];

    // Add conversation history
    conversationHistory.forEach((m: any) => {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      });
    });

    // Add current message
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 400, temperature: 0.85 },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini error:', JSON.stringify(data.error));
      return NextResponse.json({ reply: `Error: ${data.error.message}`, emotion: 'neutral' });
    }

    const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawReply) {
      console.error('Empty Gemini response:', JSON.stringify(data));
      return NextResponse.json({ reply: 'Something went wrong, please try again.', emotion: 'neutral' });
    }

    const emotionMatch = rawReply.match(/EMOTION:(\w+)/i);
    const emotion = emotionMatch ? emotionMatch[1].toLowerCase() : 'neutral';
    const reply = rawReply.replace(/\nEMOTION:\w+/gi, '').trim();

    return NextResponse.json({ reply, emotion });

  } catch (error: any) {
    console.error('Chat route error:', error.message);
    return NextResponse.json({ reply: `Error: ${error.message}`, emotion: 'neutral' }, { status: 500 });
  }
}
