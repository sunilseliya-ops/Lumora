import { NextRequest, NextResponse } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'api_key_missing' }, { status: 503 });
  }

  const { imageBase64 } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  let mimeType = 'image/jpeg';
  let cleanBase64 = imageBase64;
  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) { mimeType = match[1]; cleanBase64 = match[2]; }
  }

  const prompt = `Analyze this food image. Return ONLY valid JSON, no markdown, no explanation:
{"items":[{"name":"Food Name","calories":250,"amount":"1 cup"}],"total_calories":450,"macros":{"protein":"18g","carbs":"52g","fat":"12g"},"assessment":"Brief note","confidence":"high"}
List every visible food item. Be accurate with Indian food. If not food: {"error":"Not food","items":[],"total_calories":0}`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanBase64}` } },
            { type: 'text', text: prompt },
          ],
        }],
        max_tokens: 600,
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Groq vision error:', JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content || '';
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();

    try {
      const result = JSON.parse(cleaned);
      return NextResponse.json(result);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) return NextResponse.json(JSON.parse(jsonMatch[0]));
      return NextResponse.json({ error: 'Could not parse response', items: [], total_calories: 0 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
