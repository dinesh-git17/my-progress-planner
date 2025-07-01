'use client'
import MealChat from '@/components/MealChat'
import { useRouter } from 'next/navigation'

export default function BreakfastPage() {
  const router = useRouter()
  return (
    <MealChat
      meal="breakfast"
      showNextMeal
      nextMealLabel="Go to Lunch"
      nextMealHref="/lunch"
      onComplete={() => router.push('/lunch')}
    />
  )
}
