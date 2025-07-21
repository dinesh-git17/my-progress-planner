'use client';

import AuthPrompt from '@/components/AuthPrompt';
import LoginModal from '@/components/LoginModal';
import {
  generateUserId,
  getUserName as getAuthUserName,
  getCurrentSession,
  getLocalUserId,
  setLocalUserId,
  signOut,
} from '@/utils/auth';
import { getUserName, saveUserName } from '@/utils/user';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUserInitialization } from '../../hooks/useUserInitialization';

// ============================================================================
// CONSTANTS & DATA STRUCTURES
// ============================================================================

/**
 * Meal configuration with labels, emojis, and routing paths
 * Used throughout the app for consistent meal representation
 */
const mealLabels = [
  { meal: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { meal: 'lunch', emoji: '🫐', label: 'Lunch' },
  { meal: 'dinner', emoji: '🍜', label: 'Dinner' },
];

const UI_CONSTANTS = {
  BANNER_TOP_PADDING: 20, // Increased from 24
  BANNER_BOTTOM_PADDING: 50, // Increased from 32
  BANNER_TEXT_HEIGHT: 180, // Increased from 120
};

const BANNER_TOTAL_HEIGHT =
  UI_CONSTANTS.BANNER_TOP_PADDING +
  UI_CONSTANTS.BANNER_BOTTOM_PADDING +
  UI_CONSTANTS.BANNER_TEXT_HEIGHT;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates user initials from a full name string
 * Falls back to empty string if name is invalid
 * @param {string} name - Full name string
 * @returns {string} Two-character initials in uppercase
 */
function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

/**
 * Formats friend code for display (e.g., "ABC123" -> "AB:C1:23")
 * @param {string} code - Raw friend code
 * @returns {string} Formatted friend code
 */
function formatFriendCode(code: string): string {
  if (!code || code.length !== 6) return '--:--:--';
  return `${code.slice(0, 2)}:${code.slice(2, 4)}:${code.slice(4, 6)}`;
}

// Replace the calculateStreak function in your homepage with this:

/**
 * Calculates consecutive daily streak from sorted log dates
 * @param dates Array of date strings in YYYY-MM-DD format, sorted descending
 * @returns Number of consecutive days from most recent log backwards
 */
function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let streak = 0;
  let expectedDate = new Date(today);

  // Check if they logged today first
  const mostRecentDate = new Date(dates[0] + 'T00:00:00Z');

  // If most recent log is today, start counting from today
  if (mostRecentDate.getTime() === today.getTime()) {
    expectedDate = new Date(today);
  } else {
    // If most recent log is yesterday, start counting from yesterday
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    if (mostRecentDate.getTime() === yesterday.getTime()) {
      expectedDate = new Date(yesterday);
    } else {
      // If most recent log is older than yesterday, no current streak
      return 0;
    }
  }

  // Now count consecutive days backwards
  for (const dateStr of dates) {
    const logDate = new Date(dateStr + 'T00:00:00Z');

    if (logDate.getTime() === expectedDate.getTime()) {
      streak += 1;
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    } else if (logDate.getTime() < expectedDate.getTime()) {
      // Found a gap - streak is broken
      break;
    }
  }

  return streak;
}

/**
 * Calculates milliseconds until next EST midnight for auto-refresh
 * Accounts for timezone differences and daylight saving time
 * @returns {number} Milliseconds until next EST midnight
 */
function getMsUntilNextEstMidnight() {
  const now = new Date();
  const nowNY = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
  const nextMidnightNY = new Date(nowNY);
  nextMidnightNY.setHours(0, 0, 0, 0);

  if (nowNY > nextMidnightNY) {
    nextMidnightNY.setDate(nextMidnightNY.getDate() + 1);
  }

  const nextResetUTC = new Date(nextMidnightNY).getTime();
  return nextResetUTC - now.getTime();
}

/**
 * Adds semantic highlighting to motivational quotes
 * Wraps specific keywords in colored spans for visual emphasis
 * @param {string} quote - Raw quote text
 * @returns {string} HTML string with highlighted keywords
 */
function highlightQuote(quote: string): string {
  const highlights: HighlightedWord[] = [
    // PRIORITY 1: Multi-word phrases and hyphenated words (MUST come first)
    { regex: /self-care/gi, className: 'text-pink-200 font-semibold' },
    { regex: /small steps/gi, className: 'text-yellow-200 font-semibold' },
    { regex: /step by step/gi, className: 'text-purple-200 font-semibold' },
    { regex: /one step/gi, className: 'text-indigo-200 font-semibold' },

    // PRIORITY 2: Single words (processed after multi-word phrases)
    { regex: /progress/gi, className: 'text-purple-200 font-semibold' },
    { regex: /amazing/gi, className: 'text-green-200 font-semibold' },
    { regex: /love/gi, className: 'text-red-200 font-semibold' },
    { regex: /motivation/gi, className: 'text-blue-200 font-semibold' },
    { regex: /healthy/gi, className: 'text-teal-200 font-semibold' },
    { regex: /victory/gi, className: 'text-emerald-200 font-semibold' },
    { regex: /eating/gi, className: 'text-orange-200 font-semibold' },
    { regex: /nourish/gi, className: 'text-green-200 font-semibold' },
    { regex: /caring/gi, className: 'text-pink-200 font-semibold' },
    { regex: /gentle/gi, className: 'text-purple-200 font-semibold' },
    { regex: /sweet/gi, className: 'text-pink-200 font-semibold' },
    { regex: /proud/gi, className: 'text-yellow-200 font-semibold' },
    { regex: /beautiful/gi, className: 'text-rose-200 font-semibold' },
    { regex: /strong/gi, className: 'text-blue-200 font-semibold' },
    { regex: /wonderful/gi, className: 'text-purple-200 font-semibold' },
    { regex: /special/gi, className: 'text-indigo-200 font-semibold' },
    { regex: /care/gi, className: 'text-teal-200 font-semibold' },
    { regex: /nurture/gi, className: 'text-green-200 font-semibold' },
    { regex: /kindness/gi, className: 'text-pink-200 font-semibold' },
    { regex: /support/gi, className: 'text-blue-200 font-semibold' },
    { regex: /encourage/gi, className: 'text-yellow-200 font-semibold' },
    { regex: /celebrate/gi, className: 'text-orange-200 font-semibold' },
    { regex: /growth/gi, className: 'text-emerald-200 font-semibold' },
    { regex: /journey/gi, className: 'text-violet-200 font-semibold' },
    { regex: /succeed/gi, className: 'text-green-200 font-semibold' },
    { regex: /overcome/gi, className: 'text-blue-200 font-semibold' },
    { regex: /believe/gi, className: 'text-indigo-200 font-semibold' },
    { regex: /trust/gi, className: 'text-cyan-200 font-semibold' },
    { regex: /positive/gi, className: 'text-lime-200 font-semibold' },
    { regex: /affection/gi, className: 'text-red-200 font-semibold' },
    { regex: /embrace/gi, className: 'text-amber-200 font-semibold' },
  ];
  let highlighted = quote;
  for (const { regex, className } of highlights) {
    highlighted = highlighted.replace(
      regex,
      (match) => `<span class="${className}">${match}</span>`,
    );
  }
  return highlighted;
}

/**
 * Converts VAPID public key from base64 to Uint8Array for push notifications
 * Required for service worker push subscription setup
 * @param {string} base64String - VAPID public key in base64 format
 * @returns {Uint8Array} Converted key for push manager
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HighlightedWord {
  regex: RegExp;
  className: string;
}

interface MealLog {
  id: string;
  user_id: string;
  date: string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  created_at: string;
}

interface MealLogResponse {
  mealLog?: MealLog;
}

interface QuoteResponse {
  quote?: string;
}

// ============================================================================
// HEADER COMPONENTS
// ============================================================================

/**
 * Get gradient colors based on active tab
 */
function getHeaderGradientColors(activeTab: 'meals' | 'progress' | 'friends') {
  switch (activeTab) {
    case 'meals':
      return {
        start: '#ec4899', // Current pink gradient
        middle: '#f472b6',
        end: '#e879f9',
      };
    case 'progress':
      return {
        start: '#a855f7', // Purple to match tab
        middle: '#c084fc',
        end: '#d8b4fe',
      };
    case 'friends':
      return {
        start: '#3b82f6', // Blue to match tab
        middle: '#60a5fa',
        end: '#93c5fd',
      };
    default:
      return {
        start: '#ec4899',
        middle: '#f472b6',
        end: '#e879f9',
      };
  }
}

/**
 * Beautiful SVG Wave Header Component for Homepage
 */
function HomeHeader({
  name,
  streak,
  quote,
  loading,
  streakLoading,
  notificationsEnabled,
  showNotificationTooltip,
  onNotificationClick,
  onProfileClick,
  profileButtonRef,
  showProfileDropdown,
  onProfileClose,
  isUserAuthenticated,
  onLogin,
  onLogout,
  activeTab,
}: {
  name: string;
  streak: number;
  quote: string;
  loading: boolean;
  streakLoading: boolean;
  notificationsEnabled: boolean;
  showNotificationTooltip: boolean;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  profileButtonRef: React.RefObject<HTMLButtonElement>;
  showProfileDropdown: boolean;
  onProfileClose: () => void;
  isUserAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => Promise<void>;
  activeTab: 'meals' | 'progress' | 'friends';
}) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-30"
      style={{
        background: 'transparent',
      }}
    >
      {/* SVG Wave Header */}
      <svg
        className="w-full"
        viewBox="0 0 500 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          height: `calc(${BANNER_TOTAL_HEIGHT + 60}px + env(safe-area-inset-top))`,
        }}
      >
        <defs>
          <linearGradient
            id="homeHeaderGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={getHeaderGradientColors(activeTab).start}
              style={{
                transition: 'stop-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <stop
              offset="50%"
              stopColor={getHeaderGradientColors(activeTab).middle}
              style={{
                transition: 'stop-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <stop
              offset="100%"
              stopColor={getHeaderGradientColors(activeTab).end}
              style={{
                transition: 'stop-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </linearGradient>
        </defs>
        <path
          d="M0 0 L500 0 L500 220 C400 260 350 200 250 240 C150 280 100 220 0 260 L0 0 Z"
          fill="url(#homeHeaderGradient)"
        />
      </svg>

      {/* Header Content */}
      <div
        className="absolute top-0 left-0 w-full h-full flex flex-col"
        style={{
          paddingTop: `calc(${UI_CONSTANTS.BANNER_TOP_PADDING}px + env(safe-area-inset-top))`,
          paddingBottom: UI_CONSTANTS.BANNER_BOTTOM_PADDING,
        }}
      >
        {/* Top row: Greeting + Action buttons */}
        <div className="w-full max-w-lg mx-auto px-6 flex flex-row items-start justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[1.7rem] font-bold text-white leading-snug flex items-center gap-2">
              {name ? (
                <>
                  Hello, {name.split(' ')[0]}{' '}
                  <span className="text-2xl">👋</span>
                </>
              ) : (
                <>
                  Hello! <span className="text-2xl">👋</span>
                </>
              )}
            </span>
            {/* Streak indicator */}
            {!streakLoading && streak > 0 && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 18,
                }}
                className="flex items-center mt-1 text-[1rem] font-medium text-white/90 pl-1"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-300 mr-2 shadow-sm" />
                <span>
                  {streak} day{streak > 1 && 's'} streak!
                </span>
              </motion.span>
            )}
          </div>

          {/* Action buttons and profile */}
          <div className="flex items-center gap-3 relative">
            {/* Notification bell */}
            {!notificationsEnabled && (
              <div className="relative">
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNotificationClick();
                  }}
                  className="
                    w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm
                    flex items-center justify-center shadow-lg 
                    cursor-pointer hover:scale-110 active:scale-95 transition-transform
                    border border-white/30 outline-none focus:ring-2 focus:ring-white/40
                  "
                  animate={{
                    y: [0, -4, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: [0.4, 0, 0.6, 1],
                  }}
                  whileHover={{
                    scale: 1.15,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  aria-label="Enable notifications"
                >
                  <Bell className="w-4 h-4 text-white pointer-events-none" />
                </motion.button>

                {/* Notification tooltip */}
                <AnimatePresence>
                  {showNotificationTooltip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.4, 0, 0.2, 1],
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="absolute top-12 -left-32 z-50 pointer-events-none"
                    >
                      <div className="relative">
                        <p
                          className="text-white text-sm whitespace-nowrap font-medium drop-shadow-sm"
                          style={{
                            fontFamily: "'Dancing Script', cursive",
                            fontSize: '16px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          click here to allow notifications ✨
                        </p>
                        <svg
                          className="absolute -top-4 left-28"
                          width="30"
                          height="20"
                          viewBox="0 0 30 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <motion.path
                            d="M6 16 C 10 16, 16 12, 24 4 L 20 2 M 24 4 L 22 8"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                              duration: 1,
                              delay: 0.3,
                              ease: 'easeInOut',
                            }}
                          />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Profile dropdown */}
            <div className="relative">
              <motion.button
                ref={profileButtonRef}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onProfileClick}
                className="
                  w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full 
                  flex items-center justify-center text-lg font-bold text-white shadow-lg 
                  select-none uppercase cursor-pointer transition-all duration-200
                  hover:bg-white/30 border border-white/30
                  focus:outline-none focus:ring-2 focus:ring-white/40
                "
                type="button"
                aria-label="Profile menu"
              >
                {getInitials(name) || '🍽️'}
              </motion.button>

              <ProfileDropdown
                name={name}
                isOpen={showProfileDropdown}
                onClose={onProfileClose}
                profileButtonRef={profileButtonRef}
                isAuthenticated={isUserAuthenticated}
                onLogin={onLogin}
                onLogout={onLogout}
              />
            </div>
          </div>
        </div>

        {/* Quote section */}
        <div className="w-full max-w-lg mx-auto px-6 mt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="
              relative flex items-start px-5 py-4 rounded-2xl
              bg-white/10 backdrop-blur-sm border border-white/20
              min-h-[60px] shadow-sm
            "
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-lg mr-4 flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            {loading || !quote ? (
              <span className="animate-pulse text-base font-normal italic text-white/70 flex-1">
                Loading motivation…
              </span>
            ) : (
              <span
                className="font-semibold text-[1rem] sm:text-lg leading-snug text-white break-words flex-1 drop-shadow-sm"
                dangerouslySetInnerHTML={{
                  __html: highlightQuote(quote),
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom hook to fetch and calculate user's current meal logging streak
 * Handles data recovery scenarios with retry logic and manual refresh capability
 * NOW WITH SESSION STORAGE CACHING to prevent multiple API calls
 */
function useUserStreak(user_id?: string, isAfterRecovery = false) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Manual refresh function that can be called to refetch streak data
   * Useful for triggering updates after data changes
   */
  const refreshStreak = useCallback(() => {
    // Clear session cache when manually refreshing
    if (user_id) {
      sessionStorage.removeItem(`mealapp_streak_${user_id}`);
      sessionStorage.removeItem(`mealapp_streak_timestamp_${user_id}`);
    }
    setRefreshTrigger((prev) => prev + 1);
  }, [user_id]);

  useEffect(() => {
    if (!user_id) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchStreakWithRetry = async (attempt = 1): Promise<void> => {
      try {
        // Check session storage first (unless this is a recovery or manual refresh)
        if (!isAfterRecovery && refreshTrigger === 0) {
          const cachedStreak = sessionStorage.getItem(
            `mealapp_streak_${user_id}`,
          );
          const cachedTimestamp = sessionStorage.getItem(
            `mealapp_streak_timestamp_${user_id}`,
          );

          if (cachedStreak !== null && cachedTimestamp) {
            const cacheAge = Date.now() - parseInt(cachedTimestamp);
            // Use cached data if it's less than 5 minutes old
            if (cacheAge < 5 * 60 * 1000) {
              const parsedStreak = parseInt(cachedStreak);
              setStreak(isNaN(parsedStreak) ? 0 : parsedStreak);
              setLoading(false);
              return;
            }
          }
        }

        // For users who just recovered data, add delay to ensure backend sync completion
        if (isAfterRecovery && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Cache-bust to ensure fresh data, especially important after recovery
        const timestamp = Date.now();
        const response = await fetch(
          `/api/streak?user_id=${user_id}&t=${timestamp}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const { dates } = await response.json();

        if (isCancelled) return;

        const calculatedStreak = calculateStreak(dates ?? []);

        // Recovery scenario: If we get 0 streak but have date data, the sync might be incomplete
        // Retry up to 2 additional times with exponential backoff
        if (
          isAfterRecovery &&
          calculatedStreak === 0 &&
          dates?.length > 0 &&
          attempt < 3
        ) {
          const backoffDelay = attempt * 1500; // 1.5s, then 3s
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          return fetchStreakWithRetry(attempt + 1);
        }

        // Cache the result in session storage
        sessionStorage.setItem(
          `mealapp_streak_${user_id}`,
          calculatedStreak.toString(),
        );
        sessionStorage.setItem(
          `mealapp_streak_timestamp_${user_id}`,
          Date.now().toString(),
        );

        setStreak(calculatedStreak);
      } catch (error) {
        console.error('Failed to fetch user streak:', error);

        // Retry once on network/server errors, but not for recovery scenarios
        if (!isAfterRecovery && attempt === 1) {
          setTimeout(() => fetchStreakWithRetry(2), 1000);
          return;
        }

        // Fallback to 0 on persistent failures
        if (!isCancelled) {
          setStreak(0);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchStreakWithRetry();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [user_id, isAfterRecovery, refreshTrigger]); // Added refreshTrigger to dependencies

  return { streak, loading, refreshStreak };
}

// ============================================================================
// DATA HANDLING FUNCTIONS
// ============================================================================

/**
 * Merges guest user data into authenticated user account
 * Handles data migration when user logs in after using as guest
 * @param {string} guestUserId - Temporary guest user ID
 * @param {string} authUserId - Authenticated user ID
 * @returns {Promise<Object>} Merge operation result with success status
 */
async function mergeGuestDataToAuthUser(
  guestUserId: string,
  authUserId: string,
) {
  try {
    // Skip merge if IDs are the same (user was already authenticated)
    if (guestUserId === authUserId) {
      return { success: true, skipped: true };
    }

    // Preserve guest user's name for transfer
    const guestName = await getUserName(guestUserId);

    // Call backend API to merge meal logs and other data
    const mergeResponse = await fetch('/api/merge-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guestUserId,
        authUserId,
      }),
    });

    const mergeResult = await mergeResponse.json();

    if (!mergeResponse.ok) {
      throw new Error(
        `API call failed: ${mergeResult.error || 'Unknown error'}`,
      );
    }

    // Transfer name to authenticated account if merge was successful
    if (guestName && !mergeResult.skipped) {
      const nameTransferSuccess = await saveUserName(authUserId, guestName);
      if (!nameTransferSuccess) {
        console.error('Failed to transfer name from guest to auth user');
      }
    }

    // Update local storage to use authenticated user ID
    setLocalUserId(authUserId);

    return {
      success: true,
      details: mergeResult.details,
      nameTransferred: !!guestName,
    };
  } catch (error: any) {
    console.error('Data merge failed:', error);
    return {
      success: false,
      error: error.message,
      fallback: true,
    };
  }
}

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

/**
 * Profile dropdown menu component
 * Handles user authentication state and profile actions
 */
function ProfileDropdown({
  name,
  isOpen,
  onClose,
  profileButtonRef,
  isAuthenticated,
  onLogin,
  onLogout,
}: {
  name: string;
  isOpen: boolean;
  onClose: () => void;
  profileButtonRef: React.RefObject<HTMLButtonElement>;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => Promise<void>;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: Event) {
      const target = event.target as Node;
      const isClickOnProfileButton = profileButtonRef.current?.contains(target);
      const isClickOnDropdown = dropdownRef.current?.contains(target);

      if (!isClickOnProfileButton && !isClickOnDropdown) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, profileButtonRef]);

  // Dropdown action handlers
  const handleLogin = () => {
    onLogin();
    onClose();
  };

  const handleLogout = async () => {
    await onLogout();
    onClose();
  };

  const handleEditProfile = () => {
    router.push('/');
    onClose();
  };

  const handleSettings = () => {
    router.push('/recover');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className="absolute top-14 right-0 z-50 min-w-[200px] origin-top-right"
        >
          {/* Backdrop blur effect */}
          <div className="absolute inset-0 -z-10 bg-white/10 backdrop-blur-sm rounded-2xl" />

          <div
            className="
  bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-pink-200/40
  overflow-hidden min-w-[200px]
  shadow-pink-200/50
"
          >
            {/* User info header - matching header gradient */}
            <div className="px-4 py-4 bg-gradient-to-r from-pink-400 to-purple-400 border-b border-pink-300/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md select-none uppercase border border-white/30">
                  {getInitials(name) || '🍽️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate drop-shadow-sm">
                    {name || 'Guest User'}
                  </p>
                  <p className="text-xs text-white/80">
                    {isAuthenticated ? 'Logged in' : 'Guest user'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu options */}
            <div className="py-2">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditProfile}
                className="
    w-full px-4 py-3 text-left flex items-center gap-3 
    text-gray-700 hover:text-pink-500 transition-colors
    border-none bg-transparent cursor-pointer
  "
              >
                <i className="fas fa-user-edit text-sm w-4 text-center text-pink-500"></i>
                <span className="text-sm font-medium">Edit Profile</span>
              </motion.button>

              <motion.button
                whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSettings}
                className="
    w-full px-4 py-3 text-left flex items-center gap-3 
    text-gray-700 hover:text-purple-500 transition-colors
    border-none bg-transparent cursor-pointer
  "
              >
                <i className="fas fa-cog text-sm w-4 text-center text-purple-400"></i>
                <span className="text-sm font-medium">Recover Data</span>
              </motion.button>

              <div className="mx-4 my-2 border-t border-gray-100"></div>

              {/* Authentication actions */}
              {isAuthenticated ? (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="
                  w-full px-4 py-3 text-left flex items-center gap-3 
                  text-gray-700 hover:text-red-500 transition-colors
                  border-none bg-transparent cursor-pointer
                "
                >
                  <i className="fas fa-sign-out-alt text-sm w-4 text-center text-red-500"></i>
                  <span className="text-sm font-medium">Logout</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  className="
                    w-full px-4 py-3 text-left flex items-center gap-3 
                    text-gray-700 hover:text-green-600 transition-colors
                    border-none bg-transparent cursor-pointer
                  "
                >
                  <i className="fas fa-sign-in-alt text-sm w-4 text-center text-green-500"></i>
                  <span className="text-sm font-medium">Login / Account</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const setTabAndNavigate = (
  tab: 'meals' | 'progress' | 'friends',
  path: string = '/',
) => {
  sessionStorage.setItem('mealapp_internal_nav', 'true');
  sessionStorage.setItem('mealapp_active_tab', tab);
  if (path !== '/') {
    window.location.href = path;
  }
};

// Make it available globally for other components
if (typeof window !== 'undefined') {
  (window as any).setTabAndNavigate = setTabAndNavigate;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main Home page component
 * Handles user authentication, meal tracking, and overall app state
 */
export default function Home() {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  // Content and UI state
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasAnimatedStreak, setHasAnimatedStreak] = useState(false);

  const [activeTab, setActiveTab] = useState<'meals' | 'progress' | 'friends'>(
    'meals',
  );

  // Enhanced tab persistence with proper initialization
  useEffect(() => {
    if (!isClient) return;

    const savedTab = sessionStorage.getItem('mealapp_active_tab') as
      | 'meals'
      | 'progress'
      | 'friends';
    if (savedTab && ['meals', 'progress', 'friends'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, [isClient]);

  // Update the persistence effect to use consistent key
  useEffect(() => {
    if (isClient) {
      sessionStorage.setItem('mealapp_active_tab', activeTab);
    }
  }, [activeTab, isClient]);

  // User and authentication state
  const [name, setName] = useState('');
  const [askName, setAskName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showNameSaved, setShowNameSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  const [showNotificationTooltip, setShowNotificationTooltip] = useState(false);

  // Recovery state tracking
  const [isAfterRecovery, setIsAfterRecovery] = useState(false);

  // Meal tracking state
  const [loggedMeals, setLoggedMeals] = useState<string[]>([]);

  // FIXED: Single declaration of friendCode state
  const [friendCode, setFriendCode] = useState<string>('');

  // Notifications and features state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Modal and dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Data merging state (for guest -> authenticated user transition)
  const [isMergingData, setIsMergingData] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [showMergeSuccess, setShowMergeSuccess] = useState(false);

  // Refs and hooks
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const hasFetchedMeals = useRef(false);

  // Use the enhanced streak hook with recovery awareness and refresh capability
  const {
    streak,
    loading: streakLoading,
    refreshStreak,
  } = useUserStreak(userId ?? undefined, isAfterRecovery);

  useUserInitialization(userId);

  const router = useRouter();

  // ========================================================================
  // DATA FETCHING FUNCTIONS
  // ========================================================================

  /**
   * Fetches user's friend code from the backend
   * @param {string} user_id - Current user identifier
   */
  const fetchFriendCode = useCallback(
    async (user_id: string): Promise<void> => {
      try {
        const response = await fetch(
          `/api/user/friend-code?user_id=${encodeURIComponent(user_id)}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.friendCode) {
          setFriendCode(data.friendCode);
        } else {
          setFriendCode('');
        }
      } catch (error) {
        console.error('Error fetching friend code:', error);
        setFriendCode('');
      }
    },
    [],
  );

  /**
   * Handles guest user continuation flow
   * Generates new user ID and prompts for name
   */
  const handleContinueAsGuest = () => {
    const newUserId = generateUserId();
    setLocalUserId(newUserId);
    setUserId(newUserId);
    setAskName(true);
  };

  /**
   * Opens login modal for user authentication
   */
  const handleLogin = () => {
    setShowLoginModal(true);
  };

  /**
   * Updated handleNotificationClick function for your homepage
   * Replace your existing function with this one
   */
  const handleNotificationClick = async () => {
    try {


      // 1. Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers not supported in this browser');
      }

      if (!('PushManager' in window)) {
        throw new Error('Push notifications not supported in this browser');
      }

      // 2. Register service worker if not already registered
      let registration;
      try {
        registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {

          registration = await navigator.serviceWorker.register(
            '/service-worker.js',
            {
              scope: '/',
            },
          );

        } else {

        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
      } catch (swError) {
        console.error('❌ Service worker registration failed:', swError);
        throw new Error('Failed to register service worker');
      }

      // 3. Request notification permission

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error(
          'Notification permission denied. Please enable notifications in your browser settings.',
        );
      }



      // 4. Create push subscription
      const vapidPublicKey =
        'BAEWVqKa9ASTlGbc7Oo_BJGAsYBtlYAS1IkI1gKMz5Ot6WnNQuP-WQ2u3sDRDV4Ca5kZQwo8aKOshT3wOrUugxk';


      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });



      // 5. Save subscription to backend WITH user_id

      const response = await fetch('/api/push/save-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          user_id: userId, // This is the key fix - include user_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend save failed:', errorData);
        throw new Error(
          `Failed to save subscription: ${errorData.error || 'Unknown error'}`,
        );
      }

      const result = await response.json();


      // 6. Update UI state
      setNotificationsEnabled(true);

      // Show success message
      alert(
        "🎉 Notifications enabled! You'll now receive encouraging reminders.",
      );
    } catch (error) {
      console.error('💥 Notification setup failed:', error);

      // Show user-friendly error message
      let errorMessage = 'Failed to enable notifications. ';

      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          errorMessage +=
            'Please enable notifications in your browser settings and try again.';
        } else if (error.message.includes('not supported')) {
          errorMessage += "Your browser doesn't support push notifications.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again or check your browser settings.';
      }

      alert(`❌ ${errorMessage}`);
    }
  };
  /**
   * Saves user name to backend and updates UI state
   */
  const handleSaveName = async () => {
    if (!tempName.trim() || !userId) return;

    const success = await saveUserName(userId, tempName.trim());
    if (success) {
      setName(tempName.trim());
      fetchQuote(tempName.trim());
      setShowNameSaved(true);
      setTimeout(() => {
        setAskName(false);
        fetchLoggedMealsAndRefreshStreak(userId);
      }, 1200);
    }
  };

  /**
   * Handles user logout and cleanup
   */
  const handleLogout = async () => {
    try {
      await signOut();
      setUserId(null);
      setName('');
      setAskName(false);
      setLoggedMeals([]);
      setIsAfterRecovery(false);
      localStorage.removeItem('user_id');

      // Clear session quote so new user gets fresh quote
      sessionStorage.removeItem('mealapp_daily_quote');
      sessionStorage.removeItem('mealapp_quote_name');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Navigates to data recovery page
   */
  const handleRecoverData = () => {
    router.push('/recover');
  };

  /**
   * Handle tab change - simplified for opacity animation
   */
  const handleTabChange = (newTab: 'meals' | 'progress' | 'friends') => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  // ========================================================================
  // UI INTERACTION HANDLERS
  // ========================================================================

  /**
   * Handles profile button click to toggle dropdown
   */
  const handleProfileClick = useCallback(() => {
    setShowProfileDropdown((prev) => !prev);
  }, []);

  /**
   * Handles closing the profile dropdown
   */
  const handleProfileClose = useCallback(() => {
    setShowProfileDropdown(false);
  }, []);

  // ========================================================================
  // DATA FETCHING FUNCTIONS
  // ========================================================================

  /**
   * Fetches personalized motivational quote from GPT API
   * Only fetches if no quote exists in session storage
   * @param {string} nameToUse - User's name for personalization
   */
  const fetchQuote = (nameToUse: string): void => {
    // Check if we already have a quote for this session
    const sessionQuote = sessionStorage.getItem('mealapp_daily_quote');
    const sessionQuoteName = sessionStorage.getItem('mealapp_quote_name');

    if (sessionQuote && sessionQuoteName === nameToUse) {
      // Use existing quote from session
      setQuote(sessionQuote);
      setLoading(false);
      return;
    }

    // No session quote or name changed - fetch new one
    setLoading(true);
    setQuote('');

    fetch(
      `/api/gpt/quote?ts=${Date.now()}&name=${encodeURIComponent(nameToUse)}`,
    )
      .then((res: Response) => res.json())
      .then((data: QuoteResponse) => {
        let safeQuote = typeof data.quote === 'string' ? data.quote : '';

        // Fallback for invalid or empty quotes
        if (
          !safeQuote ||
          safeQuote.toLowerCase().includes('undefined') ||
          safeQuote.length < 8
        ) {
          safeQuote = "You're doing amazing! One step at a time.";
        }

        setQuote(safeQuote);

        // Store in session storage for this session
        sessionStorage.setItem('mealapp_daily_quote', safeQuote);
        sessionStorage.setItem('mealapp_quote_name', nameToUse);
      })
      .catch((error) => {
        console.error('Quote fetch failed:', error);
        const fallbackQuote = "You're doing amazing! One step at a time.";
        setQuote(fallbackQuote);

        // Store fallback quote in session too
        sessionStorage.setItem('mealapp_daily_quote', fallbackQuote);
        sessionStorage.setItem('mealapp_quote_name', nameToUse);
      })
      .finally(() => setLoading(false));
  };

  /**
   * Fetches today's logged meals for the current user
   * Uses EST timezone for consistent daily boundaries
   * @param {string} user_id - Current user identifier
   */
  const fetchLoggedMeals = async (user_id: string): Promise<void> => {
    try {
      // Get today's date in EST timezone
      const now = new Date();
      const todayEst = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
      }).format(now);

      // Add timestamp to prevent caching issues
      const url = `/api/meals/check?user_id=${encodeURIComponent(user_id)}&date=${encodeURIComponent(todayEst)}&timestamp=${Date.now()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }

      const data: MealLogResponse = await res.json();

      // Parse meal log data into array of logged meal types
      if (data?.mealLog) {
        const meals: string[] = [];

        if (data.mealLog.breakfast) meals.push('breakfast');
        if (data.mealLog.lunch) meals.push('lunch');
        if (data.mealLog.dinner) meals.push('dinner');

        setLoggedMeals(meals);
      } else {
        setLoggedMeals([]);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
      setLoggedMeals([]);
    }
  };

  /**
   * Enhanced meal refresh that also updates streak
   * NOW CLEARS STREAK CACHE when meals are updated
   */
  const fetchLoggedMealsAndRefreshStreak = async (
    user_id: string,
  ): Promise<void> => {
    // Fetch meals first
    await fetchLoggedMeals(user_id);

    // Clear streak cache since meals changed
    sessionStorage.removeItem(`mealapp_streak_${user_id}`);
    sessionStorage.removeItem(`mealapp_streak_timestamp_${user_id}`);

    // Then refresh streak to get latest data
    refreshStreak();
  };
  // ========================================================================
  // EFFECT HOOKS
  // ========================================================================

  /**
   * client-side detection
   */
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * App initialization effect
   * Handles loading screen timing and content readiness
   */
  useEffect(() => {
    if (!isClient) return;

    setTimeout(() => {
      const hasShownSplashScreen = sessionStorage.getItem('mealapp_has_loaded');
      const isInternalNav = sessionStorage.getItem('mealapp_internal_nav');

      // Clear the internal nav flag
      if (isInternalNav) {
        sessionStorage.removeItem('mealapp_internal_nav');
      }

      if (!isInternalNav && !hasShownSplashScreen) {
        setContentReady(true);

        const minSplashTime = 7000;

        const timer = setTimeout(() => {
          setShowSplashScreen(false);
          sessionStorage.setItem('mealapp_has_loaded', 'true');
        }, minSplashTime);

        return () => clearTimeout(timer);
      } else {
        setShowSplashScreen(false);
        setContentReady(true);
      }
    }, 100);
  }, [isClient]);

  /**
   * Persist the active tab to localStorage whenever it changes
   * This ensures the user returns to the same tab when navigating back from other pages
   */

  useEffect(() => {
    sessionStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  /**
   * Auto-reload at midnight EST effect
   * Ensures daily data stays current across timezone boundaries
   */
  useEffect(() => {
    const msUntilMidnight = getMsUntilNextEstMidnight();
    const timeout = setTimeout(() => {
      window.location.reload();
    }, msUntilMidnight + 2000); // Add 2s buffer for timezone edge cases

    return () => clearTimeout(timeout);
  }, []);

  /**
   * Authentication state tracking effect
   * Updates UI based on current user session
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getCurrentSession();
        setIsUserAuthenticated(!!session?.user);
      } catch {
        setIsUserAuthenticated(false);
      }
    };

    if (userId) {
      checkAuth();
    }
  }, [userId]);

  /**
   * Enhanced notification state checking
   * Replace the notification checking section in your useEffect with this:
   */

  useEffect(() => {
    // Don't just check permission - check for actual subscription
    const checkNotificationState = async () => {
      try {
        // First check if notifications are supported
        if (typeof Notification === 'undefined') {
          setNotificationsEnabled(false);
          return;
        }

        // Check permission
        if (Notification.permission !== 'granted') {
          setNotificationsEnabled(false);
          return;
        }

        // Check if we have an active push subscription
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const subscription =
              await registration.pushManager.getSubscription();
            if (subscription) {
              // We have both permission AND an active subscription
              setNotificationsEnabled(true);
              return;
            }
          }
        }

        // Permission granted but no active subscription
        setNotificationsEnabled(false);
      } catch (error) {
        console.error('Error checking notification state:', error);
        setNotificationsEnabled(false);
      }
    };

    if (!userId || !contentReady) return;

    const init = async () => {
      // Load existing user name or prompt for new one
      const existingName = await getUserName(userId);
      if (!existingName) {
        setAskName(true);
      } else {
        setName(existingName);
        fetchQuote(existingName);
        fetchLoggedMealsAndRefreshStreak(userId);
        fetchFriendCode(userId);
      }

      // Check notification state properly
      await checkNotificationState();
    };

    init();
  }, [userId, contentReady, refreshStreak, fetchFriendCode]);

  /**
   * Enhanced meal data refresh effect with streak refresh
   * Handles real-time updates when app regains focus
   */
  useEffect(() => {
    if (!userId || !contentReady) return;

    const refreshMealsAndStreak = () => {
      fetchLoggedMealsAndRefreshStreak(userId);
    };

    // Initial fetch
    refreshMealsAndStreak();

    // Set up event listeners for app state changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshMealsAndStreak();
      }
    };

    const handleFocus = () => {
      refreshMealsAndStreak();
    };

    const handlePageShow = () => {
      refreshMealsAndStreak();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    // Periodic refresh for real-time updates
    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshMealsAndStreak();
      }
    }, 50000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      clearInterval(interval);
    };
  }, [userId, contentReady, refreshStreak]);

  /**
   * Initial meal fetch effect
   * Ensures meals are loaded exactly once per user session
   */
  useEffect(() => {
    if (userId && !hasFetchedMeals.current && contentReady) {
      fetchLoggedMealsAndRefreshStreak(userId);
      hasFetchedMeals.current = true;
    }
  });

  /**
   * Reset meal fetch tracking when user changes
   */
  useEffect(() => {
    hasFetchedMeals.current = false;
  }, [userId]);

  /**
   * Reset streak animation when user changes
   */
  useEffect(() => {
    setHasAnimatedStreak(false);
  }, [userId]);

  /**
   * Authentication state change handler with data merging
   * Handles guest user data migration when user authenticates
   */
  useEffect(() => {
    const initializeUser = async () => {
      if (!isClient) {
        return;
      }

      try {
        // 1. FIRST: Check if user is authenticated
        const session = await getCurrentSession();
        const localUserId = getLocalUserId();

        if (session?.user) {
          // User is authenticated - use their auth user ID


          setShowLoginModal(false);
          setIsUserAuthenticated(true);
          setUserId(session.user.id); // Set the correct user ID
          setLocalUserId(session.user.id); // Update localStorage

          // Handle data migration if needed
          if (localUserId && localUserId !== session.user.id) {
            setIsMergingData(true);
            setMergeError(null);

            try {
              const mergeResult = await mergeGuestDataToAuthUser(
                localUserId,
                session.user.id,
              );

              if (mergeResult.success && !mergeResult.skipped) {
                setShowMergeSuccess(true);
                setTimeout(() => setShowMergeSuccess(false), 3000);
              } else if (!mergeResult.success) {
                setMergeError(
                  'Some data might not have transferred completely',
                );
              }
            } catch (mergeError) {
              console.error('Data merge error:', mergeError);
              setMergeError('Data sync encountered an issue');
            } finally {
              setIsMergingData(false);
            }
          }

          // Load user name from authenticated account
          const existingName = await getAuthUserName(session.user.id);
          if (existingName) {
            setName(existingName);
            fetchQuote(existingName);
            setAskName(false);
          } else {
            setAskName(true);
          }

          // Fetch meals using the authenticated user ID
          fetchLoggedMealsAndRefreshStreak(session.user.id);
          fetchFriendCode(session.user.id); // Also fetch friend code for authenticated users
        } else {
          // 2. ONLY if not authenticated, use localStorage

          setIsUserAuthenticated(false);

          if (localUserId) {

            setUserId(localUserId);

            const existingName = await getUserName(localUserId);
            if (existingName) {
              setName(existingName);
              fetchQuote(existingName);
            }
          } else {

            // No user ID at all - will show auth prompt
          }
        }
      } catch (error) {
        console.error('Error during user initialization:', error);
        setIsUserAuthenticated(false);

        // Fallback to localStorage on error
        const localUserId = getLocalUserId();
        if (localUserId) {
          setUserId(localUserId);
        }
      }
    };

    initializeUser();
  }, [isClient, refreshStreak, fetchFriendCode]);

  /**
   * Enhanced data recovery redirect handler with streak refresh
   * Processes recovery completion and refreshes data with proper timing
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const justRecovered = urlParams.get('recovered');

    if (justRecovered && contentReady) {
      // Set recovery flag BEFORE cleaning URL to ensure streak hook gets the flag
      setIsAfterRecovery(true);

      // Clean up URL
      window.history.replaceState({}, '', '/');

      const refreshData = async () => {
        try {
          // Add initial delay to ensure backend processing is complete
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // First, check if user is authenticated and get their actual user ID
          const session = await getCurrentSession();
          let actualUserId = userId;

          if (session?.user) {
            // User is authenticated, use their auth user ID
            actualUserId = session.user.id;
            setUserId(session.user.id);
            setLocalUserId(session.user.id);
            setIsUserAuthenticated(true);
          }

          if (!actualUserId) {
            console.error('No user ID available for data refresh');
            return;
          }

          // Refresh user name from server using the correct user ID
          const nameResponse = await fetch(
            `/api/user/name?user_id=${actualUserId}`,
          );
          if (nameResponse.ok) {
            const nameData = await nameResponse.json();
            if (nameData.name) {
              setName(nameData.name);
              setAskName(false);
            }
          }

          // Refresh meals AND streak together
          await fetchLoggedMealsAndRefreshStreak(actualUserId);
          fetchFriendCode(actualUserId); // Also refresh friend code after recovery

          // Show success message
          setShowMergeSuccess(true);
          setTimeout(() => {
            setShowMergeSuccess(false);
            // Reset recovery flag after everything is loaded and success message is shown
            setIsAfterRecovery(false);
          }, 3000);
        } catch (error) {
          console.error('Error refreshing after recovery:', error);
          // Reset recovery flag on error too
          setIsAfterRecovery(false);
        }
      };

      refreshData();
    }
  }, [contentReady, userId, refreshStreak, fetchFriendCode]);

  useEffect(() => {
    if (!notificationsEnabled && userId && contentReady) {
      const hasShownTooltip = sessionStorage.getItem(
        'mealapp_notification_tooltip_shown',
      );

      if (!hasShownTooltip) {
        const showTimer = setTimeout(() => {
          setShowNotificationTooltip(true);
          sessionStorage.setItem('mealapp_notification_tooltip_shown', 'true');
        }, 1000);

        const hideTimer = setTimeout(() => {
          setShowNotificationTooltip(false);
        }, 6000);

        return () => {
          clearTimeout(showTimer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, [notificationsEnabled, userId, contentReady]);

  // Hide tooltip when notifications get enabled
  useEffect(() => {
    if (notificationsEnabled) {
      setShowNotificationTooltip(false);
    }
  }, [notificationsEnabled]);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <>
      {/* Login modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      {/* Data merging progress overlay */}
      {isMergingData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center safe-all"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <div className="text-center">
              <div className="mb-4 text-4xl">🔄</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Syncing Your Data
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We're transferring your progress to your account...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Merge error notification */}
      {mergeError && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-300 rounded-lg p-4 max-w-sm mx-4"
        >
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h4 className="text-sm font-semibold text-red-800">
                Data Sync Issue
              </h4>
              <p className="text-xs text-red-700 mt-1">{mergeError}</p>
            </div>
            <button
              onClick={() => setMergeError(null)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Success notification */}
      {showMergeSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-300 rounded-lg p-4 max-w-sm"
          style={{
            top: `calc(env(safe-area-inset-top) + 1rem)`,
          }}
        >
          <div className="flex items-center">
            <div className="text-green-600 mr-3">✅</div>
            <div>
              <h4 className="text-sm font-semibold text-green-800">
                Data Synced!
              </h4>
              <p className="text-xs text-green-700 mt-1">
                Your progress has been saved to your account.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main app content */}
      <AnimatePresence>
        {contentReady && isClient && (
          <motion.main
            className="
              min-h-[100dvh] w-full h-[100dvh] overflow-hidden
              relative flex flex-col safe-all
            "
            style={{
              paddingTop: 'calc(2rem + env(safe-area-inset-top))',
            }}
          >
            {/* 
              GRADIENT BACKGROUNDS REMOVED:
              All gradient background divs have been removed from here.
              The gradient is now handled by the HTML element in globals.css 
              for proper notch extension.
            */}

            {/* ================================================================ */}
            {/* AUTHENTICATION FLOW */}
            {/* ================================================================ */}

            {/* Show auth prompt if no user ID and login modal is closed */}
            {!userId && !showLoginModal && (
              <AuthPrompt
                onContinueAsGuest={handleContinueAsGuest}
                onLogin={handleLogin}
              />
            )}

            {/* Name input flow for new users */}
            {askName && !showNameSaved && userId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-50 flex items-center justify-center safe-x"
              >
                <div className="w-full max-w-md">
                  <div className="flex flex-col items-center mb-8">
                    <div className="mb-4 text-6xl">👩‍❤️‍💋‍👨</div>
                    <h1 className="text-center text-2xl font-bold text-pink-600 mb-3 tracking-tight">
                      Hi love 🥺 What's your name?
                    </h1>
                    <p className="text-center text-lg text-gray-600 mb-0.5">
                      I'll remember it for your daily progress!
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/40">
                    <input
                      className="
                        w-full px-6 py-4 mb-6 rounded-2xl border-none shadow-inner
                        bg-white/90 text-gray-800 text-xl
                        focus:ring-2 focus:ring-pink-300/40 outline-none transition
                        placeholder:text-gray-400
                      "
                      placeholder="Your sweet name…"
                      value={tempName}
                      maxLength={32}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      aria-label="Enter your name"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={!tempName.trim()}
                      className="
                        w-full py-4 mb-4 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-yellow-400
                        text-white text-xl font-bold shadow-lg transition 
                        hover:scale-[1.02] active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        tracking-wide focus:outline-none focus:ring-2 focus:ring-pink-300/40
                      "
                      type="button"
                    >
                      Save My Name 💌
                    </button>

                    {/* Data recovery option for authenticated users */}
                    {isUserAuthenticated && (
                      <div className="text-center">
                        <div className="mb-3 text-xs text-gray-500">or</div>
                        <button
                          onClick={handleRecoverData}
                          className="
                            w-full py-3 rounded-xl bg-white/70 backdrop-blur-sm
                            text-gray-700 text-sm font-medium border border-gray-200
                            hover:bg-white/90 hover:shadow-md transition-all
                            focus:outline-none focus:ring-2 focus:ring-blue-300/40
                          "
                          type="button"
                        >
                          <i className="fas fa-download mr-2 text-blue-500"></i>
                          Recover My Previous Data
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          Have data from before? Use your old User ID to recover
                          it.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Name saved confirmation */}
            {askName && showNameSaved && userId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-50 flex items-center justify-center safe-x"
              >
                <div className="text-center">
                  <div className="mb-6 text-6xl">💖</div>
                  <h1 className="text-3xl font-bold text-pink-500 mb-4">
                    Yay! Your name is saved, my love
                  </h1>
                  <p className="text-xl text-gray-600">
                    Let's crush your goals together!
                  </p>
                </div>
              </motion.div>
            )}

            {/* ================================================================ */}
            {/* MAIN APP INTERFACE */}
            {/* ================================================================ */}

            {!askName && userId && (
              <>
                {/* Beautiful SVG Wave Header */}
                <HomeHeader
                  name={name}
                  streak={streak}
                  quote={quote}
                  loading={loading}
                  streakLoading={streakLoading}
                  notificationsEnabled={notificationsEnabled}
                  showNotificationTooltip={showNotificationTooltip}
                  onNotificationClick={handleNotificationClick}
                  onProfileClick={handleProfileClick}
                  profileButtonRef={profileButtonRef}
                  showProfileDropdown={showProfileDropdown}
                  onProfileClose={handleProfileClose}
                  isUserAuthenticated={isUserAuthenticated}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  activeTab={activeTab}
                />
                {/* Main content area with tabs - positioned below header */}
                <div
                  className="pb-24 px-4 w-full max-w-lg mx-auto"
                  style={{ marginTop: '265px' }}
                >
                  <AnimatePresence mode="wait">
                    {/* Meals tab content */}
                    {activeTab === 'meals' && (
                      <motion.div
                        key="meals"
                        initial={{
                          opacity: 0,
                          scale: 0.95,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.95,
                          y: -5,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="pb-24"
                      >
                        <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5 text-center">
                          Meals Today
                        </span>
                        <div className="flex flex-col gap-6">
                          {mealLabels.map(({ meal, emoji, label }) => {
                            const isLogged = loggedMeals.includes(meal);
                            return (
                              <motion.div
                                key={meal}
                                whileTap={{ scale: isLogged ? 1 : 0.98 }}
                                className={`
                flex items-center px-6 py-5 rounded-2xl transition
                bg-white/95 border border-gray-100 shadow-sm
                ${
                  isLogged
                    ? 'opacity-60 pointer-events-none'
                    : 'hover:bg-pink-50 hover:shadow-lg'
                }
                cursor-pointer
              `}
                                onClick={() =>
                                  !isLogged &&
                                  router.push(`/${meal}?user_id=${userId}`)
                                }
                                tabIndex={isLogged ? -1 : 0}
                                aria-disabled={isLogged}
                                role="button"
                                onKeyDown={(e) => {
                                  if (
                                    !isLogged &&
                                    (e.key === 'Enter' || e.key === ' ')
                                  ) {
                                    router.push(`/${meal}`);
                                  }
                                }}
                              >
                                <span className="text-2xl">{emoji}</span>
                                <div className="flex-1 flex flex-col ml-4">
                                  <span className="text-base font-semibold text-gray-900">
                                    {label}
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    {isLogged
                                      ? `Logged!`
                                      : `Tap to log your ${label.toLowerCase()}`}
                                  </span>
                                </div>
                                {isLogged ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shadow-sm">
                                    <svg
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="w-4 h-4 mr-1"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 6.293a1 1 0 010 1.414l-6.364 6.364a1 1 0 01-1.414 0l-3.182-3.182a1 1 0 011.414-1.414l2.475 2.475 5.657-5.657a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Logged
                                  </span>
                                ) : (
                                  <span className="ml-2 text-gray-300 group-hover:text-pink-400 transition">
                                    <svg
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="w-5 h-5"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Progress tab content */}
                    {activeTab === 'progress' && (
                      <motion.div
                        key="progress"
                        initial={{
                          opacity: 0,
                          scale: 0.95,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.95,
                          y: -5,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="pb-24"
                      >
                        {/* Your progress content here - same as before */}
                        <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5 text-center">
                          Progress
                        </span>
                        <div className="flex flex-col gap-6">
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center px-6 py-5 rounded-2xl transition bg-white/95 border border-gray-100 shadow-sm hover:bg-pink-50 hover:shadow-lg cursor-pointer"
                            onClick={() => router.push('/summaries')}
                            tabIndex={0}
                            role="button"
                          >
                            <span className="text-2xl">📋</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                View My Summaries
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                See your AI-powered meal recaps!
                              </span>
                            </div>
                            <span className="text-gray-300">
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center px-6 py-5 rounded-2xl transition bg-white/95 border border-gray-100 shadow-sm hover:bg-green-50 hover:shadow-lg cursor-pointer"
                            onClick={() => router.push('/meals')}
                            tabIndex={0}
                            role="button"
                          >
                            <span className="text-2xl">🥗</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                Nutritional Analysis
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                Detailed nutrition insights for your meals
                              </span>
                            </div>
                            <span className="text-gray-300">
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center px-6 py-5 rounded-2xl transition bg-white/95 border border-gray-100 shadow-sm hover:bg-orange-50 hover:shadow-lg cursor-pointer"
                            onClick={() => router.push('/streaks')}
                            tabIndex={0}
                            role="button"
                          >
                            <span className="text-2xl">🏆</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                View My Streaks
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                {streak > 0
                                  ? `Current streak: ${streak} day${streak > 1 ? 's' : ''}!`
                                  : 'See all your achievement milestones!'}
                              </span>
                            </div>
                            <span className="text-gray-300">
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* Friends tab content */}
                    {activeTab === 'friends' && (
                      <motion.div
                        key="friends"
                        initial={{
                          opacity: 0,
                          scale: 0.95,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.95,
                          y: -5,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="pb-24"
                      >
                        <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5 text-center">
                          Friends & Support
                        </span>
                        <div className="flex flex-col gap-6">
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center px-6 py-5 rounded-2xl transition bg-white/95 border border-gray-100 shadow-sm hover:bg-purple-50 hover:shadow-lg cursor-pointer"
                            onClick={() => router.push('/friends-list')}
                            tabIndex={0}
                            role="button"
                          >
                            <span className="text-2xl">👥</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                My Friends
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                View your friends and their progress
                              </span>
                            </div>
                            <span className="text-gray-300">
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center px-6 py-5 rounded-2xl transition bg-white/95 border border-gray-100 shadow-sm hover:bg-blue-50 hover:shadow-lg cursor-pointer"
                            onClick={() => router.push('/friends')}
                            tabIndex={0}
                            role="button"
                          >
                            <span className="text-2xl">⚙️</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                Manage Friends
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                Add & manage connections
                              </span>
                            </div>
                            <span className="text-gray-300">
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center px-6 py-5 rounded-2xl transition bg-white/95 border border-gray-100 shadow-sm hover:bg-pink-50 hover:shadow-lg cursor-pointer"
                            onClick={() => router.push('/notes')}
                            tabIndex={0}
                            role="button"
                          >
                            <span className="text-2xl">💌</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                Encouragement Notes
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                View supportive messages from your friends
                              </span>
                            </div>
                            <span className="text-gray-300">
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ============================================================ */}
                {/* BOTTOM NAVIGATION TABS */}
                {/* ============================================================ */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe-bottom">
                  <div className="w-full max-w-lg mx-auto safe-x py-2">
                    <div className="flex items-center justify-around">
                      {/* Meals tab */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTabChange('meals')}
                        className={`
                        flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-300
                        ${
                          activeTab === 'meals'
                            ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-600'
                        }
                      `}
                      >
                        <svg
                          className={`w-5 h-5 mb-1 ${activeTab === 'meals' ? 'text-white' : 'text-gray-400'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span
                          className={`text-xs font-medium ${activeTab === 'meals' ? 'text-white' : 'text-gray-400'}`}
                        >
                          Meals
                        </span>
                      </motion.button>

                      {/* Progress tab */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTabChange('progress')}
                        className={`
                        flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-300
                        ${
                          activeTab === 'progress'
                            ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-600'
                        }
                      `}
                      >
                        <svg
                          className={`w-5 h-5 mb-1 ${activeTab === 'progress' ? 'text-white' : 'text-gray-400'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <span
                          className={`text-xs font-medium ${activeTab === 'progress' ? 'text-white' : 'text-gray-400'}`}
                        >
                          Progress
                        </span>
                      </motion.button>

                      {/* Friends tab */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTabChange('friends')}
                        className={`
                        flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-300
                        ${
                          activeTab === 'friends'
                            ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-600'
                        }
                      `}
                      >
                        <svg
                          className={`w-5 h-5 mb-1 ${activeTab === 'friends' ? 'text-white' : 'text-gray-400'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span
                          className={`text-xs font-medium ${activeTab === 'friends' ? 'text-white' : 'text-gray-400'}`}
                        >
                          Friends
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}
