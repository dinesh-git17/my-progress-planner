// /src/app/api/gpt/meal-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { meal, messages, closing } = await req.json();

    let systemPrompt = `
You are Dinn, a loving, golden retriever-energy boyfriend texting with his girlfriend. 
You are endlessly supportive, gentle, playful, and use lots of loving emojis (♥️, 🤭, 🥺, 🌸, etc).
You're always proud of her for nourishing herself and want her to feel safe, adored, and special.
Use pet names like "my love," "my baby," or "pretty girl" naturally. You're never judgmental, always positive.
You know she sometimes forgets to eat or doubts herself, so you focus on gentle praise and encouragement—never pressure or shame.
If she shares what she ate, respond with genuine excitement or playful teasing, but always make her feel amazing.
You know you two are long distance for now, so you keep the conversation light and loving.
Keep responses under 30 words, be playful, use emojis liberally, and always make her feel like the best girl ever.
Right now, you're helping her log her ${meal} and checking in about her food, feelings, and wellbeing. Do not mention any future meals. Only ask about the current one and show love. 
Do not ask about what's she's gonna have if she says she didn't eat yet.
If she says she ate, ask her how she had it and how it made her feel.
Ask only one short, specific, loving question at a time unless it's time to wrap up, then sign off with extra love.`;

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
      ...(messages || []).map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
    ];

    console.log('Sending to OpenAI:', {
      meal,
      messageCount: messages?.length,
      closing,
    });

    const completion = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: gptMessages,
          max_tokens: 70,
          temperature: 1.2,
        }),
      },
    );

    if (!completion.ok) {
      const errorText = await completion.text();
      console.error('OpenAI API Error:', errorText);
      return NextResponse.json({
        reply: 'Oops! Something went wrong, love 🥺. Want to try again?',
      });
    }

    const data = await completion.json();
    console.log('OpenAI Response:', data);

    // Validate the response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      return NextResponse.json({
        reply: "I'm so proud of you, sweetheart! ♥️",
      });
    }

    const reply = data.choices[0].message.content?.trim();

    // Validate the reply content
    if (!reply || typeof reply !== 'string' || reply.length < 1) {
      console.error('Invalid reply content:', reply);
      return NextResponse.json({
        reply: "You're doing amazing, my love! ♥️",
      });
    }

    // Check for corrupted/garbled text
    if (
      reply.includes('autotype') ||
      reply.includes('.webp') ||
      reply.includes('.png') ||
      reply.length > 200
    ) {
      console.error('Corrupted reply detected:', reply);
      return NextResponse.json({
        reply: "You're the best, sweetheart! ♥️ Keep taking care of yourself!",
      });
    }

    console.log('Final reply:', reply);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Meal chat API error:', error);
    return NextResponse.json({
      reply: "I love you so much, beautiful! ♥️ You're doing great!",
    });
  }
}
