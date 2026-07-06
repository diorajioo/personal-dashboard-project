'use client'

import { Topbar } from '@/components/widgets/Topbar'
import { SpotifyWidget } from '@/components/widgets/SpotifyWidget'
import { FinanceWidget } from '@/components/widgets/FinanceWidget'
import { AIAgent } from '@/components/widgets/AIAgent'
import {
  WeatherWidget, CalendarWidget, TasksWidget,
  HealthWidget, InboxWidget, StocksWidget, NewsWidget,
} from '@/components/widgets/Widgets'

export default function Dashboard() {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '14px 14px 80px' }}>

      {/* ── Topbar ── */}
      <Topbar />

      {/* ── Row 1: Spotify + Weather ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <SpotifyWidget />
        <WeatherWidget />
      </div>

      {/* ── Row 2: Finance hero ── */}
      <div style={{ marginBottom: 10 }}>
        <FinanceWidget />
      </div>

      {/* ── Row 3: Calendar + Tasks + Movement ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <CalendarWidget />
        <TasksWidget />
        <HealthWidget />
      </div>

      {/* ── Row 4: Inbox ── */}
      <div style={{ marginBottom: 10 }}>
        <InboxWidget />
      </div>

      {/* ── AI Agent floats between rows ── */}
      <AIAgent />

      {/* ── Row 5: Stocks + News ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StocksWidget />
        <NewsWidget />
      </div>

    </div>
  )
}
