// src/app/api/gpt/summary/route.ts
import { shouldUseMockGPT } from '@/utils/environment';
import { addMockDelay, getMockMealSummary } from '@/utils/mockGptService';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// DON'T instantiate OpenAI at module level - move it inside where it's used

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, meal, answers, gpt_response } = body;

    if (!name || !meal || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Check if we should use mock responses
    if (shouldUseMockGPT()) {
      console.log('🎭 Using mock GPT response for summary generation');

      // Add realistic delay to simulate API call
      await addMockDelay(500, 1200);

      const mockSummary = getMockMealSummary(meal);

      return NextResponse.json({
        summary: mockSummary,
        _mock: true, // Flag to indicate this is a mock response
      });
    }

    // Production: Use real OpenAI API
    console.log('🚀 Using real OpenAI API for summary generation');

    // Only instantiate OpenAI client when we actually need it
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build the prompt
    let prompt = '';

    if (meal === 'day') {
      prompt = `
You're an adorable, encouraging GPT assistant helping Dinn's girlfriend eat better.

Summarize what ${name} ate today in a warm, happy tone. Make her feel proud and supported.
She told us:

${answers.map((a: string) => `- ${a}`).join('\n')}

Now, write a cute, heartfelt summary that makes her smile.
      `;
    } else {
      prompt = `
You're a sweet, supportive GPT assistant helping Dinn's girlfriend build healthy habits.

Summarize what ${name} ate for ${meal} in a warm, fun, and positive tone.
Include praise, encouragement, and maybe a fun emoji or two.

Here's what she told us:

${answers.map((a: string) => `- ${a}`).join('\n')}

${
  gpt_response && gpt_response.length > 0
    ? `You (GPT) also replied:\n${gpt_response.join('\n')}\n`
    : ''
}

Now, write a cute and kind summary for her. make it 100 words or less, and keep it light and positive.
      `;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 200,
    });

    const summary = completion.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 },
      );
    }

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error('[GPT Summary Error]', err);

    // Fallback to mock response on error (only if we're not already using mocks)
    if (!shouldUseMockGPT()) {
      console.log('🎭 Falling back to mock response due to error');

      // Use 'breakfast' as fallback since we can't access the parsed body here
      const fallbackSummary = getMockMealSummary('breakfast');
      return NextResponse.json({
        summary: fallbackSummary,
        _fallback: true,
      });
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
