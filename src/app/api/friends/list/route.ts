/**
 * Friends List API Endpoint
 *
 * GET /api/friends/list?user_id=xxx
 * - Retrieves all friends for a user
 * - Includes friend metadata (name, friend code, date added)
 * - Optimized with JOIN queries for performance
 * - Returns empty list if no friends found
 *
 * @route GET /api/friends/list
 * @param user_id - Query parameter with user's UUID
 * @returns JSON response with friends array and metadata
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET handler for retrieving user's friends list
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    // Input validation
    if (!userId) {
      return NextResponse.json(
        {
          error: 'user_id parameter is required',
          success: false,
          example: '/api/friends/list?user_id=your-user-id',
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



    // Get friends list using our utility function
    // Get friends list using direct query to avoid foreign key issues
    const { data: friendships, error: friendshipError } = await supabase
      .from('friendships')
      .select('friend_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (friendshipError) {
      console.error('❌ Error fetching friendships:', friendshipError);
      return NextResponse.json(
        {
          error: 'Failed to retrieve friends list',
          success: false,
          friends: [],
          count: 0,
          details:
            process.env.NODE_ENV === 'development'
              ? friendshipError.message
              : undefined,
        },
        { status: 500 },
      );
    }

    // Get user details for each friend separately
    const friends = [];
    for (const friendship of friendships || []) {
      const { data: userData } = await supabase
        .from('users')
        .select('user_id, name, friend_code')
        .eq('user_id', friendship.friend_id)
        .single();

      if (userData) {
        friends.push({
          user_id: userData.user_id,
          name: userData.name,
          friend_code: userData.friend_code,
          created_at: friendship.created_at,
        });
      }
    }

    const result = { success: true, friends };

    if (!result.success || !result.friends) {
      console.error(`❌ Unexpected error in friends list processing`);

      return NextResponse.json(
        {
          error: 'Failed to process friends list',
          success: false,
          friends: [],
          count: 0,
        },
        { status: 500 },
      );
    }

    // Enhance the friends data with additional metadata
    const enhancedFriends = result.friends.map((friend) => ({
      ...friend,
      // Add display-friendly friend code with spacing
      displayFriendCode: friend.friend_code
        ? `${friend.friend_code.slice(0, 3)} ${friend.friend_code.slice(3)}`
        : null,
      // Add relative time since friendship was created
      friendshipAge: calculateFriendshipAge(friend.created_at),
      // Add display name fallback
      displayName: friend.name || 'Anonymous Friend',
    }));



    return NextResponse.json({
      success: true,
      friends: enhancedFriends,
      count: enhancedFriends.length,
      userId,
      message:
        enhancedFriends.length > 0
          ? `Found ${enhancedFriends.length} friend${enhancedFriends.length === 1 ? '' : 's'}`
          : 'No friends found. Share your friend code to connect!',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Unexpected error in friends-list API:', error);

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while retrieving friends',
        success: false,
        friends: [],
        count: 0,
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * POST handler for batch friend operations (future feature)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, operation, friendIds } = body;

    // Validate basic input
    if (!userId || !operation) {
      return NextResponse.json(
        {
          error: 'userId and operation are required',
          success: false,
          supportedOperations: ['remove_multiple', 'block_multiple'],
        },
        { status: 400 },
      );
    }

    // Handle different batch operations
    switch (operation) {
      case 'remove_multiple':
        // TODO: Implement batch friend removal
        return NextResponse.json(
          {
            error: 'Batch friend removal not yet implemented',
            success: false,
            plannedFeature: true,
          },
          { status: 501 },
        );

      case 'block_multiple':
        // TODO: Implement batch friend blocking
        return NextResponse.json(
          {
            error: 'Friend blocking not yet implemented',
            success: false,
            plannedFeature: true,
          },
          { status: 501 },
        );

      default:
        return NextResponse.json(
          {
            error: `Unknown operation: ${operation}`,
            success: false,
            supportedOperations: ['remove_multiple', 'block_multiple'],
          },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error('❌ Error in friends-list POST:', error);

    return NextResponse.json(
      {
        error: 'Invalid request for batch friend operations',
        success: false,
      },
      { status: 400 },
    );
  }
}

/**
 * Helper function to calculate human-readable friendship age
 */
function calculateFriendshipAge(createdAt: string): string {
  try {
    const friendshipDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - friendshipDate.getTime();

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
  } catch (error) {
    console.warn('Error calculating friendship age:', error);
    return 'unknown';
  }
}

/**
 * DELETE handler for removing all friends (dangerous operation)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const confirmDelete = searchParams.get('confirm');

    if (!userId) {
      return NextResponse.json(
        {
          error: 'user_id parameter is required',
          success: false,
        },
        { status: 400 },
      );
    }

    if (confirmDelete !== 'yes') {
      return NextResponse.json(
        {
          error:
            'This operation removes ALL friends. Add ?confirm=yes to proceed.',
          success: false,
          warning: 'This action cannot be undone',
          exampleUrl: `/api/friends/list?user_id=${userId}&confirm=yes`,
        },
        { status: 400 },
      );
    }



    // Remove all friendships for this user (both directions)
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) {
      console.error('❌ Error removing all friends:', error);
      return NextResponse.json(
        {
          error: 'Failed to remove friends',
          success: false,
        },
        { status: 500 },
      );
    }



    return NextResponse.json({
      success: true,
      message: 'All friends removed successfully',
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error in friends DELETE:', error);

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        success: false,
      },
      { status: 500 },
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
