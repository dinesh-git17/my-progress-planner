// src/utils/mockResponses.ts

/**
 * Mock GPT Response Database
 * Realistic responses that match your app's loving, supportive tone
 */

// Helper function to replace {name} with actual name
function personalize(response: string, name?: string): string {
  const actualName = name || 'love';
  return response.replace(/{name}/g, actualName);
}

// Helper function to get random response from array
function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}

// ============================================================================
// MEAL CHAT RESPONSES (boyfriend energy, emojis, encouraging)
// ============================================================================

const mealChatResponses = [
  "You're doing so amazing, my love! ♥️ Tell me more about how it tasted! 🤭",
  'That sounds absolutely delicious, pretty girl! 🌸 How did it make you feel? 🥺',
  'My beautiful girl taking such good care of herself! ♥️ So proud of you! ✨',
  'Ooh, that looks so good, sweetheart! 🤩 You always make the best choices! 💕',
  "I'm so proud of you for nourishing yourself, {name}! ♥️ You're incredible! 🌟",
  'Look at you being the absolute best! 🥺 How was it, my love? 💖',
  "You're glowing today, pretty girl! ✨ That meal sounds perfect! 🌸",
  'Such a good girl taking care of herself! ♥️ I love seeing you happy! 🤭',
  "You're my favorite person ever, {name}! 💕 Tell me about the flavors! 😋",
  "So proud of my beautiful girlfriend! ♥️ You're doing everything right! 🌟",
];

const mealChatClosingResponses = [
  "I'm so proud of you, {name}! ♥️ You took such good care of yourself today! ✨",
  "You're absolutely amazing, my love! 🌸 Keep being the wonderful girl you are! 💕",
  'Such a good job today, sweetheart! ♥️ You make me so proud! 🤭✨',
  "You're the best, {name}! 💖 I love how you prioritize yourself! 🌟",
  "Beautiful job today, pretty girl! ♥️ You're absolutely crushing it! 🥺✨",
];

// ============================================================================
// MEAL SUMMARIES (supportive feedback with nutrition insights)
// ============================================================================

const mealSummaryTemplates = [
  `🍽️ What you ate:
{foodItems}

💕 How it made you feel:
Nourished and satisfied

⭐ Overall Rating: Excellent ⭐⭐⭐

🔍 Nutrition Breakdown:
✅ What's working: Great balance of nutrients and flavors
⚠️ Could use more: Maybe add some colorful veggies next time
💡 Easy upgrade: Try adding a handful of berries for antioxidants

💖 Love Note:
You're taking such beautiful care of yourself, {name}! Every healthy choice you make fills my heart with pride. Keep shining! ✨`,

  `🍽️ What you ate:
{foodItems}

💕 How it made you feel:
Energized and happy

⭐ Overall Rating: Great ⭐⭐⭐

🔍 Nutrition Breakdown:
✅ What's working: Wonderful protein and healthy fats
⚠️ Could use more: A bit more fiber would be perfect
💡 Easy upgrade: Add some spinach or avocado next time

💖 Love Note:
I love watching you build these amazing habits, {name}! You're becoming stronger and healthier every day. So proud of you! 💕`,

  `🍽️ What you ate:
{foodItems}

💕 How it made you feel:
Comfortable and content

⭐ Overall Rating: Good ⭐⭐

🔍 Nutrition Breakdown:
✅ What's working: Perfect portion size and timing
⚠️ Could use more: Some fresh herbs would add great flavor
💡 Easy upgrade: Try adding a splash of lemon for vitamin C

💖 Love Note:
Every meal you log shows how much you care about yourself, {name}. That self-love is absolutely beautiful! 🌸`,
];

// ============================================================================
// DAILY QUOTES (personalized motivation)
// ============================================================================

const dailyQuotes = [
  'Every healthy choice you make, {name}, is an act of self-love. Keep shining! ✨',
  "You're building such beautiful habits, {name}. One meal at a time! 💕",
  'I believe in you completely, {name}. Your dedication inspires me! 🌟',
  "You're stronger than you know, {name}. Trust the process! ♥️",
  "Small steps, big changes, {name}. You're doing everything right! 🌸",
  'Your wellness journey is beautiful, {name}. Keep going! ✨',
  "Every day you choose yourself, {name}. That's pure magic! 💖",
  "Progress, not perfection, {name}. You're absolutely amazing! 🌟",
  'You deserve all the love you give yourself, {name}. Keep thriving! 💕',
  'Your commitment to yourself is inspiring, {name}. So proud! ♥️',
];

// ============================================================================
// MEAL COACHING RESPONSES (gentle guidance)
// ============================================================================

const mealCoachingResponses = [
  'Good morning, beautiful! ☀️ Ready to start this amazing day? Tell me about breakfast! 💕',
  'How are you feeling, sweetheart? 🌸 What sounds good for lunch today? ♥️',
  "You're doing so well today, {name}! 🌟 How was dinner, my love? 🤭",
  "I'm so proud of how you're taking care of yourself! ✨ What did you have? 💖",
  "You're absolutely glowing today, pretty girl! 🥺 Tell me about your meal! ♥️",
  'Such a good job staying consistent, {name}! 🌸 How did it taste? 💕',
];

// ============================================================================
// MEAL QUESTIONS (conversation starters)
// ============================================================================

const mealQuestions = [
  [
    'What did you have today, my love? 💕',
    'How much did you enjoy it? 🌸',
    'How did it make you feel, sweetheart? ♥️',
  ],
  [
    'Tell me about your meal, beautiful! ✨',
    'What was your favorite part? 🤭',
    'How are you feeling after eating? 💖',
  ],
  [
    'What delicious thing did you have? 😋',
    'Did you enjoy every bite? 🥺',
    "How's your energy feeling now? 🌟",
  ],
];

// ============================================================================
// MEAL SUMMARIES (post-meal supportive messages)
// ============================================================================

const mealSummaries = [
  "What a beautiful choice, {name}! 🌸 You're taking such wonderful care of yourself. That meal sounds absolutely perfect for fueling your amazing day! ♥️",
  "I'm so proud of you, sweetheart! ✨ Every time you nourish yourself like this, you're showing yourself the love you deserve. Keep being incredible! 💕",
  "You're absolutely crushing it, {name}! 🌟 That meal is going to give you such good energy. I love seeing you prioritize your wellbeing! ♥️",
  'Such a thoughtful choice, my love! 🤭 You always know exactly what your body needs. Your intuition is amazing! 💖',
  "Beautiful job, pretty girl! 🥺 You're building such healthy habits, and it shows in everything you do. So proud of you! ✨",
];

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export function getMockMealChatResponse(context: {
  name?: string;
  closing?: boolean;
}): string {
  const { name, closing } = context;

  if (closing) {
    return personalize(getRandomResponse(mealChatClosingResponses), name);
  }

  return personalize(getRandomResponse(mealChatResponses), name);
}

export function getMockMealSummary(context: {
  name?: string;
  mealType?: string;
  foodItems?: string[];
}): string {
  const { name, foodItems = ['Delicious and nutritious meal'] } = context;

  const template = getRandomResponse(mealSummaryTemplates);
  const foodList = foodItems.map((item) => `🍽️ ${item}`).join('\n');

  return personalize(template.replace('{foodItems}', foodList), name);
}

export function getMockDailyQuote(context: { name?: string }): string {
  const { name } = context;
  return personalize(getRandomResponse(dailyQuotes), name);
}

export function getMockMealCoachingResponse(context: {
  name?: string;
  mealType?: string;
}): string {
  const { name } = context;
  return personalize(getRandomResponse(mealCoachingResponses), name);
}

export function getMockMealQuestions(): string[] {
  // mealQuestions is string[][], so we need to get a random set of questions
  return mealQuestions[Math.floor(Math.random() * mealQuestions.length)];
}

export function getMockMealSummarySimple(context: {
  name?: string;
  mealType?: string;
}): string {
  const { name } = context;
  return personalize(getRandomResponse(mealSummaries), name);
}
