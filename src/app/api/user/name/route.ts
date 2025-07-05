import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter required' },
        { status: 400 },
      );
    }

    // Check users table for name
    const { data: userData, error } = await supabase
      .from('users')
      .select('name')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('Error fetching user name:', error);
    }

    return NextResponse.json({
      name: userData?.name || null,
      userId: userId, // Explicitly assign the property
    });
  } catch (error: any) {
    console.error('Error fetching user name:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user name',
        name: null,
        userId: null,
      },
      { status: 500 },
    );
  }
}
