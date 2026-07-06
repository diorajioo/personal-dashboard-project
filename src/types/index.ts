// ─── Finance ─────────────────────────────────────────────
export interface Expense {
  id: string
  amount: number
  description: string
  category: string
  date: string
  source: 'manual' | 'ocr'
}

export interface SavingsGoal {
  id: string
  name: string
  current: number
  target: number | null
  color: string
}

export interface FinanceData {
  netBalance: number
  income: number
  expenses: number
  savingsRate: number
  categories: Record<string, { spent: number; budget: number }>
  recentExpenses: Expense[]
  savingsGoals: SavingsGoal[]
}

// ─── Spotify ──────────────────────────────────────────────
export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  albumArt: string | null
  durationMs: number
  progressMs: number
  isPlaying: boolean
}

export interface SpotifyQueue {
  current: SpotifyTrack | null
  queue: SpotifyTrack[]
}

// ─── Calendar / Meetings ─────────────────────────────────
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  platform: 'teams' | 'zoom' | 'meet' | 'other'
  joinUrl?: string
}

// ─── Tasks ───────────────────────────────────────────────
export interface Task {
  id: string
  title: string
  status: 'open' | 'done' | 'overdue'
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  notionUrl?: string
}

// ─── Email ───────────────────────────────────────────────
export interface Email {
  id: string
  from: string
  subject: string
  preview: string
  receivedAt: string
  isRead: boolean
  webLink?: string
}

// ─── Stocks ──────────────────────────────────────────────
export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  sparkline: number[]
  currency: string
}

// ─── Weather ─────────────────────────────────────────────
export interface WeatherData {
  location: string
  temp: number
  feelsLike: number
  description: string
  humidity: number
  windSpeed: number
  high: number
  low: number
  forecast: Array<{
    day: string
    icon: string
    temp: number
  }>
}

// ─── Health ──────────────────────────────────────────────
export interface HealthData {
  steps: number
  stepsGoal: number
  calories: number
  sleepHours: number
  heartRate: number
  activityPct: number
}

// ─── News ────────────────────────────────────────────────
export interface NewsItem {
  id: string
  title: string
  source: string
  category: string
  publishedAt: string
  url: string
}

// ─── NextAuth extension ───────────────────────────────────
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    provider?: string
  }
}
