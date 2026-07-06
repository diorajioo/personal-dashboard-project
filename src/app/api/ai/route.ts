import { NextRequest, NextResponse } from 'next/server'

const GROQ_BASE = 'https://api.groq.com/openai/v1'

// POST /api/ai — chat with Groq Llama 3.3 (free)
export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const systemPrompt = `You are Dio's personal dashboard assistant. You have access to context about Dio's day.

Current dashboard context:
${JSON.stringify(context || {}, null, 2)}

You help with:
- Summarizing emails and tasks
- Analyzing spending and finances
- Answering questions about meetings and schedule
- General productivity advice
- Questions about IDX stocks or crypto

Keep responses concise and friendly. Use Indonesian or English based on what Dio writes.`

  try {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    })

    if (!res.ok) throw new Error(`Groq ${res.status}`)
    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not respond.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('AI error:', err)
    return NextResponse.json({
      reply: "I'm having trouble connecting right now. Try again in a moment.",
    })
  }
}
