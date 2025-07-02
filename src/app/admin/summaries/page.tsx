'use client'

import { useEffect, useState } from 'react'

type DailySummary = {
  user_id: string
  name: string
  date: string
  breakfast_summary?: string
  lunch_summary?: string
  dinner_summary?: string
  full_day_summary?: string
}

export default function AdminSummariesPage() {
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/summaries')
      .then((res) => res.json())
      .then((data) => setSummaries(data.summaries || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#f6d365] to-[#fda085] p-4">
      <section className="w-full max-w-5xl bg-white/90 rounded-3xl shadow-xl p-6 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-pink-600 text-center mb-6">
          💬 GPT Daily Meal Summaries
        </h1>

        {loading ? (
          <div className="text-center text-gray-500">Loading summaries…</div>
        ) : summaries.length === 0 ? (
          <div className="text-center text-gray-500">No summaries found yet.</div>
        ) : (
          <div className="space-y-6">
            {summaries.map((summary, index) => (
              <div
                key={`${summary.user_id}-${summary.date}-${index}`}
                className="border border-orange-200 rounded-2xl p-4 bg-white/80 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-pink-700">
                  {summary.name || 'Unknown'} — {new Date(summary.date).toLocaleDateString()}
                </h2>
                <div className="mt-2 space-y-2 text-gray-800 text-sm">
                  {summary.breakfast_summary && (
                    <p>
                      <strong className="text-orange-500">Breakfast:</strong> {summary.breakfast_summary}
                    </p>
                  )}
                  {summary.lunch_summary && (
                    <p>
                      <strong className="text-orange-500">Lunch:</strong> {summary.lunch_summary}
                    </p>
                  )}
                  {summary.dinner_summary && (
                    <p>
                      <strong className="text-orange-500">Dinner:</strong> {summary.dinner_summary}
                    </p>
                  )}
                  {summary.full_day_summary && (
                    <p className="pt-2 border-t border-dashed border-gray-300 mt-2">
                      <strong className="text-pink-600">Full Day:</strong> {summary.full_day_summary}
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
