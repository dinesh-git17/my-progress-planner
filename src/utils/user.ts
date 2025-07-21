/**
 * User Management Utilities for Sweethearty
 *
 * This module provides comprehensive user management functionality including:
 * - Basic user operations (CRUD)
 * - Friend system with unique codes
 * - Friend data access with privacy controls
 * - Encouragement notes system
 *
 * @author Sweethearty Team
 * @version 2.0.0
 * @since 2025-07-07
 */

import { createClient } from '@supabase/supabase-js';
import { generateFriendCode, isValidFriendCode } from './friendCode';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface Friend {
  user_id: string;
  name: string | null;
  friend_code: string | null;
  created_at: string;
}

interface FriendData {
  success: boolean;
  friendInfo?: {
    name: string | null;
    friend_code: string | null;
  };
  mealData?: {
    date: string;
    breakfast: any;
    lunch: any;
    dinner: any;
    mealsLogged: number;
  };
  streakData?: {
    currentStreak: number;
    lastLogDate: string | null;
  };
  notes?: Array<{
    id: number;
    note: string;
    created_at: string;
    from_user_name: string | null;
  }>;
  error?: string;
}

interface AddFriendResult {
  success: boolean;
  error?: string;
  friendName?: string;
}

interface FriendsListResult {
  success: boolean;
  friends: Friend[];
  error?: string;
}

interface NoteResult {
  success: boolean;
  error?: string;
}

// =============================================================================
// CORE USER OPERATIONS
// =============================================================================

/**
 * Retrieves a user's display name from the database
 *
 * @param user_id - UUID of the user
 * @returns Promise resolving to user's name or null if not found
 * @throws Will not throw - handles all errors gracefully
 */
export async function getUserName(user_id: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('user_id', user_id)
      .single();

    if (error || !data?.name) {
      console.warn(`No name found for user: ${user_id}`);
      return null;
    }

    return data.name;
  } catch (error) {
    console.error('Unexpected error in getUserName:', error);
    return null;
  }
}

/**
 * Persists a user's display name to the database
 * Uses upsert to handle both insert and update cases
 *
 * @param user_id - UUID of the user
 * @param name - Display name to save
 * @returns Promise resolving to boolean indicating success
 */
export async function saveUserName(
  user_id: string,
  name: string,
): Promise<boolean> {
  try {
    // Validate input parameters
    if (!user_id?.trim() || !name?.trim()) {
      console.error('Invalid parameters for saveUserName:', { user_id, name });
      return false;
    }

    const { error } = await supabase
      .from('users')
      .upsert({ user_id, name: name.trim() });

    if (error) {
      console.error('Database error saving user name:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in saveUserName:', error);
    return false;
  }
}

// =============================================================================
// FRIEND CODE MANAGEMENT
// =============================================================================

/**
 * Retrieves or generates a unique friend code for a user
 *
 * Friend codes are 6-character strings (ABC123 format) that allow users
 * to add each other as friends. This function implements:
 * - Lazy generation (only creates code when needed)
 * - Uniqueness validation across all users
 * - Retry logic for collision handling
 *
 * @param user_id - UUID of the user requesting a friend code
 * @returns Promise resolving to friend code string or null on error
 */
export async function getUserFriendCode(
  user_id: string,
): Promise<string | null> {
  try {
    if (!user_id?.trim()) {
      console.error('Invalid user_id provided to getUserFriendCode');
      return null;
    }



    // First, attempt to retrieve existing friend code
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('friend_code')
      .eq('user_id', user_id)
      .single();

    // Handle case where user doesn't exist yet (PGRST116 = no rows found)
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error fetching user friend code:', fetchError);
      return null;
    }

    // Return existing code if available
    if (userData?.friend_code) {

      return userData.friend_code;
    }

    // Generate new unique friend code with collision handling

    const maxAttempts = 10;
    let attempts = 0;
    let newCode: string;

    do {
      newCode = generateFriendCode();
      attempts++;

      // Verify uniqueness across all users
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('user_id')
        .eq('friend_code', newCode)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking friend code uniqueness:', checkError);
        return null;
      }

      // Break if code is unique
      if (!existingUser) {
        break;
      }

      console.warn(`Code collision detected: ${newCode}, retrying...`);
    } while (attempts < maxAttempts);

    // Handle exhausted retry attempts
    if (attempts >= maxAttempts) {
      console.error(
        `Failed to generate unique friend code after ${maxAttempts} attempts`,
      );
      return null;
    }

    // Persist the new friend code
    const { error: updateError } = await supabase
      .from('users')
      .upsert({ user_id, friend_code: newCode });

    if (updateError) {
      console.error('Error persisting friend code:', updateError);
      return null;
    }


    return newCode;
  } catch (error) {
    console.error('Unexpected error in getUserFriendCode:', error);
    return null;
  }
}

// =============================================================================
// FRIENDSHIP MANAGEMENT
// =============================================================================

/**
 * Establishes a bidirectional friendship using a friend code
 *
 * This function implements the complete friend addition workflow:
 * - Friend code validation and lookup
 * - Duplicate relationship prevention
 * - Bidirectional relationship creation
 * - Comprehensive error handling
 *
 * @param user_id - UUID of the user adding a friend
 * @param friendCode - 6-character friend code to lookup
 * @returns Promise resolving to operation result with success status and details
 */
export async function addFriend(
  user_id: string,
  friendCode: string,
): Promise<AddFriendResult> {
  try {
    // Input validation
    if (!user_id?.trim() || !friendCode?.trim()) {
      return { success: false, error: 'Invalid input parameters' };
    }


    // Validate friend code format
    if (!isValidFriendCode(friendCode)) {
      return {
        success: false,
        error: 'Invalid friend code format. Use format: ABC123',
      };
    }

    // Lookup user by friend code
    const { data: friendUser, error: findError } = await supabase
      .from('users')
      .select('user_id, name')
      .eq('friend_code', friendCode.toUpperCase())
      .single();

    if (findError || !friendUser) {
      console.warn(`Friend code not found: ${friendCode}`);
      return {
        success: false,
        error: 'Friend code not found. Please check and try again.',
      };
    }

    // Prevent self-friendship
    if (friendUser.user_id === user_id) {
      return { success: false, error: 'You cannot add yourself as a friend' };
    }

    // Check for existing friendship
    const { data: existingFriendship, error: checkError } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', user_id)
      .eq('friend_id', friendUser.user_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing friendship:', checkError);
      return { success: false, error: 'Database error occurred' };
    }

    if (existingFriendship) {
      return {
        success: false,
        error: 'You are already friends with this user',
      };
    }

    // Create bidirectional friendship
    const { error: createError } = await supabase.from('friendships').insert([
      { user_id: user_id, friend_id: friendUser.user_id },
      { user_id: friendUser.user_id, friend_id: user_id },
    ]);

    if (createError) {
      console.error('Error creating friendship:', createError);
      return {
        success: false,
        error: 'Failed to add friend. Please try again.',
      };
    }

    const friendName = friendUser.name || 'Your friend';

    return {
      success: true,
      friendName,
    };
  } catch (error) {
    console.error('Unexpected error in addFriend:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Retrieves the complete friends list for a user
 *
 * Returns all established friendships with user metadata.
 * Uses JOIN queries for efficient data retrieval.
 *
 * @param user_id - UUID of the user whose friends to retrieve
 * @returns Promise resolving to friends list with metadata
 */
export async function getFriendsList(
  user_id: string,
): Promise<FriendsListResult> {
  try {
    if (!user_id?.trim()) {
      return { success: false, friends: [], error: 'Invalid user ID' };
    }



    // Query friendships with user metadata via foreign key join
    const { data: friendships, error: friendshipError } = await supabase
      .from('friendships')
      .select(
        `
        friend_id,
        created_at,
        users!friendships_friend_id_fkey (
          user_id,
          name,
          friend_code
        )
      `,
      )
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (friendshipError) {
      console.error('Error fetching friendships:', friendshipError);
      return {
        success: false,
        friends: [],
        error: 'Failed to retrieve friends list',
      };
    }

    // Transform joined data to clean interface
    const friends: Friend[] = (friendships || []).map((friendship) => ({
      user_id: friendship.friend_id,
      name: (friendship.users as any)?.name || null,
      friend_code: (friendship.users as any)?.friend_code || null,
      created_at: friendship.created_at,
    }));

    return { success: true, friends };
  } catch (error) {
    console.error('Unexpected error in getFriendsList:', error);
    return {
      success: false,
      friends: [],
      error: 'An unexpected error occurred',
    };
  }
}

// =============================================================================
// FRIEND DATA ACCESS
// =============================================================================

/**
 * Retrieves comprehensive friend data for a specific date
 *
 * This function aggregates multiple data sources to provide a complete
 * view of a friend's progress:
 * - Meal logging data
 * - Streak calculations
 * - Encouragement notes
 * - Privacy verification
 *
 * @param user_id - UUID of the requesting user
 * @param friend_id - UUID of the friend whose data to retrieve
 * @param date - Optional date in YYYY-MM-DD format (defaults to today)
 * @returns Promise resolving to comprehensive friend data
 */
export async function getFriendData(
  user_id: string,
  friend_id: string,
  date?: string,
): Promise<FriendData> {
  try {
    // Input validation
    if (!user_id?.trim() || !friend_id?.trim()) {
      return { success: false, error: 'Invalid user parameters' };
    }



    // Privacy check: verify friendship exists
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', user_id)
      .eq('friend_id', friend_id)
      .single();

    if (friendshipError || !friendship) {
      return { success: false, error: 'You are not friends with this user' };
    }

    // Default to today's date in ISO format
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Parallel data fetching for performance
    const [friendInfoResult, mealDataResult, recentMealsResult, notesResult] =
      await Promise.allSettled([
        // Friend basic information
        supabase
          .from('users')
          .select('name, friend_code')
          .eq('user_id', friend_id)
          .single(),

        // Meal data for specific date
        supabase
          .from('meal_logs')
          .select('date, breakfast, lunch, dinner')
          .eq('user_id', friend_id)
          .eq('date', targetDate)
          .maybeSingle(),

        // Recent meals for streak calculation
        supabase
          .from('meal_logs')
          .select('date')
          .eq('user_id', friend_id)
          .order('date', { ascending: false })
          .limit(30),

        // Encouragement notes for the date
        supabase
          .from('friend_notes')
          .select(
            `
          id,
          note,
          created_at,
          from_user_id,
          users!friend_notes_from_user_id_fkey (name)
        `,
          )
          .eq('to_user_id', friend_id)
          .eq('date', targetDate)
          .order('created_at', { ascending: false }),
      ]);

    // Process friend info result
    if (
      friendInfoResult.status === 'rejected' ||
      friendInfoResult.value.error
    ) {
      console.error('Error fetching friend info:', friendInfoResult);
      return { success: false, error: 'Friend information not found' };
    }
    const friendInfo = friendInfoResult.value.data;

    // Process meal data (non-critical)
    let mealData = null;
    if (mealDataResult.status === 'fulfilled' && !mealDataResult.value.error) {
      mealData = mealDataResult.value.data;
    } else {
      console.warn('No meal data found for date:', targetDate);
    }

    // Process recent meals for streak calculation (non-critical)
    let recentMeals: any[] = [];
    if (
      recentMealsResult.status === 'fulfilled' &&
      !recentMealsResult.value.error
    ) {
      recentMeals = recentMealsResult.value.data || [];
    } else {
      console.warn('Error fetching recent meals for streak calculation');
    }

    // Process notes (non-critical)
    let notes: any[] = [];
    if (notesResult.status === 'fulfilled' && !notesResult.value.error) {
      notes = notesResult.value.data || [];
    } else {
      console.warn('Error fetching notes for date:', targetDate);
    }

    // Calculate streak using consecutive day logic
    const streakData = calculateStreak(recentMeals);

    // Count meals logged for the target date
    const mealsLogged = [
      mealData?.breakfast,
      mealData?.lunch,
      mealData?.dinner,
    ].filter((meal) => meal && Array.isArray(meal) && meal.length > 0).length;

    // Transform notes data for client consumption
    const transformedNotes = notes.map((note) => ({
      id: note.id,
      note: note.note,
      created_at: note.created_at,
      from_user_name: (note.users as any)?.name || 'Anonymous',
    }));



    return {
      success: true,
      friendInfo: {
        name: friendInfo?.name || null,
        friend_code: friendInfo?.friend_code || null,
      },
      mealData: {
        date: targetDate,
        breakfast: mealData?.breakfast || null,
        lunch: mealData?.lunch || null,
        dinner: mealData?.dinner || null,
        mealsLogged,
      },
      streakData,
      notes: transformedNotes,
    };
  } catch (error) {
    console.error('Unexpected error in getFriendData:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Calculates consecutive meal logging streak from meal history
 *
 * @param recentMeals - Array of meal log objects with date property
 * @returns Object containing current streak and last log date
 */
function calculateStreak(recentMeals: any[]): {
  currentStreak: number;
  lastLogDate: string | null;
} {
  if (!recentMeals.length) {
    return { currentStreak: 0, lastLogDate: null };
  }

  const lastLogDate = recentMeals[0].date;
  let currentStreak = 0;

  // Set timezone-aware today for accurate comparison
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Calculate consecutive days from most recent backwards
  for (const meal of recentMeals) {
    const logDate = new Date(meal.date + 'T00:00:00Z');
    const daysDiff = Math.floor(
      (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If this log is exactly the expected number of days back, continue streak
    if (daysDiff === currentStreak) {
      currentStreak++;
    } else {
      // Gap in streak found, stop counting
      break;
    }
  }

  return { currentStreak, lastLogDate };
}

// =============================================================================
// ENCOURAGEMENT SYSTEM
// =============================================================================

/**
 * Sends an encouragement note to a friend for a specific date
 *
 * Encouragement notes are contextual messages tied to specific dates,
 * allowing friends to provide support and motivation.
 *
 * @param from_user_id - UUID of the sender
 * @param to_user_id - UUID of the recipient
 * @param note - Encouragement message content
 * @param date - Optional date in YYYY-MM-DD format (defaults to today)
 * @returns Promise resolving to operation result
 */
export async function sendFriendNote(
  from_user_id: string,
  to_user_id: string,
  note: string,
  date?: string,
): Promise<NoteResult> {
  try {
    // Input validation
    if (!from_user_id?.trim() || !to_user_id?.trim() || !note?.trim()) {
      return { success: false, error: 'Invalid input parameters' };
    }

    if (note.trim().length > 500) {
      return {
        success: false,
        error: 'Note is too long. Maximum 500 characters.',
      };
    }



    // Privacy check: verify friendship exists
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', from_user_id)
      .eq('friend_id', to_user_id)
      .single();

    if (friendshipError || !friendship) {
      return { success: false, error: 'You are not friends with this user' };
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Insert the encouragement note
    const { error: insertError } = await supabase.from('friend_notes').insert({
      from_user_id,
      to_user_id,
      note: note.trim(),
      date: targetDate,
    });

    if (insertError) {
      console.error('Error inserting friend note:', insertError);
      return {
        success: false,
        error: 'Failed to send note. Please try again.',
      };
    }


    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendFriendNote:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
