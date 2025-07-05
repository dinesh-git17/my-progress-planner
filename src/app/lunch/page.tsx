'use client';
import MealChat from '@/components/MealChat';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LunchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id') || '';

  return (
    <MealChat
      meal="lunch"
      userId={userId}
      showNextMeal
      nextMealLabel="Go to Dinner"
      nextMealHref="/dinner"
      onComplete={() => router.push(`/dinner?user_id=${userId}`)}
    />
  );
}

export default function LunchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LunchContent />
    </Suspense>
  );
}
