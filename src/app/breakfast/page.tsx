'use client';
import MealChat from '@/components/MealChat';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BreakfastPage() {
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
