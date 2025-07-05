import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { legacyUserId, currentUserId } = await req.json();

    console.log('🔄 === RECOVERY API V2 ===');
    console.log('📝 Legacy User ID:', legacyUserId);
    console.log('🔐 Current User ID:', currentUserId);

    // Validate input
    if (!legacyUserId || !currentUserId || legacyUserId === currentUserId) {
      return NextResponse.json(
        { error: 'Invalid user IDs', success: false },
        { status: 400 },
      );
    }

    // === STEP 1: Find all legacy data ===
    console.log('🔍 === STEP 1: Finding legacy data ===');

    const { data: legacyMealLogs, error: mealError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', legacyUserId);

    const { data: legacySummaries, error: summaryError } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', legacyUserId);

    const { data: legacyUserData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', legacyUserId);

    if (mealError) throw mealError;
    if (summaryError) console.error('Summary check error:', summaryError);
    if (userError) console.error('User check error:', userError);

    const hasMealData = legacyMealLogs && legacyMealLogs.length > 0;
    const hasSummaryData = legacySummaries && legacySummaries.length > 0;
    const hasUserData = legacyUserData && legacyUserData.length > 0;
    const legacyUserName = hasUserData ? legacyUserData[0]?.name : null;

    console.log(
      `📊 Found: ${legacyMealLogs?.length || 0} meals, ${legacySummaries?.length || 0} summaries, ${hasUserData ? '1' : '0'} user (${legacyUserName || 'no name'})`,
    );

    if (!hasMealData && !hasSummaryData && !hasUserData) {
      return NextResponse.json(
        { error: 'No data found', success: false },
        { status: 404 },
      );
    }

    // === STEP 2: Create current user record FIRST ===
    console.log('🥇 === STEP 2: Creating current user record FIRST ===');

    let nameTransferred = false;

    if (legacyUserName) {
      console.log('👤 Creating user record with name:', legacyUserName);
      const { data: newUserData, error: createUserError } = await supabase
        .from('users')
        .upsert({
          user_id: currentUserId,
          name: legacyUserName,
        })
        .select();

      if (createUserError) {
        console.error('❌ Failed to create user:', createUserError);
        throw createUserError;
      }

      nameTransferred = true;
      console.log('✅ User created successfully:', newUserData[0]);
    } else {
      console.log('👤 Creating user record without name');
      const { data: newUserData, error: createUserError } = await supabase
        .from('users')
        .upsert({
          user_id: currentUserId,
          name: null,
        })
        .select();

      if (createUserError) {
        console.error('❌ Failed to create user:', createUserError);
        throw createUserError;
      }

      console.log('✅ User created successfully:', newUserData[0]);
    }

    // === STEP 3: Transfer meal logs ===
    console.log('🥈 === STEP 3: Transferring meal logs ===');

    let mealLogsTransferred = 0;

    if (hasMealData) {
      const { data: updatedMeals, error: mealUpdateError } = await supabase
        .from('meal_logs')
        .update({ user_id: currentUserId })
        .eq('user_id', legacyUserId)
        .select();

      if (mealUpdateError) {
        console.error('❌ Failed to transfer meals:', mealUpdateError);
        throw mealUpdateError;
      }

      mealLogsTransferred = updatedMeals?.length || 0;
      console.log(`✅ Transferred ${mealLogsTransferred} meal logs`);
    }

    // === STEP 4: Transfer summaries (user now exists!) ===
    console.log('🥉 === STEP 4: Transferring summaries ===');

    let summariesTransferred = 0;

    if (hasSummaryData) {
      console.log(`📋 Transferring ${legacySummaries.length} summaries...`);

      const { data: updatedSummaries, error: summaryUpdateError } =
        await supabase
          .from('daily_summaries')
          .update({ user_id: currentUserId })
          .eq('user_id', legacyUserId)
          .select();

      if (summaryUpdateError) {
        console.error('❌ Failed to transfer summaries:', summaryUpdateError);
        console.error('❌ Summary error details:', summaryUpdateError);
        // Don't throw - continue without summaries
      } else {
        summariesTransferred = updatedSummaries?.length || 0;
        console.log(`✅ Transferred ${summariesTransferred} summaries`);
        console.log('📋 Summary details:', updatedSummaries);
      }
    }

    // === STEP 5: Clean up legacy user ===
    console.log('🧹 === STEP 5: Cleaning up legacy user ===');

    if (hasUserData) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', legacyUserId);

      if (deleteError) {
        console.error('❌ Failed to delete legacy user:', deleteError);
      } else {
        console.log('✅ Legacy user deleted');
      }
    }

    // === SUCCESS ===
    console.log('🎉 === RECOVERY COMPLETED ===');
    console.log(
      `📊 Results: ${mealLogsTransferred} meals, ${summariesTransferred} summaries, name: ${nameTransferred}`,
    );

    return NextResponse.json({
      success: true,
      message: 'Data recovered successfully',
      data: {
        mealLogsCount: mealLogsTransferred,
        summariesCount: summariesTransferred,
        nameTransferred,
        legacyUserId,
        currentUserId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('💥 Recovery failed:', error);
    return NextResponse.json(
      {
        error: 'Recovery failed',
        details: error.message,
        success: false,
      },
      { status: 500 },
    );
  }
}
