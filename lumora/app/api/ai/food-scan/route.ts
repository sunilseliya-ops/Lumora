import { NextRequest, NextResponse } from 'next/server';

const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'api_key_missing' }, { status: 503 });
  }

  const { imageBase64 } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  // Detect mime type from base64 header if present, default to jpeg
  let mimeType = 'image/jpeg';
  let cleanBase64 = imageBase64;

  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      cleanBase64 = match[2];
    }
  }

  const prompt = `You are a nutrition expert. Analyze this food photo carefully.

List every food item you can see and estimate calories.

Respond with ONLY this JSON (no markdown, no explanation, no code blocks):
{"items":[{"name":"Chicken Rice","calories":450,"amount":"1 plate"},{"name":"Salad","calories":80,"amount":"1 bowl"}],"total_calories":530,"macros":{"protein":"32g","carbs":"58g","fat":"12g"},"assessment":"Balanced meal with good protein","confidence":"high"}

Rules:
- calories must be numbers not strings
- confidence: high/medium/low
- If photo is not food respond: {"error":"Not food","items":[],"total_calories":0}
- List every visible item separately
- Be accurate with Indian food if applicable`;

  try {
    const response = await fetch(`${GEMINI_VISION_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: cleanBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.1 },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini vision error:', data.error);
      return NextResponse.json({ error: 'Vision API error: ' + data.error.message }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Strip any markdown formatting
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const result = JSON.parse(cleaned);
      return NextResponse.json(result);
    } catch {
      // Try to extract JSON from the text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json(result);
      }
      return NextResponse.json({ error: 'Could not parse food data', items: [], total_calories: 0 });
    }
  } catch (error: any) {
    console.error('Food scan error:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
