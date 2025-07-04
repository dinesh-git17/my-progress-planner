'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

// Loading Screen Component
function LoadingScreen({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="loading-screen-image flex flex-col items-center justify-center"
        >
          {/* Spacer to push content to bottom */}
          <div className="flex-1" />
          
          {/* Text content positioned at bottom */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative z-10 text-center px-6 pb-16"
          >
            <h1 
              className="text-lg font-light text-gray-600 mb-3 tracking-wide" 
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", Arial, sans-serif',
                letterSpacing: '0.5px'
              }}
            >
              loading admin portal
            </h1>
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center space-x-1.5"
            >
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AdminLandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
  const [contentReady, setContentReady] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMeals: 0,
    todayMeals: 0,
    lastUpdated: null as string | null
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const router = useRouter()

  // Handle loading screen timing and authentication check together
  useEffect(() => {
    // Check authentication status immediately
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setAuthChecked(true)

    // Always show loading screen for minimum duration for smooth experience
    const timer = setTimeout(() => {
      setShowLoadingScreen(false)
      // Small delay to ensure smooth transition
      setTimeout(() => setContentReady(true), 100)
    }, 2000) // Show loading screen for 2 seconds minimum

    return () => clearTimeout(timer)
  }, [])

  // Fetch stats when authenticated and content is ready
  useEffect(() => {
    if (isAuthenticated && contentReady) {
      fetchStats()
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, contentReady])

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const timestamp = new Date().getTime()
      console.log('📊 Fetching stats for landing page...')
      
      const response = await fetch(`/api/admin/stats?timestamp=${timestamp}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Landing page received stats:', data)
        setStats({
          totalUsers: data?.totalUsers || 0,
          activeUsers: data?.activeUsers || 0,
          totalMeals: data?.totalMeals || 0,
          todayMeals: data?.todayMeals || 0,
          lastUpdated: data?.lastUpdated || null
        })
      } else {
        console.error('Failed to fetch stats:', response.status)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        sessionStorage.setItem('admin_authenticated', 'true')
        setIsAuthenticated(true)
        setPassword('')
      } else {
        setError('Invalid password. Please try again.')
      }
    } catch (err) {
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated')
    setIsAuthenticated(false)
    setPassword('')
    setError('')
    setStats({
      totalUsers: 0,
      activeUsers: 0,
      totalMeals: 0,
      todayMeals: 0,
      lastUpdated: null
    })
  }

  const adminNavItems = [
    {
      title: 'Meal Logs',
      description: 'View and manage user meal entries',
      icon: '📋',
      path: '/admin/logs',
      color: 'from-pink-400 to-pink-500',
      hoverColor: 'hover:bg-pink-50'
    },
    {
      title: 'Daily Summaries', 
      description: 'AI-generated meal summaries and insights',
      icon: '💬',
      path: '/admin/summaries',
      color: 'from-purple-400 to-purple-500',
      hoverColor: 'hover:bg-purple-50'
    },
    {
      title: 'User Analytics',
      description: 'User engagement and streak analytics',
      icon: '📊',
      path: '/admin/stats',
      color: 'from-blue-400 to-blue-500',
      hoverColor: 'hover:bg-blue-50'
    },
    {
      title: 'System Settings',
      description: 'Configure app settings and preferences',
      icon: '⚙️',
      path: '/admin/settings',
      color: 'from-gray-400 to-gray-500',
      hoverColor: 'hover:bg-gray-50'
    }
  ]

  return (
    <>
      {/* Font Awesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      {/* Loading Screen */}
      <LoadingScreen isVisible={showLoadingScreen} />

      {/* Main Content */}
      <AnimatePresence>
        {contentReady && authChecked && (
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="
              min-h-[100dvh] w-full h-[100dvh] overflow-hidden
              relative pt-8 md:pt-12 flex flex-col
            "
            style={{
              paddingTop: 'max(env(safe-area-inset-top), 2rem)',
            }}
          >
            {/* Dynamic Animated Gradient Background */}
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

            {/* Authentication Flow */}
            {!isAuthenticated ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex items-center justify-center flex-1 px-4"
              >
                <div className="w-full max-w-md">
                  <div className="flex flex-col items-center mb-8">
                    <div className="mb-4 text-6xl">🔐</div>
                    <h1 className="text-center text-2xl font-bold text-pink-600 mb-3 tracking-tight">
                      Admin Portal Access
                    </h1>
                    <p className="text-center text-lg text-gray-600 mb-0.5">
                      Enter admin password to continue
                    </p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/40">
                    <form onSubmit={handlePasswordSubmit}>
                      <input
                        type="password"
                        className="
                          w-full px-6 py-4 mb-6 rounded-2xl border-none shadow-inner
                          bg-white/90 text-gray-800 text-xl
                          focus:ring-2 focus:ring-pink-300/40 outline-none transition
                          placeholder:text-gray-400
                        "
                        placeholder="Admin password…"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        disabled={isLoading}
                      />
                      
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 text-red-500 text-sm text-center"
                        >
                          {error}
                        </motion.div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={!password.trim() || isLoading}
                        className="
                          w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-purple-400
                          text-white text-xl font-bold shadow-lg transition 
                          hover:scale-[1.02] active:scale-[0.98]
                          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                          tracking-wide focus:outline-none focus:ring-2 focus:ring-pink-300/40
                        "
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Authenticating...
                          </div>
                        ) : (
                          'Access Admin Portal 🔑'
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Admin Dashboard */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col h-full"
              >
                {/* Top Header Bar */}
                <div className="w-full max-w-lg mx-auto px-4 flex flex-row items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <span className="text-[1.5rem] font-bold text-gray-900 leading-snug flex items-center gap-1">
                      Admin Portal <span className="ml-1">⚡</span>
                    </span>
                    <span className="text-sm text-gray-600 mt-1">
                      Manage your meal tracking application
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center shadow-lg cursor-pointer text-white hover:scale-105 transition-transform"
                    >
                      <i className="fas fa-sign-out-alt text-sm"></i>
                    </button>
                    
                    {/* Admin Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg select-none">
                      👨🏽‍💻
                    </div>
                  </div>
                </div>

                {/* Welcome Card */}
                <div className="w-full max-w-lg mx-auto px-4 mb-6">
                  <div
                    className="
                      relative flex items-start px-6 py-5 rounded-2xl shadow-xl shadow-pink-100/40
                      bg-gradient-to-tr from-[#fff3fc] via-[#f9f3fd] to-[#e7ffe7] border border-white/60
                      min-h-[72px] z-10 w-full
                      before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-2xl
                      before:bg-gradient-to-tr before:from-pink-200/40 before:via-purple-100/40 before:to-yellow-100/40
                      before:blur-2xl
                    "
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-xl mr-4 ml-0 flex-shrink-0 mt-0.5">
                      🎯
                    </span>
                    <span className="font-semibold text-[1.11rem] sm:text-lg leading-snug text-gray-800 break-words flex-1">
                      Welcome to the admin dashboard! Manage users, view analytics, and monitor system health.
                    </span>
                  </div>
                </div>

                {/* Navigation Cards */}
                <div className="w-full max-w-lg mx-auto px-4 flex-1 overflow-y-auto pb-8">
                  <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
                    Admin Functions
                  </span>
                  <div className="flex flex-col gap-6">
                    {adminNavItems.map((item, index) => (
                      <motion.div
                        key={item.path}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          flex items-center px-6 py-5 rounded-2xl transition
                          bg-white/95 border border-gray-100 shadow-sm
                          ${item.hoverColor} hover:shadow-lg
                          cursor-pointer
                        `}
                        onClick={() => router.push(item.path)}
                        tabIndex={0}
                        role="button"
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            router.push(item.path)
                          }
                        }}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1 flex flex-col ml-4">
                          <span className="text-base font-semibold text-gray-900">
                            {item.title}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            {item.description}
                          </span>
                        </div>
                        <span className="ml-2 text-gray-300 group-hover:text-gray-600 transition">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10.293 15.707a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586V3a1 1 0 10-2 0v9.586l-4.293-4.293a1 1 0 10-1.414 1.414l5 5z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Quick Stats Card */}
                  <div className="mt-8">
                    <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
                      Quick Stats
                    </span>
                    <div className="
                        bg-gradient-to-r from-purple-100 via-pink-50 to-yellow-100
                        border border-purple-200/50 rounded-2xl p-6 shadow-sm
                      ">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">System Overview</h3>
                        <div className="flex items-center gap-2">
                          {statsLoading && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                            />
                          )}
                          <span className="text-2xl">📈</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center mb-4">
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-2xl font-bold text-purple-600">
                            {statsLoading ? '--' : (stats?.activeUsers || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">Active Users</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Last 7 days
                          </div>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-2xl font-bold text-pink-600">
                            {statsLoading ? '--' : (stats?.totalMeals || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">Total Meals</div>
                          <div className="text-xs text-gray-400 mt-1">
                            All time
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-xl font-bold text-blue-600">
                            {statsLoading ? '--' : (stats?.totalUsers || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">Total Users</div>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-xl font-bold text-green-600">
                            {statsLoading ? '--' : (stats?.todayMeals || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">Today's Meals</div>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-center text-gray-500">
                        {stats?.lastUpdated 
                          ? `Last updated: ${new Date(stats.lastUpdated).toLocaleTimeString()}`
                          : 'Statistics updated every 30 seconds'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </>
  )
}