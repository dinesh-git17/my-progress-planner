import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || 'my love';

  const randomizer = Math.random().toString(36).slice(2, 10);
  const prompt = `
You are a loving, gentle motivator acting like a sweet boyfriend.
Give a short, sweet, *original* motivational quote (max 20 words) about eating, self-care, and taking small steps.
Use the person's name: "${name}" naturally in the message to make it feel personal and loving.
Avoid using em-dashes (—) or en-dashes (–) completely.
Do NOT mention or reference the random string. Just use it for uniqueness: "${randomizer}"
The tone should feel like a caring message meant to lift "${name}" up with affection and positivity.
Do not use any dashes or special characters in the quote. 
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
        temperature: 1.0,
        max_tokens: 50,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error('Failed to fetch GPT response');
    }

    const data = await res.json();
    // Defensive: safely extract quote as a string
    let quote =
      typeof data?.choices?.[0]?.message?.content === 'string'
        ? data.choices[0].message.content
        : '';

    // Remove the randomizer and any bad chars
    quote = quote
      .replace(/["”“]/g, '')
      .replace(new RegExp(randomizer, 'g'), '')
      .trim();

    if (!quote || quote.toLowerCase().includes('undefined')) {
      quote = `You're doing amazing, ${name}. One step at a time.`;
    }

    return new NextResponse(JSON.stringify({ quote }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('API Route Error:', err);
    return NextResponse.json(
      { quote: `You're doing amazing, ${name}. One step at a time.` },
      { status: 200 },
    );
  }
}
