'use client'
import MealChat from '@/components/MealChat'
import { useRouter } from 'next/navigation'

export default function LunchPage() {
  const router = useRouter()
  return (
    <MealChat
      meal="lunch"
      showNextMeal
      nextMealLabel="Go to Dinner"
      nextMealHref="/dinner"
      onComplete={() => router.push('/dinner')}
    />
  )
}
