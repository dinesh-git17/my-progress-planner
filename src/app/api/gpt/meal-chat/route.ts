// src/app/api/gpt/meal-chat/route.ts
import gptService from '@/utils/gptService';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { meal, messages, closing } = await req.json();

    console.log(`💬 Meal chat request for: ${meal} (closing: ${closing})`);

    // Use the new GPT service (automatically switches between mock/real)
    const response = await gptService.generateMealChatResponse({
      mealType: meal,
      messages,
      closing,
    });

    console.log(
      `✨ Response generated (${response.isMock ? 'MOCK' : 'REAL'}):`,
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
  } catch (error) {
    console.error('Meal chat API error:', error);
    return NextResponse.json({
      reply: "I love you so much, beautiful! ♥️ You're doing great!",
      isMock: true,
      error: true,
    });
  }
}
