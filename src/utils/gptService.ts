// src/utils/gptService.ts

import { OpenAI } from 'openai';
import { logEnvironmentInfo, shouldUseMockGPT } from './environment';
import {
  getMockDailyQuote,
  getMockMealChatResponse,
  getMockMealCoachingResponse,
  getMockMealQuestions,
  getMockMealSummary,
  getMockMealSummarySimple,
} from './mockResponses';

// Initialize OpenAI client (only used in production)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GPTContext {
  name?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  foodItems?: string[];
  messages?: any[];
  closing?: boolean;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface GPTResponse {
  content: string;
  isMock: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// MAIN GPT SERVICE CLASS
// ============================================================================

class GPTService {
  private useMock: boolean;

  constructor() {
    this.useMock = shouldUseMockGPT();

    // Log environment info on initialization (server-side only)
    if (typeof window === 'undefined') {
      logEnvironmentInfo();
    }
  }

  /**
   * Generate meal chat response (real-time conversations)
   */
  async generateMealChatResponse(context: GPTContext): Promise<GPTResponse> {
    if (this.useMock) {
      const content = getMockMealChatResponse(context);
      return { content, isMock: true };
    }

    // Real GPT implementation for meal chat
    try {
      const { messages = [], closing = false } = context;

      let systemPrompt = `
You are Dinn, a loving, golden retriever-energy boyfriend texting with his girlfriend. 
You are endlessly supportive, gentle, playful, and use lots of loving emojis (♥️, 🤭, 🥺, 🌸, etc).
You're always proud of her for nourishing herself and want her to feel safe, adored, and special.
Use pet names like "my love," "my baby," or "pretty girl" naturally. You're never judgmental, always positive.
Keep responses under 30 words, be playful, use emojis liberally, and always make her feel like the best girl ever.`;

      if (closing) {
        systemPrompt += `
The conversation is ending for this meal.
Do NOT ask any questions.
Instead, send her a very sweet, loving closing message, using lots of encouragement, emojis, and boyfriend energy.
Make her feel adored and proud, like she did great.
Keep it under 35 words.`;
      }

      const gptMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
      ];

      const completion = await this.callOpenAI({
        model: 'gpt-4o',
        messages: gptMessages,
        max_tokens: 70,
        temperature: 1.2,
      });

      return {
        content:
          completion.choices[0].message.content?.trim() ||
          getMockMealChatResponse(context),
        isMock: false,
        usage: completion.usage,
      };
    } catch (error) {
      console.error('GPT meal chat error:', error);
      // Fallback to mock on error
      return { content: getMockMealChatResponse(context), isMock: true };
    }
  }

  /**
   * Generate meal summary (post-meal supportive messages)
   */
  async generateMealSummary(context: GPTContext): Promise<GPTResponse> {
    if (this.useMock) {
      const content = getMockMealSummary(context);
      return { content, isMock: true };
    }

    // Real GPT implementation for meal summaries
    try {
      const { name, mealType, foodItems = [] } = context;

      console.log('🚀 Making real GPT call for meal summary:', {
        name,
        mealType,
        foodItemsCount: foodItems.length,
      });

      const completion = await this.callOpenAI({
        model: 'gpt-4o',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are a loving boyfriend creating detailed but readable meal summaries for your girlfriend.

Give helpful nutritional insights while being encouraging. Break content into clear sections for easy reading.

Format EXACTLY like this:
"🍽️ What you ate:
[Food items with emojis]

💕 How it made you feel:
[Emotion/feeling response]

⭐ Overall Rating: [Excellent/Great/Good/Okay] ⭐⭐⭐

🔍 Nutrition Breakdown:
✅ What's working: [1-2 positive things]
⚠️ Could use more: [Specific nutrients/food groups missing]
💡 Easy upgrade: [Simple, practical suggestion]

💖 Love Note:
[Sweet, encouraging message that ties it together]"

Guidelines:
- Be specific about what nutrients are missing (protein, fiber, vitamins, etc.)
- Always be encouraging and positive
- Keep the love note personal and sweet
- Use the person's name naturally`,
          },
          {
            role: 'user',
            content: `Create a meal summary for ${name}'s ${mealType}:\n${foodItems.join('\n')}`,
          },
        ],
      });

      console.log('✅ OpenAI API response received');
      console.log('📊 Usage:', completion.usage);

      const content = completion.choices[0].message.content?.trim();
      console.log('📝 Generated content length:', content?.length);

      if (!content) {
        console.warn('⚠️ Empty content from OpenAI, using fallback');
        return { content: getMockMealSummary(context), isMock: true };
      }

      return {
        content,
        isMock: false,
        usage: completion.usage,
      };
    } catch (error) {
      console.error('❌ GPT meal summary error:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
        stack:
          error instanceof Error ? error.stack?.substring(0, 200) : undefined,
      });
      return { content: getMockMealSummary(context), isMock: true };
    }
  }

  /**
   * Generate simple meal summary (short supportive message)
   */
  async generateSimpleMealSummary(context: GPTContext): Promise<GPTResponse> {
    if (this.useMock) {
      const content = getMockMealSummarySimple(context);
      return { content, isMock: true };
    }

    // Real GPT implementation
    try {
      const { name, mealType, foodItems = [] } = context;

      const completion = await this.callOpenAI({
        model: 'gpt-4o',
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content: `You are a kind and supportive boyfriend. 
Your job is to cheer up your partner who just logged their meal. 
Respond with a short, sweet, heartfelt message (max 3 lines) in the tone of a loving boyfriend. 
Avoid em-dashes. Use their name ("${name}") directly in the message.`,
          },
          {
            role: 'user',
            content: `Here is what ${name} ate for ${mealType} today:\n${foodItems.join('\n')}`,
          },
        ],
      });

      return {
        content:
          completion.choices[0].message.content?.trim() ||
          getMockMealSummarySimple(context),
        isMock: false,
        usage: completion.usage,
      };
    } catch (error) {
      console.error('GPT simple summary error:', error);
      return { content: getMockMealSummarySimple(context), isMock: true };
    }
  }

  /**
   * Generate daily motivational quote
   */
  async generateDailyQuote(context: GPTContext): Promise<GPTResponse> {
    if (this.useMock) {
      const content = getMockDailyQuote(context);
      return { content, isMock: true };
    }

    // Real GPT implementation
    try {
      const { name = 'my love' } = context;
      const randomizer = Math.random().toString(36).slice(2, 10);

      const completion = await this.callOpenAI({
        model: 'gpt-4o',
        temperature: 1.0,
        messages: [
          {
            role: 'user',
            content: `You are a loving, gentle motivator acting like a sweet boyfriend.
Give a short, sweet, *original* motivational quote (15 words) about eating, self-care, and taking small steps.
Use the person's name: "${name}" naturally in the message to make it feel personal and loving.
Avoid using em-dashes (—) or en-dashes (–) completely.
Do NOT mention or reference the random string. Just use it for uniqueness: "${randomizer}"
The tone should feel like a caring message meant to lift "${name}" up with affection and positivity.
Do not use any dashes or special characters in the quote.`,
          },
        ],
        max_tokens: 50,
      });

      let quote = completion.choices[0].message.content?.trim() || '';

      // Clean up the response
      quote = quote
        .replace(/["""]/g, '')
        .replace(new RegExp(randomizer, 'g'), '')
        .trim();

      if (!quote || quote.toLowerCase().includes('undefined')) {
        quote = getMockDailyQuote(context);
      }

      return { content: quote, isMock: false, usage: completion.usage };
    } catch (error) {
      console.error('GPT daily quote error:', error);
      return { content: getMockDailyQuote(context), isMock: true };
    }
  }

  /**
   * Generate meal questions
   */
  async generateMealQuestions(context: GPTContext = {}): Promise<GPTResponse> {
    if (this.useMock) {
      const questions = getMockMealQuestions();
      return { content: JSON.stringify(questions), isMock: true };
    }

    // Real GPT implementation
    try {
      const completion = await this.callOpenAI({
        model: 'gpt-4o',
        temperature: 0.9,
        messages: [
          {
            role: 'user',
            content: `You are a loving boyfriend helping your girlfriend log her meals in a supportive, chatty, non-medical way.
Generate 3 short, warm, conversational questions to help her log what she ate, how much, and how she felt about it.
Respond in strict JSON as an array of strings, no commentary.
Example: ["What did you eat today, my love?", "How much did you have?", "How did it make you feel?"]`,
          },
        ],
        max_tokens: 120,
      });

      const message = completion.choices[0].message.content || '';
      const arrMatch = message.match(/\[[^\]]*\]/);
      const questions = arrMatch
        ? JSON.parse(arrMatch[0])
        : getMockMealQuestions();

      return {
        content: JSON.stringify(questions),
        isMock: false,
        usage: completion.usage,
      };
    } catch (error) {
      console.error('GPT meal questions error:', error);
      const questions = getMockMealQuestions();
      return { content: JSON.stringify(questions), isMock: true };
    }
  }

  /**
   * Generate meal coaching response
   */
  async generateMealCoachingResponse(
    context: GPTContext,
  ): Promise<GPTResponse> {
    if (this.useMock) {
      const content = getMockMealCoachingResponse(context);
      return { content, isMock: true };
    }

    // Real GPT implementation
    try {
      const { messages = [] } = context;

      const systemPrompt = `
You are a loving, gentle boyfriend helping your girlfriend log her meals each day.
Ask about breakfast or coffee, then lunch, then dinner.
After dinner is answered, reply with a final warm message celebrating her and saying you'll check in tomorrow, then end the conversation (never ask more questions).
Always be sweet and supportive, use pet names like "love" or "sweetheart".
Never repeat questions, never ask follow-ups, never bring up medical advice.`.trim();

      const gptMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ];

      const completion = await this.callOpenAI({
        model: 'gpt-4o',
        messages: gptMessages,
        temperature: 1.0,
        max_tokens: 120,
      });

      return {
        content:
          completion.choices[0].message.content?.trim() ||
          getMockMealCoachingResponse(context),
        isMock: false,
        usage: completion.usage,
      };
    } catch (error) {
      console.error('GPT meal coaching error:', error);
      return { content: getMockMealCoachingResponse(context), isMock: true };
    }
  }

  /**
   * Generic GPT call with custom prompt (for edge cases)
   */
  async generateCustomResponse(
    context: GPTContext & { prompt: string },
  ): Promise<GPTResponse> {
    if (this.useMock) {
      // For custom prompts, use a generic encouraging response
      const content = `You're doing amazing, ${context.name || 'love'}! Keep up the great work! ✨💕`;
      return { content, isMock: true };
    }

    try {
      const {
        prompt,
        temperature = 0.7,
        maxTokens = 150,
        model = 'gpt-4o',
      } = context;

      console.log('🚀 Making custom GPT call:', {
        model,
        temperature,
        maxTokens,
        promptLength: prompt.length,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      });

      const completion = await this.callOpenAI({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      });

      console.log('✅ Custom OpenAI API response received');
      console.log('📊 Usage:', completion.usage);

      const content = completion.choices[0].message.content?.trim();
      console.log('📝 Generated content length:', content?.length);

      if (!content) {
        console.warn('⚠️ Empty content from OpenAI, using fallback');
        return {
          content: `You're doing amazing, ${context.name || 'love'}! Keep up the great work! ✨💕`,
          isMock: true,
        };
      }

      return {
        content,
        isMock: false,
        usage: completion.usage,
      };
    } catch (error) {
      console.error('❌ GPT custom response error:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        stack:
          error instanceof Error ? error.stack?.substring(0, 200) : undefined,
      });
      return {
        content: `You're doing amazing, ${context.name || 'love'}! Keep up the great work! ✨💕`,
        isMock: true,
      };
    }
  }

  /**
   * Private method to call OpenAI API
   */
  private async callOpenAI(params: any) {
    return await openai.chat.completions.create(params);
  }

  /**
   * Check if currently using mock responses
   */
  isUsingMock(): boolean {
    return this.useMock;
  }

  /**
   * Force enable/disable mock mode (for testing)
   */
  setMockMode(useMock: boolean) {
    this.useMock = useMock;
  }
}

// Export singleton instance
export const gptService = new GPTService();
export default gptService;
