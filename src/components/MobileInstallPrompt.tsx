// src/components/MobileInstallPrompt.tsx
'use client';

import { PWAInstaller } from '@/utils/sw-utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MobileInstallPromptProps {
  onDismiss?: () => void;
}

export default function MobileInstallPrompt({
  onDismiss,
}: MobileInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [browserName, setBrowserName] = useState('');

  useEffect(() => {
    // Check if we should show the prompt
    const shouldShowPrompt = () => {
      // Don't show if already installed
      if (PWAInstaller.isInstalled()) return false;

      // Only show on mobile touch devices
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      return isMobile && hasTouch;
    };

    // Detect device and browser
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroidDevice = /Android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Detect browser for specific instructions
    if (isIOSDevice) {
      if (/Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent)) {
        setBrowserName('Safari');
      } else if (/CriOS/.test(userAgent)) {
        setBrowserName('Chrome');
      } else if (/FxiOS/.test(userAgent)) {
        setBrowserName('Firefox');
      } else {
        setBrowserName('Browser');
      }
    } else if (isAndroidDevice) {
      if (/Chrome/.test(userAgent) && !/EdgA/.test(userAgent)) {
        setBrowserName('Chrome');
      } else if (/Firefox/.test(userAgent)) {
        setBrowserName('Firefox');
      } else if (/EdgA/.test(userAgent)) {
        setBrowserName('Edge');
      } else {
        setBrowserName('Browser');
      }
    }

    // Show prompt after a delay to let the page load
    if (shouldShowPrompt()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1000); // Show after 1 second

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  const handleInstall = async () => {
    if (isAndroid && PWAInstaller.canInstall()) {
      // Try native installation for Android Chrome
      const success = await PWAInstaller.promptInstall();
      if (success) {
        setShowPrompt(false);
        return;
      }
    }

    // Keep the prompt open to show manual instructions
    // User can dismiss it after following the steps
  };

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        icon: '🍎',
        title: 'Add to Home Screen',
        steps: [
          `Tap the share button ${browserName === 'Safari' ? '↗️' : '⋯'} in your ${browserName}`,
          'Select "Add to Home Screen" 📱',
          'Tap "Add" to install the app ✨',
        ],
      };
    } else if (isAndroid) {
      return {
        icon: '🤖',
        title: 'Install App',
        steps: PWAInstaller.canInstall()
          ? ['Tap "Install" below to add to your home screen 📱']
          : [
              'Tap the menu button ⋯ in your browser',
              'Select "Add to Home screen" or "Install" 📱',
              'Tap "Add" to install the app ✨',
            ],
      };
    }

    return {
      icon: '📱',
      title: 'Install App',
      steps: [
        "Use your browser's menu to add this app to your home screen",
        'Look for "Add to Home Screen" or "Install" options',
      ],
    };
  };

  const instructions = getInstallInstructions();

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Install Prompt Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.1,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
              {/* Header */}
              <div className="text-center mb-5">
                <div
                  className="text-4xl mb-3"
                  role="img"
                  aria-label={instructions.icon}
                >
                  {instructions.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Get the My Progress App!
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Install our app for a better experience with offline access,
                  notifications, and faster loading.
                </p>
              </div>

              {/* Instructions */}
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {instructions.title}
                </h3>
                <ol className="space-y-2">
                  {instructions.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start text-sm text-gray-700"
                    >
                      <span className="w-5 h-5 bg-pink-100 text-pink-600 rounded-full text-xs font-semibold flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                {isAndroid && PWAInstaller.canInstall() && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInstall}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl py-3 px-4 font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Install Now
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDismiss}
                  className={`${
                    isAndroid && PWAInstaller.canInstall()
                      ? 'flex-1 bg-gray-100 text-gray-700'
                      : 'w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                  } rounded-xl py-3 px-4 font-semibold text-sm transition-colors hover:bg-gray-200`}
                >
                  {isAndroid && PWAInstaller.canInstall()
                    ? 'Maybe Later'
                    : 'Got it!'}
                </motion.button>
              </div>

              {/* Benefits */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="text-xs text-gray-600">
                    <div className="text-base mb-1">📱</div>
                    <div>Home Screen</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="text-base mb-1">⚡</div>
                    <div>Offline Access</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="text-base mb-1">🔔</div>
                    <div>Notifications</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
