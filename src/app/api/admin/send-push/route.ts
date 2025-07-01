import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// --- Set up your secure values ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const CONTACT_EMAIL = process.env.PUSH_CONTACT_EMAIL || 'mailto:youremail@example.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(CONTACT_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export async function POST(req: NextRequest) {
  const { password, title, body, url } = await req.json()
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { data: subs, error } = await supabase.from('push_subscriptions').select('subscription')
  if (error) return NextResponse.json({ ok: false, error: error.message })
  let count = 0
  for (const row of subs ?? []) {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify({ title, body, url }))
      count++
    } catch (e: any) {
      // ignore individual errors
    }
  }
  return NextResponse.json({ ok: true, sent: count })
}
