// src/app/api/push/save-subscription/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing subscription',
        },
        { status: 400 },
      );
    }

    // Simple upsert - just endpoint and subscription
    const { error } = await supabase.from('push_subscriptions').upsert(
      [
        {
          endpoint: subscription.endpoint,
          subscription: subscription,
          // That's it! No user_id, no updated_at
        },
      ],
      {
        onConflict: 'endpoint',
      },
    );

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
