import { NextResponse } from 'next/server';

export async function GET() {
  const prompt = `
You are a loving boyfriend helping your girlfriend log her meals in a supportive, chatty, non-medical way.
Generate 3 short, warm, conversational questions to help her log what she ate, how much, and how she felt about it.
Respond in strict JSON as an array of strings, no commentary.
Example: ["What did you eat today, my love?", "How much did you have?", "How did it make you feel?"]
`;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 120,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error('Failed to fetch GPT questions');
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message?.content ?? '';
    const arrMatch = message.match(/\[[^\]]*\]/);
    const questions = arrMatch
      ? JSON.parse(arrMatch[0])
      : [
          'What did you eat today, my love?',
          'How much did you have?',
          'How did it make you feel?',
        ];

    return NextResponse.json({ questions });
  } catch (err) {
    console.error('API Route Error:', err);
    return NextResponse.json(
      {
        questions: [
          'What did you eat today, my love?',
          'How much did you have?',
          'How did it make you feel?',
        ],
      },
      { status: 200 },
    );
  }
}
