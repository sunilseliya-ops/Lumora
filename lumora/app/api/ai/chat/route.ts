import { NextRequest, NextResponse } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'api_key_missing' }, { status: 503 });
  }

  try {
    const { message, userName, history, memory } = await req.json();
    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 });

    const name = userName || 'friend';
    const userMemory = memory || {};
    const conversationHistory = history || [];

    const systemPrompt = `You are LUMI, a warm and caring AI wellness companion in the Lumora app.
User's name: ${name}
Their recent moods: ${JSON.stringify(userMemory?.mood_history?.slice(-3) || [])}
Topics they often discuss: ${Object.keys(userMemory?.patterns || {}).slice(0, 5).join(', ') || 'just getting started'}

How to respond:
- Be warm, genuine, and supportive like a trusted friend
- Keep replies under 120 words
- Ask ONE thoughtful follow-up question
- Reference their past patterns naturally when relevant  
- If someone seems in crisis: share iCall India 9152987821
- Never be robotic or generic

End every reply with on a new line: EMOTION:<word>
Choose from: happy, calm, sad, anxious, angry, grateful, hopeful, neutral`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: 400,
        temperature: 0.85,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Groq error:', JSON.stringify(data.error));
      return NextResponse.json({ reply: `Error: ${data.error.message}`, emotion: 'neutral' });
    }

    const rawReply = data.choices?.[0]?.message?.content;
    if (!rawReply) {
      return NextResponse.json({ reply: 'Something went wrong, please try again.', emotion: 'neutral' });
    }

    const emotionMatch = rawReply.match(/EMOTION:(\w+)/i);
    const emotion = emotionMatch ? emotionMatch[1].toLowerCase() : 'neutral';
    const reply = rawReply.replace(/\nEMOTION:\w+/gi, '').trim();

    return NextResponse.json({ reply, emotion });

  } catch (error: any) {
    console.error('Chat error:', error.message);
    return NextResponse.json({ reply: `Error: ${error.message}`, emotion: 'neutral' }, { status: 500 });
  }
}
