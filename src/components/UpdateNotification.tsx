// src/components/UpdateNotification.tsx
'use client';

import { useCacheManager } from '@/hooks/useCacheManager';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { IoCloudDownload } from 'react-icons/io5';

// Version control - update this when pushing new updates
const CURRENT_UPDATE_VERSION = 'v1.2.0';

interface UpdateContent {
  title: string;
  description: string;
  features: string[];
}

export default function UpdateNotification() {
  const { isUpdateAvailable, currentVersion, latestVersion, forceUpdate } =
    useCacheManager();
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateContent, setUpdateContent] = useState<UpdateContent | null>(
    null,
  );
  const [loadingContent, setLoadingContent] = useState(true);

  // Fetch update content from markdown file
  useEffect(() => {
    const fetchUpdateContent = async () => {
      try {
        setLoadingContent(true);
        const response = await fetch(
          `/versions/update.md?v=${CURRENT_UPDATE_VERSION}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch update content');
        }

        const markdown = await response.text();
        const parsed = parseUpdateMarkdown(markdown);
        setUpdateContent(parsed);
      } catch (error) {
        console.error('Error fetching update content:', error);
        // Fallback content
        setUpdateContent({
          title: 'New Update Available',
          description: 'Enhanced meal tracking improvements are ready!',
          features: [
            'Enhanced AI responses',
            'Better streak tracking',
            'Performance improvements',
          ],
        });
      } finally {
        setLoadingContent(false);
      }
    };

    if (isUpdateAvailable) {
      fetchUpdateContent();
    }
  }, [isUpdateAvailable]);

  // Simple markdown parser for update content
  const parseUpdateMarkdown = (markdown: string): UpdateContent => {
    const lines = markdown.split('\n').filter((line) => line.trim());

    let title = 'New Update Available';
    let description = 'Enhanced meal tracking improvements are ready!';
    const features: string[] = [];

    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        title = trimmed.replace('# ', '');
      } else if (trimmed.startsWith('## ')) {
        currentSection = trimmed.replace('## ', '').toLowerCase();
      } else if (trimmed.startsWith('> ')) {
        description = trimmed.replace('> ', '');
      } else if (trimmed.startsWith('- ') && currentSection === 'features') {
        features.push(trimmed.replace('- ', ''));
      }
    }

    return { title, description, features };
  };

  useEffect(() => {
    if (isUpdateAvailable && !loadingContent) {
      // Check if MobileInstallPrompt is currently showing
      const isMobileInstallShowing =
        sessionStorage.getItem('mobile_install_showing') === 'true';

      if (isMobileInstallShowing) {
        // Wait for MobileInstallPrompt to be dismissed, then show update notification
        const checkInterval = setInterval(() => {
          const stillShowing =
            sessionStorage.getItem('mobile_install_showing') === 'true';
          if (!stillShowing) {
            clearInterval(checkInterval);
            // Small delay to ensure smooth transition
            setTimeout(() => {
              setShowNotification(true);
            }, 1000);
          }
        }, 100);

        return () => clearInterval(checkInterval);
      } else {
        // Small delay to ensure app is fully loaded before showing notification
        const timer = setTimeout(() => {
          setShowNotification(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isUpdateAvailable, loadingContent]);

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

  // Close on escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    if (showNotification) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showNotification]);

  if (!showNotification || loadingContent) return null;

  // Animation variants (exactly like DoneModal)
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

  return (
    <AnimatePresence mode="wait">
      {showNotification && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleDismiss}
            style={{
              background: 'rgba(0, 0, 0, 0.4)', // Darker for better readability
              backdropFilter: 'saturate(120%) blur(20px)',
              WebkitBackdropFilter: 'saturate(120%) blur(20px)',
            }}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
            <motion.div
              className="w-full max-w-md mx-auto bg-transparent"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="update-modal-title"
            >
              {/* Main Content Card with Glassmorphism */}
              <div className="mx-4 mb-4">
                <div
                  className="relative flex flex-col items-center px-6 py-8 rounded-3xl border border-white/40"
                  style={{
                    background: 'rgba(255, 255, 255, 0.85)', // Much more opaque
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    boxShadow:
                      '0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {/* Update Icon */}
                  <motion.div
                    key="update-icon"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.4,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                    }}
                    className="mb-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                      <IoCloudDownload className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Main Title - Smaller size */}
                  <motion.h1
                    id="update-modal-title"
                    key="main-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-xl font-bold text-gray-800 mb-1 text-center"
                    style={{ fontFamily: 'Inter, SF Pro Display, sans-serif' }}
                  >
                    {updateContent?.title || 'Update Available!'}
                  </motion.h1>

                  {/* Subtitle Message - Smaller size */}
                  <motion.p
                    key="subtitle-message"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-gray-600 text-center mb-4 text-sm leading-relaxed"
                  >
                    {updateContent?.description ||
                      'New meal tracking improvements are ready!'}
                  </motion.p>

                  {/* Features List - Bigger card */}
                  {updateContent?.features &&
                    updateContent.features.length > 0 && (
                      <motion.div
                        key="features-list"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 1.0 }}
                        className="w-full bg-white/65 backdrop-blur-sm rounded-2xl border border-white/60 mb-6"
                      >
                        {/* Bigger fixed height container with scroll */}
                        <div
                          className="p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent"
                          style={{
                            height: '180px', // Increased from 120px
                            maxHeight: '180px',
                          }}
                        >
                          <div className="space-y-3">
                            {updateContent.features.map((feature, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.4,
                                  delay: 1.0 + index * 0.1,
                                }}
                                className="flex items-start gap-3"
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                                <p className="text-gray-700 font-medium text-sm leading-relaxed">
                                  {feature}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Scroll indicator for long lists */}
                        {updateContent.features.length > 6 && (
                          <div className="px-5 pb-3">
                            <div className="flex justify-center">
                              <div className="w-6 h-0.5 bg-blue-200 rounded-full opacity-50" />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                  {/* Version Info */}
                  {currentVersion !== latestVersion && (
                    <motion.div
                      key="version-info"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.2 }}
                      className="text-center mb-6"
                    >
                      <p className="text-xs text-gray-500">
                        Updating from v{currentVersion} to v{latestVersion}
                      </p>
                    </motion.div>
                  )}

                  {/* Update Process Info - Shows when updating */}
                  <AnimatePresence>
                    {isUpdating && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full text-center mb-4"
                      >
                        <div className="bg-white/65 backdrop-blur-sm rounded-xl border border-white/60 p-3">
                          <p className="text-xs text-gray-600 mb-2">
                            Your meal data and progress will be preserved
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                              className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"
                            />
                            <span className="text-xs text-gray-600">
                              Updating...
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons - Matching LunchModal style */}
                  <motion.div
                    key="button-container"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{
                      duration: 0.6,
                      delay: 1.4,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="w-full overflow-hidden"
                  >
                    {/* Update Now Button - Primary action */}
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="w-full py-3 px-5 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 mb-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: isUpdating
                          ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: isUpdating
                          ? '0 4px 14px 0 rgba(156, 163, 175, 0.25)'
                          : '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isUpdating) {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                          e.currentTarget.style.boxShadow =
                            '0 8px 25px 0 rgba(59, 130, 246, 0.35)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isUpdating) {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                          e.currentTarget.style.boxShadow =
                            '0 4px 14px 0 rgba(59, 130, 246, 0.25)';
                        }
                      }}
                    >
                      {isUpdating ? (
                        <div className="flex items-center justify-center gap-2">
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
                        <>
                          <span>Update Now</span>
                          <IoCloudDownload className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Maybe Later Button - Secondary action */}
                    <button
                      onClick={handleDismiss}
                      disabled={isUpdating}
                      className="w-full py-2 px-5 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gray-50 hover:bg-opacity-50 active:scale-95 disabled:opacity-50"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      Maybe Later
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
