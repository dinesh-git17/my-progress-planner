import supabase from '@/utils/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('meal_logs_with_users') // ✅ pre-joined view with user names
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[ADMIN_LOG_MEAL] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to load meal logs from Supabase.' },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      console.warn('[ADMIN_LOG_MEAL] No meal logs found in view.');
      return NextResponse.json({ logs: [] });
    }

    console.log(`[ADMIN_LOG_MEAL] Fetched ${data.length} logs successfully.`);
    return NextResponse.json({ logs: data });
  } catch (err) {
    console.error('[ADMIN_LOG_MEAL] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
