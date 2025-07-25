// src/components/MobileInstallPrompt.tsx
'use client';

import { PWAInstaller } from '@/utils/sw-utils';
import { AnimatePresence, motion } from 'framer-motion';
import { DM_Sans } from 'next/font/google';
import { useEffect, useState } from 'react';
import { DiAndroid, DiApple } from 'react-icons/di';
import { FiBell, FiSmartphone, FiZap } from 'react-icons/fi';

// ============================================================================
// FONT CONFIGURATION - Matching project patterns
// ============================================================================
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

// ============================================================================
// COLOR TOKENS - Matching AuthPrompt button
// ============================================================================
const COLOR_TOKENS = {
  // Primary CTA - matches AuthPrompt "Sign In" button exactly
  primaryGradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
  primaryHover: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
  primaryShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.25)',
  primaryShadowHover: '0 8px 25px 0 rgba(236, 72, 153, 0.35)',

  // Text colors
  headingText: '#1E1E1E',
  bodyText: '#2B2B2B',
  mutedText: '#6B7280',

  // UI elements
  stepBackground: '#FDF2F8', // Pink-50
  stepText: '#EC4899', // Pink-500
  borderColor: '#F3F4F6', // Gray-100
} as const;

// ============================================================================
// INTERFACE & PROPS
// ============================================================================
interface MobileInstallPromptProps {
  onDismiss?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MobileInstallPrompt({
  onDismiss,
}: MobileInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [browserName, setBrowserName] = useState('');

  useEffect(() => {
    // Check if we should show the prompt
    const shouldShowPrompt = () => {
      // Don't show if already installed
      if (PWAInstaller.isInstalled()) return false;

      // Only show on mobile touch devices
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      return isMobile && hasTouch;
    };

    // Detect device and browser
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroidDevice = /Android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Detect browser for specific instructions
    if (isIOSDevice) {
      if (/Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent)) {
        setBrowserName('Safari');
      } else if (/CriOS/.test(userAgent)) {
        setBrowserName('Chrome');
      } else if (/FxiOS/.test(userAgent)) {
        setBrowserName('Firefox');
      } else {
        setBrowserName('Browser');
      }
    } else if (isAndroidDevice) {
      if (/Chrome/.test(userAgent) && !/EdgA/.test(userAgent)) {
        setBrowserName('Chrome');
      } else if (/Firefox/.test(userAgent)) {
        setBrowserName('Firefox');
      } else if (/EdgA/.test(userAgent)) {
        setBrowserName('Edge');
      } else {
        setBrowserName('Browser');
      }
    }

    // Show prompt after a delay to let the page load
    if (shouldShowPrompt()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
        sessionStorage.setItem('mobile_install_showing', 'true');
      }, 1000); // Show after 1 second

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.removeItem('mobile_install_showing');
    onDismiss?.();
  };

  const handleInstall = async () => {
    if (isAndroid && PWAInstaller.canInstall()) {
      // Try native installation for Android Chrome
      const success = await PWAInstaller.promptInstall();
      if (success) {
        setShowPrompt(false);
        sessionStorage.removeItem('mobile_install_showing');
        return;
      }
    }

    // Keep the prompt open to show manual instructions
    // User can dismiss it after following the steps
  };

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        icon: DiApple,
        title: 'Add to Home Screen',
        steps: [
          `Tap the share button ${browserName === 'Safari' ? '' : ''} in your ${browserName}`,
          'Select "Add to Home Screen"',
          'Tap "Add" to install the app',
        ],
      };
    } else if (isAndroid) {
      return {
        icon: DiAndroid,
        title: 'Install App',
        steps: PWAInstaller.canInstall()
          ? ['Tap "Install" below to add to your home screen']
          : [
              'Tap the menu button in your browser',
              'Select "Add to Home screen" or "Install"',
              'Tap "Add" to install the app',
            ],
      };
    }

    return {
      icon: FiSmartphone,
      title: 'Install App',
      steps: [
        "Use your browser's menu to add this app to your home screen",
        'Look for "Add to Home Screen" or "Install" options',
      ],
    };
  };

  const instructions = getInstallInstructions();
  const IconComponent = instructions.icon;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-5000"
            onClick={handleDismiss}
            style={{ touchAction: 'none' }}
          />

          {/* Install Prompt Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.1,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm"
              style={{ padding: 'clamp(1.5rem, 5vw, 2rem)' }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl"
                  style={{
                    background: COLOR_TOKENS.primaryGradient,
                    boxShadow: COLOR_TOKENS.primaryShadow,
                  }}
                >
                  <IconComponent
                    className="text-white"
                    size={clampSize(24, 32)}
                    aria-hidden="true"
                  />
                </motion.div>

                <h2
                  className={`font-bold tracking-tight mb-3 ${dmSans.className}`}
                  style={{
                    color: COLOR_TOKENS.headingText,
                    fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                    lineHeight: '1.2',
                  }}
                >
                  Get the Sweethearty App!
                </h2>

                <p
                  className={`leading-relaxed ${dmSans.className}`}
                  style={{
                    color: COLOR_TOKENS.bodyText,
                    fontSize: 'clamp(0.875rem, 4vw, 1rem)',
                  }}
                >
                  Install our app for a better experience with offline access,
                  notifications, and faster loading.
                </p>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <h3
                  className={`font-semibold mb-4 ${dmSans.className}`}
                  style={{
                    color: COLOR_TOKENS.headingText,
                    fontSize: 'clamp(1rem, 4.5vw, 1.125rem)',
                  }}
                >
                  {instructions.title}
                </h3>

                <ol className="space-y-3">
                  {instructions.steps.map((step, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      className="flex items-start gap-3"
                    >
                      <span
                        className="flex items-center justify-center rounded-full font-semibold flex-shrink-0 mt-0.5"
                        style={{
                          width: 'clamp(20px, 5vw, 24px)',
                          height: 'clamp(20px, 5vw, 24px)',
                          background: COLOR_TOKENS.stepBackground,
                          color: COLOR_TOKENS.stepText,
                          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`leading-relaxed ${dmSans.className}`}
                        style={{
                          color: COLOR_TOKENS.bodyText,
                          fontSize: 'clamp(0.875rem, 3.5vw, 0.9375rem)',
                        }}
                      >
                        {step}
                      </span>
                    </motion.li>
                  ))}
                </ol>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mb-4">
                {isAndroid && PWAInstaller.canInstall() && (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInstall}
                    className={`flex-1 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${dmSans.className}`}
                    style={{
                      background: COLOR_TOKENS.primaryGradient,
                      color: '#FFFFFF',
                      boxShadow: COLOR_TOKENS.primaryShadow,
                      padding: 'clamp(0.75rem, 3vw, 1rem) 1.5rem',
                      fontSize: 'clamp(0.875rem, 4vw, 1rem)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        COLOR_TOKENS.primaryHover;
                      e.currentTarget.style.boxShadow =
                        COLOR_TOKENS.primaryShadowHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        COLOR_TOKENS.primaryGradient;
                      e.currentTarget.style.boxShadow =
                        COLOR_TOKENS.primaryShadow;
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '3px solid #ec4899';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                    aria-label="Install app now"
                  >
                    <FiZap size={clampSize(16, 18)} aria-hidden="true" />
                    Install Now
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleDismiss}
                  className={`rounded-xl font-semibold transition-all duration-300 border-2 ${dmSans.className} ${
                    isAndroid && PWAInstaller.canInstall()
                      ? 'flex-1 bg-transparent'
                      : 'w-full'
                  }`}
                  style={{
                    borderColor:
                      isAndroid && PWAInstaller.canInstall()
                        ? COLOR_TOKENS.borderColor
                        : '#ec4899',
                    background:
                      isAndroid && PWAInstaller.canInstall()
                        ? 'transparent'
                        : COLOR_TOKENS.primaryGradient,
                    color:
                      isAndroid && PWAInstaller.canInstall()
                        ? COLOR_TOKENS.mutedText
                        : '#FFFFFF',
                    padding: 'clamp(0.75rem, 3vw, 1rem) 1.5rem',
                    fontSize: 'clamp(0.875rem, 4vw, 1rem)',
                    boxShadow:
                      isAndroid && PWAInstaller.canInstall()
                        ? 'none'
                        : COLOR_TOKENS.primaryShadow,
                  }}
                  onMouseEnter={(e) => {
                    if (isAndroid && PWAInstaller.canInstall()) {
                      e.currentTarget.style.borderColor = '#ec4899';
                      e.currentTarget.style.background =
                        'rgba(236, 72, 153, 0.05)';
                    } else {
                      e.currentTarget.style.background =
                        COLOR_TOKENS.primaryHover;
                      e.currentTarget.style.boxShadow =
                        COLOR_TOKENS.primaryShadowHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isAndroid && PWAInstaller.canInstall()) {
                      e.currentTarget.style.borderColor =
                        COLOR_TOKENS.borderColor;
                      e.currentTarget.style.background = 'transparent';
                    } else {
                      e.currentTarget.style.background =
                        COLOR_TOKENS.primaryGradient;
                      e.currentTarget.style.boxShadow =
                        COLOR_TOKENS.primaryShadow;
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '2px solid #ec4899';
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                  aria-label={
                    isAndroid && PWAInstaller.canInstall()
                      ? 'Maybe later'
                      : 'Got it, dismiss this prompt'
                  }
                >
                  {isAndroid && PWAInstaller.canInstall()
                    ? 'Maybe Later'
                    : 'Got it!'}
                </motion.button>
              </div>

              {/* Benefits Grid */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="pt-4"
                style={{ borderTop: `1px solid ${COLOR_TOKENS.borderColor}` }}
              >
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="flex flex-col items-center">
                    <FiSmartphone
                      className="mb-2"
                      size={clampSize(18, 20)}
                      style={{ color: COLOR_TOKENS.stepText }}
                      aria-hidden="true"
                    />
                    <span
                      className={`${dmSans.className}`}
                      style={{
                        color: COLOR_TOKENS.mutedText,
                        fontSize: 'clamp(0.75rem, 3vw, 0.8125rem)',
                        fontWeight: '500',
                      }}
                    >
                      Home Screen
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <FiZap
                      className="mb-2"
                      size={clampSize(18, 20)}
                      style={{ color: COLOR_TOKENS.stepText }}
                      aria-hidden="true"
                    />
                    <span
                      className={`${dmSans.className}`}
                      style={{
                        color: COLOR_TOKENS.mutedText,
                        fontSize: 'clamp(0.75rem, 3vw, 0.8125rem)',
                        fontWeight: '500',
                      }}
                    >
                      Offline Access
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <FiBell
                      className="mb-2"
                      size={clampSize(18, 20)}
                      style={{ color: COLOR_TOKENS.stepText }}
                      aria-hidden="true"
                    />
                    <span
                      className={`${dmSans.className}`}
                      style={{
                        color: COLOR_TOKENS.mutedText,
                        fontSize: 'clamp(0.75rem, 3vw, 0.8125rem)',
                        fontWeight: '500',
                      }}
                    >
                      Notifications
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Responsive size clamping utility for consistent icon sizing
 */
function clampSize(min: number, max: number): number {
  const viewport = typeof window !== 'undefined' ? window.innerWidth : 375;
  const factor = Math.min(Math.max(viewport / 375, 0.8), 1.2);
  return Math.round(min + (max - min) * factor);
}
