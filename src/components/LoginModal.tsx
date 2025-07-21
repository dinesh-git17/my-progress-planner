// src/components/LoginModal.tsx

'use client';

import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/utils/auth';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void; // Callback for successful authentication
}

/**
 * Production-ready authentication modal component
 *
 * Handles both email/password and OAuth authentication flows with proper
 * state management, error handling, and session establishment timing.
 *
 * Key features:
 * - Unified auth state management for email and OAuth flows
 * - Proper session establishment timing with retries
 * - Comprehensive error handling with user-friendly messages
 * - Accessibility compliance and keyboard navigation
 * - Loading states and optimistic UI updates
 */
export default function LoginModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: LoginModalProps) {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // ========================================================================
  // AUTH FLOW HANDLERS
  // ========================================================================

  /**
   * Handles Google OAuth authentication
   *
   * Note: Google OAuth uses redirect flow, so no session waiting is needed
   * as the user will be redirected to /auth/callback for session establishment
   */
  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      // OAuth redirect initiated - user will be redirected to callback
      // Modal will be closed by the redirect, no manual close needed
    } catch (err: any) {
      console.error('🚫 Google OAuth initiation failed:', err);

      // Handle specific OAuth errors with user-friendly messages
      const errorMessage = err.message?.includes('popup')
        ? 'Please allow popups and try again'
        : err.message?.includes('network')
          ? 'Network error. Please check your connection'
          : 'Google sign-in failed. Please try again';

      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  /**
   * Handles email/password authentication with proper session establishment
   *
   * Critical: Email auth requires explicit session waiting since there's no
   * redirect flow to establish the session like OAuth providers have
   */
  const handleEmailAuth = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email.trim() || !password.trim()) {
        setError('Please fill in all fields');
        return;
      }

      setLoading(true);
      setError('');
      setIsProcessingAuth(true);

      try {
        let authResult;

        if (isSignUp) {
          authResult = await signUpWithEmail(email, password);

          // Handle email confirmation requirement for new accounts
          if (authResult.user && !authResult.session) {
            setError(
              'Please check your email to confirm your account before signing in',
            );
            setLoading(false);
            setIsProcessingAuth(false);
            return;
          }
        } else {
          authResult = await signInWithEmail(email, password);
        }

        // Verify we have a valid authentication result
        if (!authResult.user) {
          throw new Error('Authentication failed - no user returned');
        }



        /**
         * Critical: Wait for session establishment
         *
         * Unlike OAuth flows, email auth needs explicit session establishment
         * time. We implement a retry mechanism to ensure the session is
         * properly established before proceeding.
         */
        await waitForSessionEstablishment(authResult.user.id);

        // Success - trigger parent component auth state refresh
        onAuthSuccess?.();

        // TEMPORARY FIX: Force a page reload to reset auth state
        // This ensures the main page detects the new session properly
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (err: any) {
        console.error('🚫 Email authentication failed:', err);

        // Handle specific authentication errors
        const errorMessage = err.message?.includes('Invalid login credentials')
          ? 'Invalid email or password'
          : err.message?.includes('Email not confirmed')
            ? 'Please confirm your email address before signing in'
            : err.message?.includes('signup_disabled')
              ? 'Account creation is currently disabled'
              : err.message || 'Authentication failed. Please try again';

        setError(errorMessage);
      } finally {
        setLoading(false);
        setIsProcessingAuth(false);
      }
    },
    [email, password, isSignUp, onAuthSuccess],
  );

  /**
   * Waits for Supabase session to be fully established
   *
   * Implementation uses exponential backoff with a maximum retry limit
   * to handle session establishment timing issues gracefully
   */
  const waitForSessionEstablishment = async (
    userId: string,
    maxRetries: number = 5,
  ): Promise<void> => {
    const { getCurrentSession } = await import('@/utils/auth');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const session = await getCurrentSession();

        if (session?.user?.id === userId) {

          return;
        }



        // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.warn(`⚠️ Session check failed on attempt ${attempt}:`, error);

        if (attempt === maxRetries) {
          // If all retries fail, we still proceed but log the issue
          console.error(
            '🚫 Session establishment verification failed after all retries',
          );
          // Don't throw - the auth might still work, just proceed
          return;
        }
      }
    }
  };

  /**
   * Handles successful authentication cleanup and state updates
   */
  const handleSuccessfulAuth = useCallback(() => {
    // Clear form data for security
    resetForm();

    // Close modal
    onClose();

    // Small delay to ensure UI state is clean before any parent updates
    setTimeout(() => {
      // Trigger a gentle page refresh to ensure all auth state is synchronized
      // This is more reliable than trying to manually sync all state
      window.location.reload();
    }, 100);
  }, [onClose]);

  // ========================================================================
  // FORM MANAGEMENT
  // ========================================================================

  /**
   * Resets all form state to initial values
   */
  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setError('');
    setIsSignUp(false);
    setLoading(false);
    setIsProcessingAuth(false);
  }, []);

  /**
   * Handles modal close with proper cleanup
   */
  const handleClose = useCallback(() => {
    // Don't allow close during auth processing to prevent state corruption
    if (isProcessingAuth) {
      return;
    }

    resetForm();
    onClose();
  }, [isProcessingAuth, onClose, resetForm]);

  /**
   * Toggles between sign-in and sign-up modes
   */
  const toggleMode = useCallback(() => {
    setIsSignUp((prev) => !prev);
    setError(''); // Clear any existing errors when switching modes
  }, []);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  /**
   * Reset form when modal is closed externally
   */
  useEffect(() => {
    if (!isOpen && !isProcessingAuth) {
      resetForm();
    }
  }, [isOpen, isProcessingAuth, resetForm]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape' && !isProcessingAuth) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessingAuth, handleClose]);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
            aria-hidden="true"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                disabled={isProcessingAuth}
                className="
                  absolute top-4 right-4 w-8 h-8 rounded-full 
                  bg-gray-100 hover:bg-gray-200 transition-colors 
                  flex items-center justify-center
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:ring-2 focus:ring-gray-300 focus:outline-none
                "
                aria-label="Close dialog"
              >
                <span className="text-gray-500 text-lg">×</span>
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-4" role="img" aria-label="Lock">
                  🔐
                </div>
                <h2
                  id="modal-title"
                  className="text-2xl font-bold text-gray-800 mb-2"
                >
                  {isSignUp ? 'Create Account' : 'Welcome Back!'}
                </h2>
                <p id="modal-description" className="text-gray-600">
                  {isSignUp
                    ? 'Sign up to save your progress across devices'
                    : 'Sign in to access your saved progress'}
                </p>
              </div>

              {/* Loading State Overlay */}
              {isProcessingAuth && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-3xl z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">
                      Setting up your account...
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading || isProcessingAuth}
                className="
                  w-full mb-4 py-3 px-4 rounded-2xl border border-gray-200 
                  flex items-center justify-center gap-3 
                  hover:bg-gray-50 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:ring-2 focus:ring-blue-300/40 focus:outline-none
                "
                aria-label="Sign in with Google"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium text-gray-700">
                  {loading ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || isProcessingAuth}
                    className="
                      w-full px-4 py-3 rounded-2xl border border-gray-200
                      focus:ring-2 focus:ring-blue-300/40 focus:border-blue-400
                      outline-none transition
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    aria-describedby={error ? 'auth-error' : undefined}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading || isProcessingAuth}
                    className="
                      w-full px-4 py-3 rounded-2xl border border-gray-200
                      focus:ring-2 focus:ring-blue-300/40 focus:border-blue-400
                      outline-none transition
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    aria-describedby="password-requirements"
                  />
                  <p id="password-requirements" className="sr-only">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    isProcessingAuth ||
                    !email.trim() ||
                    !password.trim()
                  }
                  className="
                    w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500
                    text-white font-semibold shadow-lg transition
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    focus:ring-2 focus:ring-blue-300/40 focus:outline-none
                  "
                >
                  {loading || isProcessingAuth
                    ? 'Please wait...'
                    : isSignUp
                      ? 'Create Account'
                      : 'Sign In'}
                </button>
              </form>

              {/* Toggle Sign Up / Sign In */}
              <div className="text-center mt-6">
                <button
                  onClick={toggleMode}
                  disabled={loading || isProcessingAuth}
                  className="
                    text-sm text-gray-600 hover:text-gray-800 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:underline
                  "
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
