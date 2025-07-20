'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Flame,
  Heart,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'] });

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * UI timing and layout constants
 */
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
// TYPES
// ============================================================================

interface FriendData {
  success: boolean;
  friend: {
    user_id: string;
    name: string;
    friend_code: string;
  };
  date: string;
  summaries: {
    breakfast_summary: string | null;
    lunch_summary: string | null;
    dinner_summary: string | null;
    breakfast_meal_summary: string | null;
    lunch_meal_summary: string | null;
    dinner_meal_summary: string | null;
    full_day_summary: string | null;
  };
  streak: {
    current: number;
    dates: string[];
  };
  progress: {
    meals_completed_today: number;
    total_possible: number;
    completion_percentage: number;
  };
  notes: Array<{
    id: number;
    note: string;
    from_user_id: string;
    created_at: string;
    from_name?: string;
  }>;
  metadata: {
    has_data: boolean;
    last_updated: string | null;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get initials from a name for avatar display
 */
function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

/**
 * Format date for display
 */
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

function FriendDetailHeader({
  dancingScriptClass,
  friendName,
  streak,
}: {
  dancingScriptClass: string;
  friendName: string;
  streak: number;
}) {
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
        {/* Gradient definition */}
        <defs>
          <linearGradient
            id="friendDetailHeaderGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>

        {/* Single path with wavy bottom - matches summaries style */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#friendDetailHeaderGradient)"
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
            {friendName}'s Progress
          </div>
          <div className="text-lg sm:text-xl text-white font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-300" />
            {streak} day{streak !== 1 ? 's' : ''} streak! 🔥
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// MEAL COMPONENTS
// ============================================================================

const mealLabels = [
  { meal: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { meal: 'lunch', emoji: '🫐', label: 'Lunch' },
  { meal: 'dinner', emoji: '🍜', label: 'Dinner' },
];

function MealCard({
  meal,
  emoji,
  label,
  isLogged,
  index,
}: {
  meal: string;
  emoji: string;
  label: string;
  isLogged: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={`
        relative px-4 py-4 rounded-xl border-2 transition-all duration-300
        ${
          isLogged
            ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 shadow-lg shadow-pink-100/50'
            : 'bg-gray-50 border-gray-200'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`text-2xl ${isLogged ? 'grayscale-0' : 'grayscale opacity-50'}`}
          >
            {emoji}
          </div>
          <div>
            <h3
              className={`font-medium ${isLogged ? 'text-gray-800' : 'text-gray-500'}`}
            >
              {label}
            </h3>
          </div>
        </div>

        {isLogged && (
          <motion.div
            initial={false}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
            className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xs">✓</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FriendDetailPage() {
  const params = useParams();
  const router = useRouter();
  const friendId = params.friendId as string;

  // State management
  const [friendData, setFriendData] = useState<FriendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [sendingNote, setSendingNote] = useState(false);
  const [showNoteSuccess, setShowNoteSuccess] = useState(false);

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id');
    }
    return null;
  };

  // Fetch friend data
  const fetchFriendData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      // Get today's date in EST timezone
      const todayEst = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
      }).format(new Date());

      const response = await fetch(
        `/api/friends/data?user_id=${currentUserId}&friend_id=${friendId}&date=${todayEst}`,
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You are not friends with this user');
        }
        if (response.status === 404) {
          throw new Error('Friend not found');
        }
        throw new Error('Failed to load friend data');
      }

      const data = await response.json();

      console.log('Friend data received:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to load friend data');
      }

      setFriendData(data);
    } catch (err: any) {
      console.error('Error fetching friend data:', err);
      setError(err.message || 'Failed to load friend data');
    } finally {
      setLoading(false);
    }
  };

  // Send encouragement note
  const sendNote = async () => {
    if (!noteText.trim() || sendingNote) return;

    try {
      setSendingNote(true);

      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/friends/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_user_id: currentUserId,
          to_user_id: friendId,
          note: noteText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send note');
      }

      // Reset form and show success
      setNoteText('');
      setShowNoteSuccess(true);
      setTimeout(() => setShowNoteSuccess(false), 3000);

      // Refresh friend data to show new note
      await fetchFriendData();
    } catch (err: any) {
      console.error('Error sending note:', err);
      alert('Failed to send note. Please try again.');
    } finally {
      setSendingNote(false);
    }
  };

  // Initialize component
  useEffect(() => {
    if (friendId) {
      fetchFriendData();
    }
  }, [friendId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading friend data...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md w-full"
        >
          <div className="text-red-500 text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              router.push('/');
            }}
            className="w-full bg-pink-500 text-white py-3 rounded-xl font-medium hover:bg-pink-600 transition-colors"
          >
            Back to Friends
          </button>
        </motion.div>
      </div>
    );
  }

  if (!friendData) {
    return null;
  }

  return (
    <div className={`min-h-screen w-full ${dmSans.className}`}>
      {/* Back navigation button */}
      <motion.div
        className="fixed left-4 z-40 notch-safe"
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => router.push('/friends-list')}
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-pink-200/50 transition-all shadow-sm"
          aria-label="Go back to friends"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Header */}
      <FriendDetailHeader
        dancingScriptClass={dancingScript.className}
        friendName={friendData.friend?.name || 'Friend'}
        streak={friendData.streak?.current || 0}
      />

      {/* Main Content */}
      <div
        className="w-full max-w-2xl mx-auto safe-x"
        style={{
          marginTop: BANNER_TOTAL_HEIGHT,
          minHeight: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px)`,
          paddingTop: `calc(0.1rem + env(safe-area-inset-top))`, // Match summaries page
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="px-4">
          <motion.main
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto space-y-6"
          >
            {/* Today's Meals Section */}
            <motion.section
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Today's Meals
                </h2>
              </div>

              <div className="space-y-3">
                {mealLabels.map(({ meal, emoji, label }, index) => {
                  // Check if the meal summary exists (indicates meal was logged)
                  const summaryKey =
                    `${meal}_summary` as keyof typeof friendData.summaries;
                  const isLogged = !!friendData.summaries?.[summaryKey];

                  return (
                    <MealCard
                      key={meal}
                      meal={meal}
                      emoji={emoji}
                      label={label}
                      isLogged={isLogged}
                      index={index}
                    />
                  );
                })}
              </div>

              {/* Meals Summary */}
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl"
              >
                <p className="text-center text-sm text-gray-600">
                  <span className="font-medium text-pink-600">
                    {friendData.progress?.meals_completed_today || 0} of 3
                  </span>{' '}
                  meals logged today
                </p>
              </motion.div>
            </motion.section>

            {/* Meal Summaries Section */}
            {(friendData.summaries?.breakfast_summary ||
              friendData.summaries?.lunch_summary ||
              friendData.summaries?.dinner_summary) && (
              <motion.section
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  What They Ate Today
                </h2>

                <div className="space-y-4">
                  {/* Breakfast Summary */}
                  {friendData.summaries.breakfast_summary && (
                    <motion.div
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">🍳</span>
                        <h3 className="font-medium text-gray-800">Breakfast</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {friendData.summaries.breakfast_summary}
                      </p>
                    </motion.div>
                  )}

                  {/* Lunch Summary */}
                  {friendData.summaries.lunch_summary && (
                    <motion.div
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">🫐</span>
                        <h3 className="font-medium text-gray-800">Lunch</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {friendData.summaries.lunch_summary}
                      </p>
                    </motion.div>
                  )}

                  {/* Dinner Summary */}
                  {friendData.summaries.dinner_summary && (
                    <motion.div
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">🍜</span>
                        <h3 className="font-medium text-gray-800">Dinner</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {friendData.summaries.dinner_summary}
                      </p>
                    </motion.div>
                  )}

                  {/* Full Day Summary */}
                  {friendData.summaries.full_day_summary && (
                    <motion.div
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">✨</span>
                        <h3 className="font-medium text-gray-800">
                          Day Summary
                        </h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {friendData.summaries.full_day_summary}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.section>
            )}

            {/* Send Encouragement Section */}
            <motion.section
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Send Encouragement
                </h2>
              </div>

              <div className="space-y-4">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={`Send ${friendData.friend?.name || 'your friend'} an encouraging note...`}
                  className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {noteText.length}/500 characters
                  </span>

                  <button
                    onClick={sendNote}
                    disabled={!noteText.trim() || sendingNote}
                    className="px-6 py-2 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {sendingNote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    <span>{sendingNote ? 'Sending...' : 'Send Note'}</span>
                  </button>
                </div>
              </div>

              {/* Success Message */}
              <AnimatePresence>
                {showNoteSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-4 p-3 bg-green-100 border border-green-200 rounded-xl"
                  >
                    <p className="text-sm text-green-700 text-center">
                      ✨ Your encouragement was sent successfully!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Recent Notes Section */}
            {friendData.notes && friendData.notes.length > 0 && (
              <motion.section
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Notes
                </h2>

                <div className="space-y-3">
                  {friendData.notes.slice(0, 5).map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={false}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.5 + index * 0.05,
                        duration: 0.3,
                      }}
                      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                    >
                      <p className="text-sm text-gray-700 mb-2">{note.note}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>From {note.from_name || 'Friend'}</span>
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Bottom Spacing */}
            <div className="h-20" />
          </motion.main>
        </div>
      </div>
    </div>
  );
}
