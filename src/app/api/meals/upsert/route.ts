// src/app/api/meals/upsert/route.ts
// API endpoint for syncing offline meal data
// Matches your existing upsertMealLog architecture

import { supabaseServer } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

const supabase = supabaseServer;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, meal, answers, gpt_responses, name } = body;

    // Validate required fields
    if (!user_id || !meal || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, meal, answers' },
        { status: 400 },
      );
    }

    // Get current date in EST timezone (matching your existing logic)
    const now = new Date();
    const estDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
    }).format(now);

    // Prepare meal data for upsert (matching your existing structure)
    const mealData: Record<string, any> = {
      user_id,
      date: estDate,
      [meal]: answers, // Store answers array in the meal column
      created_at: new Date().toISOString(),
    };

    // Add GPT responses if provided
    if (gpt_responses && gpt_responses.length > 0) {
      mealData[`${meal}_gpt_responses`] = gpt_responses;
    }

    // Upsert meal log (matching your existing upsertMealLog logic)
    const { data: mealLogData, error: mealLogError } = await supabase
      .from('meal_logs')
      .upsert([mealData], {
        onConflict: 'user_id,date',
      })
      .select();

    if (mealLogError) {
      console.error('Error upserting meal log:', mealLogError);
      return NextResponse.json(
        { error: 'Failed to save meal log', details: mealLogError.message },
        { status: 500 },
      );
    }

    console.log('✅ Meal log upserted successfully:', mealLogData);

    // If name is provided, also upsert user name (matching your existing logic)
    if (name) {
      const { error: nameError } = await supabase
        .from('users')
        .upsert([{ user_id, name }], {
          onConflict: 'user_id',
        });

      if (nameError) {
        console.warn('Warning: Failed to update user name:', nameError);
        // Don't fail the whole request if name update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Meal data synchronized successfully',
      data: {
        user_id,
        meal,
        date: estDate,
        answersCount: answers.length,
        gptResponsesCount: gpt_responses?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in meal upsert API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
