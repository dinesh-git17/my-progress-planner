import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const CONTACT_EMAIL = process.env.PUSH_CONTACT_EMAIL || 'mailto:youremail@example.com'
const CRON_SECRET = process.env.CRON_SECRET
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(CONTACT_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export async function GET(req: NextRequest) {
  // Secure with cron secret
  if (req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  // Fetch all subscriptions
  const { data: subs, error } = await supabase.from('push_subscriptions').select('subscription')
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  let sent = 0
  for (const row of subs ?? []) {
    try {
      await webpush.sendNotification(
        row.subscription,
        JSON.stringify({
          title: '☀️ Good morning, beautiful!',
          body: 'Time for breakfast or a cozy coffee. You deserve to start your day with love. 🥐💛',
          url: '/breakfast',
        })
      )
      sent++
    } catch (e) {
      // Ignore send errors for now
    }
  }
  return NextResponse.json({ ok: true, sent })
}
