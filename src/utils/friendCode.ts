// src/utils/friendCode.ts

/**
 * Friend Code Utilities for My Progress Planner
 * Generates and validates unique 6-character friend codes
 * Format: ABC123 (3 letters + 3 numbers)
 */

/**
 * Generates a unique 6-character friend code
 * Format: 3 letters + 3 numbers (e.g., ABC123)
 * @returns A formatted friend code string
 */
export function generateFriendCode(): string {
  // Generate 3 random uppercase letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letterPart = '';
  for (let i = 0; i < 3; i++) {
    letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate 3 random numbers
  let numberPart = '';
  for (let i = 0; i < 3; i++) {
    numberPart += Math.floor(Math.random() * 10).toString();
  }

  return letterPart + numberPart;
}

/**
 * Validates a friend code format
 * @param code The friend code to validate
 * @returns True if the code matches the expected format (ABC123)
 */
export function isValidFriendCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Remove any whitespace and convert to uppercase
  const cleanCode = code.replace(/\s/g, '').toUpperCase();

  // Check if it's exactly 6 characters
  if (cleanCode.length !== 6) {
    return false;
  }

  // Check format: 3 letters followed by 3 numbers
  const letterPattern = /^[A-Z]{3}$/;
  const numberPattern = /^[0-9]{3}$/;

  const letterPart = cleanCode.substring(0, 3);
  const numberPart = cleanCode.substring(3, 6);

  return letterPattern.test(letterPart) && numberPattern.test(numberPart);
}

/**
 * Formats a friend code with proper spacing and case
 * @param code The friend code to format
 * @returns Formatted friend code (ABC123) or null if invalid
 */
export function formatFriendCode(code: string): string | null {
  if (!code || typeof code !== 'string') {
    return null;
  }

  // Remove any whitespace and convert to uppercase
  const cleanCode = code.replace(/\s/g, '').toUpperCase();

  // Validate the code
  if (!isValidFriendCode(cleanCode)) {
    return null;
  }

  return cleanCode;
}

/**
 * Generates multiple unique friend codes (useful for testing or bulk generation)
 * @param count Number of codes to generate
 * @returns Array of unique friend codes
 */
export function generateMultipleFriendCodes(count: number): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    codes.add(generateFriendCode());
  }

  return Array.from(codes);
}

/**
 * Generates a display-friendly version of a friend code with spacing
 * @param code The friend code to format for display
 * @returns Formatted string like "ABC 123" or null if invalid
 */
export function displayFriendCode(code: string): string | null {
  const formatted = formatFriendCode(code);
  if (!formatted) {
    return null;
  }

  // Add space between letters and numbers for better readability
  return `${formatted.substring(0, 3)} ${formatted.substring(3, 6)}`;
}

/**
 * Parses a user-input friend code and returns the clean version
 * Handles common user input variations like spaces, lowercase, etc.
 * @param userInput The raw user input
 * @returns Clean friend code or null if invalid
 */
export function parseFriendCodeInput(userInput: string): string | null {
  if (!userInput || typeof userInput !== 'string') {
    return null;
  }

  // Remove all whitespace, dashes, and convert to uppercase
  const cleaned = userInput
    .replace(/[\s\-_]/g, '')
    .toUpperCase()
    .trim();

  // Validate and return
  return isValidFriendCode(cleaned) ? cleaned : null;
}

/**
 * Checks if two friend codes are the same
 * @param code1 First friend code
 * @param code2 Second friend code
 * @returns True if codes are identical (case-insensitive)
 */
export function areCodesEqual(code1: string, code2: string): boolean {
  const formatted1 = formatFriendCode(code1);
  const formatted2 = formatFriendCode(code2);

  if (!formatted1 || !formatted2) {
    return false;
  }

  return formatted1 === formatted2;
}

/**
 * Friend code validation error messages
 */
export const FRIEND_CODE_ERRORS = {
  INVALID_FORMAT:
    'Friend code must be 6 characters: 3 letters followed by 3 numbers (e.g., ABC123)',
  EMPTY_CODE: 'Please enter a friend code',
  TOO_SHORT: 'Friend code is too short. It should be 6 characters.',
  TOO_LONG: 'Friend code is too long. It should be 6 characters.',
  INVALID_CHARACTERS: 'Friend code can only contain letters and numbers',
  NOT_FOUND: 'Friend code not found. Please check and try again.',
  ALREADY_FRIENDS: 'You are already friends with this user',
  CANNOT_ADD_SELF: 'You cannot add yourself as a friend',
} as const;

/**
 * Validates a friend code and returns a specific error message if invalid
 * @param code The friend code to validate
 * @returns Error message string or null if valid
 */
export function getFriendCodeError(code: string): string | null {
  if (!code || code.trim() === '') {
    return FRIEND_CODE_ERRORS.EMPTY_CODE;
  }

  const cleanCode = code.replace(/\s/g, '').toUpperCase();

  if (cleanCode.length < 6) {
    return FRIEND_CODE_ERRORS.TOO_SHORT;
  }

  if (cleanCode.length > 6) {
    return FRIEND_CODE_ERRORS.TOO_LONG;
  }

  if (!/^[A-Z0-9]{6}$/.test(cleanCode)) {
    return FRIEND_CODE_ERRORS.INVALID_CHARACTERS;
  }

  if (!isValidFriendCode(cleanCode)) {
    return FRIEND_CODE_ERRORS.INVALID_FORMAT;
  }

  return null; // Valid code
}
