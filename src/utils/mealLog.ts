import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function getOrCreateUserId() {
  if (typeof window === 'undefined') return ''

  let id = localStorage.getItem('user_id')
  if (!id) {
    let uuid
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      uuid = crypto.randomUUID()
    } else {
      uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
    localStorage.setItem('user_id', uuid)
    id = uuid
  }

  return id
}

export async function upsertMealLog({
  user_id,
  date,
  meal,
  answers,
  gpt_response,
}: {
  user_id: string
  date: string
  meal: 'breakfast' | 'lunch' | 'dinner'
  answers: any
  gpt_response: string[]
}) {
  const gptField = `${meal}_gpt`

  // Convert the EST date to ensure it's stored correctly in the database
  // The date parameter should be in 'YYYY-MM-DD' format representing EST date
  const estDate = date // Keep as-is since it should already be EST date

  // Save to `meal_logs` table
  const { error: upsertError } = await supabase.from('meal_logs').upsert(
    [
      {
        user_id,
        date: estDate, // Store the EST date directly
        [meal]: answers,
        [gptField]: gpt_response,
      },
    ],
    {
      onConflict: 'user_id,date',
    }
  )

  if (upsertError) {
    console.error('Supabase meal_logs upsert error:', upsertError)
    return
  }

  // Get user name from `users` table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('name')
    .eq('user_id', user_id)
    .maybeSingle()

  if (userError || !userData?.name) {
    console.warn('Could not fetch user name for summary:', userError)
    return
  }

  const name = userData.name

  // 🧠 Generate GPT summary for this meal
  try {
    const res = await fetch('/api/gpt/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        meal,
        answers,
        gpt_response,
      }),
    })

    const data = await res.json()
    const summaryText = data?.summary || null

    if (!summaryText) {
      console.warn('No GPT summary returned')
      return
    }

    // 🔒 Upsert into `daily_summaries` - use the same EST date
    const { error: summaryError } = await supabase.from('daily_summaries').upsert(
      [
        {
          user_id,
          name,
          date: estDate, // Use the same EST date for consistency
          [`${meal}_summary`]: summaryText,
        },
      ],
      { onConflict: 'user_id,date' }
    )

    if (summaryError) {
      console.error('Supabase daily_summaries upsert error:', summaryError)
      return
    }

    // 🍽 Check if all 3 meals are now logged for this EST date
    const { data: allMealsData, error: mealCheckError } = await supabase
      .from('meal_logs')
      .select('breakfast, lunch, dinner')
      .eq('user_id', user_id)
      .eq('date', estDate) // Query using the same EST date
      .maybeSingle()

    if (mealCheckError) {
      console.warn('Error checking full day meal log:', mealCheckError)
      return
    }

    if (allMealsData?.breakfast && allMealsData?.lunch && allMealsData?.dinner) {
      const fullDayPrompt = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          meal: 'day',
          answers: [
            ...(allMealsData.breakfast || []),
            ...(allMealsData.lunch || []),
            ...(allMealsData.dinner || []),
          ],
        }),
      }

      const fullDayRes = await fetch('/api/gpt/summary', fullDayPrompt)
      const fullDayData = await fullDayRes.json()
      const fullSummary = fullDayData?.summary

      if (fullSummary) {
        await supabase
          .from('daily_summaries')
          .update({ full_day_summary: fullSummary })
          .eq('user_id', user_id)
          .eq('date', estDate) // Use the same EST date
      }
    }
  } catch (err) {
    console.error('GPT summary generation error:', err)
  }
}
