// src/app/api/friends/data/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Type for daily summary data
interface DailySummary {
  name: string;
  breakfast_summary: string | null;
  lunch_summary: string | null;
  dinner_summary: string | null;
  breakfast_meal_summary: string | null;
  lunch_meal_summary: string | null;
  dinner_meal_summary: string | null;
  full_day_summary: string | null;
  created_at: string;
}

/**
 * Calculate streak from array of dates (reusing existing logic)
 */
function calculateStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));

  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let currentDate = today;

  for (const date of sortedDates) {
    if (date === currentDate) {
      streak++;
      // Move to previous day
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      currentDate = prevDate.toISOString().split('T')[0];
    } else {
      // Gap found, stop counting
      break;
    }
  }

  return streak;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id'); // Viewer
    const friend_id = searchParams.get('friend_id'); // Target friend
    const date =
      searchParams.get('date') || new Date().toISOString().split('T')[0]; // Default to today

    // Validate required parameters
    if (!user_id || !friend_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: user_id and friend_id',
        },
        { status: 400 },
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        },
        { status: 400 },
      );
    }

    console.log(
      `🔍 Friend data request: ${user_id} viewing ${friend_id} for ${date}`,
    );

    // Step 1: Verify friendship exists (bidirectional check)
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', user_id)
      .eq('friend_id', friend_id)
      .maybeSingle();

    if (friendshipError) {
      console.error('Friendship verification error:', friendshipError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify friendship',
        },
        { status: 500 },
      );
    }

    if (!friendship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Friendship not found. You must be friends to view this data.',
        },
        { status: 403 },
      );
    }

    // Step 2: Get friend's basic info
    const { data: friendInfo, error: friendInfoError } = await supabase
      .from('users')
      .select('user_id, friend_code')
      .eq('user_id', friend_id)
      .maybeSingle();

    if (friendInfoError || !friendInfo) {
      console.error('Friend info error:', friendInfoError);
      return NextResponse.json(
        {
          success: false,
          error: 'Friend not found',
        },
        { status: 404 },
      );
    }

    // Step 3: Get daily summaries for the specified date
    const { data: summaryData, error: summaryError } = (await supabase
      .from('daily_summaries')
      .select(
        `
        name,
        breakfast_summary,
        lunch_summary, 
        dinner_summary,
        breakfast_meal_summary,
        lunch_meal_summary,
        dinner_meal_summary,
        full_day_summary,
        created_at
      `,
      )
      .eq('user_id', friend_id)
      .eq('date', date)
      .maybeSingle()) as { data: DailySummary | null; error: any };

    if (summaryError) {
      console.error('Summary data error:', summaryError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch summary data',
        },
        { status: 500 },
      );
    }

    // Step 4: Calculate streak (get all dates with meal logs)
    const { data: streakDates, error: streakError } = await supabase
      .from('meal_logs')
      .select('date')
      .eq('user_id', friend_id)
      .order('date', { ascending: false });

    if (streakError) {
      console.error('Streak calculation error:', streakError);
      // Continue without streak data
    }

    const dateStrings = streakDates?.map((row) => row.date) || [];
    const uniqueDates = dateStrings.filter(
      (date, index, arr) => arr.indexOf(date) === index,
    );
    const currentStreak = calculateStreak(uniqueDates);

    // Step 5: Get friend notes for this date WITH sender names
    const { data: notesData, error: notesError } = await supabase
      .from('friend_notes')
      .select('id, from_user_id, note, created_at')
      .eq('to_user_id', friend_id)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (notesError) {
      console.error('Notes fetch error:', notesError);
      // Continue without notes
    }

    // Get sender names for each note
    const notesWithNames = await Promise.all(
      (notesData || []).map(async (note) => {
        // Get sender name from users table
        const { data: senderData } = await supabase
          .from('users')
          .select('name')
          .eq('user_id', note.from_user_id)
          .single();

        return {
          id: note.id,
          note: note.note,
          created_at: note.created_at,
          from_user_id: note.from_user_id,
          from_name: senderData?.name || 'Friend',
        };
      }),
    );

    // Step 6: Calculate progress metrics
    const mealsCompleted = [
      summaryData?.breakfast_summary,
      summaryData?.lunch_summary,
      summaryData?.dinner_summary,
    ].filter(Boolean).length;

    const progress = {
      meals_completed_today: mealsCompleted,
      total_possible: 3,
      completion_percentage: Math.round((mealsCompleted / 3) * 100),
    };

    // Step 7: Construct response
    const response = {
      success: true,
      friend: {
        user_id: friend_id,
        name: summaryData?.name || 'Friend',
        friend_code: friendInfo.friend_code,
      },
      date,
      summaries: {
        breakfast_summary: summaryData?.breakfast_summary || null,
        lunch_summary: summaryData?.lunch_summary || null,
        dinner_summary: summaryData?.dinner_summary || null,
        breakfast_meal_summary: summaryData?.breakfast_meal_summary || null,
        lunch_meal_summary: summaryData?.lunch_meal_summary || null,
        dinner_meal_summary: summaryData?.dinner_meal_summary || null,
        full_day_summary: summaryData?.full_day_summary || null,
      },
      streak: {
        current: currentStreak,
        dates: uniqueDates.slice(0, 30), // Last 30 days for performance
      },
      progress,
      notes: notesWithNames || [],
      metadata: {
        has_data: !!summaryData,
        last_updated: summaryData?.created_at || null,
      },
    };

    console.log(
      `✅ Friend data fetched successfully for ${friend_id} on ${date}`,
    );
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('💥 Friend data API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
