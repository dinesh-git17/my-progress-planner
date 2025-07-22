// src/app/api/gpt/quote/route.ts
import gptService from '@/utils/gptService';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || 'my love';

    console.log(`🎯 Generating daily quote for: ${name}`);

    // Use the new GPT service (automatically switches between mock/real)
    const response = await gptService.generateDailyQuote({ name });

    console.log(
      `✨ Quote generated (${response.isMock ? 'MOCK' : 'REAL'}):`,
      response.content,
    );

    // Log usage info for real GPT calls
    if (response.usage) {
      console.log(`📊 Token usage:`, response.usage);
    }

    return new NextResponse(
      JSON.stringify({
        quote: response.content,
        isMock: response.isMock,
        // Include usage info for debugging (remove in production)
        ...(process.env.NODE_ENV === 'development' && {
          usage: response.usage,
        }),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'Surrogate-Control': 'no-store',
        },
      },
    );
  } catch (err) {
    console.error('Quote API Route Error:', err);

    // Fallback response
    const name = new URL(req.url).searchParams.get('name') || 'my love';
    return NextResponse.json(
      {
        quote: `You're doing amazing, ${name}. One step at a time.`,
        isMock: true,
        error: true,
      },
      { status: 200 },
    );
  }
}
