// src/components/LoginModal.tsx

'use client';

import {
  getCurrentSession,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/utils/auth';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: LoginModalProps) {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Form validation states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setError('');
    setShowEmailForm(false);
    setIsSignUp(false);
    setShowForgotPassword(false);
    setEmailFocused(false);
    setPasswordFocused(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!loading && !isProcessingAuth) {
      resetForm();
      onClose();
    }
  }, [loading, isProcessingAuth, resetForm, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  // ========================================================================
  // AUTH HANDLERS
  // ========================================================================

  /**
   * Waits for Supabase session to be fully established
   */
  const waitForSessionEstablishment = async (
    userId: string,
    maxRetries: number = 5,
  ): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const session = await getCurrentSession();
        if (session?.user?.id === userId) {
          console.log(`✅ Session established after ${attempt} attempt(s)`);
          return;
        }

        const delay = Math.min(500 * Math.pow(2, attempt - 1), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.warn(`⚠️ Session check failed on attempt ${attempt}:`, error);
        if (attempt === maxRetries) {
          console.error('🚫 Session establishment verification failed');
        }
      }
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('🚫 Google OAuth failed:', err);
      const errorMessage = err.message?.includes('popup')
        ? 'Please allow popups and try again'
        : err.message?.includes('network')
          ? 'Network error. Please check your connection'
          : 'Google sign-in failed. Please try again';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

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
          if (authResult.user && !authResult.session) {
            setError('Please check your email to confirm your account');
            setLoading(false);
            setIsProcessingAuth(false);
            return;
          }
        } else {
          authResult = await signInWithEmail(email, password);
        }

        if (!authResult.user) {
          throw new Error('Authentication failed - no user returned');
        }

        await waitForSessionEstablishment(authResult.user.id);
        onAuthSuccess?.();

        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (err: any) {
        console.error('🚫 Email authentication failed:', err);
        const errorMessage = err.message?.includes('Invalid login credentials')
          ? 'Invalid email or password'
          : err.message?.includes('Email not confirmed')
            ? 'Please confirm your email address'
            : err.message?.includes('signup_disabled')
              ? 'Account creation is currently disabled'
              : 'Authentication failed. Please try again';
        setError(errorMessage);
      } finally {
        setLoading(false);
        setIsProcessingAuth(false);
      }
    },
    [email, password, isSignUp, onAuthSuccess],
  );

  // ========================================================================
  // ANIMATION VARIANTS
  // ========================================================================

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 200,
        duration: 0.28,
      },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn' as const,
      },
    },
  };

  const emailFormVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      marginTop: 0,
    },
    visible: {
      height: 'auto',
      opacity: 1,
      marginTop: 20,
      transition: {
        height: { duration: 0.22, ease: 'easeOut' as const },
        opacity: { duration: 0.18, delay: 0.04 },
        marginTop: { duration: 0.22, ease: 'easeOut' as const },
      },
    },
  };

  // Reduce motion for accessibility
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const reducedModalVariants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : modalVariants;

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal Sheet */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
            <motion.div
              className="
                w-full max-w-[420px] mx-auto
                bg-white rounded-t-3xl sm:rounded-3xl
                shadow-2xl shadow-black/20
                overflow-hidden
                pb-safe sm:pb-0
              "
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
              }}
              variants={reducedModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-2">
                <button
                  onClick={handleClose}
                  disabled={loading || isProcessingAuth}
                  className="
                    absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                    text-gray-400 hover:text-gray-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full
                  "
                  aria-label="Close modal"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M12.854 3.146a.5.5 0 0 0-.708 0L8 7.293 3.854 3.146a.5.5 0 1 0-.708.708L7.293 8l-4.147 4.146a.5.5 0 0 0 .708.708L8 8.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 8l4.147-4.146a.5.5 0 0 0 0-.708z" />
                  </svg>
                </button>

                <div className="text-center">
                  <h1
                    id="modal-title"
                    className="text-2xl font-semibold text-gray-900 mb-2"
                  >
                    Welcome back
                  </h1>
                  <p className="text-gray-600">Sign in to keep your progress</p>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-2">
                {/* Reduced bottom padding since we handle safe area in container */}
                {/* Error Message */}
                {error && (
                  <motion.div
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    id="auth-error"
                    role="alert"
                  >
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}

                {/* Google Sign In Button */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading || isProcessingAuth}
                  className="
                    w-full h-12 flex items-center justify-center gap-3
                    border border-gray-200 rounded-xl
                    text-gray-700 font-medium
                    hover:bg-gray-50 transition-all duration-150
                    active:scale-[0.98] disabled:opacity-50
                    disabled:cursor-not-allowed disabled:hover:bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-300/40
                  "
                  style={{ minHeight: '48px' }} // Ensure 48px touch target
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
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
                  <span>
                    {loading ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </button>

                {/* Email Form Toggle */}
                {!showEmailForm && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setShowEmailForm(true)}
                      disabled={loading || isProcessingAuth}
                      className="
                        text-gray-600 hover:text-gray-800 transition-colors
                        text-sm font-medium underline-offset-2 hover:underline
                        disabled:opacity-50 disabled:cursor-not-allowed
                        focus:outline-none focus:underline
                      "
                    >
                      Use email instead
                    </button>
                  </div>
                )}

                {/* Email Form */}
                <AnimatePresence>
                  {showEmailForm && (
                    <motion.div
                      className="overflow-hidden"
                      variants={emailFormVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <form
                        onSubmit={handleEmailAuth}
                        className="space-y-4"
                        noValidate
                      >
                        {/* Email Input */}
                        <div className="relative">
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(email.trim() !== '')}
                            required
                            disabled={loading || isProcessingAuth}
                            className="
                              w-full h-14 px-4 pt-6 pb-2
                              border border-gray-200 rounded-xl
                              text-gray-900 bg-white
                              focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400
                              outline-none transition-all duration-200
                              disabled:opacity-50 disabled:cursor-not-allowed
                              peer
                            "
                            aria-describedby={error ? 'auth-error' : undefined}
                          />
                          <label
                            htmlFor="email"
                            className={`
                              absolute left-4 text-gray-500 pointer-events-none
                              transition-all duration-200 ease-out
                              ${
                                emailFocused || email.trim()
                                  ? 'top-2 text-xs font-medium text-blue-600'
                                  : 'top-1/2 -translate-y-1/2 text-base'
                              }
                            `}
                          >
                            Email address
                          </label>
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                          <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() =>
                              setPasswordFocused(password.trim() !== '')
                            }
                            required
                            minLength={6}
                            disabled={loading || isProcessingAuth}
                            className="
                              w-full h-14 px-4 pt-6 pb-2
                              border border-gray-200 rounded-xl
                              text-gray-900 bg-white
                              focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400
                              outline-none transition-all duration-200
                              disabled:opacity-50 disabled:cursor-not-allowed
                            "
                          />
                          <label
                            htmlFor="password"
                            className={`
                              absolute left-4 text-gray-500 pointer-events-none
                              transition-all duration-200 ease-out
                              ${
                                passwordFocused || password.trim()
                                  ? 'top-2 text-xs font-medium text-blue-600'
                                  : 'top-1/2 -translate-y-1/2 text-base'
                              }
                            `}
                          >
                            Password
                          </label>
                        </div>

                        {/* Forgot Password Link */}
                        {!isSignUp && (
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              disabled={loading || isProcessingAuth}
                              className="
                                text-xs text-gray-500 hover:text-gray-700
                                transition-colors disabled:opacity-50
                                focus:outline-none focus:underline
                              "
                            >
                              Forgot password?
                            </button>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={
                            loading ||
                            isProcessingAuth ||
                            !email.trim() ||
                            !password.trim()
                          }
                          className="
                            w-full h-12 rounded-xl font-semibold text-white
                            bg-gradient-to-r from-blue-500 to-purple-500
                            hover:from-blue-600 hover:to-purple-600
                            transition-all duration-150
                            active:scale-[0.98] disabled:opacity-50
                            disabled:cursor-not-allowed disabled:hover:scale-100
                            focus:outline-none focus:ring-2 focus:ring-blue-400/30
                            shadow-lg shadow-blue-500/25
                          "
                          style={{ minHeight: '48px' }}
                        >
                          {loading || isProcessingAuth
                            ? 'Please wait...'
                            : isSignUp
                              ? 'Create Account'
                              : 'Sign In'}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                {showEmailForm && (
                  <div className="text-center mt-6 space-y-3">
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      disabled={loading || isProcessingAuth}
                      className="
                        text-sm text-gray-600 hover:text-gray-800
                        transition-colors disabled:opacity-50
                        focus:outline-none focus:underline
                      "
                    >
                      {isSignUp
                        ? 'Already have an account? Sign in'
                        : 'New here? Create account'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
