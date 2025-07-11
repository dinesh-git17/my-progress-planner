// src/app/api/friends/notes/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST - Send a new encouragement note to a friend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from_user_id, to_user_id, note } = body;

    // Validate required fields
    if (!from_user_id || !to_user_id || !note?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: from_user_id, to_user_id, note',
        },
        { status: 400 },
      );
    }

    // Validate note length
    if (note.trim().length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'Note must be 500 characters or less',
        },
        { status: 400 },
      );
    }

    // Prevent sending notes to yourself
    if (from_user_id === to_user_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot send note to yourself',
        },
        { status: 400 },
      );
    }

    console.log(`📝 Note request: ${from_user_id} → ${to_user_id}`);

    // Step 1: Verify friendship exists (bidirectional check)
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', from_user_id)
      .eq('friend_id', to_user_id)
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
          error: 'You must be friends to send notes',
        },
        { status: 403 },
      );
    }

    // Step 2: Get today's date in EST timezone (consistent with your app)
    const todayEst = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
    }).format(new Date());

    console.log(`📅 Using EST date: ${todayEst} for note storage`);

    // Step 3: Check if user already sent 5 notes today (NEW LIMIT: 5 per day per friend)
    const { data: existingNotes, error: checkError } = await supabase
      .from('friend_notes')
      .select('id')
      .eq('from_user_id', from_user_id)
      .eq('to_user_id', to_user_id)
      .eq('date', todayEst);

    if (checkError) {
      console.error('Note check error:', checkError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check existing notes',
        },
        { status: 500 },
      );
    }

    const notesCountToday = existingNotes?.length || 0;
    console.log(`📊 Notes sent today: ${notesCountToday}/5`);

    if (notesCountToday >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only send 5 notes per friend per day',
          notes_sent_today: notesCountToday,
          limit: 5,
        },
        { status: 400 },
      );
    }

    // Step 4: Insert the new note
    const { data: newNote, error: insertError } = await supabase
      .from('friend_notes')
      .insert({
        from_user_id,
        to_user_id,
        note: note.trim(),
        date: todayEst,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Note insert error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send note',
        },
        { status: 500 },
      );
    }

    console.log(
      `✅ Note sent successfully: ${newNote.id} (${notesCountToday + 1}/5 today)`,
    );

    // Step 5: Send push notification (don't fail if this fails)
    try {
      // Get sender's name for notification
      const { data: senderData } = await supabase
        .from('users')
        .select('name')
        .eq('user_id', from_user_id)
        .single();

      const senderName = senderData?.name || 'A friend';

      // Send notification
      await fetch(`${req.nextUrl.origin}/api/notifications/send-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_user_id,
          from_name: senderName,
          note_preview: note.trim(),
        }),
      });

      console.log(`📱 Notification sent for note ${newNote.id}`);
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Continue - note was saved successfully even if notification failed
    }

    return NextResponse.json({
      success: true,
      message: 'Note sent successfully',
      note: {
        id: newNote.id,
        note: newNote.note,
        date: newNote.date,
        created_at: newNote.created_at,
      },
      daily_stats: {
        notes_sent_today: notesCountToday + 1,
        remaining_today: 5 - (notesCountToday + 1),
        limit: 5,
      },
    });
  } catch (error: any) {
    console.error('💥 Friend notes POST error:', error);
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

/**
 * GET - Retrieve notes for a user (notes they received)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id'); // User receiving notes
    const date = searchParams.get('date'); // Optional: filter by specific date
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate required parameters
    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: user_id',
        },
        { status: 400 },
      );
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be between 1 and 100',
        },
        { status: 400 },
      );
    }

    console.log(
      `📖 Notes request for user: ${user_id}, date: ${date || 'all'}`,
    );

    // Build query
    let query = supabase
      .from('friend_notes')
      .select(
        `
        id,
        from_user_id,
        note,
        date,
        created_at
      `,
      )
      .eq('to_user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add date filter if specified
    if (date) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD',
          },
          { status: 400 },
        );
      }
      query = query.eq('date', date);
    }

    const { data: notes, error: notesError } = await query;

    if (notesError) {
      console.error('Notes fetch error:', notesError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch notes',
        },
        { status: 500 },
      );
    }

    // Get sender names separately to avoid JOIN complexity
    const notesWithNames = await Promise.all(
      (notes || []).map(async (note) => {
        // Get sender name from users table
        const { data: senderData } = await supabase
          .from('users')
          .select('name')
          .eq('user_id', note.from_user_id)
          .single();

        return {
          id: note.id,
          note: note.note,
          date: note.date,
          created_at: note.created_at,
          from_user_id: note.from_user_id,
          from_name: senderData?.name || 'Friend',
        };
      }),
    );

    console.log(`✅ Found ${notesWithNames.length} notes for user ${user_id}`);

    return NextResponse.json({
      success: true,
      notes: notesWithNames,
      count: notesWithNames.length,
      user_id,
      date: date || null,
    });
  } catch (error: any) {
    console.error('💥 Friend notes GET error:', error);
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
