// src/app/api/push/send-notification/route.ts
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
  process.env.VAPID_PUBLIC_KEY ||
    'BAEWVqKa9ASTlGbc7Oo_BJGAsYBtlYAS1IkI1gKMz5Ot6WnNQuP-WQ2u3sDRDV4Ca5kZQwo8aKOshT3wOrUugxk',
  process.env.VAPID_PRIVATE_KEY ||
    'KyheLVyynRbv_9XOZgu0UAdmHbV6-Z7_Wpgtpzi34As',
);

export async function POST(req: NextRequest) {
  try {
    const { title, message, targetUserId } = await req.json();



    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 },
      );
    }

    // Build query to get subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    // If targeting specific user
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 },
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found',
        successful: 0,
        failed: 0,
        total: 0,
      });
    }



    // Prepare notification payload
    const notificationPayload = {
      title,
      body: message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'admin-notification',
      data: {
        type: 'admin_message',
        url: '/',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'view',
          title: 'View App',
          icon: '/icon-192.png',
        },
      ],
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };

    // Send notifications to all matching subscriptions
    const notifications = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify(notificationPayload),
        );
        return { success: true, subscription: sub };
      } catch (err: any) {
        console.error(
          `❌ Failed to send notification to ${sub.endpoint.slice(-20)}:`,
          err.message,
        );
        return { success: false, error: err.message, subscription: sub };
      }
    });

    const results = await Promise.allSettled(notifications);

    // Count successful and failed notifications
    let successful = 0;
    let failed = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successful++;
      } else {
        failed++;
      }
    });



    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      successful,
      failed,
      total: subscriptions.length,
      targetUserId: targetUserId || null,
    });
  } catch (error: any) {
    console.error('💥 Send notification API error:', error);
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
      Allow: 'POST, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
