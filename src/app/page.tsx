'use client'

import { PushSubscriptionButton } from '@/components/PushSubscriptionButton'
import { getOrCreateUserId } from '@/utils/mealLog'
import { getUserName, saveUserName } from '@/utils/user'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const mealLabels = [
  { meal: 'breakfast', emoji: '🍳', label: 'Log Breakfast' },
  { meal: 'lunch', emoji: '🥪', label: 'Log Lunch' },
  { meal: 'dinner', emoji: '🍜', label: 'Log Dinner' },
]

export default function Home() {
  const [quote, setQuote] = useState('')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [askName, setAskName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [showNameSaved, setShowNameSaved] = useState(false)
  const [loggedMeals, setLoggedMeals] = useState<string[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationsEnabled(Notification.permission === 'granted')
    }

    const init = async () => {
      const user_id = getOrCreateUserId()
      const existingName = await getUserName(user_id)

      if (!existingName) {
        setAskName(true)
      } else {
        setName(existingName)
        fetchQuote(existingName) // ✅ pass name correctly
        fetchLoggedMeals(user_id)
      }
    }
    init()
  }, [])

  const fetchQuote = (nameToUse: string) => {
    setLoading(true)
    fetch(`/api/gpt/quote?ts=${Date.now()}&name=${encodeURIComponent(nameToUse)}`)
      .then((res) => res.json())
      .then((data) => setQuote(data.quote))
      .finally(() => setLoading(false))
  }

  const fetchLoggedMeals = async (user_id: string) => {
    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch(`/api/meals/check?user_id=${user_id}&date=${today}`)
    const data = await res.json()
    if (data?.mealLog) {
      const meals = []
      if (data.mealLog.breakfast) meals.push('breakfast')
      if (data.mealLog.lunch) meals.push('lunch')
      if (data.mealLog.dinner) meals.push('dinner')
      setLoggedMeals(meals)
    }
  }

  const handleSaveName = async () => {
    if (!tempName.trim()) return
    const user_id = getOrCreateUserId()
    const success = await saveUserName(user_id, tempName.trim())
    if (success) {
      setName(tempName.trim())
      setShowNameSaved(true)
      setTimeout(() => {
        setAskName(false)
        fetchQuote(tempName.trim()) // ✅ now passes correct name
        fetchLoggedMeals(user_id)
      }, 3000)
    }
  }

  return (
    <main className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-[#f6d365] to-[#fda085] px-2">
      <motion.section
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-xs p-4 flex flex-col items-center justify-center rounded-3xl shadow-2xl shadow-orange-200/30 bg-white/60 backdrop-blur-2xl"
      >
        {/* NAME FLOW */}
        {askName && !showNameSaved ? (
          <>
            <p className="text-center text-lg font-semibold text-pink-600 mb-3">
              Hi love 🥺 Can I know your name just once? <br />
              I want to remember your progress 💖
            </p>
            <input
              className="w-full px-4 py-2 mb-3 rounded-xl border border-orange-300 bg-white text-gray-700 text-base shadow-inner focus:ring-2 focus:ring-orange-300 outline-none transition"
              placeholder="Your sweet name…"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
            <button
              onClick={handleSaveName}
              className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 text-white font-semibold shadow-md transition hover:scale-105"
            >
              Save My Name 💌
            </button>
          </>
        ) : askName && showNameSaved ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-pink-600 text-lg font-medium"
          >
            Yay! I saved your name, my love 💖 <br />
            I’m so excited to see your progress! 🌟
          </motion.div>
        ) : (
          <>
            {/* Motivational Quote */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-center mb-4 min-h-[54px] flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    className="animate-pulse text-base font-normal italic text-gray-400 drop-shadow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Loading motivation…
                  </motion.span>
                ) : (
                  <motion.span
                    key="quote"
                    className="text-base font-normal italic text-gray-700 drop-shadow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {quote}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Push Button if not granted */}
            {!notificationsEnabled && <PushSubscriptionButton />}

            {/* Meal Buttons */}
            <div className="w-full flex flex-col gap-3 mt-2">
              {mealLabels.map(({ meal, emoji, label }) => {
                const isLogged = loggedMeals.includes(meal)
                return (
                  <motion.button
                    key={meal}
                    whileHover={{ scale: isLogged ? 1 : 1.025 }}
                    whileTap={{ scale: isLogged ? 1 : 0.98 }}
                    disabled={isLogged}
                    transition={{ type: 'spring', stiffness: 380, damping: 17 }}
                    className={`w-full py-2.5 px-4 rounded-full text-base font-semibold shadow-lg transition-all duration-200 ${
                      isLogged
                        ? 'bg-gray-300/50 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-400 to-yellow-400 text-white focus:outline-none focus:ring-2 focus:ring-pink-300/40'
                    }`}
                    type="button"
                    onClick={() => !isLogged && router.push(`/${meal}`)}
                  >
                    {emoji} {isLogged ? `${meal[0].toUpperCase() + meal.slice(1)} logged ✅` : label}
                  </motion.button>
                )
              })}
            </div>
          </>
        )}
      </motion.section>
    </main>
  )
}
