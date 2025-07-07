'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

// Actual API functions using your endpoints with better error handling
const fetchUserData = async (userId: string) => {
  try {
    const response = await fetch(`/api/user/name?user_id=${userId}`);
    if (!response.ok) {
      console.error(
        `User API failed: ${response.status} ${response.statusText}`,
      );
      throw new Error(`User not found (${response.status})`);
    }
    return response.json();
  } catch (error) {
    console.error('fetchUserData error:', error);
    throw error;
  }
};

const fetchUserMeals = async (userId: string, date: string) => {
  try {
    const url = `/api/meals/check?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}&timestamp=${Date.now()}`;
    console.log('Fetching meals from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Meals API failed: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `Failed to fetch meals (${response.status}): ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.error('fetchUserMeals error:', error);
    throw error;
  }
};

const fetchUserStreak = async (userId: string) => {
  try {
    const response = await fetch(
      `/api/streak?user_id=${userId}&t=${Date.now()}`,
    );
    if (!response.ok) {
      console.error(
        `Streak API failed: ${response.status} ${response.statusText}`,
      );
      throw new Error(`Failed to fetch streak (${response.status})`);
    }
    return response.json();
  } catch (error) {
    console.error('fetchUserStreak error:', error);
    throw error;
  }
};

const fetchUserQuote = async (userName: string) => {
  try {
    const response = await fetch(
      `/api/gpt/quote?ts=${Date.now()}&name=${encodeURIComponent(userName)}`,
    );
    if (!response.ok) {
      console.error(
        `Quote API failed: ${response.status} ${response.statusText}`,
      );
      throw new Error(`Failed to fetch quote (${response.status})`);
    }
    return response.json();
  } catch (error) {
    console.error('fetchUserQuote error:', error);
    throw error;
  }
};

// Utility functions from your original code
const mealLabels = [
  { meal: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { meal: 'lunch', emoji: '🫐', label: 'Lunch' },
  { meal: 'dinner', emoji: '🍜', label: 'Dinner' },
];

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

/**
 * Fixed calculateStreak function that properly handles streaks
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

function highlightQuote(quote: string): string {
  const highlights = [
    { regex: /self-care/gi, className: 'text-pink-500 font-semibold' },
    { regex: /progress/gi, className: 'text-purple-500 font-semibold' },
    { regex: /small steps/gi, className: 'text-yellow-500 font-semibold' },
    { regex: /amazing/gi, className: 'text-green-500 font-semibold' },
    { regex: /love/gi, className: 'text-red-500 font-semibold' },
    { regex: /motivation/gi, className: 'text-blue-500 font-semibold' },
    { regex: /healthy/gi, className: 'text-teal-500 font-semibold' },
    { regex: /victory/gi, className: 'text-teal-500 font-semibold' },
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

function UserLandingPage({
  userId,
  userName,
  loggedMeals,
  streak,
  quote,
  quoteLoading,
}: {
  userId: string;
  userName: string;
  loggedMeals: string[];
  streak: number;
  quote: string;
  quoteLoading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'meals' | 'progress'>('meals');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full relative pt-8 flex flex-col"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 2rem)',
      }}
    >
      {/* Animated gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -10,
          width: '100vw',
          height: '100vh',
          minHeight: '100vh',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5ede6] via-[#f7edf5] to-[#d8d8f0]" />
        <div className="absolute inset-0 animate-gradient-1 bg-gradient-to-tr from-[#f7edf5] via-[#d8d8f0] to-[#f2e8e8]" />
        <div className="absolute inset-0 animate-gradient-2 bg-gradient-to-bl from-[#d8d8f0] via-[#f2e8e8] to-[#f5ede6]" />
        <div className="absolute inset-0 animate-gradient-3 bg-gradient-to-tl from-[#f2e8e8] via-[#f5ede6] to-[#f7edf5]" />
      </div>

      {/* Header with greeting and profile */}
      <div className="w-full max-w-lg mx-auto px-4 flex flex-row items-center justify-between mb-8">
        <div className="flex flex-col">
          <span className="text-[1.5rem] font-bold text-gray-900 leading-snug flex items-center gap-1">
            {userName ? (
              <>
                Hello, {userName.split(' ')[0]} <span className="ml-1">👋</span>
              </>
            ) : (
              'Hello! 👋'
            )}
          </span>
          {/* Streak indicator - now properly displays with fixed calculation */}
          {streak > 0 && (
            <motion.span
              key={streak}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 18,
              }}
              className="flex items-center mt-1 text-[1rem] font-medium text-gray-700 pl-1"
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mr-2" />
              <span>
                {streak} day{streak > 1 && 's'} streak!
              </span>
            </motion.span>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg select-none uppercase">
            {getInitials(userName) || '🍽️'}
          </div>
        </div>
      </div>

      {/* Motivational quote section */}
      <div className="w-full max-w-lg mx-auto px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="
            relative flex items-start px-6 py-5 rounded-2xl shadow-xl shadow-pink-100/40
            bg-gradient-to-tr from-[#fff3fc] via-[#f9f3fd] to-[#e7ffe7] border border-white/60
            min-h-[72px] z-10 w-full
            before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-2xl
            before:bg-gradient-to-tr before:from-pink-200/40 before:via-purple-100/40 before:to-yellow-100/40
            before:blur-2xl
          "
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-50 text-xl mr-4 ml-0 flex-shrink-0 mt-0.5">
            💡
          </span>
          {quoteLoading || !quote ? (
            <span className="animate-pulse text-base font-normal italic text-gray-400 flex-1">
              Loading motivation…
            </span>
          ) : (
            <span
              className="font-semibold text-[1.11rem] sm:text-lg leading-snug text-gray-800 break-words flex-1"
              dangerouslySetInnerHTML={{
                __html: highlightQuote(quote),
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Main content area with tabs */}
      <div className="w-full max-w-lg mx-auto px-4 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Meals tab content */}
          {activeTab === 'meals' && (
            <motion.div
              key="meals"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="pb-24"
            >
              <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
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
                              d="M10.293 15.707a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586V3a1 1 0 10-2 0v9.586l-4.293-4.293a1 1 0 10-1.414 1.414l5 5z"
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="pb-24"
            >
              <span className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
                Progress
              </span>
              <div className="flex flex-col gap-6">
                {/* Summaries navigation */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex items-center px-6 py-5 rounded-2xl transition
                    bg-white/95 border border-gray-100 shadow-sm
                    hover:bg-pink-50 hover:shadow-lg
                    cursor-pointer
                  `}
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
                  <span className="ml-2 text-gray-300 group-hover:text-pink-400 transition">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 15.707a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586V3a1 1 0 10-2 0v9.586l-4.293-4.293a1 1 0 10-1.414 1.414l5 5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </motion.div>

                {/* Streaks navigation - now shows correct streak value */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex items-center px-6 py-5 rounded-2xl transition
                    bg-white/95 border border-gray-100 shadow-sm
                    hover:bg-orange-50 hover:shadow-lg
                    cursor-pointer
                  `}
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
                  <span className="ml-2 text-gray-300 group-hover:text-orange-400 transition">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 15.707a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 12.586V3a1 1 0 10-2 0v9.586l-4.293-4.293a1 1 0 10-1.414 1.414l5 5z"
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

      {/* Bottom navigation tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-2 safe-area-pb">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex items-center justify-around">
            {/* Meals tab */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('meals')}
              className={`
                flex flex-col items-center justify-center py-3 px-6 rounded-2xl transition-all duration-300
                ${
                  activeTab === 'meals'
                    ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <i
                className={`fas fa-utensils text-xl mb-1 ${activeTab === 'meals' ? 'text-white' : 'text-gray-400'}`}
              ></i>
              <span
                className={`text-xs font-medium ${activeTab === 'meals' ? 'text-white' : 'text-gray-400'}`}
              >
                Meals
              </span>
            </motion.button>

            {/* Progress tab */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('progress')}
              className={`
                flex flex-col items-center justify-center py-3 px-6 rounded-2xl transition-all duration-300
                ${
                  activeTab === 'progress'
                    ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <i
                className={`fas fa-chart-line text-xl mb-1 ${activeTab === 'progress' ? 'text-white' : 'text-gray-400'}`}
              ></i>
              <span
                className={`text-xs font-medium ${activeTab === 'progress' ? 'text-white' : 'text-gray-400'}`}
              >
                Progress
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Global styles for gradient animations */}
      <style jsx global>{`
        @keyframes gradient-fade-1 {
          0%,
          100% {
            opacity: 0;
          }
          25% {
            opacity: 0.6;
          }
          50% {
            opacity: 0;
          }
        }

        @keyframes gradient-fade-2 {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          75% {
            opacity: 0;
          }
        }

        @keyframes gradient-fade-3 {
          0%,
          25% {
            opacity: 0;
          }
          75% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
          }
        }

        .animate-gradient-1 {
          animation: gradient-fade-1 12s ease-in-out infinite;
          opacity: 0;
        }

        .animate-gradient-2 {
          animation: gradient-fade-2 12s ease-in-out infinite 4s;
          opacity: 0;
        }

        .animate-gradient-3 {
          animation: gradient-fade-3 12s ease-in-out infinite 8s;
          opacity: 0;
        }
      `}</style>
    </motion.div>
  );
}

// Main Admin Component
export default function AdminUserView() {
  const [inputUserId, setInputUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User state
  const [userName, setUserName] = useState('');
  const [loggedMeals, setLoggedMeals] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [quote, setQuote] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);

  const loadUserView = async () => {
    if (!inputUserId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    setLoading(true);
    setError('');
    setCurrentUserId('');

    console.log('Loading user view for:', inputUserId.trim());

    try {
      // Get today's date in EST timezone
      const todayEst = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
      }).format(new Date());

      console.log('Today EST date:', todayEst);

      // Fetch user data step by step with better error handling
      let userResponse, mealsResponse, streakResponse;

      // Step 1: Fetch user data
      try {
        console.log('Fetching user data...');
        userResponse = await fetchUserData(inputUserId.trim());
        console.log('User data:', userResponse);
      } catch (err: any) {
        console.error('User fetch failed:', err);
        setError(`Failed to find user: ${err.message}`);
        return;
      }

      // Step 2: Fetch meals data
      try {
        console.log('Fetching meals data...');
        mealsResponse = await fetchUserMeals(inputUserId.trim(), todayEst);
        console.log('Meals data:', mealsResponse);
      } catch (err: any) {
        console.error('Meals fetch failed:', err);
        // Continue without meals data
        mealsResponse = { mealLog: null };
      }

      // Step 3: Fetch streak data with cache busting
      try {
        console.log('Fetching streak data...');
        streakResponse = await fetchUserStreak(inputUserId.trim());
        console.log('Streak data:', streakResponse);
      } catch (err: any) {
        console.error('Streak fetch failed:', err);
        // Continue without streak data
        streakResponse = { dates: [] };
      }

      const name = userResponse.name || '';
      setUserName(name);

      // Parse meal log data into array of logged meal types
      const meals: string[] = [];
      if (mealsResponse?.mealLog) {
        if (mealsResponse.mealLog.breakfast) meals.push('breakfast');
        if (mealsResponse.mealLog.lunch) meals.push('lunch');
        if (mealsResponse.mealLog.dinner) meals.push('dinner');
      }
      setLoggedMeals(meals);

      // Calculate streak from dates array using the FIXED calculation
      const streakCount = calculateStreak(streakResponse.dates || []);
      console.log(
        'Calculated streak:',
        streakCount,
        'from dates:',
        streakResponse.dates,
      );
      setStreak(streakCount);

      // Fetch personalized quote if user has a name
      if (name) {
        setQuoteLoading(true);
        try {
          console.log('Fetching quote for:', name);
          const quoteResponse = await fetchUserQuote(name);
          let safeQuote =
            typeof quoteResponse.quote === 'string' ? quoteResponse.quote : '';

          // Fallback for invalid or empty quotes
          if (
            !safeQuote ||
            safeQuote.toLowerCase().includes('undefined') ||
            safeQuote.length < 8
          ) {
            safeQuote = "You're doing amazing! One step at a time.";
          }
          setQuote(safeQuote);
        } catch (err: any) {
          console.error('Quote fetch failed:', err);
          setQuote("You're doing amazing! One step at a time.");
        } finally {
          setQuoteLoading(false);
        }
      } else {
        setQuote("You're doing amazing! One step at a time.");
      }

      setCurrentUserId(inputUserId.trim());
      console.log('Successfully loaded user view');
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setCurrentUserId('');
    setInputUserId('');
    setUserName('');
    setLoggedMeals([]);
    setStreak(0);
    setQuote('');
    setError('');
    setQuoteLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* External CSS dependencies */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      {!currentUserId ? (
        // Admin input screen
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="mb-4 text-4xl">👨‍💼</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Admin User View
                </h1>
                <p className="text-gray-600">
                  Enter a user ID to see their landing page view
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={inputUserId}
                    onChange={(e) => setInputUserId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUserView()}
                    placeholder="Enter user ID..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-3"
                  >
                    <p className="text-red-600 text-sm flex items-center">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      {error}
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={loadUserView}
                  disabled={loading || !inputUserId.trim()}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading User View...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-eye mr-2"></i>
                      View User Landing Page
                    </span>
                  )}
                </button>

                {/* Debug info for admin */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Debug Info
                  </h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      • Streak calculation now handles yesterday's logs properly
                    </p>
                    <p>• Cache busting added to streak API calls</p>
                    <p>• Fixed logic for consecutive day counting</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // User landing page view
        <div className="relative">
          {/* Admin header with debug info */}
          <div className="bg-gray-900 text-white p-4 sticky top-0 z-50 shadow-lg">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <div>
                <h2 className="font-semibold flex items-center">
                  <i className="fas fa-user-secret mr-2"></i>
                  Admin View
                </h2>
                <p className="text-sm text-gray-300">
                  User ID: <span className="font-mono">{currentUserId}</span>
                </p>
                {/* Debug streak info */}
                <p className="text-xs text-green-300">
                  Streak: {streak} days {streak > 0 ? '✅' : '❌'}
                </p>
              </div>
              <button
                onClick={resetView}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition flex items-center"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </button>
            </div>
          </div>

          {/* User's landing page */}
          <UserLandingPage
            userId={currentUserId}
            userName={userName}
            loggedMeals={loggedMeals}
            streak={streak}
            quote={quote}
            quoteLoading={quoteLoading}
          />
        </div>
      )}
    </div>
  );
}
