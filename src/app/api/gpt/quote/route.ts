import { NextResponse } from 'next/server'

export async function GET() {
  const randomizer = Math.random().toString(36).slice(2, 10)
  const prompt = `
You are a loving, gentle motivator for someone struggling to eat regularly.
Give a short, sweet, *original* motivational quote (max 20 words) about eating, self-care, and taking small steps.
Make it sound like it's coming from a caring boyfriend.
For extra uniqueness, each time you answer, base your response on this random string: "${randomizer}".
Do NOT mention or reference the random string in your response. Only use it for inspiration.
`
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
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('OpenAI API Error:', errorText)
      throw new Error('Failed to fetch GPT response')
    }

    const data = await res.json()
    const quote =
      data.choices?.[0]?.message?.content?.replace(/["”“]/g, '').replace(randomizer, '').trim() ||
      "You're doing amazing. One step at a time."

    return new NextResponse(JSON.stringify({ quote }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Surrogate-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('API Route Error:', err)
    return NextResponse.json(
      { quote: "You're doing amazing. One step at a time." },
      { status: 200 }
    )
  }
}
