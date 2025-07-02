'use client'

import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

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
  full_day_summary?: string
}

function renderMeal(meal: any) {
  if (!meal || (Array.isArray(meal) && meal.length === 0)) {
    return (<span className="italic text-gray-400">—</span>)
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
  const [filteredLogs, setFilteredLogs] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedName, setSelectedName] = useState('')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null) // Track which log is expanded

  useEffect(() => {
    const timestamp = new Date().getTime() // Add a unique timestamp

    // Fetch fresh data with a cache-busting query parameter
    fetch(`/api/admin/log-meal?timestamp=${timestamp}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || [])
        setFilteredLogs(data.logs || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const uniqueNames = Array.from(new Set(logs.map(log => log.name).filter(Boolean)))

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    setSelectedName(name)

    if (name === '') {
      setFilteredLogs(logs)
    } else {
      setFilteredLogs(logs.filter(log => log.name === name))
    }
  }

  // Toggle expand/collapse of meal log
  const handleLogToggle = (logId: string) => {
    setExpandedLogId(prev => (prev === logId ? null : logId))
  }

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#fdf6e3] via-[#fff5fa] to-[#e6e6fa] p-4">
      {/* Banner Section with Gradient and Filter */}
      <section className="w-full max-w-6xl mt-10 bg-gradient-to-r from-[#fdf6e3] to-[#fda085] rounded-3xl shadow-lg backdrop-blur-md p-6 mb-8">
        <div className="flex items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 bg-gradient-to-r from-pink-200 to-yellow-300 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 2a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H8zM6 4a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <div className="text-3xl font-semibold text-white">Admin Logs</div>
          <div className="text-md text-white mt-2">Manage and analyze user meal logs</div>
          <select
            value={selectedName}
            onChange={handleFilterChange}
            className="px-4 py-2 rounded-2xl border border-orange-300 shadow-lg text-gray-700 focus:ring-2 focus:ring-orange-300 w-40 transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none"
          >
            <option value="">🌸 Show All Users</option>
            {uniqueNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Logs Cards Section */}
      <section className="w-full max-w-6xl mt-10 bg-white/90 rounded-3xl shadow-lg backdrop-blur-md p-6">
        {loading ? (
          <div className="text-center text-gray-400">Loading logs…</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center text-gray-400">No logs yet.</div>
        ) : (
          <div className="space-y-6">
            {filteredLogs.map((log, i) => (
              <motion.div
                key={log.id}
                className="bg-white/80 rounded-2xl shadow-sm p-4 mb-6 cursor-pointer"
                whileHover={{ scale: 1.03 }}
                onClick={() => handleLogToggle(log.id)} // Handle toggle click
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-pink-700">
                    {log.name || 'Unknown'} — {new Date(log.created_at).toLocaleDateString()}
                  </h2>
                  <motion.div
                    className={`transform ${expandedLogId === log.id ? 'rotate-180' : ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => handleLogToggle(log.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-pink-700 cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 14a1 1 0 01-.707-.293l-5-5a1 1 0 111.414-1.414L10 11.586l4.293-4.293a1 1 0 111.414 1.414l-5 5A1 1 0 0110 14z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                </div>

                {expandedLogId === log.id && (
                  <div className="mt-4 space-y-2 text-gray-800 text-sm">
                    {log.breakfast && (
                      <div>
                        <strong className="text-orange-500">Breakfast:</strong> {renderMeal(log.breakfast)}
                        <div className="pt-2">{renderGptResponse(log.breakfast_gpt)}</div>
                      </div>
                    )}
                    {log.lunch && (
                      <div>
                        <strong className="text-orange-500">Lunch:</strong> {renderMeal(log.lunch)}
                        <div className="pt-2">{renderGptResponse(log.lunch_gpt)}</div>
                      </div>
                    )}
                    {log.dinner && (
                      <div>
                        <strong className="text-orange-500">Dinner:</strong> {renderMeal(log.dinner)}
                        <div className="pt-2">{renderGptResponse(log.dinner_gpt)}</div>
                      </div>
                    )}
                    {log.full_day_summary && (
                      <div className="pt-2 border-t border-dashed border-gray-300 mt-2">
                        <strong className="text-pink-600">Full Day:</strong> {log.full_day_summary}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
