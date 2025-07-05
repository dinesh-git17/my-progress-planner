import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter required' },
        { status: 400 },
      );
    }

    // Check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId);

    // Check daily summaries
    const { data: summaryData, error: summaryError } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId);

    // Check meal logs
    const { data: mealData, error: mealError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId);

    return NextResponse.json({
      userId,
      userData: userData || [],
      summaryData: summaryData || [],
      mealData: mealData || [],
      userError: userError?.message || null,
      summaryError: summaryError?.message || null,
      mealError: mealError?.message || null,
      counts: {
        users: userData?.length || 0,
        summaries: summaryData?.length || 0,
        meals: mealData?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Debug users error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 },
    );
  }
}
