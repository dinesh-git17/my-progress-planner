'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type MealLog = {
  id: string;
  created_at: string;
  user_id: string;
  date: string;
  name?: string;
  breakfast: any;
  lunch: any;
  dinner: any;
  breakfast_gpt?: string[] | null;
  lunch_gpt?: string[] | null;
  dinner_gpt?: string[] | null;
};

function renderMeal(meal: any) {
  if (!meal || (Array.isArray(meal) && meal.length === 0)) {
    return <span className="italic text-gray-400">—</span>;
  }

  if (typeof meal === 'string') {
    try {
      meal = JSON.parse(meal);
    } catch {
      return <span>{meal}</span>;
    }
  }

  if (Array.isArray(meal)) {
    return (
      <ul className="list-disc pl-4 space-y-1">
        {meal.map((item, idx) => (
          <li key={idx} className="text-gray-700">
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return <span>{JSON.stringify(meal)}</span>;
}

function renderGptResponse(responses: string[] | null | undefined) {
  if (!responses || responses.length === 0) {
    return <span className="italic text-gray-400">—</span>;
  }

  return (
    <ul className="list-disc pl-4 space-y-1 text-sm text-pink-700">
      {responses.map((line, idx) => (
        <li key={idx} className="leading-snug">
          {line}
        </li>
      ))}
    </ul>
  );
}

export default function AdminPage() {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [selectedName, setSelectedName] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Handle content timing to match homepage
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchLogs = () => {
      // Multiple cache-busting parameters
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      setLastRefresh(new Date());

      fetch(`/api/admin/log-meal?timestamp=${timestamp}&r=${random}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log(
            `[ADMIN_LOGS] Fetched ${data.logs?.length || 0} logs at ${new Date().toISOString()}`,
          );
          const logsData = data.logs || [];
          setLogs(logsData);
        })
        .catch((error) => {
          console.error('Error fetching logs:', error);
        })
        .finally(() => setLoading(false));
    };

    // Initial fetch
    fetchLogs();

    // Fetch data every 30 seconds
    const intervalId = setInterval(fetchLogs, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Filter logs based on selected name
  useEffect(() => {
    if (selectedName === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter((log) => log.name === selectedName));
    }
  }, [logs, selectedName]);

  const uniqueNames = Array.from(
    new Set(logs.map((log) => log.name).filter(Boolean)),
  );

  const handleLogToggle = (logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    // Parse as local date to avoid timezone shifts
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  const mealEmojis = {
    breakfast: '🍳',
    lunch: '🫐',
    dinner: '🍜',
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: contentReady ? 1 : 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="
        min-h-[100dvh] w-full overflow-hidden
        relative pt-8 md:pt-12 pb-8
      "
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 2rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)',
      }}
    >
      {/* Same Dynamic Animated Gradient Background as Homepage */}
      <div
        className="fixed -z-10"
        style={{
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          width:
            'calc(100vw + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
          height:
            'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
          minHeight:
            'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5ede6] via-[#f7edf5] to-[#d8d8f0]" />

        {/* Animated overlay layers */}
        <div className="absolute inset-0 opacity-0 animate-gradient-1 bg-gradient-to-tr from-[#f7edf5] via-[#d8d8f0] to-[#f2e8e8]" />
        <div className="absolute inset-0 opacity-0 animate-gradient-2 bg-gradient-to-bl from-[#d8d8f0] via-[#f2e8e8] to-[#f5ede6]" />
        <div className="absolute inset-0 opacity-0 animate-gradient-3 bg-gradient-to-tl from-[#f2e8e8] via-[#f5ede6] to-[#f7edf5]" />
      </div>

      <style jsx>{`
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
        }

        .animate-gradient-2 {
          animation: gradient-fade-2 12s ease-in-out infinite 4s;
        }

        .animate-gradient-3 {
          animation: gradient-fade-3 12s ease-in-out infinite 8s;
        }
      `}</style>

      {/* Content Container */}
      <div className="w-full max-w-6xl mx-auto px-4 h-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: contentReady ? 1 : 0,
            y: contentReady ? 0 : 10,
          }}
          transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
          className="mb-8"
        >
          <div
            className="
            relative flex flex-col items-center px-6 py-6 rounded-2xl shadow-xl shadow-pink-100/40
            bg-gradient-to-tr from-[#fff3fc] via-[#f9f3fd] to-[#e7ffe7] border border-white/60
            before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-2xl
            before:bg-gradient-to-tr before:from-pink-200/40 before:via-purple-100/40 before:to-yellow-100/40
            before:blur-2xl
          "
          >
            <h1 className="text-2xl md:text-3xl font-bold text-pink-600 text-center mb-2 tracking-tight">
              📋 Meal Logs Admin
            </h1>
            <p className="text-sm text-gray-600 text-center mb-4">
              Last updated: {formatTime(lastRefresh)}
            </p>

            {/* Filter Control */}
            <div className="w-full max-w-xs mx-auto">
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Filter by User
              </label>
              <div className="relative">
                <select
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="
                    w-full px-4 py-3 rounded-xl border-none shadow-inner
                    bg-white/90 text-gray-800 text-sm font-medium
                    focus:ring-2 focus:ring-pink-300/40 outline-none transition
                    appearance-none cursor-pointer
                  "
                >
                  <option value="all">All Users ({logs.length})</option>
                  {uniqueNames.map((name) => {
                    const count = logs.filter(
                      (log) => log.name === name,
                    ).length;
                    return (
                      <option key={name} value={name}>
                        {name} ({count})
                      </option>
                    );
                  })}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Filter Display */}
            {selectedName !== 'all' && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-medium">
                  👤 {selectedName}
                  <button
                    onClick={() => setSelectedName('all')}
                    className="ml-1 hover:text-pink-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: contentReady ? 1 : 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          className="flex-1 overflow-y-auto"
        >
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="flex justify-center space-x-1.5 mb-4"
              >
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
              </motion.div>
              <span className="text-lg font-medium text-gray-600">
                Loading logs…
              </span>
            </motion.div>
          ) : filteredLogs.length === 0 ? (
            <div
              className="
                flex flex-col items-center justify-center py-16 px-6 rounded-2xl
                bg-white/95 border border-gray-100 shadow-sm
              "
            >
              <div className="text-4xl mb-4">
                {logs.length === 0 ? '📭' : '🔍'}
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {logs.length === 0 ? 'No logs yet' : 'No results found'}
              </h2>
              <p className="text-gray-600 text-center">
                {logs.length === 0
                  ? 'Meal logs will appear here as users log their meals.'
                  : 'Try adjusting your filter to see more results.'}
              </p>
              {logs.length > 0 && (
                <button
                  onClick={() => setSelectedName('all')}
                  className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-medium hover:scale-105 transition-transform"
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">
                  Showing {filteredLogs.length} of {logs.length} logs
                </span>
              </div>
              {filteredLogs.map((log, index) => (
                <div
                  key={`${log.id}-${index}`}
                  className="
                    relative px-6 py-6 rounded-2xl shadow-lg shadow-pink-50/50
                    bg-white/95 border border-gray-100
                    hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300
                  "
                >
                  {/* User Header */}
                  <div
                    className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 cursor-pointer"
                    onClick={() => handleLogToggle(log.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm">
                        {(log.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {log.name || 'Unknown User'}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {/* ✅ Always use the date field consistently */}
                          {formatDate(log.date)}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      className={`transform transition-transform duration-200 ${
                        expandedLogId === log.id ? 'rotate-180' : ''
                      }`}
                    >
                      <svg
                        className="w-5 h-5 text-pink-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.div>
                  </div>

                  {/* Expanded Content */}
                  {expandedLogId === log.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {(['breakfast', 'lunch', 'dinner'] as const).map(
                        (mealType) => {
                          const meal = log[mealType];
                          const gptResponse = log[
                            `${mealType}_gpt` as keyof MealLog
                          ] as string[] | null;

                          if (
                            !meal &&
                            (!gptResponse || gptResponse.length === 0)
                          )
                            return null;

                          return (
                            <div
                              key={mealType}
                              className="bg-gray-50/50 rounded-xl p-4"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">
                                  {mealEmojis[mealType]}
                                </span>
                                <span className="font-semibold text-gray-800 capitalize">
                                  {mealType}
                                </span>
                              </div>

                              {meal && (
                                <div className="mb-3 pl-7">
                                  <div className="text-sm font-medium text-gray-600 mb-1">
                                    Food Items:
                                  </div>
                                  {renderMeal(meal)}
                                </div>
                              )}

                              {gptResponse && gptResponse.length > 0 && (
                                <div className="pl-7">
                                  <div className="text-sm font-medium text-pink-600 mb-1">
                                    AI Analysis:
                                  </div>
                                  {renderGptResponse(gptResponse)}
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.main>
  );
}
