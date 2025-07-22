// src/app/api/gpt/meal-questions/route.ts
import gptService from '@/utils/gptService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log(`❓ Generating meal questions...`);

    // Use the new GPT service (automatically switches between mock/real)
    const response = await gptService.generateMealQuestions();

    const questions = JSON.parse(response.content);

    console.log(
      `✨ Questions generated (${response.isMock ? 'MOCK' : 'REAL'}):`,
      questions,
    );

    // Log usage info for real GPT calls
    if (response.usage) {
      console.log(`📊 Token usage:`, response.usage);
    }

    return NextResponse.json({
      questions,
      isMock: response.isMock,
      // Include usage info for debugging (remove in production)
      ...(process.env.NODE_ENV === 'development' && { usage: response.usage }),
    });
  } catch (err) {
    console.error('Meal questions API error:', err);
    return NextResponse.json(
      {
        questions: [
          'What did you eat today, my love?',
          'How much did you have?',
          'How did it make you feel?',
        ],
        isMock: true,
        error: true,
      },
      { status: 200 },
    );
  }
}
