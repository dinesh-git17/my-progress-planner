'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { getOrCreateUserId } from '@/utils/mealLog';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useEffect, useState } from 'react';
// ============================================================================
// FONT CONFIGURATION
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: '700' });

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface Milestone {
  days: number;
  title: string;
  bgFrom: string;
  bgTo: string;
  emoji: string;
}

type AwardStatus = 'earned' | 'close' | 'locked';

// ============================================================================
// STREAK CALCULATION LOGIC
// ============================================================================

/**
 * Calculates consecutive daily streak from sorted log dates
 * Handles active streaks that include yesterday's logs as valid current streaks
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
 */
const streakMilestones: Milestone[] = [
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

    // Cache-bust to ensure fresh data
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
// CONSTANTS
// ============================================================================
const UI_CONSTANTS = {
  BANNER_CURVE_HEIGHT: 100, // ← INCREASED from 44 to 100
  BANNER_TOP_PADDING: 35, // ← INCREASED from 32 to 35
  BANNER_BOTTOM_PADDING: 28, // ← INCREASED from 22 to 28
  BANNER_TEXT_HEIGHT: 80, // ← INCREASED from 74 to 80
} as const;

/**
 * Calculated total header height for layout positioning
 */
const BANNER_TOTAL_HEIGHT =
  UI_CONSTANTS.BANNER_CURVE_HEIGHT +
  UI_CONSTANTS.BANNER_TOP_PADDING +
  UI_CONSTANTS.BANNER_BOTTOM_PADDING +
  UI_CONSTANTS.BANNER_TEXT_HEIGHT;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines the visual status of a milestone based on current streak
 */
function getAwardStatus(milestone: Milestone, streak: number): AwardStatus {
  if (streak >= milestone.days) {
    return 'earned';
  } else if (streak >= milestone.days - 3) {
    return 'close'; // Within 3 days of earning
  } else {
    return 'locked';
  }
}

/**
 * Finds the next milestone the user is working towards
 */
function getNextMilestone(streak: number): Milestone | undefined {
  return streakMilestones.find((m) => m.days > streak);
}

/**
 * Gets motivational message based on current streak
 */
function getMotivationalMessage(streak: number): string {
  if (streak === 0) {
    return 'Start your journey today! Every meal logged is a step toward building healthy habits.';
  } else if (streak < 7) {
    return "You're building momentum! Keep going to unlock more achievements.";
  } else if (streak < 30) {
    return "Amazing progress! You're developing incredible consistency.";
  } else {
    return "You're a true champion! Your dedication is inspiring.";
  }
}

// ============================================================================
// HEADER COMPONENT (UPDATED - SVG GRADIENT VERSION)
// ============================================================================
function StreaksHeader({ dancingScriptClass }: { dancingScriptClass: string }) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-30"
      style={{
        background: 'transparent', // No background needed - SVG handles it
        // REMOVED pt-safe-top - SVG will extend into notch
      }}
    >
      {/* SVG that creates the entire header shape with wavy bottom - EXTENDS INTO NOTCH */}
      <svg
        className="w-full"
        viewBox="0 0 500 220" // Increased height to account for notch area
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          height: `calc(${BANNER_TOTAL_HEIGHT}px + env(safe-area-inset-top))`, // Add safe area to height
        }}
      >
        {/* Gradient definition - matches homepage progress tab */}
        <defs>
          <linearGradient
            id="streaksHeaderGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#d8b4fe" />
          </linearGradient>
        </defs>

        {/* Single path with wavy bottom - matches summaries style */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#streaksHeaderGradient)"
        />
      </svg>

      {/* Text content positioned absolutely over the SVG - RESPECTS SAFE AREA */}
      <div
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-start"
        style={{
          paddingTop: `calc(${UI_CONSTANTS.BANNER_TOP_PADDING}px + env(safe-area-inset-top))`, // Safe area for text only
          paddingBottom: UI_CONSTANTS.BANNER_BOTTOM_PADDING,
        }}
      >
        <div className="flex flex-col items-center w-full px-4">
          <div
            className={`text-[2.15rem] sm:text-[2.6rem] font-bold text-white text-center drop-shadow-sm ${dancingScriptClass}`}
            style={{
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontWeight: 700,
            }}
          >
            Streak Awards
          </div>
          <div className="text-lg sm:text-xl text-white font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            Celebrate your consistency and unlock amazing achievements{' '}
            <Flame className="inline w-5 h-5 text-white ml-1" />
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// COMPONENT RENDER HELPERS
// ============================================================================

/**
 * Renders individual milestone card
 */
function MilestoneCard({
  milestone,
  streak,
  index,
}: {
  milestone: Milestone;
  streak: number;
  index: number;
}) {
  const status = getAwardStatus(milestone, streak);
  const isEarned = status === 'earned';
  const isClose = status === 'close';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.1 + index * 0.1,
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
        <div
          className="text-3xl mb-3"
          role="img"
          aria-label={isEarned ? milestone.emoji : 'Locked'}
        >
          {isEarned ? milestone.emoji : '🔒'}
        </div>

        {/* Days Required */}
        <div
          className={`text-xl font-bold mb-2 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}
        >
          {milestone.days} day{milestone.days !== 1 ? 's' : ''}
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
            aria-label="Achievement earned"
          >
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT (CLEANED)
// ============================================================================
export default function StreaksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const { streak, loading } = useUserStreak(userId ?? undefined);
  const { navigate } = useNavigation();

  // Initialize user ID on component mount
  useEffect(() => {
    const uid = getOrCreateUserId();
    setUserId(uid);
  }, []);

  // Derived state for statistics and progress tracking
  const nextMilestone = getNextMilestone(streak);
  const earnedCount = streakMilestones.filter((m) => streak >= m.days).length;
  const completionPercentage = Math.round(
    (earnedCount / streakMilestones.length) * 100,
  );

  return (
    <div className={`min-h-screen w-full ${dmSans.className}`}>
      {/* Navigation: Back Button */}
      <motion.div
        className="fixed left-4 z-40 notch-safe"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => {
            sessionStorage.setItem('isReturningToHome', 'true');
            navigate('/');
          }}
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-orange-200/50 transition-all shadow-sm"
          aria-label="Go back to home"
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
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      </motion.div>

      {/* Header Banner */}
      <StreaksHeader dancingScriptClass={dancingScript.className} />

      {/* Main Content Area */}
      <div
        className="w-full max-w-2xl mx-auto safe-x"
        style={{
          marginTop: BANNER_TOTAL_HEIGHT,
          minHeight: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px)`,
          paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="px-4">
          {loading ? (
            <div className="text-center text-gray-400/80 text-base font-medium animate-pulse py-8">
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
                    <div
                      className="text-6xl mb-4"
                      role="img"
                      aria-label="Fire emoji"
                    >
                      🔥
                    </div>
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
                    {streakMilestones.map((milestone, index) => (
                      <MilestoneCard
                        key={milestone.days}
                        milestone={milestone}
                        streak={streak}
                        index={index}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Motivational Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="text-center"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-6 border border-orange-100">
                    <div
                      className="text-2xl mb-3"
                      role="img"
                      aria-label="Sparkles emoji"
                    >
                      ✨
                    </div>
                    <div className="text-gray-700 font-medium">
                      {getMotivationalMessage(streak)}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
