// src/app/api/push/save-subscription/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server operations
)

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscription, user_id } = body

    if (!subscription || !user_id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing subscription or user_id',
        },
        { status: 400 }
      )
    }

    // Save subscription with user association
    const { error } = await supabase.from('push_subscriptions').upsert(
      [
        {
          endpoint: subscription.endpoint,
          subscription: subscription,
          user_id: user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      {
        onConflict: 'endpoint',
      }
    )

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
