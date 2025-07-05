// app/api/admin/stats/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  try {
    // For now, skip auth to test the functionality
    // You can add auth back later once it's working
    console.log('📊 Fetching admin statistics...');

    // Get total users count from users table
    const { count: totalUsersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error fetching users count:', usersError);
      throw usersError;
    }

    console.log('👥 Total users count:', totalUsersCount);

    // Get total meals count from meal_logs table
    const { count: totalMealsCount, error: mealsError } = await supabase
      .from('meal_logs')
      .select('*', { count: 'exact', head: true });

    if (mealsError) {
      console.error('Error fetching meals count:', mealsError);
      throw mealsError;
    }

    console.log('🍽️ Total meals count:', totalMealsCount);

    // Get users who logged meals in the last 7 days (more accurate "active" users)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log(
      '📅 Looking for active users since:',
      sevenDaysAgo.toISOString(),
    );

    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('meal_logs')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (activeUsersError) {
      console.error('Error fetching active users:', activeUsersError);
      throw activeUsersError;
    }

    // Count unique active users
    const uniqueActiveUsers = new Set(
      activeUsersData?.map((log) => log.user_id) || [],
    ).size;
    console.log('🔥 Active users (last 7 days):', uniqueActiveUsers);

    // Get today's meal logs count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(
      '📅 Today range:',
      today.toISOString(),
      'to',
      tomorrow.toISOString(),
    );

    const { count: todayMealsCount, error: todayMealsError } = await supabase
      .from('meal_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (todayMealsError) {
      console.error('Error fetching today meals count:', todayMealsError);
      throw todayMealsError;
    }

    console.log('📊 Today meals count:', todayMealsCount);

    const stats = {
      totalUsers: totalUsersCount || 0,
      activeUsers: uniqueActiveUsers,
      totalMeals: totalMealsCount || 0,
      todayMeals: todayMealsCount || 0,
      lastUpdated: new Date().toISOString(),
    };

    console.log('✅ Final stats:', stats);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalMeals: 0,
          todayMeals: 0,
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}
