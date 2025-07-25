// src/components/DoneModal.tsx
'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { getOrCreateUserId } from '@/utils/mealLog';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { FaHeart, FaHome, FaStar } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';
import { IoCheckmarkCircle } from 'react-icons/io5';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateHome?: () => void;
}

interface StreakData {
  currentStreak: number;
  lastLogDate: string | null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DoneModal({
  isOpen,
  onClose,
  onNavigateHome,
}: DoneModalProps) {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const { navigate } = useNavigation();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastLogDate: null,
  });
  const [isLoadingStreak, setIsLoadingStreak] = useState(true);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleNavigateHome = useCallback(() => {
    sessionStorage.setItem('isReturningToHome', 'true');
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate('/');
    }
    handleClose();
  }, [navigate, onNavigateHome, handleClose]);

  // Close on escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  // Fetch streak data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStreakData();
    }
  }, [isOpen]);

  // ========================================================================
  // DATA HANDLERS
  // ========================================================================

  /**
   * Fetch streak data from API
   */
  const fetchStreakData = async () => {
    try {
      setIsLoadingStreak(true);
      const userId = getOrCreateUserId();
      const response = await fetch(
        `/api/streak?user_id=${userId}&t=${Date.now()}`,
      );
      const data = await response.json();

      if (data.dates) {
        // Calculate streak from dates array
        const streak = calculateStreak(data.dates);
        setStreakData({
          currentStreak: streak,
          lastLogDate: data.dates[0] || null,
        });
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setIsLoadingStreak(false);
    }
  };

  /**
   * Calculate streak from dates array (similar to streaks page logic)
   */
  const calculateStreak = (dates: string[]): number => {
    if (!dates.length) return 0;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let streak = 0;
    let expectedDate = new Date(today);

    // Determine starting point for streak calculation
    const mostRecentDate = new Date(dates[0] + 'T00:00:00Z');

    if (mostRecentDate.getTime() === today.getTime()) {
      // User logged today - start counting from today
      expectedDate = new Date(today);
    } else {
      // Check if most recent log is yesterday (still considered active streak)
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      if (mostRecentDate.getTime() === yesterday.getTime()) {
        expectedDate = new Date(yesterday);
      } else {
        // Most recent log is older than yesterday - no active streak
        return 0;
      }
    }

    // Count consecutive days backwards from the starting point
    for (const dateStr of dates) {
      const logDate = new Date(dateStr + 'T00:00:00Z');

      if (logDate.getTime() === expectedDate.getTime()) {
        streak += 1;
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      } else if (logDate.getTime() < expectedDate.getTime()) {
        // Gap found - streak is broken
        break;
      }
    }

    return streak;
  };

  /**
   * Generate motivational message based on streak
   */
  const getMotivationalMessage = (streak: number): string => {
    if (streak === 1)
      return "You're starting something amazing! Keep it going!";
    if (streak < 7)
      return "You're building such great habits! So proud of you!";
    if (streak < 14)
      return "Look at you being consistent! You're doing incredible!";
    if (streak < 30) return 'Your dedication is inspiring! Keep shining!';
    if (streak < 60) return "You're absolutely crushing it! Amazing work!";
    return "You're a true champion! Your consistency is beautiful!";
  };

  // ========================================================================
  // ANIMATION VARIANTS
  // ========================================================================

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 200,
        duration: 0.28,
      },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
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
              background: 'rgba(0, 0, 0, 0.1)', // Very light overlay
              backdropFilter: 'saturate(120%) blur(12px)',
              WebkitBackdropFilter: 'saturate(120%) blur(12px)',
            }}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
            <motion.div
              className="w-full max-w-md mx-auto bg-transparent"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="done-modal-title"
            >
              {/* Main Content Card with Glassmorphism */}
              <div className="mx-4 mb-4">
                <div
                  className="relative flex flex-col items-center px-8 py-12 rounded-3xl border border-white/40"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    boxShadow:
                      '0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {/* Floating decorative icons */}
                  <motion.div
                    key="sparkles-icon"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    transition={{ duration: 1.2, delay: 1.0 }}
                    className="absolute top-6 right-6 text-pink-400 text-xl"
                  >
                    <GiSparkles />
                  </motion.div>
                  <motion.div
                    key="star-icon"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.5, scale: 1 }}
                    transition={{ duration: 1.2, delay: 1.2 }}
                    className="absolute bottom-6 left-6 text-purple-400 text-lg"
                  >
                    <FaStar />
                  </motion.div>
                  <motion.div
                    key="heart-icon"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.4, y: 0 }}
                    transition={{
                      duration: 2,
                      delay: 1.8,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }}
                    className="absolute top-12 left-8 text-pink-300 text-sm"
                  >
                    <FaHeart />
                  </motion.div>

                  {/* Success Icon */}
                  <motion.div
                    key="success-icon"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.4,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                    }}
                    className="mb-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                      <IoCheckmarkCircle className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  {/* Main Title */}
                  <motion.h1
                    id="done-modal-title"
                    key="main-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-3xl font-bold text-gray-800 mb-3 text-center"
                    style={{ fontFamily: 'Inter, SF Pro Display, sans-serif' }}
                  >
                    All Done!
                  </motion.h1>

                  {/* Streak Display */}
                  <motion.div
                    key="streak-display"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mb-6"
                  >
                    {isLoadingStreak ? (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Circular Progress Background */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-inner">
                          {/* Streak Number */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-700">
                              {streakData.currentStreak}
                            </div>
                            <div className="text-xs text-purple-600 font-medium">
                              {streakData.currentStreak === 1 ? 'day' : 'days'}
                            </div>
                          </div>
                        </div>

                        {/* Streak Badge */}
                        <motion.div
                          key="streak-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.4, delay: 1.0 }}
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-lg"
                        >
                          <span className="text-xs">🔥</span>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>

                  {/* Motivational Message */}
                  <motion.p
                    key="motivational-message"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="text-lg text-gray-700 text-center mb-8 leading-relaxed px-2"
                    style={{
                      fontFamily: 'Inter, SF Pro Display, sans-serif',
                      lineHeight: '1.6',
                    }}
                  >
                    {isLoadingStreak
                      ? "You're doing amazing! Keep up the great work!"
                      : getMotivationalMessage(streakData.currentStreak)}
                  </motion.p>

                  {/* Completion Celebration */}
                  <motion.div
                    key="completion-celebration"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="text-center mb-8"
                  >
                    <p className="text-sm text-gray-600 font-medium">
                      Another day of self-care completed
                    </p>
                  </motion.div>

                  {/* Return Home Button */}
                  <motion.div
                    key="button-container"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{
                      duration: 0.6,
                      delay: 1.4,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="w-full overflow-hidden"
                  >
                    <button
                      onClick={handleNavigateHome}
                      className="w-full py-4 px-6 rounded-2xl text-white font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{
                        background:
                          'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                        boxShadow: '0 4px 14px 0 rgba(236, 72, 153, 0.25)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #db2777 0%, #ec4899 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 8px 25px 0 rgba(236, 72, 153, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 4px 14px 0 rgba(236, 72, 153, 0.25)';
                      }}
                    >
                      <FaHome className="w-5 h-5" />
                      Return Home
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
