import supabase from '@/utils/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Query the Supabase database for the latest daily summaries
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .order('date', { ascending: false }) // Get the most recent summaries first
      .limit(100) // Limit to the latest 100 summaries

    // Handle any errors that may occur during the query
    if (error) {
      console.error('[ADMIN_SUMMARIES] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to load summaries.' }, { status: 500 })
    }

    // Return the fetched data as a JSON response
    return NextResponse.json({ summaries: data })
  } catch (err) {
    // Catch any unexpected errors
    console.error('[ADMIN_SUMMARIES] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error occurred.' }, { status: 500 })
  }
}
