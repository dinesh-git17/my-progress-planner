// src/app/breakfast/page.tsx
'use client';
import MealChat from '@/components/MealChat';
import { getCurrentSession, getLocalUserId } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function BreakfastContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Get the correct user ID (authenticated or local)
  useEffect(() => {
    const getUserId = async () => {
      try {
        // First check if user is authenticated
        const session = await getCurrentSession();
        if (session?.user) {
          console.log('🔐 Breakfast: Using auth ID:', session.user.id);
          setUserId(session.user.id);
        } else {
          // Fall back to local user ID
          const localUserId = getLocalUserId();
          if (localUserId) {
            console.log('📱 Breakfast: Using local ID:', localUserId);
            setUserId(localUserId);
          } else {
            console.log('❌ No user ID found, redirecting to home');
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    getUserId();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return null; // Will redirect
  }

  return (
    <MealChat
      meal="breakfast"
      userId={userId}
      showNextMeal
      nextMealLabel="Go to Lunch"
      nextMealHref="/lunch"
      onComplete={() => {
        // Navigate to lunch with proper user context
        console.log('✅ Breakfast completed, going to lunch');
        router.push('/lunch');
      }}
    />
  );
}

export default function BreakfastPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <BreakfastContent />
    </Suspense>
  );
}
