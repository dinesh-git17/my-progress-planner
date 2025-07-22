// src/app/api/gpt/meal-coach/route.ts
import gptService from '@/utils/gptService';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { history, mealStage } = await req.json();

    console.log(`🍽️ Meal coaching request (stage: ${mealStage})`);

    // Use the new GPT service (automatically switches between mock/real)
    const response = await gptService.generateMealCoachingResponse({
      messages: history,
      mealType: mealStage,
    });

    console.log(
      `✨ Coaching response generated (${response.isMock ? 'MOCK' : 'REAL'}):`,
      response.content,
    );

    // Log usage info for real GPT calls
    if (response.usage) {
      console.log(`📊 Token usage:`, response.usage);
    }

    return NextResponse.json({
      reply: response.content,
      isMock: response.isMock,
      // Include usage info for debugging (remove in production)
      ...(process.env.NODE_ENV === 'development' && { usage: response.usage }),
    });
  } catch (err) {
    console.error('Meal coach API error:', err);
    return NextResponse.json(
      {
        reply: "I'm proud of you, love!",
        isMock: true,
        error: true,
      },
      { status: 200 },
    );
  }
}
