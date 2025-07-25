// src/app/api/push/save-subscription/route.ts
/**
 * SECURED Push Subscription Save API Endpoint
 *
 * POST /api/push/save-subscription
 * - Saves push notification subscriptions securely
 * - Sanitized logging (no sensitive data exposure)
 * - Rate limiting and validation
 * - NOW WITH ENTERPRISE-LEVEL SECURITY
 *
 * @route POST /api/push/save-subscription
 * @body { subscription: PushSubscription, user_id?: string }
 * @returns JSON response with save result
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const runtime = 'edge';

// ============================================================================
// SECURITY UTILITIES
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
 * Rate limiting check (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 subscription saves per minute per IP

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

/**
 * Sanitizes endpoint for logging (removes sensitive parts)
 */
function sanitizeEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    // Return only the domain and first few characters of path
    return `${url.hostname}${url.pathname.slice(0, 10)}...`;
  } catch {
    return 'invalid-url';
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
 * Creates secure audit log without sensitive data
 */
function createAuditLog(action: string, data: any) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Base audit log (always safe to log)
  const auditLog = {
    action,
    timestamp: new Date().toISOString(),
    ip: data.ip || 'unknown',
  };

  // Add non-sensitive data based on action
  if (action === 'SUBSCRIPTION_SAVE_ATTEMPT') {
    return {
      ...auditLog,
      hasSubscription: !!data.subscription,
      hasUserId: !!data.user_id,
      endpointDomain: data.subscription?.endpoint
        ? sanitizeEndpoint(data.subscription.endpoint)
        : 'none',
      // Only log user ID in development
      userId:
        isDevelopment && data.user_id ? sanitizeUserId(data.user_id) : 'hidden',
    };
  }

  if (action === 'SUBSCRIPTION_SAVE_SUCCESS') {
    return {
      ...auditLog,
      operation: data.operation, // 'created' or 'updated'
      subscriptionId: data.subscriptionId || 'unknown',
    };
  }

  if (action === 'SUBSCRIPTION_SAVE_ERROR') {
    return {
      ...auditLog,
      errorType: data.errorType || 'unknown',
      // Only log error details in development
      errorDetails: isDevelopment ? data.errorDetails : 'hidden',
    };
  }

  return auditLog;
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
      // Only log rate limiting in production as it's a security event
      warnLog('🚫 Rate limit exceeded:', { ip, endpoint: 'save-subscription' });
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    // Security Layer 2: Input Parsing with Sanitized Logging
    let body;
    try {
      const rawBody = await req.text();

      // SECURE: Don't log raw body - it contains sensitive subscription data
      devLog('📥 Processing subscription save request');

      if (!rawBody || rawBody.trim() === '') {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Empty request body. Expected JSON with subscription object.',
          },
          { status: 400 },
        );
      }

      body = JSON.parse(rawBody);
    } catch (parseError) {
      // SECURE: Don't log parse error details - might contain sensitive data
      devLog('❌ Invalid JSON in request body');
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 },
      );
    }

    const { subscription, user_id } = body;

    // Security Layer 3: Audit Log (Sanitized) - Dev only
    const auditData = createAuditLog('SUBSCRIPTION_SAVE_ATTEMPT', {
      ip,
      subscription,
      user_id,
    });
    devLog('📋 AUDIT:', auditData);

    // Security Layer 4: Input Validation
    if (!subscription) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing subscription object',
        },
        { status: 400 },
      );
    }

    if (!subscription.endpoint) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid subscription: missing endpoint',
        },
        { status: 400 },
      );
    }

    // Validate subscription has required keys for web push
    if (
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid subscription: missing required keys (p256dh, auth)',
        },
        { status: 400 },
      );
    }

    // Security Layer 5: User ID Validation
    if (
      user_id &&
      (typeof user_id !== 'string' || user_id.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid user_id format',
        },
        { status: 400 },
      );
    }

    // Security Layer 6: Endpoint Validation
    try {
      new URL(subscription.endpoint); // Validate URL format
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid subscription endpoint URL',
        },
        { status: 400 },
      );
    }

    // Prepare the subscription data
    const subscriptionData: any = {
      endpoint: subscription.endpoint,
      subscription: subscription, // Store the full subscription object
      created_at: new Date().toISOString(),
    };

    // Include user_id if provided
    if (user_id) {
      subscriptionData.user_id = user_id.trim();
      // SECURE: Don't log actual user ID
      devLog('🔗 Linking subscription to authenticated user');
    } else {
      devLog('⚠️ Anonymous subscription (no user_id provided)');
    }

    // Database Operations with Secure Error Handling
    try {
      // First, try to find existing subscription by endpoint
      const { data: existingData } = await supabase
        .from('push_subscriptions')
        .select('id, user_id')
        .eq('endpoint', subscription.endpoint)
        .maybeSingle();

      if (existingData) {
        // Update existing subscription
        devLog('📝 Updating existing subscription');

        const updateData: any = {
          subscription: subscription,
          created_at: new Date().toISOString(), // Update timestamp
        };

        // Only update user_id if provided and different
        if (user_id && user_id !== existingData.user_id) {
          updateData.user_id = user_id;
          devLog('🔄 Updating user association for subscription');
        }

        const { data, error } = await supabase
          .from('push_subscriptions')
          .update(updateData)
          .eq('id', existingData.id)
          .select();

        if (error) {
          // SECURE: Don't log detailed database errors in production
          errorLog('❌ Database update failed');

          // Audit log for error - dev only
          const errorAudit = createAuditLog('SUBSCRIPTION_SAVE_ERROR', {
            ip,
            errorType: 'database_update',
            errorDetails: error.message,
          });
          devLog('📋 ERROR AUDIT:', errorAudit);

          return NextResponse.json(
            {
              ok: false,
              error: 'Failed to update subscription',
            },
            { status: 500 },
          );
        }

        // Success audit log - dev only
        const successAudit = createAuditLog('SUBSCRIPTION_SAVE_SUCCESS', {
          ip,
          operation: 'updated',
          subscriptionId: existingData.id,
        });
        devLog('📋 SUCCESS AUDIT:', successAudit);

        devLog('✅ Push subscription updated successfully');
        return NextResponse.json({
          ok: true,
          message: 'Subscription updated successfully',
          action: 'updated',
          // SECURE: Don't return sensitive subscription data
          id: data?.[0]?.id,
        });
      } else {
        // Insert new subscription
        devLog('🆕 Creating new subscription');

        const { data, error } = await supabase
          .from('push_subscriptions')
          .insert([subscriptionData])
          .select();

        if (error) {
          // SECURE: Don't log detailed database errors in production
          errorLog('❌ Database insert failed');

          // Audit log for error - dev only
          const errorAudit = createAuditLog('SUBSCRIPTION_SAVE_ERROR', {
            ip,
            errorType: 'database_insert',
            errorDetails: error.message,
          });
          devLog('📋 ERROR AUDIT:', errorAudit);

          return NextResponse.json(
            {
              ok: false,
              error: 'Failed to create subscription',
            },
            { status: 500 },
          );
        }

        // Success audit log - dev only
        const successAudit = createAuditLog('SUBSCRIPTION_SAVE_SUCCESS', {
          ip,
          operation: 'created',
          subscriptionId: data?.[0]?.id,
        });
        devLog('📋 SUCCESS AUDIT:', successAudit);

        devLog('✅ Push subscription created successfully');
        return NextResponse.json({
          ok: true,
          message: 'Subscription created successfully',
          action: 'created',
          // SECURE: Don't return sensitive subscription data
          id: data?.[0]?.id,
        });
      }
    } catch (dbError: any) {
      // SECURE: Handle database errors without exposing internal details
      errorLog('❌ Database operation failed');

      // Audit log for database error - dev only
      const errorAudit = createAuditLog('SUBSCRIPTION_SAVE_ERROR', {
        ip,
        errorType: 'database_operation',
        errorDetails: dbError.message,
      });
      devLog('📋 ERROR AUDIT:', errorAudit);

      // Check if it's a schema error (safe to expose)
      if (
        dbError.message &&
        dbError.message.includes('column "user_id" does not exist')
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Database schema error: Please contact support.',
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'Database operation failed',
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    // SECURE: Top-level error handling without sensitive data exposure
    errorLog('💥 Subscription save API error');

    // Audit log for general error - dev only
    const errorAudit = createAuditLog('SUBSCRIPTION_SAVE_ERROR', {
      ip: 'unknown',
      errorType: 'api_error',
      errorDetails: error.message,
    });
    devLog('📋 ERROR AUDIT:', errorAudit);

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
      },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
