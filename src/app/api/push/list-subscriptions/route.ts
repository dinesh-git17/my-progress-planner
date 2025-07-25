// src/app/api/push/list-subscriptions/route.ts
/**
 * SECURED Push Subscriptions List API Endpoint
 *
 * GET /api/push/list-subscriptions
 * - Lists push notification subscriptions
 * - Admin can see all subscriptions
 * - Users can only see their own subscriptions
 * - NOW WITH ENTERPRISE-LEVEL SECURITY ✅
 *
 * @route GET /api/push/list-subscriptions?user_id=<optional>
 * @headers Authorization: Bearer <jwt-token> OR X-Admin-Password: <admin-password>
 * @returns JSON response with subscription list
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ============================================================================
// SECURITY MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Validates admin password from header
 */
async function validateAdminAuth(req: NextRequest): Promise<boolean> {
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

  return false;
}

/**
 * Validates that the authenticated user can access subscription data
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

    // Skip if it's an admin password (already checked)
    if (token === process.env.ADMIN_PASSWORD) {
      return { valid: false };
    }

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
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 subscription list requests per minute per IP

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

export async function GET(req: NextRequest) {
  try {
    // Security Layer 1: Rate Limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0]
      : req.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      console.warn('🚫 Rate limit exceeded for IP:', ip);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('user_id');

    console.log('📋 Secure subscription list request:', {
      requestedUserId: requestedUserId || 'all',
      ip,
    });

    // Security Layer 2: Authentication Check
    const isAdminAuthenticated = await validateAdminAuth(req);
    const userAuth = !isAdminAuthenticated
      ? await validateUserAuth(req)
      : { valid: false };

    if (!isAdminAuthenticated && !userAuth.valid) {
      console.warn('🚫 Unauthorized subscription list attempt:', {
        ip,
        requestedUserId,
      });
      return NextResponse.json(
        {
          error: 'Unauthorized. Authentication required to view subscriptions.',
        },
        { status: 401 },
      );
    }

    console.log(
      '✅ Authentication successful:',
      isAdminAuthenticated ? 'Admin' : 'User',
    );

    // Security Layer 3: Authorization - Non-admin users can only see their own subscriptions
    let finalUserId: string | null = requestedUserId;

    if (!isAdminAuthenticated) {
      // Non-admin users can only see their own subscriptions
      if (requestedUserId && requestedUserId !== userAuth.userId) {
        console.warn('🚫 User trying to access other user subscriptions:', {
          authenticatedUser: userAuth.userId,
          requestedUser: requestedUserId,
        });
        return NextResponse.json(
          { error: 'You can only view your own subscriptions.' },
          { status: 403 },
        );
      }

      // Force user to only see their own subscriptions
      finalUserId = userAuth.userId || null;
    }

    // Build query to get subscriptions
    let query = supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, created_at');

    // If targeting specific user (or forced for non-admin)
    if (finalUserId) {
      query = query.eq('user_id', finalUserId);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    // Limit results for non-admin users
    if (!isAdminAuthenticated) {
      query = query.limit(50); // Max 50 results for regular users
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 },
      );
    }

    console.log(`✅ Found ${subscriptions?.length || 0} subscription(s)`);

    // Security Layer 4: Data sanitization based on auth level
    const sanitizedSubscriptions =
      subscriptions?.map((sub) => {
        if (isAdminAuthenticated) {
          // Admin gets full data
          return {
            id: sub.id,
            user_id: sub.user_id,
            endpoint: sub.endpoint,
            created_at: sub.created_at,
            domain: sub.endpoint ? new URL(sub.endpoint).hostname : 'unknown',
          };
        } else {
          // Regular users get limited data
          return {
            id: sub.id,
            created_at: sub.created_at,
            domain: sub.endpoint ? new URL(sub.endpoint).hostname : 'unknown',
            // Don't expose user_id or full endpoint for privacy
          };
        }
      }) || [];

    // Security Layer 5: Audit logging
    console.log('📋 AUDIT LOG - SUBSCRIPTION LIST:', {
      action: 'SUBSCRIPTION_LIST_ACCESS',
      timestamp: new Date().toISOString(),
      ip,
      authMethod: isAdminAuthenticated ? 'ADMIN' : 'USER_JWT',
      authenticatedUser: userAuth.userId || 'admin',
      requestedUserId: finalUserId,
      resultCount: sanitizedSubscriptions.length,
    });

    const responseMessage = isAdminAuthenticated
      ? `Found ${sanitizedSubscriptions.length} subscription${sanitizedSubscriptions.length === 1 ? '' : 's'}`
      : sanitizedSubscriptions.length > 0
        ? `You have ${sanitizedSubscriptions.length} active subscription${sanitizedSubscriptions.length === 1 ? '' : 's'}`
        : 'No active subscriptions found. Enable notifications to receive updates!';

    return NextResponse.json({
      success: true,
      subscriptions: sanitizedSubscriptions,
      total: sanitizedSubscriptions.length,
      message: responseMessage,
      authMethod: isAdminAuthenticated ? 'admin' : 'user',
      scope: finalUserId ? 'user-specific' : 'all-users',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('💥 List subscriptions API error:', error);

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

// Remove POST method to reduce attack surface unless specifically needed
export async function POST() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests',
    },
    { status: 405 },
  );
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'GET, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Admin-Password',
    },
  });
}
