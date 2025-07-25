// src/components/DebugControls.tsx
'use client';

import { useCacheManager } from '@/hooks/useCacheManager';
import { useEffect, useState } from 'react';

export default function DebugControls() {
  const {
    debugMode,
    isUpdateAvailable,
    currentVersion,
    latestVersion,
    enableDebugMode,
    disableDebugMode,
    toggleUpdateNotification,
  } = useCacheManager();

  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700 max-w-xs">
      <div className="text-sm font-bold mb-3 text-yellow-400">
        🐛 Debug Controls
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <strong>Version:</strong> {currentVersion} → {latestVersion}
        </div>
        <div>
          <strong>Debug Mode:</strong> {debugMode ? '✅ ON' : '❌ OFF'}
        </div>
        <div>
          <strong>Update Available:</strong>{' '}
          {isUpdateAvailable ? '✅ YES' : '❌ NO'}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        {!debugMode ? (
          <button
            onClick={enableDebugMode}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
          >
            Enable Debug Mode
          </button>
        ) : (
          <>
            <button
              onClick={toggleUpdateNotification}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
            >
              {isUpdateAvailable ? 'Hide' : 'Show'} Update Modal
            </button>
            <button
              onClick={disableDebugMode}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
            >
              Disable Debug Mode
            </button>
          </>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-400">
        💡 Console commands available when debug enabled
      </div>
    </div>
  );
}
