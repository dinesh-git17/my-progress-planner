import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
);

export async function POST(req: NextRequest) {
  try {
    const { guestUserId, authUserId } = await req.json();



    if (!guestUserId || !authUserId) {
      return NextResponse.json(
        { error: 'Missing guestUserId or authUserId' },
        { status: 400 },
      );
    }

    if (guestUserId === authUserId) {

      return NextResponse.json({
        success: true,
        message: 'No merge needed - IDs are identical',
        skipped: true,
      });
    }

    // Step 1: Update meal logs

    const { data: mealUpdateData, error: mealUpdateError } = await supabase
      .from('meal_logs')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (mealUpdateError) {
      console.error('❌ Error updating meal logs:', mealUpdateError);
      throw mealUpdateError;
    }



    // Step 2: Update user names table

    const { data: nameUpdateData, error: nameUpdateError } = await supabase
      .from('user_names')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (nameUpdateError) {
      console.error('❌ Error updating user names:', nameUpdateError);
      // Don't throw - this table might not exist or have data

    }

    // Step 3: Update any push notification subscriptions

    const { data: pushUpdateData, error: pushUpdateError } = await supabase
      .from('push_subscriptions')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (pushUpdateError) {
      console.error('❌ Error updating push subscriptions:', pushUpdateError);
      // Don't throw - this table might not exist or have data

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



    return NextResponse.json({
      success: true,
      message: 'Data merged successfully',
      details: {
        mealLogsTransferred: finalMealCheck?.length || 0,
        userNamesTransferred: finalNameCheck?.length || 0,
        authUserId,
        guestUserId,
      },
    });
  } catch (error: any) {
    console.error('💥 API Error merging user data:', error);
    return NextResponse.json(
      {
        error: 'Failed to merge user data',
        details: error.message || error,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Also add a GET method for debugging/testing
export async function GET() {
  return NextResponse.json({
    message: 'Merge user data API endpoint',
    methods: ['POST'],
    requiredFields: ['guestUserId', 'authUserId'],
  });
}
