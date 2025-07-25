import { supabaseServer } from '@/utils/supabaseServer';
import { NextResponse } from 'next/server';

const supabase = supabaseServer;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    if (!user_id) return NextResponse.json({ streak: 0, dates: [] });

    // Fetch all meal log dates for the user
    const { data, error } = await supabase
      .from('meal_logs')
      .select('date')
      .eq('user_id', user_id)
      .order('date', { ascending: false });

    if (error) return NextResponse.json({ streak: 0, dates: [] });

    // Normalize dates to YYYY-MM-DD, filter invalid, dedupe, and output as array
    const dateArr = (data ?? [])
      .map((d) => d.date?.slice(0, 10))
      .filter((d): d is string => Boolean(d));

    // Dedupe while preserving order (Apple style!)
    const seen = new Set<string>();
    const uniqueDates: string[] = [];
    for (const date of dateArr) {
      if (!seen.has(date)) {
        seen.add(date);
        uniqueDates.push(date);
      }
    }

    return NextResponse.json({ dates: uniqueDates });
  } catch (err) {
    return NextResponse.json({ streak: 0, dates: [] });
  }
}
