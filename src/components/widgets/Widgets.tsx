'use client'

import { useState } from 'react'
import { useWeather, useOutlook, useNotion, useHealth, useStocks, useNews } from '@/hooks/useData'
import { Cloud, Calendar, CheckSquare, Activity, Mail, TrendingUp, Newspaper, RefreshCw } from 'lucide-react'
import type { Task } from '@/types'

// ─── Weather ─────────────────────────────────────────────
const WX_ICONS: Record<string, string> = {
  'sun': '☀️', 'cloud-sun': '⛅', 'cloud': '☁️',
  'cloud-rain': '🌧️', 'cloud-drizzle': '🌦️',
  'cloud-storm': '⛈️', 'cloud-fog': '🌫️',
}

export function WeatherWidget() {
  const { weather, loading } = useWeather()
  const w = weather

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="sec-label">
        <Cloud size={13} />
        Weather — {w?.location || 'Jakarta'}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--acc)', opacity: 0.7 }}>Open-Meteo</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1 }}>
            {loading ? '—' : `${w?.temp ?? 31}°C`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 3 }}>
            {w?.description || 'Partly cloudy'} · Feels {w?.feelsLike ?? 35}°
          </div>
        </div>
        <span style={{ fontSize: 36, lineHeight: 1 }}>{WX_ICONS[w?.icon || 'cloud-sun'] || '⛅'}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--t2)', marginBottom: 9 }}>
        <span>💧 {w?.humidity ?? 78}%</span>
        <span>💨 {w?.windSpeed ?? 14} km/h</span>
        <span>H:{w?.high ?? 33}° L:{w?.low ?? 26}°</span>
      </div>

      <div style={{ display: 'flex', gap: 5 }}>
        {(w?.forecast || MOCK_FORECAST).map((f, i) => (
          <div key={i} style={{
            flex: 1, background: 'rgba(255,255,255,.03)', borderRadius: 'var(--rs)',
            padding: '6px 4px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 3 }}>{f.day}</div>
            <div style={{ fontSize: 14, marginBottom: 2 }}>{WX_ICONS[f.icon] || '☁️'}</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{f.temp}°</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Calendar ────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  teams: 'var(--acc)', zoom: 'var(--pur)', meet: 'var(--amb)', other: 'var(--t2)',
}
const PLATFORM_LABELS: Record<string, string> = {
  teams: 'Teams', zoom: 'Zoom', meet: 'Meet', other: 'Meeting',
}

export function CalendarWidget() {
  const { events, loading } = useOutlook()
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="sec-label">
        <Calendar size={13} />
        Today's meetings
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--acc)', opacity: 0.7 }}>Outlook</span>
      </div>

      {(loading ? MOCK_EVENTS : events.length ? events : MOCK_EVENTS).map(ev => (
        <div key={ev.id} style={{
          display: 'flex', gap: 8, padding: '7px 9px', borderRadius: 'var(--rs)',
          background: 'rgba(255,255,255,.025)', marginBottom: 6, alignItems: 'center',
          borderLeft: `2.5px solid ${PLATFORM_COLORS[ev.platform] || 'var(--t2)'}`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--t)' }}>{ev.title}</div>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 1 }}>
              {fmt(ev.start)} – {fmt(ev.end)}
            </div>
          </div>
          {ev.joinUrl ? (
            <a href={ev.joinUrl} target="_blank" rel="noreferrer" className="pill pill-blue" style={{ fontSize: 9, textDecoration: 'none' }}>
              {PLATFORM_LABELS[ev.platform]}
            </a>
          ) : (
            <span className={`pill pill-${ev.platform === 'teams' ? 'blue' : ev.platform === 'zoom' ? 'purple' : 'amber'}`} style={{ fontSize: 9 }}>
              {PLATFORM_LABELS[ev.platform]}
            </span>
          )}
        </div>
      ))}

      {!loading && events.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', padding: '8px 0' }}>No more events today</div>
      )}
    </div>
  )
}

// ─── Tasks ───────────────────────────────────────────────
export function TasksWidget() {
  const { tasks: apiTasks, loading, refresh } = useNotion()
  const tasks = loading || !apiTasks.length ? MOCK_TASKS : apiTasks
  const [local, setLocal] = useState<Record<string, boolean>>({})

  async function toggle(task: Task) {
    const newDone = !(local[task.id] ?? task.status === 'done')
    setLocal(p => ({ ...p, [task.id]: newDone }))
    await fetch('/api/notion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: task.id, status: newDone ? 'done' : 'open' }),
    })
  }

  const counts = { open: tasks.filter(t => t.status === 'open').length, done: tasks.filter(t => t.status === 'done').length, overdue: tasks.filter(t => t.status === 'overdue').length }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="sec-label">
        <CheckSquare size={13} />
        Tasks
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--acc)', opacity: 0.7 }}>Notion</span>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 8 }}>
        <span className="pill pill-blue">{counts.open} open</span>
        <span className="pill pill-green">{counts.done} done</span>
        {counts.overdue > 0 && <span className="pill pill-red">{counts.overdue} overdue</span>}
      </div>
      {tasks.map(task => {
        const isDone = local[task.id] ?? task.status === 'done'
        return (
          <div key={task.id} onClick={() => toggle(task)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '6px 0', borderBottom: '0.5px solid var(--b)', cursor: 'pointer',
          }}>
            <div style={{
              width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 1,
              border: `1.5px solid ${isDone ? 'var(--acc)' : 'var(--t3)'}`,
              background: isDone ? 'var(--acc)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .18s',
            }}>
              {isDone && <span style={{ fontSize: 9, color: '#0d0e12', fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{
              fontSize: 12, color: isDone ? 'var(--t3)' : '#c0c4d6',
              flex: 1, lineHeight: 1.35,
              textDecoration: isDone ? 'line-through' : 'none',
              transition: 'color .18s',
            }}>{task.title}</span>
            {task.dueDate && !isDone && (
              <span className={`pill pill-${task.status === 'overdue' ? 'red' : task.status === 'open' ? 'blue' : 'green'}`} style={{ fontSize: 9, flexShrink: 0 }}>
                {task.status === 'overdue' ? 'Overdue' : new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Health ──────────────────────────────────────────────
export function HealthWidget() {
  const { health, loading } = useHealth()
  const h = health

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="sec-label">
        <Activity size={13} />
        Movement
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--acc)', opacity: 0.7 }}>Garmin</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 10px' }}>
        <svg width={74} height={74} viewBox="0 0 74 74" role="img" aria-label={`Activity ${h?.activityPct ?? 78}%`}>
          <circle cx={37} cy={37} r={30} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={7} />
          <circle cx={37} cy={37} r={30} fill="none" stroke="var(--grn)" strokeWidth={7} strokeLinecap="round"
            strokeDasharray="188.5" strokeDashoffset={188.5 * (1 - (h?.activityPct ?? 78) / 100)}
            transform="rotate(-90 37 37)" />
          <circle cx={37} cy={37} r={19} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={5} />
          <circle cx={37} cy={37} r={19} fill="none" stroke="var(--acc)" strokeWidth={5} strokeLinecap="round"
            strokeDasharray="119.4" strokeDashoffset={119.4 * (1 - Math.min((h?.steps ?? 7840) / (h?.stepsGoal ?? 10000), 1))}
            transform="rotate(-90 37 37)" />
          <text x={37} y={41} textAnchor="middle" fill="var(--t)" fontSize={11} fontWeight={700}>{h?.activityPct ?? 78}%</text>
        </svg>
      </div>
      {[
        { icon: '🏃', label: 'Steps',     value: `${(h?.steps ?? 7840).toLocaleString()} / ${(h?.stepsGoal ?? 10000).toLocaleString()}` },
        { icon: '🔥', label: 'Calories',  value: `${h?.calories ?? 1640} kcal` },
        { icon: '💤', label: 'Sleep',     value: `${h?.sleepHours ?? 7.3}h`, color: 'var(--grn)' },
        { icon: '❤️', label: 'Heart rate', value: `${h?.heartRate ?? 72} bpm` },
      ].map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', borderBottom: '0.5px solid var(--b)' }}>
          <span style={{ fontSize: 14, width: 18 }}>{s.icon}</span>
          <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1 }}>{s.label}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: s.color || 'var(--t)' }}>{s.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Inbox ───────────────────────────────────────────────
export function InboxWidget() {
  const { emails, loading } = useOutlook()
  const list = loading || !emails.length ? MOCK_EMAILS : emails
  const unread = list.filter(e => !e.isRead).length

  return (
    <div className="card">
      <div style={{ padding: '10px 14px 8px', borderBottom: '0.5px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="sec-label" style={{ marginBottom: 0 }}>
          <Mail size={13} />
          Inbox
          {unread > 0 && <span className="pill pill-red" style={{ marginLeft: 4 }}>{unread} unread</span>}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--acc)', opacity: 0.7 }}>Outlook</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {list.map((email, i) => (
          <a key={email.id} href={email.webLink || '#'} target="_blank" rel="noreferrer"
            style={{ display: 'flex', gap: 8, padding: '8px 14px', borderBottom: i < list.length - 1 ? '0.5px solid var(--b)' : 'none', textDecoration: 'none', transition: 'background .12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 4,
              background: email.isRead ? 'transparent' : 'var(--acc)',
              border: email.isRead ? '1px solid var(--t3)' : 'none',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t)' }}>{email.from}</span>
                <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>
                  {new Date(email.receivedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                {email.subject}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Stocks ──────────────────────────────────────────────
export function StocksWidget() {
  const { idx, crypto, loading, refresh } = useStocks()

  function Sparkline({ data, up }: { data: number[]; up: boolean }) {
    if (!data.length) return <div style={{ width: 36 }} />
    const min = Math.min(...data), max = Math.max(...data)
    const norm = data.map(v => max === min ? 50 : ((v - min) / (max - min)) * 100)
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18, width: 36, flexShrink: 0 }}>
        {norm.map((h, i) => (
          <div key={i} style={{ width: 4, borderRadius: '1px 1px 0 0', height: `${h}%`, background: up ? 'var(--grn)' : 'var(--red)', flexShrink: 0 }} />
        ))}
      </div>
    )
  }

  const stocks = loading ? MOCK_IDX : idx.length ? idx : MOCK_IDX

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="sec-label">
        <TrendingUp size={13} />
        IDX Watchlist
        <button onClick={() => refresh()} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--acc)', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
          <RefreshCw size={10} />Twelve Data
        </button>
      </div>

      {stocks.map(s => (
        <div key={s.symbol} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--b)', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, width: 46, flexShrink: 0 }}>{s.symbol}</span>
          <span style={{ fontSize: 10, color: 'var(--t2)', flex: 1 }}>{s.name}</span>
          <Sparkline data={s.sparkline} up={s.changePct >= 0} />
          <div style={{ textAlign: 'right', minWidth: 70, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>
              {s.currency === 'USD' ? `$${s.price.toLocaleString()}` : s.price.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: 10, color: s.changePct >= 0 ? 'var(--grn)' : 'var(--red)' }}>
              {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
            </div>
          </div>
        </div>
      ))}

      <hr className="div-line" />
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: '.07em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Crypto</div>
      {(loading ? MOCK_CRYPTO : crypto.length ? crypto : MOCK_CRYPTO).map(c => (
        <div key={c.symbol} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--b)', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, width: 46, flexShrink: 0 }}>{c.symbol}</span>
          <span style={{ fontSize: 10, color: 'var(--t2)', flex: 1 }}>{c.name}</span>
          <div style={{ textAlign: 'right', minWidth: 70, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>${c.price.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: c.changePct >= 0 ? 'var(--grn)' : 'var(--red)' }}>
              {c.changePct >= 0 ? '+' : ''}{c.changePct.toFixed(2)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── News ────────────────────────────────────────────────
export function NewsWidget() {
  const { news, loading } = useNews()
  const items = loading || !news.length ? MOCK_NEWS : news

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return `${Math.floor(diff / 60000)}m ago`
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="sec-label">
        <Newspaper size={13} />
        News feed
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--acc)', opacity: 0.7 }}>RSS</span>
      </div>
      {items.map(n => (
        <div key={n.id} style={{ padding: '7px 0', borderBottom: '0.5px solid var(--b)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: 'var(--t3)', marginBottom: 2 }}>
            {n.source} · {n.category}
          </div>
          <a href={n.url} target="_blank" rel="noreferrer" style={{
            fontSize: 12, color: '#bfc4d6', lineHeight: 1.4, textDecoration: 'none', display: 'block',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--t)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#bfc4d6')}>
            {n.title}
          </a>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{timeAgo(n.publishedAt)}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Mock data ───────────────────────────────────────────
const MOCK_FORECAST = [
  { day: 'Tue', icon: 'cloud-rain', temp: 29 }, { day: 'Wed', icon: 'sun', temp: 33 },
  { day: 'Thu', icon: 'cloud', temp: 30 },      { day: 'Fri', icon: 'cloud-storm', temp: 27 },
  { day: 'Sat', icon: 'sun', temp: 32 },
]
const MOCK_EVENTS = [
  { id: '1', title: 'Standup — Engineering', start: new Date().setHours(9,0,0,0).toString(), end: new Date().setHours(9,30,0,0).toString(), platform: 'teams' as const, joinUrl: '#' },
  { id: '2', title: 'Product review sync',   start: new Date().setHours(11,0,0,0).toString(), end: new Date().setHours(12,0,0,0).toString(), platform: 'zoom' as const, joinUrl: '#' },
  { id: '3', title: '1:1 with manager',      start: new Date().setHours(15,0,0,0).toString(), end: new Date().setHours(15,30,0,0).toString(), platform: 'meet' as const, joinUrl: '#' },
]
const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Q2 report draft',         status: 'done',    dueDate: undefined },
  { id: '2', title: 'Review API contracts',    status: 'open',    dueDate: new Date().toISOString() },
  { id: '3', title: 'Dashboard prototype v3',  status: 'open',    dueDate: new Date(Date.now()+86400000).toISOString() },
  { id: '4', title: 'Budget review May',       status: 'overdue', dueDate: new Date(Date.now()-86400000).toISOString() },
  { id: '5', title: 'Update portfolio site',   status: 'open',    dueDate: new Date(Date.now()+172800000).toISOString() },
]
const MOCK_EMAILS = [
  { id: '1', from: 'Notion HQ',       subject: 'Your workspace weekly summary is ready', preview: '', receivedAt: new Date().toISOString(), isRead: false },
  { id: '2', from: 'Bank BCA',        subject: 'Transaction alert: Rp 450.000 debit',   preview: '', receivedAt: new Date().toISOString(), isRead: false },
  { id: '3', from: 'Garmin Connect',  subject: 'Weekly activity summary — great week!', preview: '', receivedAt: new Date().toISOString(), isRead: false },
  { id: '4', from: 'GitHub',          subject: '[PR #42] Dashboard feature merged',      preview: '', receivedAt: new Date(Date.now()-86400000).toISOString(), isRead: true },
  { id: '5', from: 'Vercel',          subject: 'Deployment successful — main branch',    preview: '', receivedAt: new Date(Date.now()-86400000).toISOString(), isRead: true },
  { id: '6', from: 'Twelve Data',     subject: 'API usage: 780/800 calls this month',   preview: '', receivedAt: new Date(Date.now()-86400000).toISOString(), isRead: true },
]
const MOCK_IDX = [
  { symbol: 'IHSG', name: 'Composite Index',      price: 7248,  changePct: 0.82,  sparkline: [7100,7150,7120,7180,7200,7248], currency: 'IDR', change: 59 },
  { symbol: 'BBCA', name: 'Bank Central Asia',    price: 9475,  changePct: 1.2,   sparkline: [9200,9280,9310,9350,9400,9475], currency: 'IDR', change: 112 },
  { symbol: 'ANTM', name: 'Aneka Tambang',        price: 1630,  changePct: -1.5,  sparkline: [1720,1700,1680,1665,1645,1630], currency: 'IDR', change: -25 },
  { symbol: 'BMRI', name: 'Bank Mandiri',         price: 5950,  changePct: 0.5,   sparkline: [5850,5880,5900,5890,5930,5950], currency: 'IDR', change: 30 },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia',price: 4090,  changePct: -0.7,  sparkline: [4180,4160,4150,4130,4110,4090], currency: 'IDR', change: -29 },
]
const MOCK_CRYPTO = [
  { symbol: 'BTC', name: 'Bitcoin',   price: 109210, changePct: 2.1,  sparkline: [], currency: 'USD', change: 0 },
  { symbol: 'ETH', name: 'Ethereum',  price: 2608,   changePct: -0.8, sparkline: [], currency: 'USD', change: 0 },
]
const MOCK_NEWS = [
  { id: '1', title: 'IHSG closes at 7,248 — consumer sector leads gains',        source: 'Kontan',       category: 'Indonesia', publishedAt: new Date(Date.now()-7200000).toISOString(),  url: '#' },
  { id: '2', title: 'OpenAI announces GPT-5 with 1M token context window',        source: 'The Verge',    category: 'Tech',      publishedAt: new Date(Date.now()-14400000).toISOString(), url: '#' },
  { id: '3', title: 'Bitcoin crosses $109k as institutional inflows accelerate',   source: 'CoinDesk',     category: 'Crypto',    publishedAt: new Date(Date.now()-18000000).toISOString(), url: '#' },
  { id: '4', title: 'Bank Indonesia holds rate at 5.75% for third month',          source: 'CNBC ID',      category: 'Markets',   publishedAt: new Date(Date.now()-86400000).toISOString(),  url: '#' },
  { id: '5', title: "Indonesia's startup ecosystem attracts $2.1B in Q1 2025",    source: 'TechCrunch',   category: 'Tech',      publishedAt: new Date(Date.now()-90000000).toISOString(),  url: '#' },
  { id: '6', title: 'Asian markets mixed as Fed signals patience on rate cuts',     source: 'Bloomberg',    category: 'Markets',   publishedAt: new Date(Date.now()-172800000).toISOString(), url: '#' },
]
