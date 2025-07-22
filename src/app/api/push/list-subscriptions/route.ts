// src/app/api/push/list-subscriptions/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  try {
    console.log('📋 Fetching all push subscriptions...');

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 },
      );
    }

    console.log(`✅ Found ${subscriptions?.length || 0} subscription(s)`);

    // Return sanitized subscription data (no sensitive info)
    const sanitizedSubscriptions =
      subscriptions?.map((sub) => ({
        id: sub.id,
        user_id: sub.user_id,
        endpoint: sub.endpoint, // Keep full endpoint for admin purposes
        created_at: sub.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      subscriptions: sanitizedSubscriptions,
      total: sanitizedSubscriptions.length,
    });
  } catch (error: any) {
    console.error('💥 List subscriptions API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'GET, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
