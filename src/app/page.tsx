'use client'

import AskForPushPermission from '@/components/AskForPushPermission'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [quote, setQuote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Add cache-busting parameter to always fetch a new quote
    fetch('/api/gpt/quote?ts=' + Date.now())
      .then((res) => res.json())
      .then((data) => setQuote(data.quote))
      .finally(() => setLoading(false))
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

        {/* Ask for push permission */}
        <AskForPushPermission />

        {/* Animated CTA Button */}
        <Link href="/log" className="w-11/12 mx-auto">
          <motion.button
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 17 }}
            className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 text-white text-base font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-300/40 transition-all duration-200 mt-2"
            type="button"
          >
            Log your meal&nbsp;🍽️
          </motion.button>
        </Link>
      </motion.section>
    </main>
  )
}
