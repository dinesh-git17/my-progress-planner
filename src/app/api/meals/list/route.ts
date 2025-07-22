// src/app/api/meals/list/route.ts
import supabase from '@/utils/supabaseAdmin';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  const date = searchParams.get('date'); // This should be EST date in 'YYYY-MM-DD' format

  if (!user_id || !date) {
    return NextResponse.json(
      { error: 'Missing user_id or date' },
      { status: 400 },
    );
  }

  try {
    // STEP 1: Get meal data, existing summaries, and user name in parallel
    const [mealDataResult, summariesResult, userResult] = await Promise.all([
      supabase
        .from('meal_logs')
        .select('breakfast, lunch, dinner, created_at')
        .eq('user_id', user_id)
        .eq('date', date)
        .maybeSingle(),
      supabase
        .from('daily_summaries')
        .select(
          'breakfast_meal_summary, lunch_meal_summary, dinner_meal_summary',
        )
        .eq('user_id', user_id)
        .eq('date', date)
        .maybeSingle(),
      supabase
        .from('users')
        .select('name')
        .eq('user_id', user_id)
        .maybeSingle(),
    ]);

    const { data: mealData, error: mealError } = mealDataResult;
    const { data: existingSummaries, error: summaryError } = summariesResult;
    const { data: userData, error: userError } = userResult;

    if (mealError) {
      console.error('Database fetch error:', mealError);
      return NextResponse.json(
        { error: 'Failed to fetch meal logs' },
        { status: 500 },
      );
    }

    if (summaryError) {
      console.error('Error checking cached summaries:', summaryError);
      // Don't fail the request, just log the error
    }

    if (userError) {
      console.error('Error fetching user data:', userError);
      // Don't fail the request, just log the error
    }

    const userName = userData?.name || 'User'; // Fallback if name not found

    if (!mealData) {
      return NextResponse.json(
        { message: 'No meal log found for the given date' },
        { status: 404 },
      );
    }

    // STEP 2: Process each meal - use cache if available, generate if not
    const mealLists: Record<string, string | null> = {};
    const newSummaries: Record<string, string> = {};
    const gptPromises: Promise<void>[] = [];

    // Create array of meals to process
    const mealsToProcess = [
      { type: 'breakfast', data: mealData.breakfast },
      { type: 'lunch', data: mealData.lunch },
      { type: 'dinner', data: mealData.dinner },
    ];

    // Process each meal
    for (const { type, data } of mealsToProcess) {
      const cacheKey = `${type}_meal_summary` as keyof typeof existingSummaries;
      const cachedSummary = existingSummaries?.[cacheKey];

      if (cachedSummary) {
        mealLists[type] = cachedSummary;
      } else if (hasMealData(data)) {
        // Add to promises array to run in parallel
        gptPromises.push(
          generateMealSummary(type, data)
            .then((summary) => {
              console.log(
                `📝 Generated summary for ${type}:`,
                summary?.substring(0, 50) + '...',
              );
              if (summary) {
                mealLists[type] = summary;
                newSummaries[cacheKey] = summary;
                console.log(`✅ Added ${cacheKey} to newSummaries`);
              } else {
                mealLists[type] =
                  `${type.charAt(0).toUpperCase() + type.slice(1)} logged`;
                console.log(
                  `⚠️ No summary generated for ${type}, using fallback`,
                );
              }
            })
            .catch((error) => {
              console.error(`GPT error for ${type}:`, error);
              mealLists[type] =
                `${type.charAt(0).toUpperCase() + type.slice(1)} logged`;
            }),
        );
      } else {
        mealLists[type] = null;
      }
    }

    // Wait for all GPT requests to complete
    await Promise.all(gptPromises);

    console.log('🔍 Final newSummaries object:', newSummaries);
    console.log('🔍 Keys in newSummaries:', Object.keys(newSummaries));

    // STEP 3: Cache new summaries to database if any were generated
    if (Object.keys(newSummaries).length > 0) {
      console.log('💾 Saving new summaries to database:', newSummaries);

      // First, check if a row already exists
      const { data: existingRow } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user_id)
        .eq('date', date)
        .maybeSingle();

      if (existingRow) {
        // Row exists - just UPDATE the meal summary columns
        console.log('📝 Updating existing row with new meal summaries');
        const { data: updateResult, error: updateError } = await supabase
          .from('daily_summaries')
          .update(newSummaries) // Only update the meal summary columns
          .eq('user_id', user_id)
          .eq('date', date)
          .select();

        if (updateError) {
          console.error('❌ Error updating summaries:', updateError);
        } else {
          console.log('✅ Successfully updated meal summaries:', updateResult);
        }
      } else {
        // No row exists - INSERT with name
        console.log('🆕 Creating new row with meal summaries');
        const insertData = {
          user_id,
          date,
          name: userName,
          ...newSummaries,
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('daily_summaries')
          .insert(insertData)
          .select();

        if (insertError) {
          console.error('❌ Error inserting summaries:', insertError);
        } else {
          console.log('✅ Successfully inserted meal summaries:', insertResult);
        }
      }
    } else {
      console.log(
        'ℹ️ No new summaries to save - all were from cache or no meal data',
      );
    }

    return NextResponse.json({
      mealLists,
      date: mealData.created_at,
      cached: Object.keys(newSummaries).length === 0, // All were from cache
      cacheHitRate: `${Math.round(((3 - Object.keys(newSummaries).length) / 3) * 100)}%`,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 },
    );
  }
}

/**
 * Generate GPT summary for a meal
 */
async function generateMealSummary(
  mealType: string,
  mealData: any,
): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a loving boyfriend creating detailed but readable meal summaries for your girlfriend.

Give helpful nutritional insights while being encouraging. Break content into clear sections for easy reading.

Format EXACTLY like this:
"🍽️ What you ate:
[Food items with emojis]

💕 How it made you feel:
[Emotion/feeling response]

⭐ Overall Rating: [Excellent/Great/Good/Okay] ⭐⭐⭐

🔍 Nutrition Breakdown:
✅ What's working: [1-2 positive things]
⚠️ Could use more: [Specific nutrients/food groups missing]
💡 Easy upgrade: [Simple, practical suggestion]

💖 Love Note:
[Sweet, encouraging message that ties it together]"

Guidelines:
- Be specific about what nutrients are missing (protein, fiber, vitamins, etc.)
- Give practical suggestions (add nuts, include veggies, pair with...)
- Celebrate what they did well first
- Use clear sections with emojis for visual breaks
- Keep loving boyfriend tone throughout
- Make suggestions feel achievable, not overwhelming
- Consider meal timing (breakfast needs energy, dinner lighter)
- Keep it around 100-120 words`,
        },
        {
          role: 'user',
          content: `Here's the conversation about ${mealType}:\n\n${formatMealData(mealData)}`,
        },
      ],
    });

    return completion.choices[0].message.content?.trim() || null;
  } catch (error) {
    console.error(`GPT error for ${mealType}:`, error);
    throw error;
  }
}

/**
 * Helper function to check if meal data exists and has content
 * Handles various formats that meal data might be stored in
 */
function hasMealData(mealData: any): boolean {
  if (!mealData) return false;

  // Handle array format (most common based on your admin logs)
  if (Array.isArray(mealData)) {
    // Check if array has any non-empty string items
    const validItems = mealData.filter((item) => {
      return (
        item !== null &&
        item !== undefined &&
        typeof item === 'string' &&
        item.trim().length > 0
      );
    });

    return validItems.length > 0;
  }

  // Handle string format
  if (typeof mealData === 'string') {
    return mealData.trim().length > 0;
  }

  // Handle object format (just in case)
  if (typeof mealData === 'object') {
    return Object.keys(mealData).length > 0;
  }

  return false;
}

/**
 * Helper function to format meal data for GPT processing
 * Handles various formats that meal data might be stored in
 */
function formatMealData(mealData: any): string {
  if (!mealData) return '';

  // Handle array format (most common)
  if (Array.isArray(mealData)) {
    return mealData
      .filter(
        (item) => item && typeof item === 'string' && item.trim().length > 0,
      )
      .join('\n\n');
  }

  // Handle string format
  if (typeof mealData === 'string') {
    return mealData.trim();
  }

  // Handle object format (convert to string)
  if (typeof mealData === 'object') {
    return JSON.stringify(mealData, null, 2);
  }

  return String(mealData);
}
