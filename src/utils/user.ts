import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getUserName(user_id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('name')
    .eq('user_id', user_id)
    .single()

  if (error || !data?.name) return null
  return data.name
}

export async function saveUserName(user_id: string, name: string): Promise<boolean> {
  const { error } = await supabase.from('users').upsert({ user_id, name })

  return !error
}
