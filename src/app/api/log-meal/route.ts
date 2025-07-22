// src/app/api/log-meal/route.ts
import gptService from '@/utils/gptService';
import supabase from '@/utils/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, name, meal, entries } = body;

  if (!user_id || !name || !meal || !entries) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().split('T')[0];

  console.log(`🍽️ Logging ${meal} for ${name} (${entries.length} items)`);

  // 1. Save meal log
  const { error: mealLogError } = await supabase
    .from('meal_logs')
    .upsert({
      user_id,
      date: today,
      [meal]: entries,
    })
    .eq('user_id', user_id)
    .eq('date', today);

  if (mealLogError) {
    console.error('Error saving meal log:', mealLogError);
    return NextResponse.json(
      { error: 'Failed to save meal log' },
      { status: 500 },
    );
  }

  // 2. Generate GPT summary for current meal using our service
  const response = await gptService.generateSimpleMealSummary({
    name,
    mealType: meal,
    foodItems: entries,
  });

  const mealSummary = response.content;

  console.log(
    `✨ Meal summary generated (${response.isMock ? 'MOCK' : 'REAL'}):`,
    mealSummary,
  );

  // Log usage info for real GPT calls
  if (response.usage) {
    console.log(`📊 Token usage:`, response.usage);
  }

  // 3. Update daily_summaries table with this meal summary
  const mealCol = `${meal}_summary` as
    | 'breakfast_summary'
    | 'lunch_summary'
    | 'dinner_summary';

  const { data: summaryRow, error: upsertError } = await supabase
    .from('daily_summaries')
    .upsert(
      {
        user_id,
        name,
        date: today,
        [mealCol]: mealSummary,
      },
      { onConflict: 'user_id,date' },
    )
    .select()
    .maybeSingle();

  if (upsertError) {
    console.error('Error updating daily_summaries:', upsertError);
    return NextResponse.json(
      { error: 'Failed to store GPT summary' },
      { status: 500 },
    );
  }

  // 4. If all 3 meal summaries exist, generate full-day summary
  const { breakfast_summary, lunch_summary, dinner_summary } = summaryRow || {};

  if (
    breakfast_summary &&
    lunch_summary &&
    dinner_summary &&
    !summaryRow?.full_day_summary
  ) {
    console.log('🌟 All meals complete - generating full day summary');

    // Generate full day summary using our service
    const fullDayPrompt = `You are a sweet, loving boyfriend summarizing your partner's eating progress today.
You will now write a warm, proud summary (3-5 sentences) of her day based on what she ate.

Today ${name} had:
- Breakfast: ${breakfast_summary}
- Lunch: ${lunch_summary}  
- Dinner: ${dinner_summary}

Write an encouraging summary celebrating her commitment to nourishing herself today.`;

    const fullDayResponse = await gptService.generateCustomResponse({
      name,
      prompt: fullDayPrompt,
      temperature: 1,
      maxTokens: 150,
      model: 'gpt-4o',
    });

    console.log(
      `✨ Full day summary generated (${fullDayResponse.isMock ? 'MOCK' : 'REAL'})`,
    );

    // Log usage for full day summary
    if (fullDayResponse.usage) {
      console.log(`📊 Full day token usage:`, fullDayResponse.usage);
    }

    // Update with full day summary
    await supabase
      .from('daily_summaries')
      .update({ full_day_summary: fullDayResponse.content })
      .eq('user_id', user_id)
      .eq('date', today);

    console.log('🎉 Full day summary saved to database');
  }

  return NextResponse.json({
    success: true,
    message: 'Meal logged successfully',
    mealSummary,
    isMock: response.isMock,
    // Include usage info for debugging
    ...(process.env.NODE_ENV === 'development' && {
      usage: response.usage,
      hasFullDaySummary: !!(
        breakfast_summary &&
        lunch_summary &&
        dinner_summary
      ),
    }),
  });
}
