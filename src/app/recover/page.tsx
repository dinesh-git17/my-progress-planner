'use client';

import { getCurrentSession } from '@/utils/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RecoverDataPage() {
  const [userIdInput, setUserIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<
    'idle' | 'success' | 'error' | 'not-found'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [recoveredData, setRecoveredData] = useState<any>(null);
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getCurrentSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentUserId(session.user.id);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const handleRecovery = async () => {
    if (!userIdInput.trim()) {
      setErrorMessage('Please enter a valid User ID');
      return;
    }

    if (!isAuthenticated) {
      setErrorMessage('Please log in first to recover your data');
      return;
    }

    setIsLoading(true);
    setRecoveryStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/recover-legacy-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legacyUserId: userIdInput.trim(),
          currentUserId: currentUserId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRecoveryStatus('success');
        setRecoveredData(result.data);

        // Set recovery flag in localStorage
        localStorage.setItem('data_just_recovered', 'true');
        localStorage.setItem('recovery_user_id', currentUserId || '');
        localStorage.setItem('recovery_timestamp', Date.now().toString());
      } else if (result.error === 'No data found') {
        setRecoveryStatus('not-found');
        setErrorMessage('No data found for this User ID');
      } else {
        setRecoveryStatus('error');
        setErrorMessage(result.error || 'Recovery failed');
      }
    } catch (error) {
      console.error('Recovery error:', error);
      setRecoveryStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5ede6] via-[#f7edf5] to-[#d8d8f0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/40">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 text-5xl">🔄</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Recover Your Data
            </h1>
            <p className="text-gray-600 text-sm">
              Enter your previous User ID to merge your old meal logs with your
              current account
            </p>
          </div>

          {/* Authentication Check */}
          {!isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-6 bg-yellow-50 rounded-2xl border border-yellow-200 mb-6"
            >
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="font-semibold text-yellow-800 mb-2">
                Login Required
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                You need to be logged in to recover your data
              </p>
              <button
                onClick={handleGoHome}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Go to Login
              </button>
            </motion.div>
          ) : (
            <>
              {/* Current User Info */}
              <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">✅</div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Logged in as: {currentUserId}
                    </p>
                    <p className="text-xs text-green-600">
                      Data will be merged into this account
                    </p>
                  </div>
                </div>
              </div>

              {/* Recovery Form */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="userId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Previous User ID
                  </label>
                  <input
                    id="userId"
                    type="text"
                    placeholder="e.g., user_abc123xyz789"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && !isLoading && handleRecovery()
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the unique ID from your previous app usage
                  </p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </motion.div>
                )}

                {/* Recover Button */}
                <button
                  onClick={handleRecovery}
                  disabled={isLoading || !userIdInput.trim()}
                  className="
                    w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-500 
                    text-white font-semibold rounded-xl shadow-lg
                    hover:scale-[1.02] active:scale-[0.98] 
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    transition-all duration-200
                  "
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Recovering Data...
                    </div>
                  ) : (
                    'Recover My Data'
                  )}
                </button>
              </div>
            </>
          )}

          {/* Recovery Status */}
          <AnimatePresence>
            {recoveryStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center"
              >
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-semibold text-green-800 mb-2">
                  Data Recovered Successfully!
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  {recoveredData && (
                    <>
                      <p>
                        • {recoveredData.mealLogsCount || 0} meal logs
                        transferred
                      </p>
                      <p>
                        • {recoveredData.summariesCount || 0} daily summaries
                        transferred
                      </p>
                      <p>
                        • {recoveredData.nameTransferred ? 'Name' : 'No name'}{' '}
                        transferred
                      </p>
                      <p>• All data is now linked to your current account</p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    // Force a full page reload to refresh all state
                    window.location.href = '/';
                  }}
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Go to Home
                </button>
              </motion.div>
            )}

            {recoveryStatus === 'not-found' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-xl text-center"
              >
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  No Data Found
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  We couldn't find any data associated with this User ID. Please
                  double-check the ID and try again.
                </p>
                <button
                  onClick={() => {
                    setRecoveryStatus('idle');
                    setUserIdInput('');
                    setErrorMessage('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {recoveryStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl text-center"
              >
                <div className="text-4xl mb-3">❌</div>
                <h3 className="font-semibold text-red-800 mb-2">
                  Recovery Failed
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  {errorMessage ||
                    'Something went wrong during the recovery process.'}
                </p>
                <button
                  onClick={() => {
                    setRecoveryStatus('idle');
                    setErrorMessage('');
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={handleGoHome}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40"
        >
          <h4 className="font-semibold text-gray-800 mb-2">Need Help?</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Your User ID was displayed in the old version of the app</p>
            <p>
              • It usually starts with "user_" followed by random characters
            </p>
            <p>• Contact support if you can't find your User ID</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
