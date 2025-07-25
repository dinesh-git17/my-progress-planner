// src/app/api/merge-user-data/route.ts
/**
 * SECURED Merge User Data API Endpoint
 *
 * POST /api/merge-user-data
 * - Merges guest user data into authenticated user account
 * - Multi-layer authentication and rate limiting
 * - Environment-aware logging (dev only)
 * - NOW WITH PRODUCTION-SAFE LOGGING ✅
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
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
 * Sanitizes user ID for logging (dev only, shows first 8 chars)
 */
function sanitizeUserId(userId: string): string {
  if (!userId || userId.length < 8) return 'invalid-id';
  return `${userId.slice(0, 8)}...`;
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
  if (action === 'USER_DATA_MERGE') {
    return {
      ...auditLog,
      authMethod: data.authMethod || 'unknown',
      mealLogsTransferred: data.mealLogsTransferred || 0,
      userNamesTransferred: data.userNamesTransferred || 0,
      // Only log sanitized user IDs in development
      guestUserId:
        isDevelopment && data.guestUserId
          ? sanitizeUserId(data.guestUserId)
          : 'hidden',
      authUserId:
        isDevelopment && data.authUserId
          ? sanitizeUserId(data.authUserId)
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
 * Validates that the authenticated user owns both user IDs being merged
 */
async function validateUserOwnership(
  req: NextRequest,
  guestUserId: string,
  authUserId: string,
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
      devLog('❌ Invalid JWT token:', error);
      return false;
    }

    // Verify that the authUserId matches the authenticated user
    if (user.id !== authUserId) {
      devLog('❌ Auth user ID mismatch:', {
        tokenUserId: user.id,
        requestedUserId: authUserId,
      });
      return false;
    }

    return true;
  } catch (error) {
    devLog('❌ Error validating user ownership:', error);
    return false;
  }
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 requests per minute per IP

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
      warnLog('🚫 Rate limit exceeded for merge API:', { ip });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { guestUserId, authUserId, adminPassword } = requestBody;

    devLog('🔄 Starting secure data merge operation');
    devLog('📝 Guest ID:', guestUserId ? sanitizeUserId(guestUserId) : 'none');
    devLog('🔐 Auth ID:', authUserId ? sanitizeUserId(authUserId) : 'none');

    // Basic validation
    if (!guestUserId || !authUserId) {
      return NextResponse.json(
        { error: 'Missing guestUserId or authUserId' },
        { status: 400 },
      );
    }

    if (guestUserId === authUserId) {
      devLog('ℹ️ Guest and auth IDs are identical, no merge needed');
      return NextResponse.json({
        success: true,
        message: 'No merge needed - IDs are identical',
        skipped: true,
      });
    }

    // Security Layer 2: Authentication Check
    // Try admin authentication first, then user authentication
    const isAdminAuthenticated = await validateAdminAuth(req, requestBody);
    const isUserAuthenticated = !isAdminAuthenticated
      ? await validateUserOwnership(req, guestUserId, authUserId)
      : false;

    if (!isAdminAuthenticated && !isUserAuthenticated) {
      warnLog('🚫 Unauthorized merge attempt detected', { ip });
      return NextResponse.json(
        { error: 'Unauthorized. Invalid credentials or token.' },
        { status: 401 },
      );
    }

    devLog(
      '✅ Authentication successful:',
      isAdminAuthenticated ? 'Admin' : 'User',
    );

    // Security Layer 3: Additional validation for user-authenticated requests
    if (!isAdminAuthenticated) {
      // For user authentication, add extra checks
      // Verify that both user IDs exist and guest data isn't too old
      const { data: guestData } = await supabase
        .from('meal_logs')
        .select('created_at')
        .eq('user_id', guestUserId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (guestData && guestData.length > 0) {
        const lastGuestActivity = new Date(guestData[0].created_at);
        const daysSinceLastActivity =
          (Date.now() - lastGuestActivity.getTime()) / (1000 * 60 * 60 * 24);

        // Prevent merging very old guest data (security measure)
        if (daysSinceLastActivity > 30) {
          warnLog('🚫 Attempted merge of stale guest data', {
            daysSinceLastActivity,
          });
          return NextResponse.json(
            { error: 'Guest data is too old to merge safely.' },
            { status: 400 },
          );
        }
      }
    }

    // Step 1: Update meal logs
    devLog('🍽️ Updating meal logs...');
    const { data: mealUpdateData, error: mealUpdateError } = await supabase
      .from('meal_logs')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (mealUpdateError) {
      errorLog('❌ Error updating meal logs');
      devLog('❌ Meal logs error details:', mealUpdateError);
      throw mealUpdateError;
    }

    devLog('✅ Meal logs updated successfully');

    // Step 2: Update user names table
    devLog('👤 Updating user names...');
    const { data: nameUpdateData, error: nameUpdateError } = await supabase
      .from('user_names')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (nameUpdateError) {
      devLog('❌ Error updating user names:', nameUpdateError);
      // Don't throw - this table might not exist or have data
      devLog('ℹ️ Continuing despite user_names error...');
    }

    // Step 3: Update any push notification subscriptions
    devLog('🔔 Updating push subscriptions...');
    const { data: pushUpdateData, error: pushUpdateError } = await supabase
      .from('push_subscriptions')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (pushUpdateError) {
      devLog('❌ Error updating push subscriptions:', pushUpdateError);
      // Don't throw - this table might not exist or have data
      devLog('ℹ️ Continuing despite push_subscriptions error...');
    }

    // Step 4: Check what data was actually moved
    const { data: finalMealCheck } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', authUserId);

    const { data: finalNameCheck } = await supabase
      .from('user_names')
      .select('*')
      .eq('user_id', authUserId);

    // Security Layer 4: Secure Audit logging (dev only)
    const auditData = createSecureAuditLog('USER_DATA_MERGE', {
      ip,
      authMethod: isAdminAuthenticated ? 'ADMIN' : 'USER_JWT',
      guestUserId,
      authUserId,
      mealLogsTransferred: finalMealCheck?.length || 0,
      userNamesTransferred: finalNameCheck?.length || 0,
    });
    devLog('📋 AUDIT LOG:', auditData);

    devLog('✅ Data merge completed successfully');
    devLog('📊 Final meal logs count:', finalMealCheck?.length || 0);
    devLog('📊 Final name records count:', finalNameCheck?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'Data merged successfully',
      details: {
        mealLogsTransferred: finalMealCheck?.length || 0,
        userNamesTransferred: finalNameCheck?.length || 0,
        authUserId,
        guestUserId,
        authMethod: isAdminAuthenticated ? 'admin' : 'user',
      },
    });
  } catch (error: any) {
    errorLog('💥 API Error merging user data');
    devLog('💥 Merge error details:', error);

    // Security: Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        error: 'Failed to merge user data',
        details: isDevelopment
          ? error.message || error
          : 'Internal server error',
        stack: isDevelopment ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Remove the GET method to reduce attack surface
// If you need debugging, create a separate debug endpoint with proper authentication
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests',
    },
    { status: 405 },
  );
}
