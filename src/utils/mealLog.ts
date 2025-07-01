import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Generate or retrieve persistent user ID (stored in localStorage)
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

// Save meal log and GPT response to Supabase
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
  const gptField = `${meal}_gpt` // e.g. "breakfast_gpt"

  const payload = {
    user_id,
    date,
    [meal]: answers, // e.g. { foods: ['1 burger', '1 yogurt'] }
    [gptField]: gpt_response, // e.g. "You're amazing for eating today 💖"
  }

  const { error } = await supabase
    .from('meal_logs')
    .upsert([payload], { onConflict: 'user_id,date' })

  if (error) {
    console.error('Supabase upsert error:', error)
  }
}
