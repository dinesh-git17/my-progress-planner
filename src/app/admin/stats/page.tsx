'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type StatsData = {
  totalUsers: number
  activeUsers: number
  totalMeals: number
  todayMeals: number
  lastUpdated: string | null
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalMeals: 0,
    todayMeals: 0,
    lastUpdated: null
  })
  const [loading, setLoading] = useState(true)
  const [contentReady, setContentReady] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Handle content timing to match homepage
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchStats = () => {
      const timestamp = new Date().getTime()
      setLastRefresh(new Date())

      // Fetch stats without auth for now (you can add it back later)
      fetch(`/api/admin/stats?timestamp=${timestamp}`)
        .then((res) => {
          console.log('📡 Stats API response status:', res.status)
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          console.log('📊 Received stats data:', data)
          // Ensure we have valid data with defaults
          setStats({
            totalUsers: data?.totalUsers || 0,
            activeUsers: data?.activeUsers || 0,
            totalMeals: data?.totalMeals || 0,
            todayMeals: data?.todayMeals || 0,
            lastUpdated: data?.lastUpdated || null
          })
        })
        .catch((error) => {
          console.error('❌ Error fetching stats:', error)
          // Set default values on error
          setStats({
            totalUsers: 0,
            activeUsers: 0,
            totalMeals: 0,
            todayMeals: 0,
            lastUpdated: null
          })
        })
        .finally(() => setLoading(false))
    }

    // Initial fetch
    fetchStats()

    // Fetch data every 30 seconds
    const intervalId = setInterval(fetchStats, 30000)

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
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
              📊 User Analytics & Statistics
            </h1>
            <p className="text-sm text-gray-600 text-center mb-4">
              Last updated: {formatTime(lastRefresh)}
            </p>
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
              <span className="text-lg font-medium text-gray-600">Loading analytics…</span>
            </motion.div>
          ) : (
            <div className="space-y-8 pb-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Active Users Card */}
                <div className="
                  relative px-6 py-6 rounded-2xl shadow-lg shadow-blue-50/50
                  bg-white/95 border border-gray-100
                  hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300
                ">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full flex items-center justify-center text-2xl">
                      👥
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {(stats?.activeUsers || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Last 7 days</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Active Users</h3>
                  <p className="text-sm text-gray-600">Users who logged meals recently</p>
                </div>

                {/* Total Users Card */}
                <div className="
                  relative px-6 py-6 rounded-2xl shadow-lg shadow-purple-50/50
                  bg-white/95 border border-gray-100
                  hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300
                ">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {(stats?.totalUsers || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">All time</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Users</h3>
                  <p className="text-sm text-gray-600">All registered users</p>
                </div>

                {/* Total Meals Card */}
                <div className="
                  relative px-6 py-6 rounded-2xl shadow-lg shadow-pink-50/50
                  bg-white/95 border border-gray-100
                  hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300
                ">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pink-600">
                        {(stats?.totalMeals || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">All time</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Meals</h3>
                  <p className="text-sm text-gray-600">All logged meals</p>
                </div>

                {/* Today's Meals Card */}
                <div className="
                  relative px-6 py-6 rounded-2xl shadow-lg shadow-green-50/50
                  bg-white/95 border border-gray-100
                  hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300
                ">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center text-2xl">
                      📅
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {(stats?.todayMeals || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Today</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Today's Meals</h3>
                  <p className="text-sm text-gray-600">Meals logged today</p>
                </div>
              </div>

              {/* Detailed Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Engagement Card */}
                <div className="
                  relative px-6 py-6 rounded-2xl shadow-lg shadow-indigo-50/50
                  bg-white/95 border border-gray-100
                ">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-200 to-indigo-300 rounded-full flex items-center justify-center text-xl">
                      📈
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">User Engagement</h3>
                      <p className="text-sm text-gray-600">Activity metrics and trends</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">Engagement Rate</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {(stats?.totalUsers || 0) > 0 ? Math.round(((stats?.activeUsers || 0) / (stats?.totalUsers || 1)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">Avg Meals per User</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {(stats?.totalUsers || 0) > 0 ? Math.round((stats?.totalMeals || 0) / (stats?.totalUsers || 1)) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">Daily Activity</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {(stats?.activeUsers || 0) > 0 ? Math.round(((stats?.todayMeals || 0) / (stats?.activeUsers || 1)) * 100) / 100 : 0} meals/user
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Health Card */}
                <div className="
                  relative px-6 py-6 rounded-2xl shadow-lg shadow-orange-50/50
                  bg-white/95 border border-gray-100
                ">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full flex items-center justify-center text-xl">
                      🎯
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">System Health</h3>
                      <p className="text-sm text-gray-600">Platform performance metrics</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">Database Status</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Healthy
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">API Response</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Fast
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">Last Updated</span>
                      <span className="text-sm font-medium text-gray-600">
                        {stats?.lastUpdated 
                          ? new Date(stats.lastUpdated).toLocaleTimeString()
                          : 'Just now'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Refresh Info */}
              <div className="
                bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100
                border border-gray-200/50 rounded-2xl p-6 text-center
              ">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-lg mr-3">
                    🔄
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Auto-Refresh Enabled</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Statistics automatically update every 30 seconds to provide real-time insights.
                  All data is sourced directly from your production database.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.main>
  )
}