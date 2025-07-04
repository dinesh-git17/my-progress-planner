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
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

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

interface HighlightedWord {
  regex: RegExp;
  className: string;
}

function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let streak = 0;
  let compare = new Date(today);
  for (const dateStr of dates) {
    const logDate = new Date(dateStr + 'T00:00:00Z');
    if (logDate.getTime() === compare.getTime()) {
      streak += 1;
      compare.setUTCDate(compare.getUTCDate() - 1);
    } else if (logDate.getTime() < compare.getTime()) {
      break;
    }
  }
  return streak;
}

function useUserStreak(user_id?: string) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user_id) return;
    setLoading(true);
    fetch(`/api/streak?user_id=${user_id}`)
      .then((res) => res.json())
      .then(({ dates }) => setStreak(calculateStreak(dates ?? [])))
      .catch((err) => {
        setStreak(0);
      })
      .finally(() => setLoading(false));
  }, [user_id]);

  return { streak, loading };
}

function highlightQuote(quote: string): string {
  const highlights: HighlightedWord[] = [
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

async function mergeGuestDataToAuthUser(
  guestUserId: string,
  authUserId: string,
) {
  try {
    if (guestUserId === authUserId) {
      return { success: true, skipped: true };
    }

    const guestName = await getUserName(guestUserId);

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

    if (guestName && !mergeResult.skipped) {
      const nameTransferSuccess = await saveUserName(authUserId, guestName);
      if (!nameTransferSuccess) {
        console.error('Failed to transfer name');
      }
    }

    setLocalUserId(authUserId);

    return {
      success: true,
      details: mergeResult.details,
      nameTransferred: !!guestName,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      fallback: true,
    };
  }
}

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

  const handleLogin = () => {
    onLogin();
    onClose();
  };

  const handleLogout = async () => {
    await onLogout();
    onClose();
  };

  const handleEditProfile = () => {
    onClose();
  };

  const handleSettings = () => {
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
          <div className="absolute inset-0 -z-10 bg-white/10 backdrop-blur-sm rounded-2xl" />

          <div
            className="
            bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60
            overflow-hidden min-w-[200px]
            shadow-pink-100/40
          "
          >
            <div className="px-4 py-4 bg-gradient-to-r from-pink-50 to-yellow-50 border-b border-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md select-none uppercase">
                  {getInitials(name) || '🍽️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {name || 'Guest User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAuthenticated ? 'Logged in' : 'Guest user'}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-2">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(249, 168, 212, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditProfile}
                className="
                  w-full px-4 py-3 text-left flex items-center gap-3 
                  text-gray-700 hover:text-pink-600 transition-colors
                  border-none bg-transparent cursor-pointer
                "
              >
                <i className="fas fa-user-edit text-sm w-4 text-center text-pink-500"></i>
                <span className="text-sm font-medium">Edit Profile</span>
              </motion.button>

              <motion.button
                whileHover={{ backgroundColor: 'rgba(168, 162, 250, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSettings}
                className="
                  w-full px-4 py-3 text-left flex items-center gap-3 
                  text-gray-700 hover:text-purple-600 transition-colors
                  border-none bg-transparent cursor-pointer
                "
              >
                <i className="fas fa-cog text-sm w-4 text-center text-purple-500"></i>
                <span className="text-sm font-medium">Settings</span>
              </motion.button>

              <div className="mx-4 my-2 border-t border-gray-100"></div>

              {isAuthenticated ? (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="
                    w-full px-4 py-3 text-left flex items-center gap-3 
                    text-gray-700 hover:text-red-600 transition-colors
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

function LoadingScreen({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="loading-screen-image flex flex-col items-center justify-center"
        >
          <div className="flex-1" />

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="relative z-10 text-center px-6 pb-16"
          >
            <h1
              className="text-lg font-light text-gray-600 mb-3 tracking-wide"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", Arial, sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              loading your meals
            </h1>
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex justify-center space-x-1.5"
            >
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [askName, setAskName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showNameSaved, setShowNameSaved] = useState(false);
  const [loggedMeals, setLoggedMeals] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'meals' | 'progress'>('meals');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMergingData, setIsMergingData] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [showMergeSuccess, setShowMergeSuccess] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const { streak, loading: streakLoading } = useUserStreak(userId ?? undefined);
  const router = useRouter();
  const hasFetchedMeals = useRef(false);

  const handleContinueAsGuest = () => {
    const newUserId = generateUserId();
    setLocalUserId(newUserId);
    setUserId(newUserId);
    setAskName(true);
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  const handleNotificationClick = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('Notification permission denied');

      const vapidPublicKey =
        'BAEWVqKa9ASTlGbc7Oo_BJGAsYBtlYAS1IkI1gKMz5Ot6WnNQuP-WQ2u3sDRDV4Ca5kZQwo8aKOshT3wOrUugxk';

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const response = await fetch('/api/push/save-subscription', {
        method: 'POST',
        body: JSON.stringify({
          subscription,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      setNotificationsEnabled(true);
      alert('🎉 Notifications enabled!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // App initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
      setTimeout(() => setContentReady(true), 100);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-reload at midnight EST
  useEffect(() => {
    const msUntilMidnight = getMsUntilNextEstMidnight();
    const timeout = setTimeout(() => {
      window.location.reload();
    }, msUntilMidnight + 2000);

    return () => clearTimeout(timeout);
  }, []);

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

  // Initialize user ID from localStorage
  useEffect(() => {
    const localUserId = getLocalUserId();
    if (localUserId) {
      setUserId(localUserId);
    }
  }, []);

  // Initialize app data when user ID and content are ready
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    if (!userId || !contentReady) return;

    const init = async () => {
      const existingName = await getUserName(userId);
      if (!existingName) {
        setAskName(true);
      } else {
        setName(existingName);
        fetchQuote(existingName);
        fetchLoggedMeals(userId);
      }

      // Check for existing push subscription
      try {
        if (
          'serviceWorker' in navigator &&
          Notification.permission === 'granted'
        ) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const subscription =
              await registration.pushManager.getSubscription();
            if (subscription) {
              setNotificationsEnabled(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing push subscription:', error);
      }
    };

    init();
  }, [userId, contentReady]);

  // Refresh meals data on visibility changes
  useEffect(() => {
    if (!userId || !contentReady) return;

    const refreshMeals = () => {
      fetchLoggedMeals(userId);
    };

    refreshMeals();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshMeals();
      }
    };

    const handleFocus = () => {
      refreshMeals();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      refreshMeals();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshMeals();
      }
    }, 50000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      clearInterval(interval);
    };
  }, [userId, contentReady]);

  useEffect(() => {
    if (userId && !hasFetchedMeals.current && contentReady) {
      fetchLoggedMeals(userId);
      hasFetchedMeals.current = true;
    }
  });

  useEffect(() => {
    hasFetchedMeals.current = false;
  }, [userId]);

  interface QuoteResponse {
    quote?: string;
  }

  // Handle authentication state changes with data merging
  useEffect(() => {
    const handleAuthStateChange = async () => {
      if (!contentReady) {
        return;
      }

      try {
        const session = await getCurrentSession();
        const localUserId = getLocalUserId();

        if (session?.user) {
          setShowLoginModal(false);

          // Check if user had existing guest data that needs to be merged
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
              setMergeError('Data sync encountered an issue');
            } finally {
              setIsMergingData(false);
            }
          }

          setUserId(session.user.id);
          setLocalUserId(session.user.id);

          const existingName = await getAuthUserName(session.user.id);
          if (existingName) {
            setName(existingName);
            setAskName(false);
            fetchQuote(existingName);
          } else {
            setAskName(true);
          }

          fetchLoggedMeals(session.user.id);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    handleAuthStateChange();
  }, [contentReady]);

  // Handle data recovery redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const justRecovered = urlParams.get('recovered');

    if (justRecovered && userId && contentReady) {
      window.history.replaceState({}, '', '/');

      const refreshData = async () => {
        try {
          const nameResponse = await fetch(`/api/user/name?user_id=${userId}`);
          if (nameResponse.ok) {
            const nameData = await nameResponse.json();
            if (nameData.name) {
              setName(nameData.name);
              setAskName(false);
              fetchQuote(nameData.name);
            }
          }

          fetchLoggedMeals(userId);

          setShowMergeSuccess(true);
          setTimeout(() => setShowMergeSuccess(false), 3000);
        } catch (error) {
          console.error('Error refreshing after recovery:', error);
        }
      };

      refreshData();
    }
  }, [userId, contentReady]);

  const fetchQuote = (nameToUse: string): void => {
    setLoading(true);
    setQuote('');
    fetch(
      `/api/gpt/quote?ts=${Date.now()}&name=${encodeURIComponent(nameToUse)}`,
    )
      .then((res: Response) => res.json())
      .then((data: QuoteResponse) => {
        let safeQuote = typeof data.quote === 'string' ? data.quote : '';
        if (
          !safeQuote ||
          safeQuote.toLowerCase().includes('undefined') ||
          safeQuote.length < 8
        ) {
          safeQuote = "You're doing amazing! One step at a time.";
        }
        setQuote(safeQuote);
      })
      .catch(() => setQuote("You're doing amazing! One step at a time."))
      .finally(() => setLoading(false));
  };

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

  const fetchLoggedMeals = async (user_id: string): Promise<void> => {
    try {
      const now = new Date();
      const todayEst = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
      }).format(now);

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

  const handleSaveName = async () => {
    if (!tempName.trim() || !userId) return;
    const success = await saveUserName(userId, tempName.trim());
    if (success) {
      setName(tempName.trim());
      setShowNameSaved(true);
      setTimeout(() => {
        setAskName(false);
        fetchQuote(tempName.trim());
        fetchLoggedMeals(userId);
      }, 1200);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUserId(null);
      setName('');
      setAskName(false);
      setLoggedMeals([]);
      localStorage.removeItem('user_id');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRecoverData = () => {
    router.push('/recover');
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      <LoadingScreen isVisible={showLoadingScreen} />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {isMergingData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
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

      {showMergeSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-300 rounded-lg p-4 max-w-sm mx-4"
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

      <AnimatePresence>
        {contentReady && (
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="
              min-h-[100dvh] w-full h-[100dvh] overflow-hidden
              relative pt-8 md:pt-12 flex flex-col
            "
            style={{
              paddingTop: 'max(env(safe-area-inset-top), 2rem)',
            }}
          >
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
              <div className="absolute inset-0 bg-gradient-to-br from-[#f5ede6] via-[#f7edf5] to-[#d8d8f0]" />
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

            {!userId && !showLoginModal && (
              <AuthPrompt
                onContinueAsGuest={handleContinueAsGuest}
                onLogin={handleLogin}
              />
            )}

            {askName && !showNameSaved && userId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-50 flex items-center justify-center px-4"
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

            {askName && showNameSaved && userId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-50 flex items-center justify-center px-4"
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

            {!askName && userId && (
              <>
                <div className="w-full max-w-lg mx-auto px-4 flex flex-row items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <span className="text-[1.5rem] font-bold text-gray-900 leading-snug flex items-center gap-1">
                      {name ? (
                        <>
                          Hello, {name.split(' ')[0]}{' '}
                          <span className="ml-1">👋</span>
                        </>
                      ) : (
                        'Hello! 👋'
                      )}
                    </span>
                    {!streakLoading && streak > 0 && (
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

                  <div className="flex items-center gap-3 relative">
                    {!notificationsEnabled && userId && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNotificationClick();
                        }}
                        className="
                          w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 
                          flex items-center justify-center shadow-lg 
                          cursor-pointer hover:scale-110 active:scale-95 transition-transform
                          border-none outline-none focus:ring-2 focus:ring-pink-300
                        "
                        style={{
                          zIndex: 10000,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        type="button"
                        aria-label="Enable notifications"
                      >
                        <i className="fas fa-bell text-white text-xs pointer-events-none"></i>
                      </button>
                    )}

                    <div className="relative">
                      <motion.button
                        ref={profileButtonRef}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setShowProfileDropdown(!showProfileDropdown)
                        }
                        className="
                          w-12 h-12 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full 
                          flex items-center justify-center text-lg font-bold text-white shadow-lg 
                          select-none uppercase cursor-pointer transition-all duration-200
                          hover:shadow-xl hover:from-pink-300 hover:to-yellow-300
                          focus:outline-none focus:ring-2 focus:ring-pink-300/40
                          border-none
                        "
                        type="button"
                        aria-label="Profile menu"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {getInitials(name) || '🍽️'}
                      </motion.button>

                      <ProfileDropdown
                        name={name}
                        isOpen={showProfileDropdown}
                        onClose={() => setShowProfileDropdown(false)}
                        profileButtonRef={profileButtonRef}
                        isAuthenticated={isUserAuthenticated}
                        onLogin={() => setShowLoginModal(true)}
                        onLogout={handleLogout}
                      />
                    </div>
                  </div>
                </div>

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
                    {loading || !quote ? (
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

                <div className="w-full max-w-lg mx-auto px-4 flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
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
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className={`
                              flex items-center px-6 py-5 rounded-2xl transition
                              bg-white/95 border border-gray-100 shadow-sm
                              hover:bg-pink-50 hover:shadow-lg
                              cursor-pointer
                            `}
                            onClick={() => router.push('/summaries')}
                            tabIndex={0}
                            role="button"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                router.push('/summaries');
                              }
                            }}
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

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className={`
                              flex items-center px-6 py-5 rounded-2xl transition
                              bg-white/95 border border-gray-100 shadow-sm
                              hover:bg-orange-50 hover:shadow-lg
                              cursor-pointer
                            `}
                            onClick={() => router.push('/streaks')}
                            tabIndex={0}
                            role="button"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                router.push('/streaks');
                              }
                            }}
                          >
                            <span className="text-2xl">🏆</span>
                            <div className="flex-1 flex flex-col ml-4">
                              <span className="text-base font-semibold text-gray-900">
                                View My Streaks
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                {!streakLoading && streak > 0
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

                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-2 safe-area-pb">
                  <div className="w-full max-w-lg mx-auto">
                    <div className="flex items-center justify-around">
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
              </>
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}
