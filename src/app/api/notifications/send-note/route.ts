// src/app/api/notifications/send-note/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:dineshddawo@gmail.com', // Replace with your email
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { to_user_id, from_name, note_preview } = await req.json();

    if (!to_user_id || !from_name || !note_preview) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Get all push subscriptions for the target user
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', to_user_id);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      // Don't fail the whole request if notifications fail
      return NextResponse.json({
        success: true,
        message: 'Note sent, but notification failed',
      });
    }

    // Send notifications to all user's devices
    const notifications =
      subscriptions?.map(async (sub) => {
        try {
          const payload = JSON.stringify({
            title: '💌 New Encouragement Note',
            body: `${from_name}: ${note_preview.slice(0, 60)}${note_preview.length > 60 ? '...' : ''}`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: 'friend-note',
            data: {
              type: 'friend_note',
              from_name,
              url: '/notes',
            },
            actions: [
              {
                action: 'view',
                title: 'View Note',
                icon: '/icon-192x192.png',
              },
            ],
          });

          await webpush.sendNotification(sub.subscription, payload);
          return { success: true };
        } catch (err) {
          console.error('Failed to send notification:', err);
          return { success: false, error: err };
        }
      }) || [];

    const results = await Promise.allSettled(notifications);
    const successful = results.filter((r) => r.status === 'fulfilled').length;

    console.log(
      `📱 Sent ${successful}/${notifications.length} notifications to ${to_user_id}`,
    );

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      stats: {
        total: notifications.length,
        successful,
        failed: notifications.length - successful,
      },
    });
  } catch (error: any) {
    console.error('💥 Notification API error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 },
    );
  }
}
