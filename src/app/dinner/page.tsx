// src/app/dinner/page.tsx
'use client';
import MealChat from '@/components/MealChat';
import { getCurrentSession, getLocalUserId } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function DinnerContent() {
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

          setUserId(session.user.id);
        } else {
          // Fall back to local user ID
          const localUserId = getLocalUserId();
          if (localUserId) {

            setUserId(localUserId);
          } else {

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
      meal="dinner"
      userId={userId}
      showNextMeal
      nextMealLabel="Finish Day"
      nextMealHref="/"
      onComplete={() => {
        // Navigate back to home with completed meal data

        router.push('/');
      }}
    />
  );
}

export default function DinnerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <DinnerContent />
    </Suspense>
  );
}
