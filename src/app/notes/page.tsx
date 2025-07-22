'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Heart, Mail } from 'lucide-react';
import { DM_Sans, Dancing_Script } from 'next/font/google';
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

interface Note {
  id: number;
  note: string;
  date: string;
  created_at: string;
  from_user_id: string;
  from_name: string;
}

interface NotesResponse {
  success: boolean;
  notes: Note[];
  count: number;
  user_id: string;
  error?: string;
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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date for grouping (just the date part)
 */
function formatDateGroup(dateString: string) {
  // Get today's date in EST (same timezone as the app)
  const todayEst = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(new Date());

  const yesterdayEst = new Date();
  yesterdayEst.setDate(yesterdayEst.getDate() - 1);
  const yesterdayEstStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(yesterdayEst);

  // Compare the date strings directly (YYYY-MM-DD format)
  if (dateString === todayEst) return 'Today';
  if (dateString === yesterdayEstStr) return 'Yesterday';

  // For other dates, parse and format
  const date = new Date(dateString + 'T00:00:00Z'); // Treat as UTC to avoid timezone shifts
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Group notes by date
 */
function groupNotesByDate(notes: Note[]) {
  const groups: { [key: string]: Note[] } = {};

  notes.forEach((note) => {
    const dateKey = note.date;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(note);
  });

  return groups;
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

function NotesHeader({
  dancingScriptClass,
  notesCount,
}: {
  dancingScriptClass: string;
  notesCount: number;
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
        {/* Gradient definition - matches homepage friends tab */}
        <defs>
          <linearGradient
            id="notesHeaderGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>

        {/* Single path with wavy bottom - matches summaries style */}
        <path
          d="M0 0 L500 0 L500 160 C400 200 350 140 250 180 C150 220 100 160 0 200 L0 0 Z"
          fill="url(#notesHeaderGradient)"
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
            Encouragement Notes
          </div>
          <div className="text-lg sm:text-xl text-white font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight flex items-center justify-center gap-2">
            <Mail className="w-5 h-5 text-white" />
            {notesCount} note{notesCount !== 1 ? 's' : ''} from friends
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function NoteCard({ note }: { note: Note }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start space-x-3">
        {/* Friend Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {getInitials(note.from_name)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Friend Name and Time */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-800 truncate">
              {note.from_name}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatDate(note.created_at)}
            </span>
          </div>

          {/* Note Content */}
          <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Heart className="w-8 h-8 text-blue-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">No notes yet</h3>
      <p className="text-sm text-gray-600 max-w-sm mx-auto">
        When your friends send you encouraging notes, they'll appear here. Share
        your friend code to start connecting!
      </p>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NotesPage() {
  const { navigate } = useNavigation();

  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today'>('all');

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id');
    }
    return null;
  };

  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      // Create minimum loading delay promise
      const minLoadingDelay = new Promise((resolve) =>
        setTimeout(resolve, 2000),
      );

      // Create data fetch promise
      const dataFetch = (async () => {
        const limit = selectedFilter === 'today' ? 50 : 100;
        const url = `/api/friends/notes?user_id=${currentUserId}&limit=${limit}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to load notes');
        }

        const data: NotesResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load notes');
        }

        // Filter by today if selected
        let filteredNotes = data.notes;
        if (selectedFilter === 'today') {
          const todayEst = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
          }).format(new Date());

          filteredNotes = data.notes.filter((note) => note.date === todayEst);
        }

        return filteredNotes;
      })();

      // Wait for both the data and minimum loading time
      const [filteredNotes] = await Promise.all([dataFetch, minLoadingDelay]);

      setNotes(filteredNotes);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchNotes();
  }, [selectedFilter]);

  // Group notes by date
  const groupedNotes = groupNotesByDate(notes);
  const dateKeys = Object.keys(groupedNotes).sort((a, b) => b.localeCompare(a)); // Most recent first

  // Loading state - show full screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4">
        {/* Modern notes loading animation - similar to friends but with mail/message theme */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center"
        >
          {/* Animated mail icon */}
          <motion.div
            className="relative mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg"
              animate={{
                y: [-2, 2, -2],
                rotate: [0, 1, -1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Loading Notes
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              Gathering encouraging messages from your friends...
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center justify-center space-x-1"
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }
  return (
    <div className={`h-screen w-full overflow-hidden ${dmSans.className}`}>
      {/* Back navigation button */}
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
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-blue-200/50 transition-all shadow-sm"
          aria-label="Go back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Header */}
      <NotesHeader
        dancingScriptClass={dancingScript.className}
        notesCount={notes.length}
      />

      {/* Main Content */}
      <div
        className="w-full max-w-2xl mx-auto safe-x overflow-hidden"
        style={{
          marginTop: BANNER_TOTAL_HEIGHT,
          height: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px)`,
          paddingTop: '2.5rem',
          paddingBottom: '2rem',
        }}
      >
        <div className="px-4 h-full overflow-y-auto">
          <div className="max-w-md mx-auto">
            {/* Filter Tabs */}
            <div className="py-2">
              <div className="flex bg-white rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === 'all'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All Notes
                </button>
                <button
                  onClick={() => setSelectedFilter('today')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === 'today'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
            {/* Main Content */}
            <main className="pb-20">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="flex justify-center space-x-1.5 mb-3"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  </motion.div>
                  <p className="text-sm text-gray-500">Loading your notes...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-lg text-center"
                >
                  <div className="text-red-500 text-4xl mb-4">😕</div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Oops!
                  </h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchNotes}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : notes.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-6">
                  {dateKeys.map((dateKey) => (
                    <motion.section
                      key={dateKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* Date Header */}
                      <div className="flex items-center space-x-2 px-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <h2 className="text-sm font-medium text-gray-600">
                          {formatDateGroup(dateKey)}
                        </h2>
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400">
                          {groupedNotes[dateKey].length} note
                          {groupedNotes[dateKey].length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Notes for this date */}
                      <div className="space-y-3">
                        {groupedNotes[dateKey].map((note) => (
                          <NoteCard key={note.id} note={note} />
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
