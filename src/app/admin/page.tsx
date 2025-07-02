'use client'

import { useEffect, useState } from 'react'

type MealLog = {
  id: string
  created_at: string
  user_id: string
  name?: string
  breakfast: any
  lunch: any
  dinner: any
  breakfast_gpt?: string[] | null
  lunch_gpt?: string[] | null
  dinner_gpt?: string[] | null
}

function renderMeal(meal: any) {
  if (!meal || (Array.isArray(meal) && meal.length === 0)) {
    return <span className="italic text-gray-400">—</span>
  }

  if (typeof meal === 'string') {
    try {
      meal = JSON.parse(meal)
    } catch {
      return <span>{meal}</span>
    }
  }

  if (Array.isArray(meal)) {
    return (
      <ul className="list-disc pl-4 space-y-1">
        {meal.map((item, idx) => (
          <li key={idx} className="text-gray-700">{item}</li>
        ))}
      </ul>
    )
  }

  return <span>{JSON.stringify(meal)}</span>
}

function renderGptResponse(responses: string[] | null | undefined) {
  if (!responses || responses.length === 0) {
    return <span className="italic text-gray-400">—</span>
  }

  return (
    <ul className="list-disc pl-4 space-y-1 text-sm text-pink-700">
      {responses.map((line, idx) => (
        <li key={idx} className="leading-snug">{line}</li>
      ))}
    </ul>
  )
}

export default function AdminPage() {
  const [logs, setLogs] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/log-meal')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#f6d365] to-[#fda085] p-4">
      <section className="w-full max-w-6xl mt-10 bg-white/90 rounded-3xl shadow-lg backdrop-blur-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-pink-600 text-center">🍽️ Meal Logs + GPT Responses</h1>
        {loading ? (
          <div className="text-center text-gray-400">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-400">No logs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-base">
              <thead>
                <tr className="text-left text-gray-600 border-b font-semibold">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Breakfast</th>
                  <th className="py-2 pr-3">Lunch</th>
                  <th className="py-2">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={i % 2 ? 'bg-orange-50/40' : 'bg-transparent'}>
                    <td className="py-2 pr-3 font-mono text-gray-700 whitespace-nowrap align-top">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3 text-pink-700 font-semibold align-top">{log.name || '—'}</td>

                    {/* Breakfast */}
                    <td className="py-2 pr-3 align-top">
                      <div className="mb-2">
                        <span className="block text-sm font-semibold text-gray-700">User:</span>
                        {renderMeal(log.breakfast)}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-pink-600">GPT:</span>
                        {renderGptResponse(log.breakfast_gpt)}
                      </div>
                    </td>

                    {/* Lunch */}
                    <td className="py-2 pr-3 align-top">
                      <div className="mb-2">
                        <span className="block text-sm font-semibold text-gray-700">User:</span>
                        {renderMeal(log.lunch)}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-pink-600">GPT:</span>
                        {renderGptResponse(log.lunch_gpt)}
                      </div>
                    </td>

                    {/* Dinner */}
                    <td className="py-2 align-top">
                      <div className="mb-2">
                        <span className="block text-sm font-semibold text-gray-700">User:</span>
                        {renderMeal(log.dinner)}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-pink-600">GPT:</span>
                        {renderGptResponse(log.dinner_gpt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
