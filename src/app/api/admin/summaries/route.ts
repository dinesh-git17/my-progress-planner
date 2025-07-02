import supabase from '@/utils/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .order('date', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[ADMIN_SUMMARIES] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to load summaries.' }, { status: 500 })
    }

    return NextResponse.json({ summaries: data })
  } catch (err) {
    console.error('[ADMIN_SUMMARIES] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error occurred.' }, { status: 500 })
  }
}
