'use client';
import MealChat from '@/components/MealChat';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LunchPage() {
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
