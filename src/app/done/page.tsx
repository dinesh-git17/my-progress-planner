'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Done page component - celebrates meal logging completion
 * Clean implementation without notch extensions or complex gradients
 */
export default function DonePage() {
  const router = useRouter();
  const [contentReady, setContentReady] = useState(false);

  // Handle content timing for smooth entry animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Handle back button navigation
  const handleReturnHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <AnimatePresence>
        {contentReady && (
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-md mx-auto"
          >
            {/* Main Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <div className="relative flex flex-col items-center px-8 py-10 rounded-3xl shadow-xl bg-white/80 backdrop-blur-sm border border-white/60">
                {/* Background decoration */}
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-pink-50/40 via-purple-50/40 to-yellow-50/40 blur-xl" />

                {/* Animated Emoji */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.5,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="text-6xl mb-6"
                  role="img"
                  aria-label="Cherry blossom"
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

                {/* Celebration Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="text-center mb-8 space-y-2"
                >
                  <p className="text-lg font-semibold leading-relaxed text-gray-800">
                    You did so well today, love.
                  </p>
                  <p className="text-base leading-relaxed text-gray-700">
                    I'm proud of you for nourishing yourself—one meal at a time.
                  </p>
                  <p className="text-base leading-relaxed text-gray-700">
                    Can't wait to cheer you on tomorrow! 💖
                  </p>
                </motion.div>

                {/* Return Home Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReturnHome}
                  className="
                    w-full py-4 rounded-2xl 
                    bg-gradient-to-r from-pink-400 via-pink-500 to-purple-500
                    text-white text-xl font-bold shadow-lg 
                    transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-pink-300/40
                    hover:shadow-xl
                  "
                  type="button"
                  aria-label="Return to home page"
                >
                  Return Home 🏠
                </motion.button>

                {/* Decorative Elements */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.4, scale: 1 }}
                  transition={{ duration: 1.5, delay: 1.5 }}
                  className="absolute top-4 right-4 text-pink-300 text-xl"
                  role="img"
                  aria-label="Sparkles"
                >
                  ✨
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.4, scale: 1 }}
                  transition={{ duration: 1.5, delay: 1.7 }}
                  className="absolute bottom-4 left-4 text-yellow-300 text-lg"
                  role="img"
                  aria-label="Star"
                >
                  💫
                </motion.div>

                {/* Additional floating decorations */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.3, y: 0 }}
                  transition={{
                    duration: 2,
                    delay: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }}
                  className="absolute top-12 left-6 text-purple-300 text-sm"
                  role="img"
                  aria-label="Heart"
                >
                  💜
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0.3, y: 0 }}
                  transition={{
                    duration: 2.5,
                    delay: 2.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }}
                  className="absolute bottom-12 right-6 text-pink-300 text-sm"
                  role="img"
                  aria-label="Flower"
                >
                  🌺
                </motion.div>
              </div>
            </motion.div>

            {/* Success Stats (Optional Enhancement) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-gray-500 font-medium">
                Another day of self-care completed! 🎉
              </p>
            </motion.div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
