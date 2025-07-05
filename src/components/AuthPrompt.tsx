// src/components/AuthPrompt.tsx

'use client';

import { motion } from 'framer-motion';

interface AuthPromptProps {
  onContinueAsGuest: () => void;
  onLogin: () => void;
}

export default function AuthPrompt({
  onContinueAsGuest,
  onLogin,
}: AuthPromptProps) {
  console.log('🔐 AuthPrompt component rendered');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-50 flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 text-6xl">🍽️</div>
          <h1 className="text-center text-2xl font-bold text-pink-600 mb-3 tracking-tight">
            Welcome to Meal Tracker!
          </h1>
          <p className="text-center text-lg text-gray-600 mb-0.5">
            Choose how you'd like to continue
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/40 space-y-4">
          {/* Login Button */}
          <button
            onClick={() => {
              console.log('🔑 Login button clicked');
              onLogin();
            }}
            className="
              w-full py-4 rounded-2xl bg-gradient-to-r from-blue-400 via-blue-500 to-purple-400
              text-white text-xl font-bold shadow-lg transition 
              hover:scale-[1.02] active:scale-[0.98]
              tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-300/40
            "
            type="button"
          >
            🔐 Login / Sign Up
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Continue as Guest Button */}
          <button
            onClick={() => {
              console.log('👥 Guest button clicked');
              onContinueAsGuest();
            }}
            className="
              w-full py-4 rounded-2xl bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400
              text-white text-xl font-bold shadow-lg transition 
              hover:scale-[1.02] active:scale-[0.98]
              tracking-wide focus:outline-none focus:ring-2 focus:ring-gray-300/40
            "
            type="button"
          >
            👥 Continue as Guest
          </button>
        </div>
      </div>
    </motion.div>
  );
}
