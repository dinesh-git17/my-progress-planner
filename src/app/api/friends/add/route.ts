// src/app/api/friends/add/route.ts
/**
 * SECURED Add Friend API Endpoint
 *
 * POST /api/friends/add
 * - Adds a friend using their friend code
 * - Validates friend code format and existence
 * - Creates bidirectional friendship
 * - Prevents duplicate friendships and self-adding
 * - NOW WITH MULTI-LAYER SECURITY ✅
 *
 * @route POST /api/friends/add
 * @body { userId: string, friendCode: string, adminPassword?: string }
 * @headers Authorization: Bearer <jwt-token> OR X-Admin-Password: <admin-password>
 * @returns JSON response with success status and friend details
 */

import { addFriend } from '@/utils/user';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
 * Validates that the authenticated user owns the userId being used
 */
async function validateUserOwnership(
  req: NextRequest,
  userId: string,
): Promise<boolean> {
  try {
    // Get session from Supabase auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
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
      return false;
    }

    // Verify that the userId matches the authenticated user
    if (user.id !== userId) {
      console.error('❌ User ID mismatch:', {
        tokenUserId: user.id,
        requestedUserId: userId,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error validating user ownership:', error);
    return false;
  }
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 friend requests per minute per IP

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

/**
 * POST handler for adding friends via friend codes (SECURED)
 */
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
        { error: 'Too many friend requests. Please try again later.' },
        { status: 429 },
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { userId, friendCode, adminPassword } = requestBody;

    console.log(
      `🤝 Secure add friend request: ${userId} wants to add ${friendCode}`,
    );
    console.log('🔍 IP Address:', ip);

    // Basic input validation
    if (!userId || !friendCode) {
      return NextResponse.json(
        {
          error: 'Both userId and friendCode are required',
          success: false,
          requiredFields: ['userId', 'friendCode'],
        },
        { status: 400 },
      );
    }

    if (typeof userId !== 'string' || typeof friendCode !== 'string') {
      return NextResponse.json(
        {
          error: 'userId and friendCode must be strings',
          success: false,
        },
        { status: 400 },
      );
    }

    if (userId.trim().length === 0 || friendCode.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'userId and friendCode cannot be empty',
          success: false,
        },
        { status: 400 },
      );
    }

    // Security Layer 2: Authentication Check
    // Try admin authentication first, then user authentication
    const isAdminAuthenticated = await validateAdminAuth(req, requestBody);
    const isUserAuthenticated = !isAdminAuthenticated
      ? await validateUserOwnership(req, userId)
      : false;

    if (!isAdminAuthenticated && !isUserAuthenticated) {
      console.warn('🚫 Unauthorized friend add attempt:', {
        ip,
        userId,
        friendCode,
      });
      return NextResponse.json(
        { error: 'Unauthorized. Invalid credentials or token.' },
        { status: 401 },
      );
    }

    console.log(
      '✅ Authentication successful:',
      isAdminAuthenticated ? 'Admin' : 'User',
    );

    // Security Layer 3: Friend Code Validation
    const cleanFriendCode = friendCode.trim().toUpperCase();

    // Validate friend code format (should be 6 characters, alphanumeric)
    if (!/^[A-Z0-9]{6}$/.test(cleanFriendCode)) {
      return NextResponse.json(
        {
          error:
            'Invalid friend code format. Must be 6 alphanumeric characters.',
          success: false,
        },
        { status: 400 },
      );
    }

    // Security Layer 4: Prevent excessive friend requests from same user
    if (!isAdminAuthenticated) {
      // Check if user has made too many friend requests recently
      const { data: recentRequests } = await supabase
        .from('user_friends')
        .select('created_at')
        .eq('user_id', userId)
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ) // Last 24 hours
        .order('created_at', { ascending: false });

      if (recentRequests && recentRequests.length >= 10) {
        console.warn('🚫 Too many friend requests from user:', userId);
        return NextResponse.json(
          {
            error: 'Too many friend requests today. Please try again tomorrow.',
          },
          { status: 429 },
        );
      }
    }

    // Use our utility function to add the friend
    const result = await addFriend(userId, cleanFriendCode);

    // Handle different response scenarios
    if (!result.success) {
      // Determine appropriate HTTP status code based on error type
      let statusCode = 400; // Default to bad request

      if (result.error?.includes('not found')) {
        statusCode = 404;
      } else if (result.error?.includes('already friends')) {
        statusCode = 409; // Conflict
      } else if (result.error?.includes('cannot add yourself')) {
        statusCode = 400; // Bad request
      } else if (result.error?.includes('Database error')) {
        statusCode = 500; // Internal server error
      }

      console.warn(`❌ Add friend failed: ${result.error}`);

      // Security Layer 5: Audit logging for failures
      console.log('📋 AUDIT LOG - FRIEND ADD FAILURE:', {
        action: 'FRIEND_ADD_FAILED',
        timestamp: new Date().toISOString(),
        ip,
        authMethod: isAdminAuthenticated ? 'ADMIN' : 'USER_JWT',
        userId,
        friendCode: cleanFriendCode,
        error: result.error,
        statusCode,
      });

      return NextResponse.json(
        {
          error: result.error,
          success: false,
          userId,
          friendCode: cleanFriendCode,
        },
        { status: statusCode },
      );
    }

    // Security Layer 5: Audit logging for success
    console.log('📋 AUDIT LOG - FRIEND ADD SUCCESS:', {
      action: 'FRIEND_ADD_SUCCESS',
      timestamp: new Date().toISOString(),
      ip,
      authMethod: isAdminAuthenticated ? 'ADMIN' : 'USER_JWT',
      userId,
      friendCode: cleanFriendCode,
      friendName: result.friendName,
    });

    // Success case
    console.log(`✅ Successfully added friend: ${result.friendName}`);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${result.friendName} as a friend!`,
      friendName: result.friendName,
      userId,
      friendCode: cleanFriendCode,
      timestamp: new Date().toISOString(),
      authMethod: isAdminAuthenticated ? 'admin' : 'user',
    });
  } catch (error: any) {
    console.error('❌ Unexpected error in add-friend API:', error);

    // Security: Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          success: false,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while adding friend',
        success: false,
        details: isDevelopment ? error.message : undefined,
        stack: isDevelopment ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * GET handler removed to reduce attack surface
 * Use a separate debug endpoint with proper authentication if needed
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests',
    },
    { status: 405 },
  );
}

/**
 * DELETE handler for removing friends (future feature)
 * Currently returns not implemented but with security
 */
export async function DELETE(req: NextRequest) {
  try {
    // Security check for DELETE operations too
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0]
      : req.headers.get('x-real-ip') || 'unknown';

    const requestBody = await req.json();
    const { userId, friendUserId } = requestBody;

    // Basic auth check for future DELETE functionality
    const isAdminAuthenticated = await validateAdminAuth(req, requestBody);
    const isUserAuthenticated = !isAdminAuthenticated
      ? await validateUserOwnership(req, userId)
      : false;

    if (!isAdminAuthenticated && !isUserAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required for friend removal.' },
        { status: 401 },
      );
    }

    // TODO: Implement friend removal in future version
    return NextResponse.json(
      {
        error: 'Friend removal not yet implemented',
        success: false,
        plannedFeature: true,
        message: 'This feature will be available in a future update',
      },
      { status: 501 }, // Not Implemented
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid request for friend removal',
        success: false,
      },
      { status: 400 },
    );
  }
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'POST, DELETE, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Admin-Password',
    },
  });
}
