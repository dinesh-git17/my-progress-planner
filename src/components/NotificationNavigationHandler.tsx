'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function NotificationNavigationHandler() {
  const router = useRouter();

  useEffect(() => {
    // Only set up listener if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      

      // Handle notification click navigation
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const targetUrl = event.data.url;


        // Use Next.js router to navigate
        router.push(targetUrl);
      }
    };

    // Add event listener for service worker messages
    navigator.serviceWorker.addEventListener(
      'message',
      handleServiceWorkerMessage,
    );

    return () => {
      // Cleanup listener on unmount
      navigator.serviceWorker.removeEventListener(
        'message',
        handleServiceWorkerMessage,
      );
    };
  }, [router]);

  return null; // This component doesn't render anything
}
