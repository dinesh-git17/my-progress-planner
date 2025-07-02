import supabase from '@/utils/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('meal_logs_with_users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching meal logs:', error)
    return NextResponse.json({ error: 'Failed to load meal logs.' }, { status: 500 })
  }

  return NextResponse.json({ logs: data })
}
