'use client'
import MealChat from '@/components/MealChat'
import { useRouter } from 'next/navigation'

export default function DinnerPage() {
  const router = useRouter()
  return (
    <MealChat
      meal="dinner"
      showNextMeal
      nextMealLabel="Finish Day"
      nextMealHref="/done"
      onComplete={() => router.push('/done')}
    />
  )
}
