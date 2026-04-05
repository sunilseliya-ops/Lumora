import { NextRequest, NextResponse } from 'next/server';

const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

const FOOD_PROMPT = `Analyze this food image. Return ONLY valid JSON, no markdown, no explanation:
{
  "items": [{"name": "food name", "calories": 250, "amount": "1 cup"}],
  "total_calories": 450,
  "macros": {"protein": "18g", "carbs": "52g", "fat": "12g"},
  "assessment": "Brief nutritional note",
  "confidence": "high"
}
If not food: {"error": "Cannot identify food", "items": [], "total_calories": 0}
Be conservative with portions. Include ALL visible items.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'api_key_missing' }, { status: 503 });
  }

  const { imageBase64 } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  try {
    const response = await fetch(`${GEMINI_VISION_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
            { text: FOOD_PROMPT },
          ],
        }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.1 },
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
