// src/components/UpdateNotification.tsx
'use client';

import { useCacheManager } from '@/hooks/useCacheManager';
import { getUserName } from '@/utils/userNameCache';
import { AnimatePresence, motion } from 'framer-motion';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useCallback, useEffect, useState } from 'react';
import { FaHeart, FaStar } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';
import { IoClose, IoRefresh, IoSparklesSharp } from 'react-icons/io5';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
});

// ============================================================================
// TYPES
// ============================================================================

interface UpdateNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Updates content - in production, this would be fetched from updates.md
const UPDATES_CONTENT = `# 🌟 What's New in Sweethearty

## Version 2.1.0 - Latest Updates

### ✨ Enhanced User Experience
- **Smoother Animations**: Improved transitions and micro-interactions throughout the app
- **Better Offline Support**: Enhanced caching for seamless offline meal logging
- **Faster Loading**: Optimized app shell for quicker startup times

### 🍽️ Meal Tracking Improvements
- **Smart Suggestions**: AI now provides more personalized meal recommendations
- **Enhanced Chat**: More natural and encouraging conversation flow
- **Better Memory**: The app now remembers your preferences better

### 🎨 Visual Refinements
- **Cleaner Interface**: Simplified layouts with better focus on content
- **Improved Accessibility**: Better contrast ratios and screen reader support
- **Modern Design**: Updated glassmorphic effects and smoother gradients

### 🔧 Performance & Reliability
- **Faster Sync**: Improved background data synchronization
- **Better Error Handling**: More graceful handling of network issues
- **Memory Optimization**: Reduced memory usage for better performance

### 🔒 Privacy & Security
- **Enhanced Data Protection**: Improved encryption for sensitive information
- **Better Session Management**: More secure authentication handling
- **Privacy Controls**: Enhanced user data management options`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple markdown parser for basic formatting
 */
function parseMarkdown(text: string): string {
  return (
    text
      // Headers
      .replace(
        /^### (.+)$/gm,
        '<h3 class="font-semibold text-gray-900 mt-4 mb-2 text-sm">$1</h3>',
      )
      .replace(
        /^## (.+)$/gm,
        '<h2 class="font-bold text-gray-900 mt-6 mb-3 text-base">$1</h2>',
      )
      .replace(
        /^# (.+)$/gm,
        '<h1 class="font-bold text-gray-900 mb-4 text-lg">$1</h1>',
      )
      // Bold text
      .replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-semibold text-gray-800">$1</strong>',
      )
      // List items
      .replace(
        /^- (.+)$/gm,
        '<li class="text-gray-700 text-xs leading-relaxed">$1</li>',
      )
      // Wrap lists
      .replace(/<li/g, '<ul class="space-y-1 ml-4 mb-3"><li')
      .replace(/li>(?!\s*<li)/g, 'li></ul>')
      // Line breaks
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UpdateNotification({
  isOpen,
  onClose,
}: UpdateNotificationProps) {
  // ========================================================================
  // STATE & HOOKS
  // ========================================================================

  const { forceUpdate, dismissUpdate, isLoading } = useCacheManager();
  const [userName, setUserName] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    const loadUserName = async () => {
      try {
        // Get user ID first (following your app's pattern)
        const { getCurrentSession, getLocalUserId } = await import(
          '@/utils/auth'
        );

        let userId: string | null = null;

        // Check for authenticated user first
        const session = await getCurrentSession();
        if (session?.user) {
          userId = session.user.id;
        } else {
          // Fall back to local user ID
          userId = getLocalUserId();
        }

        if (userId) {
          const name = await getUserName(userId);
          setUserName(name || 'love');
        } else {
          setUserName('love');
        }
      } catch (error) {
        console.warn('Failed to load user name:', error);
        setUserName('love');
      }
    };

    if (isOpen) {
      loadUserName();
    }
  }, [isOpen]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleClose = useCallback(() => {
    if (isUpdating) return; // Prevent closing during update

    dismissUpdate();
    onClose();
  }, [dismissUpdate, onClose, isUpdating]);

  const handleUpdateNow = useCallback(async () => {
    if (isUpdating) return;

    setIsUpdating(true);

    try {
      await forceUpdate();
      // forceUpdate will reload the page, so we won't reach here normally
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
      // Keep modal open to allow retry
    }
  }, [forceUpdate, isUpdating]);

  const handleMaybeLater = useCallback(() => {
    if (isUpdating) return;
    handleClose();
  }, [handleClose, isUpdating]);

  // ========================================================================
  // ANIMATION VARIANTS
  // ========================================================================

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      scale: 0.8,
      opacity: 0,
      y: 50,
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 300,
        duration: 0.4,
      },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: 50,
      transition: {
        duration: 0.3,
        ease: 'easeIn' as const,
      },
    },
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
              backdropFilter: 'saturate(120%) blur(12px)',
              WebkitBackdropFilter: 'saturate(120%) blur(12px)',
            }}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-md mx-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="update-modal-title"
            >
              {/* Main Content Card with Glassmorphism - Matching DoneModal */}
              <div
                className="relative flex flex-col px-6 py-8 rounded-3xl border border-white/40"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'saturate(180%) blur(20px)',
                  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  boxShadow:
                    '0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                }}
              >
                {/* Floating decorative icons - Matching DoneModal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.6, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                  className="absolute top-4 right-4 text-pink-400 text-lg"
                >
                  <GiSparkles />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  className="absolute bottom-4 left-4 text-purple-400 text-sm"
                >
                  <FaStar />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 0.7,
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.7,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className="absolute top-4 left-4 text-red-400 text-base"
                >
                  <FaHeart />
                </motion.div>

                {/* Close Button */}
                {!isUpdating && (
                  <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-white/20 transition-all duration-200"
                    aria-label="Close update notification"
                  >
                    <IoClose size={18} />
                  </button>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mb-3"
                  >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                      <IoSparklesSharp className="text-white text-xl" />
                    </div>
                  </motion.div>

                  <h2
                    id="update-modal-title"
                    className={`font-bold text-gray-900 mb-2 ${dancingScript.className}`}
                    style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
                  >
                    App Updated!
                  </h2>

                  <p
                    className={`text-gray-700 ${dmSans.className}`}
                    style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}
                  >
                    Hi {userName}, new features are available for you! 💕
                  </p>
                </div>

                {/* Updates Content */}
                <div className="mb-6 max-h-48 overflow-y-auto">
                  <div
                    className={`text-gray-700 ${dmSans.className}`}
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(UPDATES_CONTENT),
                    }}
                    style={{
                      fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                      lineHeight: '1.5',
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {/* Update Now Button - Primary */}
                  <motion.button
                    onClick={handleUpdateNow}
                    disabled={isUpdating}
                    whileHover={
                      !isUpdating ? { scale: 1.01, y: -1 } : undefined
                    }
                    whileTap={!isUpdating ? { scale: 0.99 } : undefined}
                    className={`
                      w-full rounded-xl font-semibold transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                      ${dmSans.className}
                    `}
                    style={{
                      background: isUpdating
                        ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                        : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                      color: '#FFFFFF',
                      minHeight: 'max(44px, 10vw)',
                      maxHeight: '52px',
                      padding: 'clamp(0.625rem, 2.5vw, 0.875rem) 1.25rem',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      boxShadow: isUpdating
                        ? '0 4px 14px 0 rgba(156, 163, 175, 0.25)'
                        : '0 4px 14px 0 rgba(236, 72, 153, 0.25)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isUpdating) {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #db2777 0%, #ec4899 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 8px 25px 0 rgba(236, 72, 153, 0.35)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isUpdating) {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 4px 14px 0 rgba(236, 72, 153, 0.25)';
                      }
                    }}
                    aria-label={
                      isUpdating ? 'Updating app...' : 'Update app now'
                    }
                  >
                    {isUpdating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        >
                          <IoRefresh size={18} />
                        </motion.div>
                        Updating...
                      </>
                    ) : (
                      <>Update Now 💕</>
                    )}
                  </motion.button>

                  {/* Maybe Later Button - Secondary */}
                  {!isUpdating && (
                    <motion.button
                      onClick={handleMaybeLater}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      className={`
                        w-full rounded-xl font-medium border-2 transition-all duration-300
                        flex items-center justify-center gap-2
                        ${dmSans.className}
                      `}
                      style={{
                        borderColor: '#D1D5DB',
                        background: 'transparent',
                        color: '#6B7280',
                        minHeight: 'max(44px, 10vw)',
                        maxHeight: '52px',
                        padding: 'clamp(0.625rem, 2.5vw, 0.875rem) 1.25rem',
                        fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#9CA3AF';
                        e.currentTarget.style.background =
                          'rgba(156, 163, 175, 0.05)';
                        e.currentTarget.style.color = '#4B5563';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6B7280';
                      }}
                      aria-label="Dismiss update notification"
                    >
                      Maybe Later
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
