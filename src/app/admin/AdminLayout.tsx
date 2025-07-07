'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem('admin_authenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        sessionStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 text-6xl">🔐</div>
            <h1 className="text-center text-2xl font-bold text-pink-600 mb-3 tracking-tight">
              Admin Portal Access
            </h1>
            <p className="text-center text-lg text-gray-600 mb-0.5">
              Enter admin password to continue
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/40">
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                className="
                  w-full px-6 py-4 mb-6 rounded-2xl border-none shadow-inner
                  bg-white/90 text-gray-800 text-xl
                  focus:ring-2 focus:ring-pink-300/40 outline-none transition
                  placeholder:text-gray-400
                "
                placeholder="Admin password…"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                disabled={isSubmitting}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 text-red-500 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={!password.trim() || isSubmitting}
                className="
                  w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-purple-400
                  text-white text-xl font-bold shadow-lg transition 
                  hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  tracking-wide focus:outline-none focus:ring-2 focus:ring-pink-300/40
                "
              >
                {isSubmitting ? 'Authenticating...' : 'Access Admin Portal'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // If authenticated, render the children
  return <>{children}</>;
}
