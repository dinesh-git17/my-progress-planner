// src/components/AuthPrompt.tsx

'use client';

import { motion } from 'framer-motion';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useState } from 'react';
import { FaArrowRight, FaHeartbeat, FaLock, FaUser } from 'react-icons/fa';

// ============================================================================
// FONT CONFIGURATION - Matching project patterns
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' });

// ============================================================================
// CONSTANTS - Matching summaries page
// ============================================================================
const UI_CONSTANTS = {
  BANNER_CURVE_HEIGHT: 100,
  BANNER_TOP_PADDING: 35,
  BANNER_BOTTOM_PADDING: 28,
  BANNER_TEXT_HEIGHT: 80,
} as const;

const BANNER_TOTAL_HEIGHT =
  UI_CONSTANTS.BANNER_CURVE_HEIGHT +
  UI_CONSTANTS.BANNER_TOP_PADDING +
  UI_CONSTANTS.BANNER_BOTTOM_PADDING +
  UI_CONSTANTS.BANNER_TEXT_HEIGHT;

// ============================================================================
// SVG WAVE COMPONENT - Matching summaries page structure
// ============================================================================
function WaveHeader() {
  return (
    <header
      className="fixed top-0 left-0 w-full z-30"
      style={{
        background: 'transparent',
      }}
    >
      {/* SVG that creates the entire header shape with wavy bottom - EXTENDS INTO NOTCH */}
      <svg
        className="w-full"
        viewBox="0 0 500 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          height: `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top))`,
        }}
      >
        <defs>
          <linearGradient
            id="authHeaderGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor="#111111" />
            <stop offset="100%" stopColor="#1f1f1f" />
          </linearGradient>
        </defs>

        {/* Single path with 2-3 large wave peaks - matching summaries pattern */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#authHeaderGradient)"
        />
      </svg>

      {/* App title overlay - positioned like summaries page */}
      <div
        className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
        style={{
          paddingTop: `calc(${UI_CONSTANTS.BANNER_TOP_PADDING}px + env(safe-area-inset-top))`,
          paddingBottom: `${UI_CONSTANTS.BANNER_BOTTOM_PADDING}px`,
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <h1
            className={`text-white text-4xl font-bold tracking-wide ${dancingScript.className}`}
          >
            Sweethearty
          </h1>
          <FaHeartbeat className="text-white text-3xl animate-pulse" />
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface AuthPromptProps {
  onContinueAsGuest: () => void;
  onLogin: () => void;
}

export default function AuthPrompt({
  onContinueAsGuest,
  onLogin,
}: AuthPromptProps) {
  const [isLoading, setIsLoading] = useState<'login' | 'guest' | null>(null);

  const handleLogin = async () => {
    setIsLoading('login');
    try {
      await onLogin();
    } finally {
      setIsLoading(null);
    }
  };

  const handleGuest = async () => {
    setIsLoading('guest');
    try {
      await onContinueAsGuest();
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 ${dmSans.className}`}
    >
      {/* Wave Header */}
      <WaveHeader />

      {/* Main Content Container - positioned closer to header to avoid overflow */}
      <div
        className="w-full max-w-md mx-auto px-6"
        style={{
          marginTop: `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top) - 40px)`,
          paddingTop: '0.5rem',
          minHeight: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px - env(safe-area-inset-top))`,
        }}
      >
        <div className="flex items-center justify-center min-h-full">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="w-full"
          >
            {/* Glassmorphic Card */}
            <div className="relative">
              {/* Card background with glass effect */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl" />

              {/* Card content */}
              <div className="relative p-8 space-y-8">
                {/* Welcome Section */}
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <FaLock className="text-white text-2xl" />
                  </motion.div>

                  <div className="space-y-2">
                    <h2
                      className={`text-2xl font-bold text-gray-800 ${dancingScript.className}`}
                    >
                      Welcome Back
                    </h2>
                    <p className="text-gray-600 text-base leading-relaxed">
                      Track your meals with love and support
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4">
                  {/* Primary Login Button */}
                  <motion.button
                    onClick={handleLogin}
                    disabled={isLoading !== null}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      group w-full py-4 px-6 rounded-2xl
                      bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600
                      text-white font-semibold text-lg shadow-xl
                      hover:shadow-2xl hover:from-blue-700 hover:to-purple-700
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      focus:outline-none focus:ring-4 focus:ring-blue-300/50
                      transition-all duration-300
                      flex items-center justify-center gap-3
                    "
                    aria-label="Sign in to your account"
                  >
                    {isLoading === 'login' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        <FaLock className="text-lg" />
                        <span>Sign In</span>
                        <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>

                  {/* Divider */}
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <span className="text-sm text-gray-500 font-medium px-2">
                      or
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  </div>

                  {/* Secondary Guest Button */}
                  <motion.button
                    onClick={handleGuest}
                    disabled={isLoading !== null}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      group w-full py-4 px-6 rounded-2xl
                      bg-white/50 backdrop-blur-sm border-2 border-white/60
                      text-gray-700 font-semibold text-lg
                      hover:bg-white/70 hover:border-white/80 hover:shadow-lg
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      focus:outline-none focus:ring-4 focus:ring-gray-300/50
                      transition-all duration-300
                      flex items-center justify-center gap-3
                    "
                    aria-label="Continue as guest without signing in"
                  >
                    {isLoading === 'guest' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <>
                        <FaUser className="text-lg" />
                        <span>Continue as Guest</span>
                        <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Error state placeholder (can be extended) */}
                <div className="min-h-[24px] flex items-center justify-center">
                  {/* Error messages would go here if needed */}
                </div>
              </div>
            </div>

            {/* Bottom subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm text-gray-500 mt-6 leading-relaxed"
            >
              Your personal nutrition companion with AI-powered insights
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
