'use client'

import { PushSubscriptionButton } from '@/components/PushSubscriptionButton'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const mealLabels = [
  { meal: 'breakfast', emoji: '🍳', label: 'Log Breakfast' },
  { meal: 'lunch', emoji: '🥪', label: 'Log Lunch' },
  { meal: 'dinner', emoji: '🍜', label: 'Log Dinner' }
]

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('user_id')
  if (!id) {
    const uuid = crypto?.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    localStorage.setItem('user_id', uuid)
    id = uuid
  }
  return id
}

export default function Home() {
  const [quote, setQuote] = useState('')
  const [loading, setLoading] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [loggedMeals, setLoggedMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false
  })

  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    fetch('/api/gpt/quote?ts=' + Date.now())
      .then(res => res.json())
      .then(data => setQuote(data.quote))
      .finally(() => setLoading(false))

    if (Notification?.permission === 'granted') {
      setNotificationsEnabled(true)
    }

    const user_id = getOrCreateUserId()
    const today = new Date().toISOString().slice(0, 10)

    fetch(`/api/meals/check?user_id=${user_id}&date=${today}`)
      .then(res => res.json())
      .then(data => {
        if (data.mealLog) {
          setLoggedMeals({
            breakfast: !!data.mealLog.breakfast,
            lunch: !!data.mealLog.lunch,
            dinner: !!data.mealLog.dinner
          })
        }
      })
  }, [])

  return (
    <main className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-[#f6d365] to-[#fda085] px-2">
      <motion.section
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-xs p-4 flex flex-col items-center justify-center rounded-3xl shadow-2xl shadow-orange-200/30 bg-white/60 backdrop-blur-2xl"
      >
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

        {/* Meal Selection Buttons */}
        <div className="w-full flex flex-col gap-3 mt-2">
          {!notificationsEnabled && <PushSubscriptionButton />}
          {mealLabels.map(({ meal, emoji, label }) => {
            const isLogged = loggedMeals[meal as 'breakfast' | 'lunch' | 'dinner']
            return (
              <motion.button
                key={meal}
                whileHover={{ scale: isLogged ? 1 : 1.025 }}
                whileTap={{ scale: isLogged ? 1 : 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 17 }}
                disabled={isLogged}
                className={`w-full py-2.5 px-4 rounded-full shadow-lg transition-all duration-200 font-semibold text-base ${
                  isLogged
                    ? 'bg-green-100 text-green-800 cursor-default'
                    : 'bg-gradient-to-r from-pink-400 to-yellow-400 text-white hover:scale-105'
                }`}
                type="button"
                onClick={() => router.push(`/${meal}`)}
              >
                {isLogged ? `✅ ${emoji} ${meal.charAt(0).toUpperCase() + meal.slice(1)} Logged` : `${emoji} ${label}`}
              </motion.button>
            )
          })}
        </div>
      </motion.section>
    </main>
  )
}
