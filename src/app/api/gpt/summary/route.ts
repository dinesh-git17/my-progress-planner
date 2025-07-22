// src/app/api/gpt/summary/route.ts
import gptService from '@/utils/gptService';
import { NextResponse } from 'next/server';

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

    console.log(`📝 Generating summary for ${name}'s ${meal}`);

    // Use the new GPT service for custom prompt
    const prompt =
      meal === 'day'
        ? `You're an adorable, encouraging GPT assistant helping Dinn's girlfriend eat better.

Summarize what ${name} ate today in a warm, happy tone. Make her feel proud and supported.
She told us:

${answers.map((a: string) => `- ${a}`).join('\n')}

Now, write a cute, heartfelt summary that makes her smile.`
        : `You're a sweet, supportive GPT assistant helping Dinn's girlfriend build healthy habits.

Summarize what ${name} ate for ${meal} in a warm, fun, and positive tone.
Include praise, encouragement, and maybe a fun emoji or two.

Here's what she told us:

${answers.map((a: string) => `- ${a}`).join('\n')}

${
  gpt_response && gpt_response.length > 0
    ? `You (GPT) also replied:\n${gpt_response.join('\n')}\n`
    : ''
}

Now, write a cute and kind summary for her. make it 100 words or less, and keep it light and positive.`;

    // Use the custom response method for this complex prompt
    const response = await gptService.generateCustomResponse({
      name,
      prompt,
      temperature: 0.85,
      maxTokens: 200,
      model: 'gpt-4',
    });

    console.log(
      `✨ Summary generated (${response.isMock ? 'MOCK' : 'REAL'}):`,
      response.content,
    );

    // Log usage info for real GPT calls
    if (response.usage) {
      console.log(`📊 Token usage:`, response.usage);
    }

    return NextResponse.json({
      summary: response.content,
      isMock: response.isMock,
      // Include usage info for debugging (remove in production)
      ...(process.env.NODE_ENV === 'development' && { usage: response.usage }),
    });
  } catch (err: any) {
    console.error('[GPT Summary Error]', err);

    // Try to get name from request body if available
    let fallbackName = 'love';
    try {
      const errorBody = await req.json();
      fallbackName = errorBody?.name || 'love';
    } catch {
      // If we can't parse the body, use default
    }

    return NextResponse.json(
      {
        summary: `You're doing amazing, ${fallbackName}! Keep up the great work! ✨`,
        isMock: true,
        error: true,
      },
      { status: 500 },
    );
  }
}
