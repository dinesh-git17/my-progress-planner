// src/components/LunchModal.tsx
'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect } from 'react';
import { FaArrowRight, FaHeart, FaHome, FaStar } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';
import { IoCheckmarkCircle } from 'react-icons/io5';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDinner?: () => void;
  onNavigateHome?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LunchModal({
  isOpen,
  onClose,
  onNavigateToDinner,
  onNavigateHome,
}: LunchModalProps) {
  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  const { navigate } = useNavigation();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleNavigateToDinner = useCallback(() => {
    if (onNavigateToDinner) {
      onNavigateToDinner();
    } else {
      navigate('/dinner');
    }
    handleClose();
  }, [onNavigateToDinner, navigate, handleClose]);

  const handleNavigateHome = useCallback(() => {
    sessionStorage.setItem('isReturningToHome', 'true');
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate('/');
    }
    handleClose();
  }, [navigate, onNavigateHome, handleClose]);

  // Close on escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  // ========================================================================
  // ANIMATION VARIANTS (MATCHING DONEMODAL)
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

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop - Matching DoneModal */}
          <motion.div
            className="fixed inset-0 z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
            style={{
              background: 'rgba(0, 0, 0, 0.1)', // Very light overlay like DoneModal
              backdropFilter: 'saturate(120%) blur(12px)',
              WebkitBackdropFilter: 'saturate(120%) blur(12px)',
            }}
            aria-hidden="true"
          />

          {/* Modal Container - Slide from Bottom */}
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
              aria-labelledby="lunch-modal-title"
            >
              {/* Main Content Card with Glassmorphism - Matching DoneModal */}
              <div className="mx-4 mb-4">
                <div
                  className="relative flex flex-col items-center px-8 py-12 rounded-3xl border border-white/40"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)', // Same translucent white
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    boxShadow:
                      '0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {/* Floating decorative icons - Matching DoneModal positions */}
                  <motion.div
                    key="sparkles-icon"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    transition={{ duration: 1.2, delay: 1.0 }}
                    className="absolute top-6 right-6 text-blue-400 text-xl"
                  >
                    <GiSparkles />
                  </motion.div>
                  <motion.div
                    key="star-icon"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.5, scale: 1 }}
                    transition={{ duration: 1.2, delay: 1.2 }}
                    className="absolute bottom-6 left-6 text-indigo-400 text-lg"
                  >
                    <FaStar />
                  </motion.div>
                  <motion.div
                    key="heart-icon"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    transition={{ duration: 1.2, delay: 1.4 }}
                    className="absolute top-1/2 right-8 text-sky-400 text-base"
                  >
                    <FaHeart />
                  </motion.div>

                  {/* Success Icon - Matching DoneModal */}
                  <motion.div
                    key="success-icon"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      damping: 15,
                      stiffness: 300,
                      delay: 0.2,
                    }}
                    className="mb-6"
                  >
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <IoCheckmarkCircle className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  {/* Main Title */}
                  <motion.h2
                    key="main-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-3xl font-bold text-gray-800 mb-4 leading-tight"
                    id="lunch-modal-title"
                  >
                    Lunch Complete!
                  </motion.h2>

                  {/* Celebration Icon */}
                  <motion.div
                    key="celebration-icon"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      damping: 20,
                      stiffness: 300,
                      delay: 0.6,
                    }}
                    className="flex items-center justify-center gap-2 mb-6"
                  >
                    <FaStar className="w-5 h-5 text-blue-500" />
                    <span className="text-4xl">🥪</span>
                    <FaStar className="w-5 h-5 text-blue-500" />
                  </motion.div>

                  {/* Motivational Message */}
                  <motion.p
                    key="motivation-message"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-lg leading-relaxed mb-2 text-gray-700 text-center"
                  >
                    Perfect midday fuel! You're keeping your energy up and
                    staying amazing! 💪
                  </motion.p>

                  {/* Completion Celebration */}
                  <motion.div
                    key="completion-celebration"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="text-center mb-8"
                  >
                    <p className="text-sm text-gray-600 font-medium">
                      Ready for a delicious dinner!
                    </p>
                  </motion.div>

                  {/* Action Buttons - Matching DoneModal */}
                  <motion.div
                    key="button-container"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{
                      duration: 0.6,
                      delay: 1.2,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="w-full overflow-hidden"
                  >
                    {/* Go to Dinner Button */}
                    <button
                      onClick={handleNavigateToDinner}
                      className="w-full py-4 px-6 rounded-2xl text-white font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 mb-3"
                      style={{
                        background:
                          'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 8px 25px 0 rgba(59, 130, 246, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 4px 14px 0 rgba(59, 130, 246, 0.25)';
                      }}
                    >
                      <span>Go to Dinner</span>
                      <FaArrowRight className="w-4 h-4" />
                    </button>

                    {/* Return Home Button */}
                    <button
                      onClick={handleNavigateHome}
                      className="w-full py-3 px-6 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gray-50 hover:bg-opacity-50 active:scale-95"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <FaHome className="w-4 h-4" />
                      Return Home
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
