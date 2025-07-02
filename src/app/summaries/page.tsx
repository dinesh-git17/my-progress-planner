'use client'

import { getOrCreateUserId } from '@/utils/mealLog'
import { useEffect, useState } from 'react'

type Summary = {
  date: string
  breakfast_summary: string | null
  lunch_summary: string | null
  dinner_summary: string | null
  full_day_summary: string | null
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummaries = async () => {
      const user_id = getOrCreateUserId()
      const res = await fetch(`/api/summaries?user_id=${user_id}`)
      const data = await res.json()
      setSummaries(data.summaries || [])
      setLoading(false)
    }

    fetchSummaries()
  }, [])

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-[#f6d365] to-[#fda085] flex items-center justify-center p-4">
      <section className="w-full max-w-3xl bg-white/90 shadow-xl rounded-3xl p-6 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-pink-600 text-center mb-6">📝 Your Meal Summaries</h1>

        {loading ? (
          <div className="text-center text-gray-500">Loading summaries…</div>
        ) : summaries.length === 0 ? (
          <div className="text-center text-gray-500">No summaries yet. Start logging your meals 💖</div>
        ) : (
          <div className="space-y-6">
            {summaries.map((summary) => (
              <div
                key={summary.date}
                className="bg-white rounded-2xl p-4 shadow-md border border-orange-100"
              >
                <h2 className="text-lg font-semibold text-pink-600 mb-2">
                  {new Date(summary.date).toLocaleDateString()}
                </h2>
                <div className="space-y-1 text-sm text-gray-700">
                  {summary.breakfast_summary && (
                    <p>
                      <span className="font-semibold text-orange-500">🍳 Breakfast:</span>{' '}
                      {summary.breakfast_summary}
                    </p>
                  )}
                  {summary.lunch_summary && (
                    <p>
                      <span className="font-semibold text-orange-500">🥪 Lunch:</span>{' '}
                      {summary.lunch_summary}
                    </p>
                  )}
                  {summary.dinner_summary && (
                    <p>
                      <span className="font-semibold text-orange-500">🍽️ Dinner:</span>{' '}
                      {summary.dinner_summary}
                    </p>
                  )}
                  {summary.full_day_summary && (
                    <p className="pt-2 text-pink-700 font-medium">
                      💖 <i>Day Summary:</i> {summary.full_day_summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
