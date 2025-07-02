// hooks/useUserStreak.ts

import { useEffect, useState } from 'react'

/** Calculates the current streak from a sorted array of log dates (YYYY-MM-DD, desc order) */
function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  let streak = 0
  let compare = new Date(today)
  for (const dateStr of dates) {
    const logDate = new Date(dateStr + 'T00:00:00Z')
    if (logDate.getTime() === compare.getTime()) {
      streak += 1
      compare.setUTCDate(compare.getUTCDate() - 1)
    } else if (logDate.getTime() < compare.getTime()) {
      break // Streak broken
    }
  }
  return streak
}

export function useUserStreak(user_id?: string) {
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user_id) return
    setLoading(true)
    fetch(`/api/streak?user_id=${user_id}`)
      .then((res) => res.json())
      .then(({ dates }) => setStreak(calculateStreak(dates ?? [])))
      .finally(() => setLoading(false))
  }, [user_id])

  return { streak, loading }
}
