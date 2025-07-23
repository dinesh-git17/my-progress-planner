// src/components/AuthPrompt.tsx

'use client';

import { motion } from 'framer-motion';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import Image from 'next/image';
import React, { useState } from 'react';
import { FaArrowRight, FaLock, FaUser } from 'react-icons/fa';

// ============================================================================
// FONT CONFIGURATION - Matching project patterns
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' });

// ============================================================================
// CONSTANTS - Increased header height
// ============================================================================
const UI_CONSTANTS = {
  BANNER_CURVE_HEIGHT: 92, // Increased from 80 (+15%)
  BANNER_TOP_PADDING: 29, // Increased from 25 (+16%)
  BANNER_BOTTOM_PADDING: 23, // Increased from 20 (+15%)
  BANNER_TEXT_HEIGHT: 69, // Increased from 60 (+15%)
} as const;

const BANNER_TOTAL_HEIGHT =
  UI_CONSTANTS.BANNER_CURVE_HEIGHT +
  UI_CONSTANTS.BANNER_TOP_PADDING +
  UI_CONSTANTS.BANNER_BOTTOM_PADDING +
  UI_CONSTANTS.BANNER_TEXT_HEIGHT;

// ============================================================================
// SVG WAVE COMPONENT - Matching summaries page structure with CSS variable
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
            <stop offset="0%" stopColor="#be185d" />
            <stop offset="50%" stopColor="#a21caf" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        {/* Single path with 2-3 large wave peaks - matching summaries pattern */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#authHeaderGradient)"
        />
      </svg>

      {/* App title overlay - perfectly centered vertically */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          top: `env(safe-area-inset-top)`,
          height: `${BANNER_TOTAL_HEIGHT}px`,
          paddingBottom: `${UI_CONSTANTS.BANNER_CURVE_HEIGHT}px`,
          minHeight: 'clamp(120px, 18vh, 220px)',
        }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-1">
            <h1
              className={`text-white font-bold tracking-wide ${dancingScript.className}`}
              style={{ fontSize: 'clamp(3rem, 10vw, 5rem)' }}
            >
              Sweethearty
            </h1>
          </div>
          <p
            className={`text-white/90 font-medium tracking-wide ${dmSans.className}`}
            style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)' }}
          >
            Your loving meal companion
          </p>
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
  const [iconError, setIconError] = useState(false);

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
      className={`fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 ${dmSans.className}`}
      style={
        {
          '--header-h': `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top))`,
        } as React.CSSProperties
      }
    >
      {/* Wave Header */}
      <WaveHeader />

      {/* Main Content Container - fully responsive with CSS variables and safe areas */}
      <div
        className="w-full flex flex-col min-h-0"
        style={{
          marginTop: 'calc(var(--header-h) + 0.75rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          paddingLeft: 'clamp(1rem, 5vw, 2rem)',
          paddingRight: 'clamp(1rem, 5vw, 2rem)',
          minHeight:
            'calc(100vh - var(--header-h) - env(safe-area-inset-bottom, 0px) - 1.75rem)',
        }}
      >
        {/* Centered content area with proper constraints */}
        <div className="flex-1 flex items-center justify-center max-w-md mx-auto w-full min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="w-full flex flex-col min-h-0"
          >
            {/* Glassmorphic Card - responsive sizing */}
            <div className="relative flex-shrink-0">
              {/* Card background with enhanced glass effect */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl" />

              {/* Card content - reduced spacing for better fit */}
              <div className="relative p-6 sm:p-8 space-y-8 sm:space-y-10">
                {/* Welcome Section */}
                <div className="text-center space-y-4 sm:space-y-5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto"
                  >
                    {!iconError ? (
                      <Image
                        src="/icons/auth-icon.png"
                        alt="Sweethearty app icon"
                        width={96}
                        height={96}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl shadow-lg"
                        onError={() => setIconError(true)}
                        priority
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <FaLock className="text-white text-xl sm:text-2xl" />
                      </div>
                    )}
                  </motion.div>

                  <div className="space-y-2 sm:space-y-3">
                    <h2
                      className={`text-xl sm:text-2xl font-bold text-gray-800 ${dmSans.className}`}
                      style={{ letterSpacing: '-0.025em', lineHeight: '1.2' }}
                    >
                      Welcome Back
                    </h2>
                    <p
                      className={`text-gray-600 text-sm sm:text-base leading-relaxed ${dmSans.className}`}
                    >
                      Track your meals with love and support
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4 sm:space-y-5">
                  {/* Primary Login Button */}
                  <motion.button
                    onClick={handleLogin}
                    disabled={isLoading !== null}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      group w-full py-3 sm:py-4 px-6 rounded-2xl
                      bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600
                      text-white font-semibold text-base sm:text-lg shadow-xl
                      hover:shadow-2xl hover:from-pink-600 hover:to-purple-700
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      focus:outline-none focus:ring-4 focus:ring-pink-300/50
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
                        <FaLock className="text-base sm:text-lg" />
                        <span>Sign In</span>
                        <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>

                  {/* Sign-in Tagline - Updated copy */}
                  <p
                    className={`text-xs sm:text-sm text-gray-500 text-center leading-relaxed px-2 ${dmSans.className}`}
                  >
                    Keep your meals synced across all your devices
                  </p>

                  {/* Divider */}
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <span className="text-sm text-gray-500 font-medium px-2">
                      or
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  </div>

                  {/* Secondary Guest Button - Smaller and de-emphasized */}
                  <motion.button
                    onClick={handleGuest}
                    disabled={isLoading !== null}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="
                      group w-full py-2.5 sm:py-3 px-5 rounded-xl
                      bg-white/60 backdrop-blur-sm border border-gray-300/60
                      text-gray-700 font-medium text-sm sm:text-base
                      hover:bg-white/80 hover:border-gray-400/60 hover:shadow-sm
                      focus:bg-white/80 focus:border-gray-400/60
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      focus:outline-none focus:ring-2 focus:ring-gray-400/40
                      transition-all duration-300
                      flex items-center justify-center gap-2
                    "
                    aria-label="Continue as guest without signing in"
                  >
                    {isLoading === 'guest' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <>
                        <FaUser className="text-sm" />
                        <span>Continue as Guest</span>
                        <FaArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Error state placeholder - compact */}
                <div className="min-h-[20px] sm:min-h-[24px] flex items-center justify-center">
                  {/* Error messages would go here if needed */}
                </div>
              </div>
            </div>

            {/* Bottom subtitle - responsive with safe area awareness */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 leading-relaxed flex-shrink-0"
              style={{
                marginBottom: 'calc(env(safe-area-inset-bottom, 0px) * 0.5)',
              }}
            >
              <span className="hidden sm:inline">
                Your personal nutrition companion with AI-powered insights
              </span>
              <span className="sm:hidden">AI-powered meal companion</span>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
