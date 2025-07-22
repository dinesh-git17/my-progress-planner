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
  'mailto:dineshddawo@gmail.com',
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
      .select('id, subscription')
      .eq('user_id', to_user_id);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({
        success: true,
        message: 'Note sent, but notification failed',
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`📱 No push subscriptions found for user: ${to_user_id}`);
      return NextResponse.json({
        success: true,
        message: 'Note sent, but user has no push subscriptions',
      });
    }

    // Send notifications and track results
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
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
          console.log(
            `✅ Notification sent successfully to subscription ${sub.id}`,
          );
          return { success: true, subscriptionId: sub.id };
        } catch (err: any) {
          console.error(
            `❌ Failed to send notification to subscription ${sub.id}:`,
            err.message,
          );

          // Handle expired/invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`🗑️ Removing expired subscription ${sub.id}`);
            // Remove expired subscription from database
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);

            return {
              success: false,
              subscriptionId: sub.id,
              error: 'Subscription expired and removed',
              removed: true,
            };
          }

          return {
            success: false,
            subscriptionId: sub.id,
            error: err.message,
          };
        }
      }),
    );

    // Calculate statistics
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success,
    ).length;

    const removed = results.filter(
      (r) => r.status === 'fulfilled' && r.value.removed,
    ).length;

    const failed = results.length - successful - removed;

    console.log(
      `📱 Notification results for ${to_user_id}: ${successful} sent, ${removed} expired (cleaned), ${failed} failed`,
    );

    return NextResponse.json({
      success: true,
      message: 'Notifications processed',
      stats: {
        total: results.length,
        successful,
        expired_removed: removed,
        failed,
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
