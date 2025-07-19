'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Heart,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-800">
                Encouragement Notes
              </h1>
              <p className="text-sm text-gray-500">
                {notes.length} note{notes.length !== 1 ? 's' : ''} from friends
              </p>
            </div>

            <div className="flex items-center space-x-1 bg-pink-100 px-3 py-1 rounded-full">
              <MessageCircle className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium text-pink-700">
                {notes.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-md mx-auto px-4 py-4">
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
      <main className="max-w-md mx-auto px-4">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg text-center"
          >
            <div className="text-red-500 text-4xl mb-4">😕</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Oops!</h2>
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
  );
}
