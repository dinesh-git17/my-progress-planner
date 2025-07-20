'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Heart, Loader2 } from 'lucide-react';
import { DM_Sans, Dancing_Script } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
const dmSans = DM_Sans({ subsets: ['latin'] });
const dancingScript = Dancing_Script({ subsets: ['latin'] });

// ============================================================================
// CONSTANTS
// ============================================================================
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
      className="fixed top-0 left-0 w-full z-30 pt-safe-top"
      style={{
        background: '#f5ede6',
      }}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Text content */}
        <div
          className="flex flex-col items-center w-full px-4"
          style={{
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
            Encouragement Notes
          </div>
          <div className="text-lg sm:text-xl text-gray-600 font-normal text-center max-w-lg mx-auto mt-2 px-2 leading-tight">
            {notesCount} note{notesCount !== 1 ? 's' : ''} from friends 💌
          </div>
        </div>

        {/* Curved bottom border using SVG */}
        <svg
          className="absolute left-0 bottom-0 w-full"
          viewBox="0 0 500 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            height: BANNER_CURVE_HEIGHT,
          }}
        >
          <path d="M0 0C82 40 418 40 500 0V44H0V0Z" fill="#f5ede6" />
        </svg>
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
        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
      <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Heart className="w-8 h-8 text-pink-400" />
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
  const router = useRouter();

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
        // Use EST timezone for consistency
        const todayEst = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/New_York',
        }).format(new Date());

        console.log(`🔍 Filtering notes for today (EST): ${todayEst}`);
        filteredNotes = data.notes.filter((note) => {
          console.log(
            `📝 Note date: ${note.date}, Today: ${todayEst}, Match: ${note.date === todayEst}`,
          );
          return note.date === todayEst;
        });
      }

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your notes...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${dmSans.className}`}>
      {/* Back navigation button */}
      <motion.div
        className="fixed left-4 z-40 notch-safe"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => router.push('/')}
          className="p-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full border border-white/40 hover:bg-white/80 focus:ring-2 focus:ring-pink-200/50 transition-all shadow-sm"
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
        className="w-full max-w-2xl mx-auto safe-x"
        style={{
          marginTop: BANNER_TOTAL_HEIGHT,
          minHeight: `calc(100vh - ${BANNER_TOTAL_HEIGHT}px)`,
          paddingTop: '1rem',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="px-4">
          <div className="max-w-md mx-auto">
            {/* Filter Tabs */}
            <div className="py-2">
              <div className="flex bg-white rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === 'all'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All Notes
                </button>
                <button
                  onClick={() => setSelectedFilter('today')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === 'today'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Main Content */}
            <main className="pb-20">
              {error ? (
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
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
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
