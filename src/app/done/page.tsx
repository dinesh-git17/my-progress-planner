'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DonePage() {
  const router = useRouter()
  const [contentReady, setContentReady] = useState(false)

  // Handle content timing to match homepage
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence>
        {contentReady && (
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="
              min-h-[100dvh] w-full h-[100dvh] overflow-hidden
              relative flex items-center justify-center
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

            {/* Main Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-md mx-auto px-4"
            >
              <div className="
                relative flex flex-col items-center px-8 py-10 rounded-3xl shadow-2xl shadow-pink-100/40
                bg-gradient-to-tr from-[#fff3fc] via-[#f9f3fd] to-[#e7ffe7] border border-white/60
                before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-3xl
                before:bg-gradient-to-tr before:from-pink-200/40 before:via-purple-100/40 before:to-yellow-100/40
                before:blur-2xl
              ">
                {/* Animated Emoji */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 1, 
                    delay: 0.5, 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 15 
                  }}
                  className="text-6xl mb-6"
                >
                  🌸
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="text-3xl font-bold text-pink-600 mb-4 text-center tracking-tight"
                >
                  All Done!
                </motion.h1>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="text-center mb-8"
                >
                  <p className="text-lg font-semibold leading-relaxed text-gray-800 mb-2">
                    You did so well today, love.
                  </p>
                  <p className="text-base leading-relaxed text-gray-700">
                    I'm proud of you for nourishing yourself—one meal at a time.
                  </p>
                  <p className="text-base leading-relaxed text-gray-700 mt-2">
                    Can't wait to cheer you on tomorrow! 💖
                  </p>
                </motion.div>

                {/* Return Home Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/')}
                  className="
                    w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-yellow-400
                    text-white text-xl font-bold shadow-lg transition 
                    hover:scale-[1.02] active:scale-[0.98]
                    tracking-wide focus:outline-none focus:ring-2 focus:ring-pink-300/40
                  "
                  type="button"
                >
                  Return Home 🏠
                </motion.button>

                {/* Subtle decorative elements */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ duration: 2, delay: 1.5 }}
                  className="absolute top-4 right-4 text-pink-200 text-xl"
                >
                  ✨
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ duration: 2, delay: 1.7 }}
                  className="absolute bottom-4 left-4 text-yellow-200 text-lg"
                >
                  💫
                </motion.div>
              </div>
            </motion.div>
          </motion.main>
        )}
      </AnimatePresence>
    </>
  )
}