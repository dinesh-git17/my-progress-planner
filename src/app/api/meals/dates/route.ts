// src/app/api/meals/dates/route.ts
import { supabaseServer } from '@/utils/supabaseServer';
import { NextResponse } from 'next/server';

const supabase = supabaseServer;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  try {
    // Query the meal_logs table to get all dates with meals for this user
    const { data, error } = await supabase
      .from('meal_logs')
      .select('date, created_at')
      .eq('user_id', user_id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Database fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch meal dates' },
        { status: 500 },
      );
    }

    // Return just the dates that have meals
    const mealDates = data.map((row) => ({
      date: row.date,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      mealDates: mealDates || [],
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 },
    );
  }
}
