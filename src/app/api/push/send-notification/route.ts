// src/app/api/push/send-notification/route.ts
/**
 * SECURED Push Notification Send API Endpoint
 *
 * POST /api/push/send-notification
 * - Sends push notifications to users
 * - Supports targeting specific users or all users
 * - NOW WITH ENTERPRISE-LEVEL SECURITY
 *
 * @route POST /api/push/send-notification
 * @body { title: string, message: string, targetUserId?: string, adminPassword?: string }
 * @headers Authorization: Bearer <jwt-token> OR X-Admin-Password: <admin-password>
 * @returns JSON response with notification send results
 */

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

// ============================================================================
// SECURITY MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Validates admin password from header or body
 */
async function validateAdminAuth(
  req: NextRequest,
  requestBody?: any,
): Promise<boolean> {
  // Method 1: Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === process.env.ADMIN_PASSWORD) {
      return true;
    }
  }

  // Method 2: Check X-Admin-Password header
  const adminPasswordHeader = req.headers.get('x-admin-password');
  if (adminPasswordHeader === process.env.ADMIN_PASSWORD) {
    return true;
  }

  // Method 3: Check password in request body
  if (requestBody?.adminPassword === process.env.ADMIN_PASSWORD) {
    return true;
  }

  return false;
}

/**
 * Validates that the authenticated user is an admin or authorized user
 */
async function validateUserAuth(
  req: NextRequest,
): Promise<{ valid: boolean; userId?: string }> {
  try {
    // Get session from Supabase auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false };
    }

    const token = authHeader.substring(7);

    // Create client with the user's JWT token
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    // Verify the token and get user
    const {
      data: { user },
      error,
    } = await userSupabase.auth.getUser(token);

    if (error || !user) {
      console.error('❌ Invalid JWT token:', error);
      return { valid: false };
    }

    // For push notifications, we could add additional checks here
    // For example, check if user has admin role in database
    // For now, we'll allow any authenticated user to send notifications to themselves

    return { valid: true, userId: user.id };
  } catch (error) {
    console.error('❌ Error validating user auth:', error);
    return { valid: false };
  }
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 notification sends per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Security Layer 1: Rate Limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0]
      : req.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      console.warn('🚫 Rate limit exceeded for IP:', ip);
      return NextResponse.json(
        { error: 'Too many notification requests. Please try again later.' },
        { status: 429 },
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { title, message, targetUserId, adminPassword } = requestBody;

    console.log('📤 Secure push notification request:', {
      title: title?.slice(0, 30) + '...',
      message: message?.slice(0, 50) + '...',
      targetUserId: targetUserId || 'all users',
      ip,
    });

    // Basic input validation
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 },
      );
    }

    if (typeof title !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Title and message must be strings' },
        { status: 400 },
      );
    }

    // Security Layer 2: Authentication Check
    const isAdminAuthenticated = await validateAdminAuth(req, requestBody);
    const userAuth = !isAdminAuthenticated
      ? await validateUserAuth(req)
      : { valid: false };

    if (!isAdminAuthenticated && !userAuth.valid) {
      console.warn('🚫 Unauthorized push notification attempt:', {
        ip,
        title: title?.slice(0, 20),
      });
      return NextResponse.json(
        {
          error:
            'Unauthorized. Admin authentication required for push notifications.',
        },
        { status: 401 },
      );
    }

    console.log(
      '✅ Authentication successful:',
      isAdminAuthenticated ? 'Admin' : 'User',
    );

    // Security Layer 3: Authorization - Non-admin users can only send to themselves
    if (
      !isAdminAuthenticated &&
      targetUserId &&
      targetUserId !== userAuth.userId
    ) {
      console.warn('🚫 User trying to send to other user:', {
        authenticatedUser: userAuth.userId,
        targetUser: targetUserId,
      });
      return NextResponse.json(
        { error: 'You can only send notifications to yourself.' },
        { status: 403 },
      );
    }

    // If user is authenticated but no targetUserId specified, send to themselves
    const finalTargetUserId = isAdminAuthenticated
      ? targetUserId
      : targetUserId || userAuth.userId;

    // Security Layer 4: Content Validation
    if (title.length > 100 || message.length > 500) {
      return NextResponse.json(
        { error: 'Title max 100 chars, message max 500 chars' },
        { status: 400 },
      );
    }

    // Build query to get subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    // If targeting specific user
    if (finalTargetUserId) {
      query = query.eq('user_id', finalTargetUserId);
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
      console.log('📭 No subscriptions found for target');
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found for target',
        successful: 0,
        failed: 0,
        total: 0,
        targetUserId: finalTargetUserId,
      });
    }

    console.log(`📱 Found ${subscriptions.length} subscription(s)`);

    // Prepare notification payload
    const notificationPayload = {
      title,
      body: message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: isAdminAuthenticated ? 'admin-notification' : 'user-notification',
      data: {
        type: isAdminAuthenticated ? 'admin_message' : 'user_message',
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

        // Handle expired subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`🗑️ Removing expired subscription: ${sub.id}`);
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          return {
            success: false,
            error: 'expired',
            subscription: sub,
            removed: true,
          };
        }

        return { success: false, error: err.message, subscription: sub };
      }
    });

    const results = await Promise.allSettled(notifications);

    // Count successful and failed notifications
    let successful = 0;
    let failed = 0;
    let removed = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successful++;
        } else if (result.value.removed) {
          removed++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    });

    // Security Layer 5: Audit logging
    console.log('📋 AUDIT LOG - PUSH NOTIFICATION:', {
      action: 'PUSH_NOTIFICATION_SENT',
      timestamp: new Date().toISOString(),
      ip,
      authMethod: isAdminAuthenticated ? 'ADMIN' : 'USER_JWT',
      authenticatedUser: userAuth.userId || 'admin',
      targetUserId: finalTargetUserId,
      title: title.slice(0, 50),
      message: message.slice(0, 100),
      results: { successful, failed, removed, total: subscriptions.length },
    });

    console.log(
      `✅ Notification summary: ${successful} successful, ${failed} failed, ${removed} expired/removed`,
    );

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      successful,
      failed,
      removed,
      total: subscriptions.length,
      targetUserId: finalTargetUserId,
      authMethod: isAdminAuthenticated ? 'admin' : 'user',
    });
  } catch (error: any) {
    console.error('💥 Send notification API error:', error);

    // Security: Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: isDevelopment ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// Remove GET method to reduce attack surface
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests',
    },
    { status: 405 },
  );
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'POST, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Admin-Password',
    },
  });
}
