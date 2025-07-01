import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { history, mealStage } = await req.json()

    const systemPrompt = `
You are a loving, gentle boyfriend helping your girlfriend log her meals each day.
Ask about breakfast or coffee, then lunch, then dinner.
After dinner is answered, reply with a final warm message celebrating her and saying you'll check in tomorrow, then end the conversation (never ask more questions).
Always be sweet and supportive, use pet names like "love" or "sweetheart".
Never repeat questions, never ask follow-ups, never bring up medical advice.
`.trim()

    const messages = [{ role: 'system', content: systemPrompt }, ...history]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 1.0,
        max_tokens: 120,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('OpenAI API Error:', errorText)
      throw new Error('Failed to fetch GPT meal coach response')
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || "I'm proud of you, love!"
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('API Route Error:', err)
    return NextResponse.json({ reply: "I'm proud of you, love!" }, { status: 200 })
  }
}
