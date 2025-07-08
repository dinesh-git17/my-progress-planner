/**
 * Friend Code Management API Endpoint
 *
 * GET /api/user/friend-code?user_id=xxx
 * - Retrieves or generates a unique friend code for a user
 * - Creates user record if it doesn't exist
 * - Handles friend code generation with collision detection
 *
 * @route GET /api/user/friend-code
 * @param user_id - Query parameter with user's UUID
 * @returns JSON response with friend code or error
 */

import { getUserFriendCode } from '@/utils/user';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET handler for retrieving/generating friend codes
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    // Input validation
    if (!userId) {
      return NextResponse.json(
        {
          error: 'user_id parameter required',
          success: false,
        },
        { status: 400 },
      );
    }

    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid user_id format',
          success: false,
        },
        { status: 400 },
      );
    }

    console.log(`🔍 Friend code request for user: ${userId}`);

    // Get or generate friend code using our utility function
    const friendCode = await getUserFriendCode(userId);

    if (!friendCode) {
      console.error(
        `❌ Failed to get/generate friend code for user: ${userId}`,
      );
      return NextResponse.json(
        {
          error: 'Failed to generate friend code. Please try again.',
          success: false,
        },
        { status: 500 },
      );
    }

    console.log(`✅ Friend code ready: ${friendCode}`);

    // Return successful response
    return NextResponse.json({
      success: true,
      friendCode,
      userId,
      message: 'Friend code retrieved successfully',
    });
  } catch (error: any) {
    console.error('❌ Unexpected error in friend-code API:', error);

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        success: false,
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * POST handler for refreshing friend codes (optional feature)
 * Allows users to regenerate their friend code if needed
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, forceRegenerate } = body;

    // Input validation
    if (!userId) {
      return NextResponse.json(
        {
          error: 'userId is required in request body',
          success: false,
        },
        { status: 400 },
      );
    }

    if (!forceRegenerate) {
      return NextResponse.json(
        {
          error: 'forceRegenerate must be true to regenerate friend code',
          success: false,
        },
        { status: 400 },
      );
    }

    console.log(`🔄 Force regenerating friend code for user: ${userId}`);

    // Clear existing friend code first
    const { error: clearError } = await supabase
      .from('users')
      .update({ friend_code: null })
      .eq('user_id', userId);

    if (clearError) {
      console.error('❌ Error clearing existing friend code:', clearError);
      return NextResponse.json(
        {
          error: 'Failed to clear existing friend code',
          success: false,
        },
        { status: 500 },
      );
    }

    // Generate new friend code
    const newFriendCode = await getUserFriendCode(userId);

    if (!newFriendCode) {
      return NextResponse.json(
        {
          error: 'Failed to generate new friend code',
          success: false,
        },
        { status: 500 },
      );
    }

    console.log(`✅ New friend code generated: ${newFriendCode}`);

    return NextResponse.json({
      success: true,
      friendCode: newFriendCode,
      userId,
      message: 'Friend code regenerated successfully',
    });
  } catch (error: any) {
    console.error('❌ Unexpected error in friend-code POST:', error);

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        success: false,
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS handler for CORS (if needed)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
