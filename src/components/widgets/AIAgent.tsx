'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

export function AIAgent() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey Dio! Ask me anything — finances, tasks, emails, stocks. What's up?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const val = input.trim()
    if (!val || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: val }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: val }],
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Couldn't reach AI right now. Try again shortly." }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -22, marginBottom: -22, paddingRight: 6, position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>

        {/* Panel */}
        <div style={{
          background: 'var(--s1)', border: '0.5px solid var(--b)',
          borderRadius: 'var(--r)', overflow: 'hidden',
          maxHeight: open ? 320 : 0,
          opacity: open ? 1 : 0,
          transition: 'max-height .3s cubic-bezier(.4,0,.2,1), opacity .22s',
          position: 'relative', zIndex: 5, marginBottom: open ? 10 : 0,
          width: 296,
        }}>
          <div style={{ padding: '10px 13px', borderBottom: '0.5px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={13} color="var(--acc)" />
              AI Agent
            </span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'rgba(123,158,248,.1)', color: 'var(--acc)' }}>
              Groq · Llama 3.3 free
            </span>
          </div>

          <div style={{
            padding: '10px 12px', minHeight: 100, maxHeight: 180,
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                fontSize: 11, lineHeight: 1.5, padding: '7px 10px',
                borderRadius: 9, maxWidth: '92%',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'rgba(123,158,248,.15)' : 'rgba(255,255,255,.05)',
                color: m.role === 'user' ? '#c5d5ff' : 'var(--t)',
                borderBottomRightRadius: m.role === 'user' ? 3 : 9,
                borderBottomLeftRadius: m.role === 'assistant' ? 3 : 9,
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{
                fontSize: 11, padding: '7px 10px', borderRadius: 9,
                background: 'rgba(255,255,255,.05)', color: 'var(--t2)',
                alignSelf: 'flex-start', borderBottomLeftRadius: 3,
              }}>
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: 5, padding: '8px 11px', borderTop: '0.5px solid var(--b)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything..."
              style={{
                flex: 1, background: 'rgba(255,255,255,.05)', border: '0.5px solid var(--b)',
                borderRadius: 'var(--rs)', padding: '6px 9px', fontSize: 11,
                color: 'var(--t)', outline: 'none',
              }}
            />
            <button onClick={send} disabled={loading || !input.trim()} style={{
              background: 'var(--acc)', border: 'none', borderRadius: 'var(--rs)',
              padding: '6px 11px', fontSize: 11, color: '#0d0e12', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              opacity: loading || !input.trim() ? 0.6 : 1,
            }}>
              <Send size={11} />
            </button>
          </div>
        </div>

        {/* FAB */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle AI agent"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--acc), var(--pur))',
            border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(123,158,248,.28)',
            transition: 'transform .2s, box-shadow .2s',
            position: 'relative', zIndex: 10,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
        >
          {open ? <X size={18} /> : <Sparkles size={18} />}
        </button>
      </div>
    </div>
  )
}
