// src/app/lunch/page.tsx
'use client';
import MealChat from '@/components/MealChat';
import { useNavigation } from '@/contexts/NavigationContext';
import { getCurrentSession, getLocalUserId } from '@/utils/auth';
import { Suspense, useEffect, useState } from 'react';

function LunchContent() {
  const { navigate } = useNavigation();
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Get the correct user ID (authenticated or local)
  useEffect(() => {
    const getUserId = async () => {
      try {
        // First check if user is authenticated
        const session = await getCurrentSession();
        if (session?.user) {
          console.log('🔐 Lunch: Using auth ID:', session.user.id);
          setUserId(session.user.id);
        } else {
          // Fall back to local user ID
          const localUserId = getLocalUserId();
          if (localUserId) {
            console.log('📱 Lunch: Using local ID:', localUserId);
            setUserId(localUserId);
          } else {
            console.log('❌ No user ID found, redirecting to home');
            navigate('/');
            return;
          }
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    getUserId();
  }, [navigate]);

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
      meal="lunch"
      userId={userId}
      showNextMeal
      nextMealLabel="Go to Dinner"
      nextMealHref="/dinner"
      onComplete={() => {
        // Navigate to dinner with proper user context
        console.log('✅ Lunch completed, going to dinner');
        navigate('/dinner');
      }}
    />
  );
}

export default function LunchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <LunchContent />
    </Suspense>
  );
}
