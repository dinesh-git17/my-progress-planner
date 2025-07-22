// src/app/api/push/save-subscription/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    console.log('📥 Received POST request to save-subscription');

    // Safely parse the JSON body
    let body;
    try {
      const rawBody = await req.text();
      console.log('🔍 Raw request body:', rawBody);

      if (!rawBody || rawBody.trim() === '') {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Empty request body. Expected JSON with subscription object.',
          },
          { status: 400 },
        );
      }

      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 },
      );
    }

    const { subscription, user_id } = body;

    console.log('💾 Saving push subscription:', {
      endpoint: subscription?.endpoint,
      hasKeys: subscription?.keys ? 'yes' : 'no',
      user_id: user_id || 'not provided',
    });

    // Validate subscription object
    if (!subscription) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing subscription object',
        },
        { status: 400 },
      );
    }

    if (!subscription.endpoint) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid subscription: missing endpoint',
        },
        { status: 400 },
      );
    }

    // Validate subscription has required keys for web push
    if (
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid subscription: missing required keys (p256dh, auth)',
        },
        { status: 400 },
      );
    }

    // Prepare the subscription data
    const subscriptionData: any = {
      endpoint: subscription.endpoint,
      subscription: subscription, // Store the full subscription object
      created_at: new Date().toISOString(),
    };

    // Include user_id if provided
    if (user_id) {
      subscriptionData.user_id = user_id;
      console.log(`🔗 Linking subscription to user: ${user_id}`);
    } else {
      console.log('⚠️ No user_id provided - subscription will be anonymous');
    }

    // Check if the table has the user_id column
    try {
      // First, try to find existing subscription by endpoint
      const { data: existingData } = await supabase
        .from('push_subscriptions')
        .select('id, user_id')
        .eq('endpoint', subscription.endpoint)
        .maybeSingle();

      if (existingData) {
        // Update existing subscription
        console.log(
          `📝 Updating existing subscription (ID: ${existingData.id})`,
        );

        const updateData: any = {
          subscription: subscription,
          created_at: new Date().toISOString(), // Update timestamp
        };

        // Only update user_id if provided and different
        if (user_id && user_id !== existingData.user_id) {
          updateData.user_id = user_id;
          console.log(
            `🔄 Updating user_id from ${existingData.user_id} to ${user_id}`,
          );
        }

        const { data, error } = await supabase
          .from('push_subscriptions')
          .update(updateData)
          .eq('id', existingData.id)
          .select();

        if (error) {
          console.error('❌ Supabase update error:', error);
          return NextResponse.json(
            {
              ok: false,
              error: `Database update error: ${error.message}`,
            },
            { status: 500 },
          );
        }

        console.log('✅ Push subscription updated successfully');
        return NextResponse.json({
          ok: true,
          message: 'Subscription updated successfully',
          action: 'updated',
          data: data?.[0],
        });
      } else {
        // Insert new subscription
        console.log('🆕 Creating new subscription');

        const { data, error } = await supabase
          .from('push_subscriptions')
          .insert([subscriptionData])
          .select();

        if (error) {
          console.error('❌ Supabase insert error:', error);
          return NextResponse.json(
            {
              ok: false,
              error: `Database insert error: ${error.message}`,
            },
            { status: 500 },
          );
        }

        console.log('✅ Push subscription created successfully');
        return NextResponse.json({
          ok: true,
          message: 'Subscription created successfully',
          action: 'created',
          data: data?.[0],
        });
      }
    } catch (dbError: any) {
      console.error('❌ Database operation error:', dbError);

      // Check if it's a column doesn't exist error
      if (
        dbError.message &&
        dbError.message.includes('column "user_id" does not exist')
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Database schema error: user_id column missing. Please run the migration.',
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: `Database error: ${dbError.message}`,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('💥 API error in save-subscription:', error);

    return NextResponse.json(
      {
        ok: false,
        error: `Internal server error: ${error.message || 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'POST, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
