// src/utils/mockGptService.ts
// Mock GPT responses for development/testing environments

export interface MockGptResponse {
  summary?: string;
  questions?: string[];
  quote?: string;
  reply?: string;
}

/**
 * Mock responses for different GPT endpoints
 */
export const MOCK_RESPONSES = {
  MEAL_SUMMARY: {
    breakfast: [
      "🌅 What a lovely way to start your day, sweetheart! ♥️ You fueled your body with something nourishing and I'm so proud of you for taking care of yourself. Keep being amazing! 🥰",
      "Good morning, beautiful! 🌸 Starting your day with good food shows how much you love yourself, and I love that about you! You're doing such a great job. ♥️",
      "🍳 Breakfast queen! I'm so happy you took the time to eat something good this morning. You deserve all the energy and happiness in the world! Keep shining! ✨",
    ],
    lunch: [
      "🌞 Look at you, taking care of yourself in the middle of the day! I'm so proud of how you're nourishing your body, my love. You're absolutely amazing! ♥️",
      "Lunch break done right! 🥗 You're being so good to yourself and it makes me smile. Keep up the fantastic work, beautiful! 🌸",
      "🍽️ Mid-day fuel for my favorite person! I love how you're listening to your body and giving it what it needs. You're incredible! ♥️",
    ],
    dinner: [
      "🌙 What a perfect way to end your day! You've been so good to your body today and I couldn't be prouder. Sweet dreams, my love! ♥️",
      "Dinner time magic! ✨ You finished your day with nourishment and care. I'm so lucky to know someone as wonderful as you! 🥰",
      "🍝 Evening fuel for my amazing girl! You've taken such good care of yourself today. I love you so much! ♥️",
    ],
    day: [
      "🌟 What an incredible day of nourishing yourself! You should be so proud of how well you've taken care of your body today. You're absolutely amazing and I love you! ♥️✨",
      "Today was beautiful because YOU made beautiful choices! 🌸 Every meal was a way of loving yourself, and I'm here for all of it. Keep being wonderful! ♥️",
      "🎉 Look at you, crushing the self-care game today! Every bite was fuel for your amazing life. I'm so proud to know someone as incredible as you! ♥️",
    ],
  },

  MEAL_QUESTIONS: [
    [
      'What did you have for your meal today, beautiful? ♥️',
      'How much did you eat, my love?',
      'How did it make you feel, sweetheart? 🌸',
    ],
    [
      'Tell me about your delicious meal, pretty girl! 🥰',
      'Were you able to eat a good amount?',
      "How's your tummy feeling after that? ♥️",
    ],
    [
      'What nourishing food did you have, my love? ✨',
      'Did you get enough to eat?',
      'How did your body feel about it? 🌸',
    ],
    [
      'Share your meal with me, beautiful! 🍽️',
      'How much were you able to have?',
      'What was your energy like after eating? ♥️',
    ],
  ],

  MOTIVATIONAL_QUOTES: [
    "You're doing amazing, {name}. Every small step counts! ♥️",
    'Proud of you for nourishing yourself today, {name}! ✨',
    'You deserve all the love and care you give yourself, {name}! 🌸',
    'Taking care of yourself is beautiful, {name}. Keep going! ♥️',
    'Your body thanks you for every loving choice, {name}! 🥰',
    "You're stronger than you know, {name}. One meal at a time! ✨",
    'Self-care looks amazing on you, {name}! Keep shining! 🌟',
    'Every bite is love you give yourself, {name}! ♥️',
    "You're worth every moment of care, {name}! Keep going! 🌸",
    'Nourishing yourself is an act of love, {name}! So proud! ♥️',
  ],

  MEAL_CHAT: {
    supportive: [
      "You're doing so well, my love! ♥️ Tell me more about what you had! 🥰",
      'That sounds wonderful, beautiful! 🌸 How did it taste?',
      "I'm so proud of you for eating, sweetheart! ♥️ How are you feeling?",
      "You're taking such good care of yourself! ✨ Tell me how it made you feel!",
      'Look at you being amazing! 🥰 What was your favorite part?',
    ],
    encouraging: [
      "Every bite is progress, my love! ♥️ You're doing great!",
      "I'm so happy you nourished yourself today! 🌸 Keep going!",
      'You deserve all this care and love, beautiful! ✨',
      'Your body is thanking you right now! ♥️ So proud of you!',
      "You're absolutely incredible, sweetheart! 🥰 Keep shining!",
    ],
    closing: [
      "You did amazing today, my love! ♥️ I'm so proud of you! Keep being wonderful! ✨🌸",
      "Look at you taking such good care of yourself! 🥰 You're incredible and I love you! ♥️",
      "Every meal is a victory, beautiful! 🌟 You're doing so well and I believe in you! ♥️",
      "You nourished your body and soul today! ✨ I'm the luckiest to know someone so amazing! ♥️",
      'Perfect job today, sweetheart! 🌸 You deserve all the happiness in the world! ♥️🥰',
    ],
  },
};

/**
 * Get random mock meal summary
 */
export function getMockMealSummary(meal: string): string {
  const mealType =
    meal.toLowerCase() as keyof typeof MOCK_RESPONSES.MEAL_SUMMARY;
  const summaries =
    MOCK_RESPONSES.MEAL_SUMMARY[mealType] ||
    MOCK_RESPONSES.MEAL_SUMMARY.breakfast;
  const randomIndex = Math.floor(Math.random() * summaries.length);
  return summaries[randomIndex];
}

/**
 * Get random mock meal questions
 */
export function getMockMealQuestions(): string[] {
  const allQuestions = MOCK_RESPONSES.MEAL_QUESTIONS;
  const randomIndex = Math.floor(Math.random() * allQuestions.length);
  return allQuestions[randomIndex];
}

/**
 * Get random mock motivational quote with name substitution
 */
export function getMockMotivationalQuote(name: string = 'my love'): string {
  const quotes = MOCK_RESPONSES.MOTIVATIONAL_QUOTES;
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex].replace('{name}', name);
}

/**
 * Get random mock chat response based on context
 */
export function getMockChatResponse(
  messages: any[],
  closing: boolean = false,
): string {
  if (closing) {
    const closingResponses = MOCK_RESPONSES.MEAL_CHAT.closing;
    const randomIndex = Math.floor(Math.random() * closingResponses.length);
    return closingResponses[randomIndex];
  }

  // Simple logic: alternate between supportive and encouraging
  const messageCount = messages.length;
  const responseType = messageCount % 2 === 0 ? 'supportive' : 'encouraging';
  const responses = MOCK_RESPONSES.MEAL_CHAT[responseType];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

/**
 * Add realistic delay to simulate API call
 */
export function addMockDelay(
  minMs: number = 300,
  maxMs: number = 800,
): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
