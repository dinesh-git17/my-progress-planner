import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Safe user ID generator (never fails, see previous advice)
export function getOrCreateUserId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('user_id')
  if (!id) {
    let uuid
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      uuid = crypto.randomUUID()
    } else {
      uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
    localStorage.setItem('user_id', uuid)
    id = uuid
  }
  return id
}

// This upserts (insert or update) the meal log for the right meal, user, and date
export async function upsertMealLog({
  user_id,
  date,
  meal, // 'breakfast', 'lunch', or 'dinner'
  answers,
}: {
  user_id: string
  date: string
  meal: 'breakfast' | 'lunch' | 'dinner'
  answers: any
}) {
  // The upsert will only overwrite the specific meal field, leave others intact
  const { error } = await supabase
    .from('meal_logs')
    .upsert([{ user_id, date, [meal]: answers }], { onConflict: ['user_id', 'date'] })
  if (error) {
    console.error('Supabase upsert error:', error)
  }
}
