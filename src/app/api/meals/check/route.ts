import supabase from '@/utils/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const date = searchParams.get('date')

  if (!user_id || !date) {
    return NextResponse.json({ error: 'Missing user_id or date' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('meal_logs')
    .select('breakfast, lunch, dinner')
    .eq('user_id', user_id)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 })
  }

  return NextResponse.json({ mealLog: data })
}
