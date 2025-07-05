import supabase from '@/utils/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('daily_summaries')
    .select(
      'date, breakfast_summary, lunch_summary, dinner_summary, full_day_summary',
    )
    .eq('user_id', user_id)
    .order('date', { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 },
    );
  }

  return NextResponse.json({ summaries: data });
}
