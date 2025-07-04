import supabase from '@/utils/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const date = searchParams.get('date')

  // Check if user_id or date is missing
  if (!user_id || !date) {
    return NextResponse.json({ error: 'Missing user_id or date' }, { status: 400 })
  }

  try {
    // Convert the passed date to EST (ensure the date is in the 'YYYY-MM-DD' format)
    const requestedDateEST = new Date(
      new Date(date).toLocaleString('en-US', { timeZone: 'America/New_York' })
    )
      .toISOString()
      .slice(0, 10)

    // Fetching meal log for the user and the exact date
    const { data, error } = await supabase
      .from('meal_logs')
      .select('breakfast, lunch, dinner, created_at')
      .eq('user_id', user_id)
      .eq('date', requestedDateEST) // Compare against the formatted date
      .maybeSingle()

    if (error) {
      console.error('Database fetch error:', error) // Log error for debugging
      return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 })
    }

    // If no meal log data is found
    if (!data) {
      return NextResponse.json({ message: 'No meal log found for the given date' }, { status: 404 })
    }

    // Convert created_at to EST and extract the date part
    const createdAtEST = new Date(
      new Date(data.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' })
    )
      .toISOString()
      .slice(0, 10)

    // Compare the created_at date with requested date
    if (createdAtEST !== requestedDateEST) {
      return NextResponse.json(
        { message: 'Meal log does not match the requested date' },
        { status: 404 }
      )
    }

    // Return the fetched meal log data
    return NextResponse.json({ mealLog: data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
}
