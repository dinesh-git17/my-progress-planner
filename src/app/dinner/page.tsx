'use client';
import MealChat from '@/components/MealChat';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DinnerPage() {
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
