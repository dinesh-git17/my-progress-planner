// src/components/UpdateNotification.tsx
'use client';

import { useCacheManager } from '@/hooks/useCacheManager';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function UpdateNotification() {
  const { isUpdateAvailable, currentVersion, latestVersion, forceUpdate } =
    useCacheManager();
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      // Small delay to ensure app is fully loaded before showing notification
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isUpdateAvailable]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      forceUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    // Show again after 1 hour if user dismisses
    setTimeout(
      () => {
        if (isUpdateAvailable) {
          setShowNotification(true);
        }
      },
      60 * 60 * 1000,
    ); // 1 hour
  };

  if (!showNotification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white/95 backdrop-blur-sm border border-orange-200/50 rounded-3xl shadow-2xl p-8 max-w-sm w-full transform transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="flex-shrink-0"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <span className="text-3xl">🍽️</span>
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Fresh Features Ready!
              </h3>
              <p className="text-sm text-gray-600">
                New meal tracking improvements are available
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🤖</span>
                <p className="text-sm text-orange-700 font-medium">
                  Enhanced AI responses
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">📈</span>
                <p className="text-sm text-orange-700 font-medium">
                  Better streak tracking
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <p className="text-sm text-orange-700 font-medium">
                  Performance improvements
                </p>
              </div>
            </div>
          </div>

          {/* Version Info */}
          {currentVersion !== latestVersion && (
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500">
                Updating from v{currentVersion} to v{latestVersion}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDismiss}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
              type="button"
            >
              Maybe Later
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 text-white font-medium text-sm hover:from-orange-500 hover:to-amber-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Now 🚀'
              )}
            </motion.button>
          </div>

          {/* Update Process Info */}
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 text-center"
            >
              <p className="text-xs text-gray-500">
                Your meal data and progress will be preserved
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
