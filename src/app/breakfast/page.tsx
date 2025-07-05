'use client';
import MealChat from '@/components/MealChat';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BreakfastContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id') || '';

  return (
    <MealChat
      meal="breakfast"
      userId={userId}
      showNextMeal
      nextMealLabel="Go to Lunch"
      nextMealHref="/lunch"
      onComplete={() => router.push(`/lunch?user_id=${userId}`)}
    />
  );
}

export default function BreakfastPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BreakfastContent />
    </Suspense>
  );
}
