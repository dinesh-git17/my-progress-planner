'use client'

import { PushSubscriptionButton } from '@/components/PushSubscriptionButton'
import { getOrCreateUserId } from '@/utils/mealLog'
import { getUserName, saveUserName } from '@/utils/user'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const mealLabels = [
  { meal: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { meal: 'lunch', emoji: '🥪', label: 'Lunch' },
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

function getMsUntilNextESTMidnight() {
  // Handles daylight savings too!
  const now = new Date()
  // Get current NY time
  const nowNY = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  // Set next midnight in NY
  const nextMidnightNY = new Date(nowNY)
  nextMidnightNY.setHours(24, 0, 0, 0)
  // How many ms until next midnight in NY?
  return nextMidnightNY.getTime() - nowNY.getTime()
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
  const { streak, loading: streakLoading } = useUserStreak(userId ?? undefined)
  const router = useRouter()

  useEffect(() => {
  // Auto-refresh at next EST midnight (America/New_York)
  const msUntilMidnight = getMsUntilNextESTMidnight()
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
    if (typeof Notification !== 'undefined') {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
    if (!userId) return
    const init = async () => {
      const existingName = await getUserName(userId)
      if (!existingName) {
        setAskName(true)
      } else {
        setName(existingName)
        fetchQuote(existingName)
        fetchLoggedMeals(userId)
      }
    }
    init()
    // eslint-disable-next-line
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
    breakfast?: boolean
    lunch?: boolean
    dinner?: boolean
  }

  interface MealLogResponse {
    mealLog?: MealLog
  }

  const fetchLoggedMeals = async (user_id: string): Promise<void> => {
    const today = new Date().toLocaleString("en-US", { timeZone: "America/New_York" }).slice(0, 10)
    const res = await fetch(`/api/meals/check?user_id=${user_id}&date=${today}`)
    const data: MealLogResponse = await res.json()
    if (data?.mealLog) {
      const meals: string[] = []
      if (data.mealLog.breakfast) meals.push('breakfast')
      if (data.mealLog.lunch) meals.push('lunch')
      if (data.mealLog.dinner) meals.push('dinner')
      setLoggedMeals(meals)
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

console.log('userId:', userId)
console.log('streak:', streak)
console.log('streakLoading:', streakLoading)


  return (
      <main className="
        min-h-[100dvh] w-full h-[100dvh] overflow-y-auto overflow-x-hidden
        bg-gradient-to-br from-[#fdf6e3] via-[#fff5fa] to-[#e6e6fa]
        pt-8 md:pt-12 pb-32 flex flex-col
      ">
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
              className="flex items-center mt-1 text-[1rem] font-medium text-gray-700"
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mr-2" />
              <span>{streak} day{streak > 1 && 's'} streak!</span>
            </motion.span>
)}

        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg select-none uppercase">
          {getInitials(name) || "🍽️"}
        </div>
      </div>

      {/* Motivational Quote */}
<div className="w-full max-w-lg mx-auto px-4 mb-8">
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
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-50 text-xl mr-4 ml-0">
      💡
    </span>
          {loading || !quote ? (
            <span className="animate-pulse text-base font-normal italic text-gray-400">
              Loading motivation…
            </span>
          ) : (
            <span
              className="font-semibold text-[1.11rem] sm:text-lg leading-snug text-gray-800 break-words"
              dangerouslySetInnerHTML={{ __html: highlightQuote(quote) }}
            />
          )}
        </motion.div>
      </div>

      {/* Name Prompt Flow */}
      {askName && !showNameSaved ? (
        <div className="w-full max-w-lg mx-auto px-4 mt-8">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-2 text-3xl">👩‍❤️‍💋‍👨</div>
            <p className="text-center text-lg font-semibold text-pink-600 mb-1 tracking-tight">
              Hi love 🥺 What’s your name?
            </p>
            <p className="text-center text-base text-gray-500 mb-0.5">
              I’ll remember it for your daily progress!
            </p>
          </div>
          <input
            className="
              w-full px-5 py-3 mb-4 rounded-xl border-none shadow-inner
              bg-white text-gray-800 text-lg
              focus:ring-2 focus:ring-pink-300/40 outline-none transition
              placeholder:text-gray-400
            "
            placeholder="Your sweet name…"
            value={tempName}
            maxLength={32}
            onChange={(e) => setTempName(e.target.value)}
            aria-label="Enter your name"
          />
          <button
            onClick={handleSaveName}
            className="
              w-full py-3 rounded-full bg-gradient-to-r from-pink-300 via-pink-400 to-yellow-300
              text-white text-lg font-bold shadow-md transition hover:scale-[1.03]
              tracking-wide focus:outline-none focus:ring-2 focus:ring-pink-300/30
            "
            type="button"
          >
            Save My Name 💌
          </button>
        </div>
      ) : askName && showNameSaved ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg mx-auto px-4 text-center text-lg font-semibold text-pink-500 my-8"
        >
          Yay! Your name is saved, my love 💖<br />
          Let’s crush your goals together!
        </motion.div>
      ) : (
        <>
          {/* Enable Notifications Section */}
          {!notificationsEnabled && (
            <div className="w-full max-w-lg mx-auto px-4 mb-6">
              <PushSubscriptionButton />
            </div>
          )}

          {/* Meals Section */}
          <div className="w-full max-w-lg mx-auto px-4 mb-10">
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
          </div>

          {/* Progress/Summaries Section */}
          <div className="w-full max-w-lg mx-auto px-4 mt-10">
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
            </div>
          </div>

        </>
      )}
    </main>
  )
}