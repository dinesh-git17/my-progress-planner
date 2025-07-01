'use client'

import { useEffect, useState } from 'react'

type MealLog = {
  id: string
  created_at: string
  breakfast: string
  lunch: string
  dinner: string
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
    <main className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#f6d365] to-[#fda085] p-0">
      <section className="w-full max-w-xl mt-10 bg-white/80 rounded-3xl shadow-lg backdrop-blur-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-700 text-center">🍽️ Meal Logs</h1>
        {loading ? (
          <div className="text-center text-gray-400">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-400">No logs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Breakfast/Coffee</th>
                  <th className="py-2 pr-3">Lunch</th>
                  <th className="py-2">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={i % 2 ? 'bg-orange-50/30' : ''}>
                    <td className="py-2 pr-3 font-mono">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3">{log.breakfast}</td>
                    <td className="py-2 pr-3">{log.lunch}</td>
                    <td className="py-2">{log.dinner}</td>
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
