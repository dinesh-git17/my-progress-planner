/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */

'use client'

import { getOrCreateUserId } from '@/utils/mealLog'
import { getUserName, saveUserName } from '@/utils/user'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const mealLabels = [
  { meal: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { meal: 'lunch', emoji: '🫐', label: 'Lunch' },
  { meal: 'dinner', emoji: '🍜', label: 'Dinner' },
]

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 2)
}

interface HighlightedWord {
  regex: RegExp
  className: string
}

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
      break
    }
  }
  return streak
}

// --- Stable user_id! ---
function useUserStreak(user_id?: string) {
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user_id) return
    setLoading(true)
    fetch(`/api/streak?user_id=${user_id}`)
      .then(res => res.json())
      .then(({ dates }) => setStreak(calculateStreak(dates ?? [])))
      .catch((err) => {
        setStreak(0)
      })
      .finally(() => setLoading(false))
  }, [user_id])

  return { streak, loading }
}

function highlightQuote(quote: string): string {
  const highlights: HighlightedWord[] = [
    { regex: /self-care/gi, className: 'text-pink-500 font-semibold' },
    { regex: /progress/gi, className: 'text-purple-500 font-semibold' },
    { regex: /small steps/gi, className: 'text-yellow-500 font-semibold' },
    { regex: /amazing/gi, className: 'text-green-500 font-semibold' },
    { regex: /love/gi, className: 'text-red-500 font-semibold' },
    { regex: /motivation/gi, className: 'text-blue-500 font-semibold' },
    { regex: /healthy/gi, className: 'text-teal-500 font-semibold' },
    { regex: /victory/gi, className: 'text-teal-500 font-semibold' },
  ]
  let highlighted = quote
  for (const { regex, className } of highlights) {
    highlighted = highlighted.replace(
      regex,
      (match) => `<span class="${className}">${match}</span>`
    )
  }
  return highlighted
}

function getMsUntilNextEstMidnight() {
  // Handles daylight savings too!
  const now = new Date()
  // Get current NY time
  const nowNY = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  // Set next midnight EST (which is 4 AM UTC)
  const nextMidnightNY = new Date(nowNY)
  nextMidnightNY.setHours(0, 0, 0, 0)  // Midnight EST
  
  if (nowNY > nextMidnightNY) {
    // If it's already past midnight EST, calculate for the next day
    nextMidnightNY.setDate(nextMidnightNY.getDate() + 1)
  }

  const nextResetUTC = new Date(nextMidnightNY).getTime() // Reset time in UTC

  // How many ms until next reset time (midnight EST)
  return nextResetUTC - now.getTime()
}

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
              loading your meals
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

export default function Home() {
  const [quote, setQuote] = useState('')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [askName, setAskName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [showNameSaved, setShowNameSaved] = useState(false)
  const [loggedMeals, setLoggedMeals] = useState<string[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
  const [contentReady, setContentReady] = useState(false)
  const [activeTab, setActiveTab] = useState<'meals' | 'progress'>('meals')
  const { streak, loading: streakLoading } = useUserStreak(userId ?? undefined)
  const router = useRouter()
  const hasFetchedMeals = useRef(false)

  // Helper function for VAPID key conversion
  function urlBase64ToUint8Array(base64String: string) {
    console.log('🔄 Converting VAPID key:', base64String.substring(0, 20) + '...')
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+').replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    console.log('✅ VAPID key converted to Uint8Array, length:', outputArray.length)
    return outputArray
  }

  // Enhanced notification handler with debug logging
// Alternative: Try this simpler approach based on your original PushSubscriptionButton
const handleNotificationClick = async () => {
  console.log('🔔 Trying original approach...')
  
  try {
    // This is closer to your original PushSubscriptionButton logic
    const reg = await navigator.serviceWorker.ready

    // Ask for notification permission
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') throw new Error('Notification permission denied')

    const vapidPublicKey = 'BAEWVqKa9ASTlGbc7Oo_BJGAsYBtlYAS1IkI1gKMz5Ot6WnNQuP-WQ2u3sDRDV4Ca5kZQwo8aKOshT3wOrUugxk'

    // Subscribe for push
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    })

    // Send subscription object to your backend to save
    const response = await fetch('/api/push/save-subscription', {
      method: 'POST',
      body: JSON.stringify({
        subscription: sub,
        user_id: userId
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) throw new Error('Failed to save subscription')
    
    setNotificationsEnabled(true)
    alert('🎉 Notifications enabled!')
    
  } catch (err: any) {
    console.error('❌ Error:', err)
    alert(`Error: ${err.message}`)
  }
}

  // Handle loading screen timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false)
      // Small delay to ensure smooth transition
      setTimeout(() => setContentReady(true), 100)
    }, 2000) // Show loading screen for 2 seconds minimum

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const msUntilMidnight = getMsUntilNextEstMidnight()
    const timeout = setTimeout(() => {
      window.location.reload()
    }, msUntilMidnight + 2000) // 2s buffer to be safe

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const uid = getOrCreateUserId()
    setUserId(uid)
  }, [])

  useEffect(() => {
    // Check notification permission status
    if (typeof Notification !== 'undefined') {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
    
    if (!userId || !contentReady) return
    
    const init = async () => {
      const existingName = await getUserName(userId)
      if (!existingName) {
        setAskName(true)
      } else {
        setName(existingName)
        fetchQuote(existingName)
        fetchLoggedMeals(userId)
      }

      // Check if user already has push notifications enabled
      // This will check both browser permission AND if they have an active subscription
      try {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
              // User has both permission and active subscription
              setNotificationsEnabled(true)
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing push subscription:', error)
      }
    }
    
    init()
  }, [userId, contentReady])

  // Refresh logged meals whenever the page becomes visible or gains focus
  useEffect(() => {
    if (!userId || !contentReady) return

    const refreshMeals = () => {
      console.log('🔄 Refreshing meals for user:', userId)
      fetchLoggedMeals(userId)
    }

    // Always refresh meals when this component mounts/remounts
    console.log('🏠 Homepage mounted, refreshing meals')
    refreshMeals()

    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, refreshing meals')
        refreshMeals()
      }
    }

    // Refresh when window gains focus (user clicks back into window)
    const handleFocus = () => {
      console.log('🎯 Window gained focus, refreshing meals')
      refreshMeals()
    }

    // Refresh when user returns to this page (for client-side navigation)
    const handlePageShow = (event: PageTransitionEvent) => {
      console.log('📄 Page show event, refreshing meals')
      refreshMeals()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)

    // Set up a periodic refresh every 5 seconds to catch navigation changes
    const interval = setInterval(() => {
      if (!document.hidden) {
        console.log('⏰ Periodic refresh triggered')
        refreshMeals()
      }
    }, 5000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
      clearInterval(interval)
    }
  }, [userId, contentReady])

  // Also refresh meals every time the component renders (aggressive approach)
  useEffect(() => {
    if (userId && !hasFetchedMeals.current && contentReady) {
      console.log('🎨 Component effect: fetching meals')
      fetchLoggedMeals(userId)
      hasFetchedMeals.current = true
    }
  })

  // Reset the fetch flag when userId changes
  useEffect(() => {
    console.log('🆔 UserId changed, resetting fetch flag')
    hasFetchedMeals.current = false
  }, [userId])

  interface QuoteResponse {
    quote?: string
  }

  const fetchQuote = (nameToUse: string): void => {
    setLoading(true)
    setQuote('')
    fetch(`/api/gpt/quote?ts=${Date.now()}&name=${encodeURIComponent(nameToUse)}`)
      .then((res: Response) => res.json())
      .then((data: QuoteResponse) => {
        let safeQuote = typeof data.quote === 'string' ? data.quote : ''
        if (
          !safeQuote ||
          safeQuote.toLowerCase().includes('undefined') ||
          safeQuote.length < 8
        ) {
          safeQuote = "You're doing amazing! One step at a time."
        }
        setQuote(safeQuote)
      })
      .catch(() => setQuote("You're doing amazing! One step at a time."))
      .finally(() => setLoading(false))
  }

  interface MealLog {
    id: string;
    user_id: string;
    date: string; // Store the date as a string (ISO format)
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
    created_at: string; // Add this line to include the 'created_at' field
    // You may also want to add any other fields you expect from the database
  }

  interface MealLogResponse {
    mealLog?: MealLog
  }

  const fetchLoggedMeals = async (user_id: string): Promise<void> => {
    console.log('🍽️ === FETCHING LOGGED MEALS ===')
    console.log('👤 User ID:', user_id)
    
    try {
      // Get today's date in EST - CORRECTED METHOD
      const now = new Date();
      const todayEst = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/New_York' 
      }).format(now); // Returns 'YYYY-MM-DD' format directly in EST

      console.log('📅 Looking for date:', todayEst)
      
      const url = `/api/meals/check?user_id=${encodeURIComponent(user_id)}&date=${encodeURIComponent(todayEst)}&timestamp=${Date.now()}`
      console.log('🌐 Full API URL:', url)
      
      console.log('📡 Making fetch request...')
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      
      if (!res.ok) {
        console.error('❌ HTTP Error Response:')
        const errorText = await res.text()
        console.error('  Error body:', errorText)
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`)
      }
      
      const data: MealLogResponse = await res.json()
      console.log('✅ Meal data received:', JSON.stringify(data, null, 2))
      
      if (data?.mealLog) {
        const meals: string[] = []
        
        // Since we're querying by the exact EST date, and the API already filtered
        // correctly, we can directly check for logged meals without date comparison
        if (data.mealLog.breakfast) {
          meals.push('breakfast')
          console.log('🍳 Found breakfast logged')
        }
        if (data.mealLog.lunch) {
          meals.push('lunch')
          console.log('🥪 Found lunch logged')
        }
        if (data.mealLog.dinner) {
          meals.push('dinner')
          console.log('🍜 Found dinner logged')
        }

        setLoggedMeals(meals)
        console.log('✅ State updated successfully')
      } else {
        console.log('📭 No meal log found in response, resetting to empty')
        setLoggedMeals([])
      }
      
    } catch (error) {
      console.error('💥 === ERROR FETCHING MEALS ===')
      console.error('Error details:', error)
      setLoggedMeals([])
    }
  }

  const handleSaveName = async () => {
    if (!tempName.trim() || !userId) return
    const success = await saveUserName(userId, tempName.trim())
    if (success) {
      setName(tempName.trim())
      setShowNameSaved(true)
      setTimeout(() => {
        setAskName(false)
        fetchQuote(tempName.trim())
        fetchLoggedMeals(userId)
      }, 1200)
    }
  }

  // Apple Health colors for streak badge
  const streakColors = [
    "from-[#ffecd2] to-[#fcb69f]",
    "from-[#a8edea] to-[#fed6e3]",
    "from-[#f9d423] to-[#ff4e50]",
    "from-[#fceabb] to-[#f8b500]",
  ]
  const streakColor = streakColors[streak % streakColors.length]

  console.log('🏠 === HOMEPAGE RENDER ===')
  console.log('👤 Current userId:', userId)
  console.log('🍽️ Current loggedMeals:', loggedMeals)
  console.log('👋 Current name:', name)
  console.log('📊 Current streak:', streak)
  console.log('🏠 === END RENDER DEBUG ===')

  // Add this right before your return statement to debug state
console.log('🔍 BUTTON RENDER DEBUG:')
console.log('- notificationsEnabled:', notificationsEnabled)
console.log('- userId:', userId)
console.log('- Should show button:', !notificationsEnabled && userId)
console.log('- Notification.permission:', typeof Notification !== 'undefined' ? Notification.permission : 'undefined')

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
        {contentReady && (
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

            {/* Name Input Flow - Full Screen Overlay */}
            {askName && !showNameSaved && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-50 flex items-center justify-center px-4"
              >
                <div className="w-full max-w-md">
                  <div className="flex flex-col items-center mb-8">
                    <div className="mb-4 text-6xl">👩‍❤️‍💋‍👨</div>
                    <h1 className="text-center text-2xl font-bold text-pink-600 mb-3 tracking-tight">
                      Hi love 🥺 What's your name?
                    </h1>
                    <p className="text-center text-lg text-gray-600 mb-0.5">
                      I'll remember it for your daily progress!
                    </p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/40">
                    <input
                      className="
                        w-full px-6 py-4 mb-6 rounded-2xl border-none shadow-inner
                        bg-white/90 text-gray-800 text-xl
                        focus:ring-2 focus:ring-pink-300/40 outline-none transition
                        placeholder:text-gray-400
                      "
                      placeholder="Your sweet name…"
                      value={tempName}
                      maxLength={32}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      aria-label="Enter your name"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={!tempName.trim()}
                      className="
                        w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-yellow-400
                        text-white text-xl font-bold shadow-lg transition 
                        hover:scale-[1.02] active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        tracking-wide focus:outline-none focus:ring-2 focus:ring-pink-300/40
                      "
                      type="button"
                    >
                      Save My Name 💌
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Name Saved Confirmation - Full Screen Overlay */}
            {askName && showNameSaved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-50 flex items-center justify-center px-4"
              >
                <div className="text-center">
                  <div className="mb-6 text-6xl">💖</div>
                  <h1 className="text-3xl font-bold text-pink-500 mb-4">
                    Yay! Your name is saved, my love
                  </h1>
                  <p className="text-xl text-gray-600">
                    Let's crush your goals together!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Main Content - Hidden when asking for name */}
            {!askName && (
              <>
                {/* Top Profile Bar */}
                <div className="w-full max-w-lg mx-auto px-4 flex flex-row items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <span className="text-[1.5rem] font-bold text-gray-900 leading-snug flex items-center gap-1">
                      {name ? <>Hello, {name.split(' ')[0]} <span className="ml-1">👋</span></> : "Hello! 👋"}
                    </span>
                    {!streakLoading && streak > 0 && (
                      <motion.span
                        key={streak}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                        className="flex items-center mt-1 text-[1rem] font-medium text-gray-700 pl-1"
                      >
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mr-2" />
                        <span>{streak} day{streak > 1 && 's'} streak!</span>
                      </motion.span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    {!notificationsEnabled && userId && (
                      <button
                        onClick={(e) => {
                          console.log('🖱️ Button clicked!', e);
                          e.preventDefault();
                          e.stopPropagation();
                          handleNotificationClick();
                        }}
                        className="
                          w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 
                          flex items-center justify-center shadow-lg 
                          cursor-pointer hover:scale-110 active:scale-95 transition-transform
                          border-none outline-none focus:ring-2 focus:ring-pink-300
                        "
                        style={{ 
                          zIndex: 10000,
                          WebkitTapHighlightColor: 'transparent'
                        }}
                        type="button"
                        aria-label="Enable notifications"
                      >
                        <i className="fas fa-bell text-white text-xs pointer-events-none"></i>
                      </button>
                    )}
                    
                    {/* Profile Initial */}
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg select-none uppercase">
                      {getInitials(name) || "🍽️"}
                    </div>
                  </div>
                </div>

                {/* Motivational Quote */}
                <div className="w-full max-w-lg mx-auto px-4 mb-6">
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.5 }}
                    className="
                      relative flex items-start px-6 py-5 rounded-2xl shadow-xl shadow-pink-100/40
                      bg-gradient-to-tr from-[#fff3fc] via-[#f9f3fd] to-[#e7ffe7] border border-white/60
                      min-h-[72px] z-10 w-full
                      before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-2xl
                      before:bg-gradient-to-tr before:from-pink-200/40 before:via-purple-100/40 before:to-yellow-100/40
                      before:blur-2xl
                    "
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-50 text-xl mr-4 ml-0 flex-shrink-0 mt-0.5">
                      💡
                    </span>
                    {loading || !quote ? (
                      <span className="animate-pulse text-base font-normal italic text-gray-400 flex-1">
                        Loading motivation…
                      </span>
                    ) : (
                      <span
                        className="font-semibold text-[1.11rem] sm:text-lg leading-snug text-gray-800 break-words flex-1"
                        dangerouslySetInnerHTML={{ __html: highlightQuote(quote) }}
                      />
                    )}
                  </motion.div>
                </div>

                {/* Tab Content */}
                <div className="w-full max-w-lg mx-auto px-4 flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {activeTab === 'meals' && (
                      <motion.div
                        key="meals"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="pb-24"
                      >
                        <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
                          Meals Today
                        </span>
                        <div className="flex flex-col gap-6">
                    {mealLabels.map(({ meal, emoji, label }) => {
                      const isLogged = loggedMeals.includes(meal)
                      return (
                        <motion.div
                          key={meal}
                          whileTap={{ scale: isLogged ? 1 : 0.98 }}
                          className={`
                            flex items-center px-6 py-5 rounded-2xl transition
                            bg-white/95 border border-gray-100 shadow-sm
                            ${isLogged
                              ? 'opacity-60 pointer-events-none'
                              : 'hover:bg-pink-50 hover:shadow-lg'}
                            cursor-pointer
                          `}
                          onClick={() => !isLogged && router.push(`/${meal}`)}
                          tabIndex={isLogged ? -1 : 0}
                          aria-disabled={isLogged}
                          role="button"
                          onKeyDown={e => {
                            if (!isLogged && (e.key === "Enter" || e.key === " ")) {
                              router.push(`/${meal}`)
                            }
                          }}
                        >
                          <span className="text-2xl">{emoji}</span>
                          <div className="flex-1 flex flex-col ml-4">
                            <span className="text-base font-semibold text-gray-900">
                              {label}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">
                              {isLogged
                                ? `Logged!`
                                : `Tap to log your ${label.toLowerCase()}`}
                            </span>
                          </div>
                          {isLogged ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shadow-sm">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                                <path fillRule="evenodd" d="M16.707 6.293a1 1 0 010 1.414l-6.364 6.364a1 1 0 01-1.414 0l-3.182-3.182a1 1 0 011.414-1.414l2.475 2.475 5.657-5.657a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Logged
                            </span>
                          ) : (
                            <span className="ml-2 text-gray-300 group-hover:text-pink-400 transition">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586V3a1 1 0 10-2 0v9.586l-4.293-4.293a1 1 0 10-1.414 1.414l5 5z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </motion.div>
                      )
                    })}

                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'progress' && (
                      <motion.div
                        key="progress"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="pb-24"
                      >
                        <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
                          Progress
                        </span>
                        <div className="flex flex-col gap-6">
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className={`
                              flex items-center px-6 py-5 rounded-2xl transition
                              bg-white/95 border border-gray-100 shadow-sm
                              hover:bg-pink-50 hover:shadow-lg
                              cursor-pointer
                            `}
                            onClick={() => router.push('/summaries')}
                            tabIndex={0}
                            role="button"
                            onKeyDown={e => {
                              if (e.key === "Enter" || e.key === " ") {
                                router.push('/summaries')
                              }
                            }}
                          >
                            <span className="text-2xl">📋</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                View My Summaries
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                See your AI-powered meal recaps!
                              </span>
                            </div>
                            <span className="ml-2 text-gray-300 group-hover:text-pink-400 transition">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586V3a1 1 0 10-2 0v9.586l-4.293-4.293a1 1 0 10-1.414 1.414l5 5z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className={`
                              flex items-center px-6 py-5 rounded-2xl transition
                              bg-white/95 border border-gray-100 shadow-sm
                              hover:bg-orange-50 hover:shadow-lg
                              cursor-pointer
                            `}
                            onClick={() => router.push('/streaks')}
                            tabIndex={0}
                            role="button"
                            onKeyDown={e => {
                              if (e.key === "Enter" || e.key === " ") {
                                router.push('/streaks')
                              }
                            }}
                          >
                            <span className="text-2xl">🏆</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                View My Streaks
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                {!streakLoading && streak > 0 
                                  ? `Current streak: ${streak} day${streak > 1 ? 's' : ''}!`
                                  : 'See all your achievement milestones!'
                                }
                              </span>
                            </div>
                            <span className="ml-2 text-gray-300 group-hover:text-orange-400 transition">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586V3a1 1 0 10-2 0v9.586l-4.293-4.293a1 1 0 10-1.414 1.414l5 5z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom Tab Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-2 safe-area-pb">
                  <div className="w-full max-w-lg mx-auto">
                    <div className="flex items-center justify-around">
                      {/* Meals Tab */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('meals')}
                        className={`
                          flex flex-col items-center justify-center py-3 px-6 rounded-2xl transition-all duration-300
                          ${activeTab === 'meals' 
                            ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-gray-600'
                          }
                        `}
                      >
                        <i className={`fas fa-utensils text-xl mb-1 ${activeTab === 'meals' ? 'text-white' : 'text-gray-400'}`}></i>
                        <span className={`text-xs font-medium ${activeTab === 'meals' ? 'text-white' : 'text-gray-400'}`}>
                          Meals
                        </span>
                      </motion.button>

                      {/* Progress Tab */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('progress')}
                        className={`
                          flex flex-col items-center justify-center py-3 px-6 rounded-2xl transition-all duration-300
                          ${activeTab === 'progress' 
                            ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-gray-600'
                          }
                        `}
                      >
                        <i className={`fas fa-chart-line text-xl mb-1 ${activeTab === 'progress' ? 'text-white' : 'text-gray-400'}`}></i>
                        <span className={`text-xs font-medium ${activeTab === 'progress' ? 'text-white' : 'text-gray-400'}`}>
                          Progress
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </>
  )
}