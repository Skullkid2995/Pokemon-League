import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const player1Name = formData.get('player1Name') as string;
    const player2Name = formData.get('player2Name') as string;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type || 'image/png';

    // Use OpenAI Vision API to analyze the image
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // or 'gpt-4-vision-preview' if available
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this Pokemon TCG Pocket game screenshot and extract the following information:
1. Who won the match? (Player 1: "${player1Name}" or Player 2: "${player2Name}")
2. What were the damage points for ${player1Name}? (number only)
3. What were the damage points for ${player2Name}? (number only)

Return the response in JSON format with the following structure:
{
  "winner": "player1" or "player2" or null if unclear,
  "player1DamagePoints": number or null,
  "player2DamagePoints": number or null,
  "confidence": "high" or "medium" or "low"
}

Look for:
- Victory/defeat indicators
- Final scores or damage totals
- Player names matching the provided names
- Any numbers that represent damage points

If you cannot determine any value, use null.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI analysis' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI analysis response', rawResponse: content },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        winner: analysisResult.winner || null,
        player1DamagePoints: analysisResult.player1DamagePoints ?? null,
        player2DamagePoints: analysisResult.player2DamagePoints ?? null,
        confidence: analysisResult.confidence || 'medium',
      },
    });
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

