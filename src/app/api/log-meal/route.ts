import supabase from '@/utils/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, name, meal, entries } = body;

  if (!user_id || !name || !meal || !entries) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Save meal log
  const { error: mealLogError } = await supabase
    .from('meal_logs')
    .upsert({
      user_id,
      date: today,
      [meal]: entries,
    })
    .eq('user_id', user_id)
    .eq('date', today);

  if (mealLogError) {
    console.error('Error saving meal log:', mealLogError);
    return NextResponse.json(
      { error: 'Failed to save meal log' },
      { status: 500 },
    );
  }

  // 2. Generate GPT summary for current meal
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: `You are a kind and supportive boyfriend. 
Your job is to cheer up your partner who just logged their meal. 
Respond with a short, sweet, heartfelt message (max 3 lines) in the tone of a loving boyfriend. 
Avoid em-dashes. Use their name (“${name}”) directly in the message.`,
      },
      {
        role: 'user',
        content: `Here is what ${name} ate for ${meal} today:\n${entries.join('\n')}`,
      },
    ],
  });

  const mealSummary = completion.choices[0].message.content?.trim();

  // 3. Update daily_summaries table with this meal summary
  const mealCol = `${meal}_summary` as
    | 'breakfast_summary'
    | 'lunch_summary'
    | 'dinner_summary';

  const { data: summaryRow, error: upsertError } = await supabase
    .from('daily_summaries')
    .upsert(
      {
        user_id,
        name,
        date: today,
        [mealCol]: mealSummary,
      },
      { onConflict: 'user_id,date' },
    )
    .select()
    .maybeSingle();

  if (upsertError) {
    console.error('Error updating daily_summaries:', upsertError);
    return NextResponse.json(
      { error: 'Failed to store GPT summary' },
      { status: 500 },
    );
  }

  // 4. If all 3 meal summaries exist, generate full-day summary
  const { breakfast_summary, lunch_summary, dinner_summary } = summaryRow || {};

  if (
    breakfast_summary &&
    lunch_summary &&
    dinner_summary &&
    !summaryRow.full_day_summary
  ) {
    const fullDayCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 1,
      messages: [
        {
          role: 'system',
          content: `You are a sweet, loving boyfriend summarizing your partner's eating progress today.
You will now write a warm, proud summary (3-5 sentences) of her day based on what she ate. 
Be affectionate and uplifting, avoid em-dashes, and use her name (${name}).`,
        },
        {
          role: 'user',
          content: `
Here is what ${name} ate today:
Breakfast Summary: ${breakfast_summary}
Lunch Summary: ${lunch_summary}
Dinner Summary: ${dinner_summary}
          `.trim(),
        },
      ],
    });

    const fullDaySummary = fullDayCompletion.choices[0].message.content?.trim();

    await supabase
      .from('daily_summaries')
      .update({ full_day_summary: fullDaySummary })
      .eq('user_id', user_id)
      .eq('date', today);
  }

  return NextResponse.json({ success: true });
}
