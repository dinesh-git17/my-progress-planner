import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // <-- must be anon, not service role
)

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const sub = await req.json()
  // Optionally associate with user_id/localStorage as you wish
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert([{ endpoint: sub.endpoint, subscription: sub }], { onConflict: 'endpoint' })
  if (error) return NextResponse.json({ ok: false, error })
  return NextResponse.json({ ok: true })
}
