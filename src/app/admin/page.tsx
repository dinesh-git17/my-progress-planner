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
    <main className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#fdf6e3] via-[#fff5fa] to-[#e6e6fa] p-2 sm:p-4">
      {/* Banner Section with Gradient and Filter */}
      <section className="w-full max-w-6xl mt-4 sm:mt-10 bg-gradient-to-r from-[#fdf6e3] to-[#fda085] rounded-2xl sm:rounded-3xl shadow-lg backdrop-blur-md p-4 sm:p-6 mb-4 sm:mb-8">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 bg-gradient-to-r from-pink-200 to-yellow-300 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 2a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H8zM6 4a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </motion.div>
            <div className="text-xl font-semibold text-white">Admin Logs</div>
          </div>
          <div className="text-sm text-white/90 mb-4 text-center">Manage and analyze user meal logs</div>
          
          {/* Mobile Filter Dropdown */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </div>
            <motion.select
              value={selectedName}
              onChange={handleFilterChange}
              className="appearance-none pl-10 pr-10 py-2.5 rounded-xl border-0 bg-white/95 backdrop-blur-sm shadow-lg text-gray-700 focus:ring-2 focus:ring-pink-300 focus:ring-opacity-50 w-full transition-all duration-300 ease-in-out focus:outline-none font-medium text-sm"
              whileTap={{ scale: 0.98 }}
            >
              <option value="" className="text-gray-700">🌸 Show All Users</option>
              {uniqueNames.map((name) => (
                <option key={name} value={name} className="text-gray-700">
                  👤 {name}
                </option>
              ))}
            </motion.select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between gap-4">
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
          
          {/* Desktop Filter Dropdown */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </div>
            <motion.select
              value={selectedName}
              onChange={handleFilterChange}
              className="appearance-none pl-10 pr-10 py-3 rounded-2xl border-0 bg-white/95 backdrop-blur-sm shadow-lg text-gray-700 focus:ring-2 focus:ring-pink-300 focus:ring-opacity-50 w-52 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl focus:outline-none font-medium text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <option value="" className="text-gray-700">🌸 Show All Users</option>
              {uniqueNames.map((name) => (
                <option key={name} value={name} className="text-gray-700">
                  👤 {name}
                </option>
              ))}
            </motion.select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Logs Cards Section */}
      <section className="w-full max-w-6xl mt-4 sm:mt-10 bg-white/90 rounded-2xl sm:rounded-3xl shadow-lg backdrop-blur-md p-3 sm:p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading logs…</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No logs yet.</div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredLogs.map((log, i) => (
              <motion.div
                key={log.id}
                className="bg-white/80 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 cursor-pointer"
                whileHover={{ scale: window.innerWidth >= 640 ? 1.03 : 1.01 }}
                onClick={() => handleLogToggle(log.id)}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-pink-700 flex-1 min-w-0">
                    <span className="block sm:inline truncate">{log.name || 'Unknown'}</span>
                    <span className="hidden sm:inline"> — </span>
                    <span className="block sm:inline text-sm sm:text-base text-pink-600/80">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </h2>
                  <motion.div
                    className={`transform transition-transform duration-200 ${expandedLogId === log.id ? 'rotate-180' : ''} flex-shrink-0 ml-2`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-pink-700 cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 14a1 1 0 01-.707-.293l-5-5a1 1 0 111.414-1.414L10 11.586l4.293-4.293a1 1 0 111.414 1.414l-5 5A1 1 0 0110 14z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                </div>

                {expandedLogId === log.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 sm:mt-4 space-y-3 sm:space-y-2 text-gray-800 text-sm overflow-hidden"
                  >
                    {log.breakfast && (
                      <div className="space-y-2">
                        <div>
                          <strong className="text-orange-500">Breakfast:</strong>
                          <div className="mt-1">{renderMeal(log.breakfast)}</div>
                        </div>
                        <div className="pl-0 sm:pl-2">{renderGptResponse(log.breakfast_gpt)}</div>
                      </div>
                    )}
                    {log.lunch && (
                      <div className="space-y-2">
                        <div>
                          <strong className="text-orange-500">Lunch:</strong>
                          <div className="mt-1">{renderMeal(log.lunch)}</div>
                        </div>
                        <div className="pl-0 sm:pl-2">{renderGptResponse(log.lunch_gpt)}</div>
                      </div>
                    )}
                    {log.dinner && (
                      <div className="space-y-2">
                        <div>
                          <strong className="text-orange-500">Dinner:</strong>
                          <div className="mt-1">{renderMeal(log.dinner)}</div>
                        </div>
                        <div className="pl-0 sm:pl-2">{renderGptResponse(log.dinner_gpt)}</div>
                      </div>
                    )}
                    {log.full_day_summary && (
                      <div className="pt-2 border-t border-dashed border-gray-300 mt-3 sm:mt-2">
                        <strong className="text-pink-600">Full Day:</strong>
                        <div className="mt-1">{log.full_day_summary}</div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}