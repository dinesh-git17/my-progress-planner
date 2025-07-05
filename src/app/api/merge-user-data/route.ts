import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
);

export async function POST(req: NextRequest) {
  try {
    const { guestUserId, authUserId } = await req.json();

    console.log('🔄 API: Starting data merge...');
    console.log('📝 Guest ID:', guestUserId);
    console.log('🔐 Auth ID:', authUserId);

    if (!guestUserId || !authUserId) {
      return NextResponse.json(
        { error: 'Missing guestUserId or authUserId' },
        { status: 400 },
      );
    }

    if (guestUserId === authUserId) {
      console.log('ℹ️ Guest and auth IDs are the same, no merge needed');
      return NextResponse.json({
        success: true,
        message: 'No merge needed - IDs are identical',
        skipped: true,
      });
    }

    // Step 1: Update meal logs
    console.log('🍽️ Updating meal logs...');
    const { data: mealUpdateData, error: mealUpdateError } = await supabase
      .from('meal_logs')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (mealUpdateError) {
      console.error('❌ Error updating meal logs:', mealUpdateError);
      throw mealUpdateError;
    }

    console.log('✅ Meal logs updated successfully');

    // Step 2: Update user names table
    console.log('👤 Updating user names...');
    const { data: nameUpdateData, error: nameUpdateError } = await supabase
      .from('user_names')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (nameUpdateError) {
      console.error('❌ Error updating user names:', nameUpdateError);
      // Don't throw - this table might not exist or have data
      console.log('ℹ️ Continuing despite user_names error...');
    }

    // Step 3: Update any push notification subscriptions
    console.log('🔔 Updating push subscriptions...');
    const { data: pushUpdateData, error: pushUpdateError } = await supabase
      .from('push_subscriptions')
      .update({ user_id: authUserId })
      .eq('user_id', guestUserId);

    if (pushUpdateError) {
      console.error('❌ Error updating push subscriptions:', pushUpdateError);
      // Don't throw - this table might not exist or have data
      console.log('ℹ️ Continuing despite push_subscriptions error...');
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

    console.log('✅ Data merge completed successfully');
    console.log('📊 Final meal logs count:', finalMealCheck?.length || 0);
    console.log('📊 Final name records count:', finalNameCheck?.length || 0);

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
