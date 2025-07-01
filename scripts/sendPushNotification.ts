// scripts/sendPushNotification.ts
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// Use your own VAPID keys here!
const VAPID_PUBLIC_KEY =
  'BAEWVqKa9ASTlGbc7Oo_BJGAsYBtlYAS1IkI1gKMz5Ot6WnNQuP-WQ2u3sDRDV4Ca5kZQwo8aKOshT3wOrUugxk'
const VAPID_PRIVATE_KEY = 'KyheLVyynRbv_9XOZgu0UAdmHbV6-Z7_Wpgtpzi34As'

webpush.setVapidDetails('mailto:dineshddawo@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: subs } = await supabase.from('push_subscriptions').select('subscription')
  for (const row of subs ?? []) {
    try {
      await webpush.sendNotification(
        row.subscription,
        JSON.stringify({
          title: 'Lunch time, love!',
          body: 'Don’t forget to log your meal! 🍜',
        })
      )
      console.log('Sent push!')
    } catch (e) {
      console.error('Push error', e)
    }
  }
}

main()
