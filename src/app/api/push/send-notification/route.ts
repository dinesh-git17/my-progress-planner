// src/app/api/push/send-notification/route.ts
/**
 * SECURED Push Notification Send API Endpoint
 *
 * POST /api/push/send-notification
 * - Sends push notifications to users
 * - Supports targeting specific users or all users
 * - Environment-aware logging (dev only)
 * - NOW WITH PRODUCTION-SAFE LOGGING ✅
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
// LOGGING UTILITIES
// ============================================================================

/**
 * Development-only logging helper
 */
function devLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

/**
 * Production-safe error logging (only critical errors)
 */
function errorLog(message: string, data?: any) {
  if (data) {
    console.error(message, data);
  } else {
    console.error(message);
  }
}

/**
 * Production-safe warning logging (only critical warnings)
 */
function warnLog(message: string, data?: any) {
  if (data) {
    console.warn(message, data);
  } else {
    console.warn(message);
  }
}

/**
 * Sanitizes user ID for logging (shows only first 8 chars)
 */
function sanitizeUserId(userId: string): string {
  if (!userId || userId.length < 8) return 'invalid-id';
  return `${userId.slice(0, 8)}...`;
}

/**
 * Sanitizes message content for logging (shows only length)
 */
function sanitizeMessage(title: string, message: string) {
  return {
    titleLength: title?.length || 0,
    messageLength: message?.length || 0,
    hasContent: !!(title && message),
  };
}

/**
 * Creates secure audit log without sensitive data
 */
function createSecureAuditLog(action: string, data: any) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Base audit log (always safe to log)
  const auditLog = {
    action,
    timestamp: new Date().toISOString(),
    ip: data.ip || 'unknown',
  };

  // Add non-sensitive data based on action
  if (action === 'PUSH_NOTIFICATION_SENT') {
    return {
      ...auditLog,
      authMethod: data.authMethod || 'unknown',
      results: {
        successful: data.successful || 0,
        failed: data.failed || 0,
        removed: data.removed || 0,
        total: data.total || 0,
      },
      // Only log sanitized data in development
      targetUserId:
        isDevelopment && data.targetUserId
          ? sanitizeUserId(data.targetUserId)
          : 'hidden',
      messageInfo: isDevelopment
        ? sanitizeMessage(data.title, data.message)
        : 'hidden',
    };
  }

  return auditLog;
}

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
      devLog('❌ Invalid JWT token:', error);
      return { valid: false };
    }

    // For push notifications, we could add additional checks here
    // For example, check if user has admin role in database
    // For now, we'll allow any authenticated user to send notifications to themselves

    return { valid: true, userId: user.id };
  } catch (error) {
    devLog('❌ Error validating user auth:', error);
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
      warnLog('🚫 Rate limit exceeded for push notification API', { ip });
      return NextResponse.json(
        { error: 'Too many notification requests. Please try again later.' },
        { status: 429 },
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { title, message, targetUserId, adminPassword } = requestBody;

    devLog('📤 Processing push notification request');
    devLog('📝 Message info:', sanitizeMessage(title, message));
    devLog(
      '🎯 Target:',
      targetUserId ? sanitizeUserId(targetUserId) : 'broadcast',
    );

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
      warnLog('🚫 Unauthorized push notification attempt', { ip });
      return NextResponse.json(
        {
          error:
            'Unauthorized. Admin authentication required for push notifications.',
        },
        { status: 401 },
      );
    }

    devLog(
      '✅ Authentication successful:',
      isAdminAuthenticated ? 'Admin' : 'User',
    );

    // Security Layer 3: Authorization - Non-admin users can only send to themselves
    if (
      !isAdminAuthenticated &&
      targetUserId &&
      targetUserId !== userAuth.userId
    ) {
      warnLog('🚫 User attempted to send notification to other user', { ip });
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
      errorLog('❌ Error fetching subscriptions');
      devLog('❌ Subscription fetch error details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 },
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      devLog('📭 No subscriptions found for target');
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found for target',
        successful: 0,
        failed: 0,
        total: 0,
        targetUserId: finalTargetUserId,
      });
    }

    devLog(`📱 Found ${subscriptions.length} subscription(s)`);

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
        devLog(`❌ Failed to send notification to subscription:`, err.message);

        // Handle expired subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          devLog('🗑️ Removing expired subscription');
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

    // Security Layer 5: Secure Audit logging (dev only)
    const auditData = createSecureAuditLog('PUSH_NOTIFICATION_SENT', {
      ip,
      authMethod: isAdminAuthenticated ? 'ADMIN' : 'USER_JWT',
      targetUserId: finalTargetUserId,
      title,
      message,
      successful,
      failed,
      removed,
      total: subscriptions.length,
    });
    devLog('📋 AUDIT LOG:', auditData);

    devLog(
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
    errorLog('💥 Send notification API error');
    devLog('💥 Send notification error details:', error);

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
