import supabase from '@/utils/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('meal_logs_with_users')
      .select('*')
      .order('date', { ascending: false })
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

    // Create response with comprehensive no-cache headers
    const response = NextResponse.json({ logs: data });

    // Prevent caching at all levels
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store');

    return response;
  } catch (err) {
    console.error('[ADMIN_LOG_MEAL] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
