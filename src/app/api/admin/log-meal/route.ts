// src/app/api/admin/log-meal/route.ts

import supabase from '@/utils/supabaseAdmin'
import { NextResponse } from 'next/server'

// POST: Save a new meal log (can include GPT responses if needed)
export async function POST(req: Request) {
  try {
    const { answers } = await req.json()
    const { breakfast, lunch, dinner } = answers

    const { error } = await supabase.from('meal_logs').insert([
      {
        breakfast,
        lunch,
        dinner,
      },
    ])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save meal log.' }, { status: 500 })
  }
}

// GET: Fetch meal logs including GPT responses
export async function GET() {
  const { data, error } = await supabase
    .from('meal_logs')
    .select(
      `
      id,
      created_at,
      breakfast,
      lunch,
      dinner,
      breakfast_gpt,
      lunch_gpt,
      dinner_gpt
    `
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'Failed to load meal logs.' }, { status: 500 })
  }

  return NextResponse.json({ logs: data })
}
