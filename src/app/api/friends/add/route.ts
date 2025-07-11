/**
 * Add Friend API Endpoint
 *
 * POST /api/friends/add
 * - Adds a friend using their friend code
 * - Validates friend code format and existence
 * - Creates bidirectional friendship
 * - Prevents duplicate friendships and self-adding
 *
 * @route POST /api/friends/add
 * @body { userId: string, friendCode: string }
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

/**
 * POST handler for adding friends via friend codes
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { userId, friendCode } = body;

    // Input validation
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

    console.log(`🤝 Add friend request: ${userId} wants to add ${friendCode}`);

    // Use our utility function to add the friend
    const result = await addFriend(userId, friendCode.trim().toUpperCase());

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

      return NextResponse.json(
        {
          error: result.error,
          success: false,
          userId,
          friendCode,
        },
        { status: statusCode },
      );
    }

    // Success case
    console.log(`✅ Successfully added friend: ${result.friendName}`);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${result.friendName} as a friend!`,
      friendName: result.friendName,
      userId,
      friendCode,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Unexpected error in add-friend API:', error);

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
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * GET handler for API documentation/health check
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/friends/add',
    method: 'POST',
    description: 'Add a friend using their friend code',
    requiredFields: {
      userId: 'string - UUID of the user adding a friend',
      friendCode: 'string - 6-character friend code (ABC123 format)',
    },
    example: {
      request: {
        userId: 'user-uuid-here',
        friendCode: 'ABC123',
      },
      response: {
        success: true,
        message: 'Successfully added Sarah as a friend!',
        friendName: 'Sarah',
        userId: 'user-uuid-here',
        friendCode: 'ABC123',
      },
    },
    errorCodes: {
      400: 'Invalid input parameters',
      404: 'Friend code not found',
      409: 'Already friends or cannot add yourself',
      500: 'Server error',
    },
  });
}

/**
 * DELETE handler for removing friends (future feature)
 * Currently returns not implemented
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, friendUserId } = body;

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
      Allow: 'GET, POST, DELETE, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
