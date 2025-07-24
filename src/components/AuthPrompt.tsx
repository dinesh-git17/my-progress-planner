// src/components/AuthPrompt.tsx

'use client';

import { motion } from 'framer-motion';
import { DM_Sans, Dancing_Script, Manrope } from 'next/font/google';
import Image from 'next/image';
import React, { useState } from 'react';
import { FaArrowRight, FaLock, FaUser } from 'react-icons/fa';

// ============================================================================
// FONT CONFIGURATION - Matching project patterns
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' });
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

// ============================================================================
// CONSTANTS - Taller header dimensions (~20% viewport)
// ============================================================================
const UI_CONSTANTS = {
  BANNER_CURVE_HEIGHT: 110, // Increased from 92
  BANNER_TOP_PADDING: 35, // Increased from 29
  BANNER_BOTTOM_PADDING: 28, // Increased from 23
  BANNER_TEXT_HEIGHT: 85, // Increased from 69
} as const;

const BANNER_TOTAL_HEIGHT =
  UI_CONSTANTS.BANNER_CURVE_HEIGHT +
  UI_CONSTANTS.BANNER_TOP_PADDING +
  UI_CONSTANTS.BANNER_BOTTOM_PADDING +
  UI_CONSTANTS.BANNER_TEXT_HEIGHT;

// ============================================================================
// SVG WAVE COMPONENT - Modern amber gradient
// ============================================================================
function WaveHeader() {
  return (
    <header
      className="fixed top-0 left-0 w-full z-30"
      style={{
        background: 'transparent',
      }}
    >
      {/* SVG that creates the entire header shape with wavy bottom */}
      <svg
        className="w-full"
        viewBox="0 0 500 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          height: `clamp(180px, 35vh, 320px)`,
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
            <stop offset="0%" stopColor="#db2777" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>

        {/* Wave path */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#authHeaderGradient)"
        />
      </svg>

      {/* App title overlay - perfectly centered */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          top: `env(safe-area-inset-top)`,
          height: `clamp(180px, 35vh, 320px)`,
          paddingBottom: `${UI_CONSTANTS.BANNER_CURVE_HEIGHT + 40}px`,
        }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <h1
            className={`font-bold tracking-wide ${dancingScript.className}`}
            style={{
              fontSize: 'clamp(3rem, 15vw, 5rem)',
              color: '#FFFFFF',
            }}
          >
            Sweethearty
          </h1>
          <p
            className={`font-medium tracking-wide ${dmSans.className} -mt-4`}
            style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
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
      className={`fixed inset-0 z-50 min-h-screen ${dmSans.className}`}
      style={
        {
          '--header-h': `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top))`,
          background: '#F9FAFB',
        } as React.CSSProperties
      }
    >
      {/* Wave Header */}
      <WaveHeader />

      {/* Main Content Container - with breathing room from taller header */}
      <div
        className="flex flex-col"
        style={{
          position: 'absolute',
          top: `calc(clamp(180px, 35vh, 320px) + env(safe-area-inset-top) - 6rem)`,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          left: 'clamp(1rem, 5vw, 2rem)',
          right: 'clamp(1rem, 5vw, 2rem)',
          minHeight: '0',
        }}
      >
        {/* Flexible spacer - top */}
        <div className="flex-1 min-h-4" />

        {/* Main content block - flexible but constrained */}
        <div className="flex-shrink-0 max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="space-y-6"
          >
            {/* Modern elevated card */}
            <div className="relative">
              {/* Card background with modern elevation */}
              <div
                className="absolute inset-0 rounded-3xl border"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#E5E7EB',
                  boxShadow:
                    '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
              />

              {/* Card content - responsive spacing */}
              <div
                className="relative space-y-6 sm:space-y-8"
                style={{ padding: 'clamp(1.5rem, 4vw, 2rem)' }}
              >
                {/* Welcome Section */}
                <div className="text-center space-y-4 sm:space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="mx-auto"
                    style={{
                      width: 'clamp(96px, 35vw, 200px)',
                      height: 'clamp(96px, 35vw, 200px)',
                    }}
                  >
                    {!iconError ? (
                      <Image
                        src="/icons/auth-icon.png"
                        alt="Sweethearty app icon"
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                        onError={() => setIconError(true)}
                        priority
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                          background:
                            'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                        }}
                      >
                        <FaLock
                          className="text-white"
                          style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}
                        />
                      </div>
                    )}
                  </motion.div>

                  <div className="space-y-2 sm:space-y-3">
                    <h2
                      className={`font-bold tracking-tight ${manrope.className}`}
                      style={{
                        color: '#1E1E1E',
                        lineHeight: '1.2',
                        fontSize: 'clamp(1.5rem, 6vw, 1.875rem)',
                      }}
                    >
                      Meals Made Mindful
                    </h2>
                    <p
                      className={`leading-relaxed ${dmSans.className}`}
                      style={{
                        color: '#2B2B2B',
                        fontSize: 'clamp(0.875rem, 4vw, 1.125rem)',
                      }}
                    >
                      AI that actually cares how you eat
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Primary Login Button - Rich amber gradient */}
                  <motion.button
                    onClick={handleLogin}
                    disabled={isLoading !== null}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      group w-full rounded-2xl font-semibold shadow-lg
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      transition-all duration-300 flex items-center justify-center gap-3
                    "
                    style={{
                      background:
                        'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.25)',
                      minHeight: 'max(44px, 11vw)',
                      maxHeight: '56px',
                      padding: 'clamp(0.75rem, 3vw, 1rem) 1.5rem',
                      fontSize: 'clamp(1rem, 4vw, 1.125rem)',
                    }}
                    onMouseEnter={(e) => {
                      if (isLoading === null) {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #db2777 0%, #ec4899 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 8px 25px 0 rgba(236, 72, 153, 0.35)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isLoading === null) {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 4px 14px 0 rgba(236, 72, 153, 0.25)';
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '3px solid #ec4899';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                    aria-label="Sign in to your account"
                  >
                    {isLoading === 'login' ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        <FaLock
                          style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}
                        />
                        <span>Sign In</span>
                        <FaArrowRight
                          className="group-hover:translate-x-1 transition-transform"
                          style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}
                        />
                      </>
                    )}
                  </motion.button>

                  {/* Sign-in benefits tagline */}
                  <p
                    className={`text-center leading-relaxed px-2 ${dmSans.className}`}
                    style={{
                      color: '#4B5563',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    }}
                  >
                    Keep your meals synced across all your devices
                  </p>

                  {/* Subtle separator */}
                  <div className="relative py-2">
                    <div
                      className="absolute inset-0 flex items-center"
                      aria-hidden="true"
                    >
                      <div
                        className="w-full border-t"
                        style={{ borderColor: '#D1D5DB' }}
                      />
                    </div>
                    <div className="relative flex justify-center">
                      <span
                        className={`px-4 font-medium ${dmSans.className}`}
                        style={{
                          background: '#FFFFFF',
                          color: '#6B7280',
                          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                        }}
                      >
                        or
                      </span>
                    </div>
                  </div>

                  {/* Secondary Guest Button - Outlined style */}
                  <motion.button
                    onClick={handleGuest}
                    disabled={isLoading !== null}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="
                      group w-full rounded-xl font-medium
                      border-2 transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      flex items-center justify-center gap-2
                    "
                    style={{
                      borderColor: '#D1D5DB',
                      background: 'transparent',
                      color: '#ec4899',
                      minHeight: 'max(44px, 10vw)',
                      maxHeight: '52px',
                      padding: 'clamp(0.625rem, 2.5vw, 0.875rem) 1.25rem',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                    }}
                    onMouseEnter={(e) => {
                      if (isLoading === null) {
                        e.currentTarget.style.borderColor = '#ec4899';
                        e.currentTarget.style.background =
                          'rgba(236, 72, 153, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isLoading === null) {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid #ec4899';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                    aria-label="Continue as guest without signing in"
                  >
                    {isLoading === 'guest' ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{
                            borderColor: 'rgba(236, 72, 153, 0.3)',
                            borderTopColor: '#ec4899',
                          }}
                        />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <>
                        <FaUser
                          style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}
                        />
                        <span>Continue as Guest</span>
                        <FaArrowRight
                          className="group-hover:translate-x-0.5 transition-transform"
                          style={{
                            fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                          }}
                        />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Bottom tagline with better contrast */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className={`text-center leading-relaxed flex-shrink-0 ${dmSans.className}`}
              style={{
                color: '#6B7280',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
              }}
            >
              AI-powered meal companion
            </motion.p>
          </motion.div>
        </div>

        {/* Flexible spacer - bottom */}
        <div className="flex-1 min-h-4" />
      </div>
    </div>
  );
}
