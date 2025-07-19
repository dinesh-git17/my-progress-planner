'use client';

import { getOrCreateUserId } from '@/utils/mealLog';
import { AnimatePresence, motion } from 'framer-motion';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' });

// ============================================================================
// STREAK CALCULATION LOGIC
// ============================================================================

/**
 * Calculates consecutive daily streak from sorted log dates
 * Handles active streaks that include yesterday's logs as valid current streaks
 *
 * @param dates Array of date strings in YYYY-MM-DD format, sorted descending
 * @returns Number of consecutive days from most recent log backwards
 */
function calculateStreak(dates: string[]): number {
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
}

// ============================================================================
// MILESTONE DEFINITIONS
// ============================================================================

/**
 * Streak milestones with Apple Health inspired styling
 * Each milestone represents a significant achievement in user consistency
 */
const streakMilestones = [
  {
    days: 1,
    title: 'First Step',
    bgFrom: '#ffecd2',
    bgTo: '#fcb69f',
    emoji: '🌱',
  },
  {
    days: 3,
    title: 'Getting Started',
    bgFrom: '#a8edea',
    bgTo: '#fed6e3',
    emoji: '🔥',
  },
  {
    days: 5,
    title: 'Building Habits',
    bgFrom: '#f9d423',
    bgTo: '#ff4e50',
    emoji: '🏆',
  },
  {
    days: 7,
    title: 'One Week Strong',
    bgFrom: '#fceabb',
    bgTo: '#f8b500',
    emoji: '⭐',
  },
  {
    days: 10,
    title: 'Double Digits',
    bgFrom: '#d299c2',
    bgTo: '#fef9d7',
    emoji: '🥉',
  },
  {
    days: 14,
    title: 'Two Week Warrior',
    bgFrom: '#89f7fe',
    bgTo: '#66a6ff',
    emoji: '👑',
  },
  {
    days: 21,
    title: 'Habit Master',
    bgFrom: '#fdbb2d',
    bgTo: '#22c1c3',
    emoji: '💎',
  },
  {
    days: 30,
    title: 'Monthly Champion',
    bgFrom: '#ff9a9e',
    bgTo: '#fecfef',
    emoji: '🥈',
  },
  {
    days: 45,
    title: 'Consistency King',
    bgFrom: '#a18cd1',
    bgTo: '#fbc2eb',
    emoji: '♔',
  },
  {
    days: 60,
    title: 'Two Month Hero',
    bgFrom: '#fad0c4',
    bgTo: '#ffd1ff',
    emoji: '🚀',
  },
  {
    days: 75,
    title: 'Unstoppable',
    bgFrom: '#ffecd2',
    bgTo: '#fcb69f',
    emoji: '⚡',
  },
  {
    days: 90,
    title: 'Three Month Legend',
    bgFrom: '#667eea',
    bgTo: '#764ba2',
    emoji: '🥇',
  },
  {
    days: 120,
    title: 'Four Month Master',
    bgFrom: '#f093fb',
    bgTo: '#f5576c',
    emoji: '♾️',
  },
  {
    days: 150,
    title: 'Five Month Phenomenon',
    bgFrom: '#4facfe',
    bgTo: '#00f2fe',
    emoji: '✨',
  },
  {
    days: 180,
    title: 'Half Year Hero',
    bgFrom: '#43e97b',
    bgTo: '#38f9d7',
    emoji: '☀️',
  },
  {
    days: 365,
    title: 'One Year Legend',
    bgFrom: '#fa709a',
    bgTo: '#fee140',
    emoji: '👸',
  },
];

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom hook to fetch and manage user streak data
 * Includes cache busting to ensure fresh data after updates
 */
function useUserStreak(user_id?: string) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user_id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Cache-bust to ensure fresh data, especially important for real-time updates
    fetch(`/api/streak?user_id=${user_id}&t=${Date.now()}`)
      .then((res) => res.json())
      .then(({ dates }) => setStreak(calculateStreak(dates ?? [])))
      .catch((err) => {
        console.error('Failed to fetch streak data:', err);
        setStreak(0);
      })
      .finally(() => setLoading(false));
  }, [user_id]);

  return { streak, loading };
}

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

/**
 * Header banner dimensions for consistent layout calculations
 * These values ensure proper spacing and prevent layout shifts
 */
const BANNER_CURVE_HEIGHT = 44;
const BANNER_TOP_PADDING = 32;
const BANNER_BOTTOM_PADDING = 22;
const BANNER_TEXT_HEIGHT = 74;
const BANNER_TOTAL_HEIGHT =
  BANNER_CURVE_HEIGHT +
  BANNER_TOP_PADDING +
  BANNER_BOTTOM_PADDING +
  BANNER_TEXT_HEIGHT;

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

/**
 * Fixed header component with curved bottom design
 * Uses absolute positioning to maintain consistent layout
 */
function StreaksHeader({ dancingScriptClass }: { dancingScriptClass: string }) {
  return (
    <header
      className="safe-area-pt fixed top-0 left-0 w-full z-30"
      style={{
        height: `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top))`,
        minHeight: `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top))`,
        pointerEvents: 'none',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
    >
      <div
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #f5ede6 0%, #f7edf5 54%, #d8d8f0 100%)',
          height: '100%',
        }}
      >
        <div
          className="flex flex-col items-center w-full px-4 z-10"
          style={{
            pointerEvents: 'auto',
            paddingTop: BANNER_TOP_PADDING,
            paddingBottom: BANNER_BOTTOM_PADDING,
          }}
        >
          <div
            className={`text-[2.15rem] sm:text-[2.6rem] font-bold text-gray-900 text-center drop-shadow-sm ${dancingScriptClass}`}
            style={{
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontWeight: 700,
            }}
          >
            Streak Awards
          </div>
          <div className="text-lg sm:text-xl text-gray-600 font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            Celebrate your consistency and unlock amazing achievements 🏆
          </div>
        </div>

        {/* Curved bottom border using SVG for precise control */}
        <svg
          className="absolute left-0 bottom-0 w-full"
          viewBox="0 0 500 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            display: 'block',
            zIndex: 11,
            pointerEvents: 'none',
            height: BANNER_CURVE_HEIGHT,
          }}
        >
          <defs>
            <linearGradient
              id="curveGradient"
              x1="0"
              y1="0"
              x2="500"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f5ede6" />
              <stop offset="0.54" stopColor="#f7edf5" />
              <stop offset="1" stopColor="#d8d8f0" />
            </linearGradient>
          </defs>
          <path
            d="M0 0C82 40 418 40 500 0V44H0V0Z"
            fill="url(#curveGradient)"
          />
        </svg>
      </div>
    </header>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StreaksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const { streak, loading } = useUserStreak(userId ?? undefined);
  const router = useRouter();

  // Initialize user ID on component mount
  useEffect(() => {
    const uid = getOrCreateUserId();
    setUserId(uid);
  }, []);

  /**
   * Determines the visual status of a milestone based on current streak
   * Provides different states for better UX feedback
   */
  const getAwardStatus = (milestone: (typeof streakMilestones)[0]) => {
    if (streak >= milestone.days) {
      return 'earned';
    } else if (streak >= milestone.days - 3) {
      return 'close'; // Within 3 days of earning
    } else {
      return 'locked';
    }
  };

  /**
   * Finds the next milestone the user is working towards
   * Used for progress motivation and goal setting
   */
  const getNextMilestone = () => {
    return streakMilestones.find((m) => m.days > streak);
  };

  // Derived state for statistics and progress tracking
  const nextMilestone = getNextMilestone();
  const earnedCount = streakMilestones.filter((m) => streak >= m.days).length;
  const completionPercentage = Math.round(
    (earnedCount / streakMilestones.length) * 100,
  );

  const BG_GRADIENT =
    'linear-gradient(135deg, #f5ede6 0%, #f7edf5 54%, #d8d8f0 100%)';

  return (
    <>
      {/* External dependencies */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      <div
        className={`h-screen w-full flex flex-col overflow-hidden fixed inset-0 ${dmSans.className}`}
      >
        {/* Fixed gradient background */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          aria-hidden="true"
          style={{ background: BG_GRADIENT }}
        />

        {/* Navigation: Back Button */}
        <motion.div
          className="absolute left-4 top-4 z-40"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            zIndex: 40,
            top: '16px',
            left: '16px',
            willChange: 'opacity',
          }}
        >
          <button
            onClick={() => router.push('/')}
            className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-orange-200/50 transition-all shadow-sm"
            aria-label="Go Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </button>
        </motion.div>

        {/* Header Banner */}
        <StreaksHeader dancingScriptClass={dancingScript.className} />

        {/* Main Content Area */}
        <div
          className="flex-1 w-full max-w-2xl mx-auto flex flex-col relative z-10"
        style={{
          marginTop: `calc(${BANNER_TOTAL_HEIGHT - 20}px + env(safe-area-inset-top))`,
          height: `calc(100vh - (${BANNER_TOTAL_HEIGHT - 20}px + env(safe-area-inset-top)))`,
          overflow: 'auto',
        }}
        >
          <div className="px-4 pb-8 pt-8">
            {loading ? (
              <div className="text-center text-gray-400/80 text-base font-medium animate-pulse py-20">
                Loading your streaks…
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  {/* Current Streak Display */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/60">
                      <div className="text-6xl mb-4">🔥</div>
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {streak}
                      </div>
                      <div className="text-lg text-gray-600 mb-4">
                        Day{streak !== 1 ? 's' : ''} in a row
                      </div>

                      {/* Next milestone progress indicator */}
                      {nextMilestone && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">
                            {nextMilestone.days - streak} more day
                            {nextMilestone.days - streak !== 1 ? 's' : ''}
                          </span>{' '}
                          until{' '}
                          <span className="font-semibold text-orange-500">
                            {nextMilestone.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Statistics Overview */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {earnedCount}
                          </div>
                          <div className="text-sm text-gray-600">
                            Awards Earned
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {streakMilestones.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Awards
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {completionPercentage}%
                          </div>
                          <div className="text-sm text-gray-600">Complete</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Achievement Milestones Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                      Achievement Milestones
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                      {streakMilestones.map((milestone, index) => {
                        const status = getAwardStatus(milestone);
                        const isEarned = status === 'earned';
                        const isClose = status === 'close';

                        return (
                          <motion.div
                            key={milestone.days}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: 0.4 + index * 0.05,
                              duration: 0.4,
                            }}
                            className={`
                              relative p-6 rounded-2xl border transition-all duration-300
                              ${
                                isEarned
                                  ? 'bg-white/95 shadow-lg border-white/60 scale-105'
                                  : isClose
                                    ? 'bg-white/70 shadow-md border-orange-200'
                                    : 'bg-white/40 shadow-sm border-gray-200 opacity-60'
                              }
                            `}
                          >
                            {/* Award Background Gradient for earned milestones */}
                            {isEarned && (
                              <div
                                className="absolute inset-0 rounded-2xl opacity-20"
                                style={{
                                  background: `linear-gradient(135deg, ${milestone.bgFrom}, ${milestone.bgTo})`,
                                }}
                              />
                            )}

                            <div className="relative z-10 text-center">
                              {/* Milestone Icon */}
                              <div className="text-3xl mb-3">
                                {isEarned ? milestone.emoji : '🔒'}
                              </div>

                              {/* Days Required */}
                              <div
                                className={`text-xl font-bold mb-2 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}
                              >
                                {milestone.days} day
                                {milestone.days !== 1 ? 's' : ''}
                              </div>

                              {/* Milestone Title */}
                              <div
                                className={`text-sm font-medium ${isEarned ? 'text-gray-800' : 'text-gray-500'}`}
                              >
                                {milestone.title}
                              </div>

                              {/* Progress indicator for close milestones */}
                              {isClose && !isEarned && (
                                <div className="mt-2 text-xs text-orange-600 font-medium">
                                  {milestone.days - streak} more day
                                  {milestone.days - streak !== 1 ? 's' : ''}!
                                </div>
                              )}

                              {/* Earned checkmark indicator */}
                              {isEarned && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: 0.6 + index * 0.05,
                                    type: 'spring',
                                    stiffness: 200,
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                                >
                                  <i className="fas fa-check text-white text-xs"></i>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Motivational Message based on current progress */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-center pb-4"
                  >
                    <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-6 border border-orange-100">
                      <div className="text-2xl mb-3">✨</div>
                      <div className="text-gray-700 font-medium">
                        {streak === 0
                          ? 'Start your journey today! Every meal logged is a step toward building healthy habits.'
                          : streak < 7
                            ? "You're building momentum! Keep going to unlock more achievements."
                            : streak < 30
                              ? "Amazing progress! You're developing incredible consistency."
                              : "You're a true champion! Your dedication is inspiring."}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
