'use client'

import { motion } from 'framer-motion'
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
  const [contentReady, setContentReady] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [filteredSummaries, setFilteredSummaries] = useState<DailySummary[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([])
  const [uniqueDates, setUniqueDates] = useState<string[]>([])

  // Handle content timing to match homepage
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchSummaries = () => {
      const timestamp = new Date().getTime()
      setLastRefresh(new Date())

      fetch(`/api/admin/summaries?timestamp=${timestamp}`)
        .then((res) => res.json())
        .then((data) => {
          const summariesData = data.summaries || []
          setSummaries(summariesData)
          
          // Extract unique users and dates for filters
          const users = Array.from(new Set(summariesData.map((s: DailySummary) => s.name || 'Unknown'))) as string[]
          const dates = Array.from(new Set(summariesData.map((s: DailySummary) => s.date))) as string[]
          
          setUniqueUsers(users.sort())
          setUniqueDates(dates.sort().reverse())
          
          setUniqueUsers(users)
          setUniqueDates(dates)
        })
        .finally(() => setLoading(false))
    }

    // Initial fetch
    fetchSummaries()

    // Fetch data every 30 seconds
    const intervalId = setInterval(fetchSummaries, 30000)

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  // Filter summaries based on selected filters
  useEffect(() => {
    console.log('🔍 Filtering:', { selectedUser, selectedDate, summariesCount: summaries.length })
    
    let filtered = [...summaries] // Create a copy to avoid mutation

    if (selectedUser !== 'all') {
      console.log('👤 Filtering by user:', selectedUser)
      filtered = filtered.filter(summary => {
        const userName = summary.name || 'Unknown'
        console.log('Checking user:', userName, 'against:', selectedUser, 'match:', userName === selectedUser)
        return userName === selectedUser
      })
    }

    if (selectedDate !== 'all') {
      console.log('📅 Filtering by date:', selectedDate)
      filtered = filtered.filter(summary => {
        console.log('Checking date:', summary.date, 'against:', selectedDate, 'match:', summary.date === selectedDate)
        return summary.date === selectedDate
      })
    }

    console.log('✅ Filtered result count:', filtered.length)
    setFilteredSummaries(filtered)
  }, [summaries, selectedUser, selectedDate])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const mealEmojis = {
    breakfast: '🍳',
    lunch: '🫐', 
    dinner: '🍜'
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: contentReady ? 1 : 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="
        min-h-[100dvh] w-full overflow-hidden
        relative pt-8 md:pt-12 pb-8
      "
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 2rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)',
      }}
    >
            {/* Same Dynamic Animated Gradient Background as Homepage */}
            <div 
              className="fixed -z-10"
              style={{
                top: 'calc(-1 * env(safe-area-inset-top, 0px))',
                left: 'calc(-1 * env(safe-area-inset-left, 0px))',
                right: 'calc(-1 * env(safe-area-inset-right, 0px))',
                bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
                width: 'calc(100vw + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
                height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
                minHeight: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Base gradient layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#f5ede6] via-[#f7edf5] to-[#d8d8f0]" />
              
              {/* Animated overlay layers */}
              <div className="absolute inset-0 opacity-0 animate-gradient-1 bg-gradient-to-tr from-[#f7edf5] via-[#d8d8f0] to-[#f2e8e8]" />
              <div className="absolute inset-0 opacity-0 animate-gradient-2 bg-gradient-to-bl from-[#d8d8f0] via-[#f2e8e8] to-[#f5ede6]" />
              <div className="absolute inset-0 opacity-0 animate-gradient-3 bg-gradient-to-tl from-[#f2e8e8] via-[#f5ede6] to-[#f7edf5]" />
            </div>
            
            <style jsx>{`
              @keyframes gradient-fade-1 {
                0%, 100% { opacity: 0; }
                25% { opacity: 0.6; }
                50% { opacity: 0; }
              }
              
              @keyframes gradient-fade-2 {
                0%, 100% { opacity: 0; }
                50% { opacity: 0.5; }
                75% { opacity: 0; }
              }
              
              @keyframes gradient-fade-3 {
                0%, 25% { opacity: 0; }
                75% { opacity: 0.7; }
                100% { opacity: 0; }
              }
              
              .animate-gradient-1 {
                animation: gradient-fade-1 12s ease-in-out infinite;
              }
              
              .animate-gradient-2 {
                animation: gradient-fade-2 12s ease-in-out infinite 4s;
              }
              
              .animate-gradient-3 {
                animation: gradient-fade-3 12s ease-in-out infinite 8s;
              }
            `}</style>

            {/* Content Container */}
            <div className="w-full max-w-6xl mx-auto px-4 h-full flex flex-col">
              
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: contentReady ? 1 : 0, 
                  y: contentReady ? 0 : 10 
                }}
                transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                className="mb-8"
              >
                <div className="
                  relative flex flex-col items-center px-6 py-6 rounded-2xl shadow-xl shadow-pink-100/40
                  bg-gradient-to-tr from-[#fff3fc] via-[#f9f3fd] to-[#e7ffe7] border border-white/60
                  before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-2xl
                  before:bg-gradient-to-tr before:from-pink-200/40 before:via-purple-100/40 before:to-yellow-100/40
                  before:blur-2xl
                ">
                  <h1 className="text-2xl md:text-3xl font-bold text-pink-600 text-center mb-2 tracking-tight">
                    💬 Daily Meal Summaries
                  </h1>
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Last updated: {formatTime(lastRefresh)}
                  </p>
                  
                  {/* Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto">
                    {/* User Filter */}
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Filter by User
                      </label>
                      <div className="relative">
                        <select
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="
                            w-full px-4 py-3 rounded-xl border-none shadow-inner
                            bg-white/90 text-gray-800 text-sm font-medium
                            focus:ring-2 focus:ring-pink-300/40 outline-none transition
                            appearance-none cursor-pointer
                          "
                        >
                          <option value="all">All Users ({summaries.length})</option>
                          {uniqueUsers.map(user => {
                            const count = summaries.filter(s => (s.name || 'Unknown') === user).length
                            return (
                              <option key={user} value={user}>
                                {user} ({count})
                              </option>
                            )
                          })}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Date Filter */}
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Filter by Date
                      </label>
                      <div className="relative">
                        <select
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="
                            w-full px-4 py-3 rounded-xl border-none shadow-inner
                            bg-white/90 text-gray-800 text-sm font-medium
                            focus:ring-2 focus:ring-pink-300/40 outline-none transition
                            appearance-none cursor-pointer
                          "
                        >
                          <option value="all">All Dates</option>
                          {uniqueDates.map(date => {
                            const count = summaries.filter(s => s.date === date).length
                            return (
                              <option key={date} value={date}>
                                {formatDate(date)} ({count})
                              </option>
                            )
                          })}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {(selectedUser !== 'all' || selectedDate !== 'all') && (
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {selectedUser !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-medium">
                          👤 {selectedUser}
                          <button
                            onClick={() => setSelectedUser('all')}
                            className="ml-1 hover:text-pink-900 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {selectedDate !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                          📅 {formatDate(selectedDate)}
                          <button
                            onClick={() => setSelectedDate('all')}
                            className="ml-1 hover:text-purple-900 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUser('all')
                          setSelectedDate('all')
                        }}
                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Content Area */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: contentReady ? 1 : 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                className="flex-1 overflow-y-auto"
              >
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <motion.div
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="flex justify-center space-x-1.5 mb-4"
                    >
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    </motion.div>
                    <span className="text-lg font-medium text-gray-600">Loading summaries…</span>
                  </motion.div>
                ) : filteredSummaries.length === 0 ? (
                  <div
                    className="
                      flex flex-col items-center justify-center py-16 px-6 rounded-2xl
                      bg-white/95 border border-gray-100 shadow-sm
                    "
                  >
                    <div className="text-4xl mb-4">
                      {summaries.length === 0 ? '📭' : '🔍'}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {summaries.length === 0 ? 'No summaries yet' : 'No results found'}
                    </h2>
                    <p className="text-gray-600 text-center">
                      {summaries.length === 0 
                        ? 'Daily meal summaries will appear here as users log their meals.'
                        : 'Try adjusting your filters to see more results.'
                      }
                    </p>
                    {summaries.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedUser('all')
                          setSelectedDate('all')
                        }}
                        className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-medium hover:scale-105 transition-transform"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600">
                        Showing {filteredSummaries.length} of {summaries.length} summaries
                      </span>
                    </div>
                    {filteredSummaries.map((summary, index) => (
                      <div
                        key={`${summary.user_id}-${summary.date}-${index}`}
                        className="
                          relative px-6 py-6 rounded-2xl shadow-lg shadow-pink-50/50
                          bg-white/95 border border-gray-100
                          hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300
                        "
                      >
                        {/* User Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm">
                              {(summary.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-gray-900">
                                {summary.name || 'Unknown User'}
                              </h2>
                              <p className="text-sm text-gray-500">
                                {formatDate(summary.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-2xl">📊</div>
                        </div>

                        {/* Meal Summaries */}
                        <div className="space-y-4">
                          {(['breakfast', 'lunch', 'dinner'] as const).map((mealType) => {
                            const summaryText = summary[`${mealType}_summary` as keyof DailySummary] as string
                            if (!summaryText) return null

                            return (
                              <div key={mealType} className="bg-gray-50/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xl">{mealEmojis[mealType]}</span>
                                  <span className="font-semibold text-gray-800 capitalize">
                                    {mealType}
                                  </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed text-sm pl-7">
                                  {summaryText}
                                </p>
                              </div>
                            )
                          })}

                          {/* Full Day Summary */}
                          {summary.full_day_summary && (
                            <div className="
                              relative mt-4 pt-4 border-t border-dashed border-gray-200
                              bg-gradient-to-r from-pink-50/50 via-purple-50/50 to-yellow-50/50 
                              rounded-xl p-4
                            ">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">🌟</span>
                                <span className="font-bold text-pink-600">
                                  Full Day Summary
                                </span>
                              </div>
                              <p className="text-gray-800 leading-relaxed font-medium pl-7">
                                {summary.full_day_summary}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.main>
    )
}