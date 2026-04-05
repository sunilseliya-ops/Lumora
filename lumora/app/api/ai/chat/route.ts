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
    const mem = memory || {};
    const conversationHistory = history || [];

    // Build rich system prompt from onboarding + memory
    const goals = mem.goals?.join(', ') || 'not specified';
    const challenges = mem.challenges?.join(', ') || 'not specified';
    const style = mem.support_style || 'warm and supportive';
    const fitness = mem.fitness_level || 'unknown';
    const recentMoods = mem.mood_history?.slice(-3).map((m: any) => m.emotion).join(', ') || 'unknown';
    const topics = Object.keys(mem.patterns || {}).slice(0, 5).join(', ') || 'getting started';

    const systemPrompt = `You are LUMI, a deeply personal AI wellness companion in the Lumora app.

USER PROFILE:
- Name: ${name}
- Goals: ${goals}
- Biggest challenges: ${challenges}
- Preferred support style: ${style}
- Fitness level: ${fitness}
- Recent mood pattern: ${recentMoods}
- Topics they discuss most: ${topics}

HOW TO RESPOND:
- Match their preferred style: ${style}
- Address their specific goals and challenges when relevant
- Keep replies focused and under 150 words
- Ask ONE thoughtful follow-up question per message
- Celebrate progress toward their specific goals
- Reference past patterns naturally: "I've noticed you often feel..."
- If crisis/emergency: share iCall India 9152987821

IMPORTANT: You know this person. Use their profile to give personalized, specific advice — not generic wellness tips.

End every reply on a new line with: EMOTION:<word>
Options: happy, calm, sad, anxious, angry, grateful, hopeful, neutral`;

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
