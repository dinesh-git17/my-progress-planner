'use client';
import MealChat from '@/components/MealChat';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DinnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id') || '';

  return (
    <MealChat
      meal="dinner"
      userId={userId}
      showNextMeal
      nextMealLabel="Finish Day"
      nextMealHref="/done"
      onComplete={() => router.push(`/done?user_id=${userId}`)}
    />
  );
}

export default function DinnerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DinnerContent />
    </Suspense>
  );
}
