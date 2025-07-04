import supabase from '@/utils/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const date = searchParams.get('date') // This should be EST date in 'YYYY-MM-DD' format

  if (!user_id || !date) {
    return NextResponse.json({ error: 'Missing user_id or date' }, { status: 400 })
  }

  try {
    // Query the meal_logs table directly with the EST date
    // Since the 'date' column stores EST dates as 'YYYY-MM-DD'
    const { data, error } = await supabase
      .from('meal_logs')
      .select('breakfast, lunch, dinner, created_at')
      .eq('user_id', user_id)
      .eq('date', date) // Direct comparison with EST date
      .maybeSingle()

    if (error) {
      console.error('Database fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ message: 'No meal log found for the given date' }, { status: 404 })
    }

    // Return the meal log data
    // No need for additional date comparisons since we're filtering by 'date' column
    return NextResponse.json({ mealLog: data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
}
