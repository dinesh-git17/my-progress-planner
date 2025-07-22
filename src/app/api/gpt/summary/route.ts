import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, meal, answers, gpt_response } = body;

    if (!name || !meal || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Build the prompt
    let prompt = '';

    if (meal === 'day') {
      prompt = `
You're an adorable, encouraging GPT assistant helping Dinn's girlfriend eat better.

Summarize what ${name} ate today in a warm, happy tone. Make her feel proud and supported.
She told us:

${answers.map((a: string) => `- ${a}`).join('\n')}

Now, write a cute, heartfelt summary that makes her smile.
      `;
    } else {
      prompt = `
You're a sweet, supportive GPT assistant helping Dinn's girlfriend build healthy habits.

Summarize what ${name} ate for ${meal} in a warm, fun, and positive tone.
Include praise, encouragement, and maybe a fun emoji or two.

Here’s what she told us:

${answers.map((a: string) => `- ${a}`).join('\n')}

${
  gpt_response && gpt_response.length > 0
    ? `You (GPT) also replied:\n${gpt_response.join('\n')}\n`
    : ''
}

Now, write a cute and kind summary for her. make it 100 words or less, and keep it light and positive.
      `;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 200,
    });

    const summary = completion.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 },
      );
    }

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error('[GPT Summary Error]', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
