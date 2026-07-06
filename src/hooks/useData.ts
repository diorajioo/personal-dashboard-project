import useSWR from 'swr'
import type {
  FinanceData, SpotifyQueue, WeatherData,
  StockQuote, NewsItem, Task, Email, CalendarEvent, HealthData
} from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useFinance() {
  const { data, error, mutate } = useSWR<FinanceData>('/api/finance', fetcher, {
    refreshInterval: 300000, // 5 min
  })
  return { finance: data, loading: !data && !error, error, refresh: mutate }
}

export function useSpotify() {
  const { data, error, mutate } = useSWR<SpotifyQueue>('/api/spotify', fetcher, {
    refreshInterval: 5000, // 5 sec — real-time feel
  })
  return { spotify: data, loading: !data && !error, error, refresh: mutate }
}

export function useOutlook() {
  const { data, error } = useSWR<{ emails: Email[]; events: CalendarEvent[] }>(
    '/api/outlook', fetcher, { refreshInterval: 120000 } // 2 min
  )
  return {
    emails: data?.emails || [],
    events: data?.events || [],
    loading: !data && !error,
    error,
  }
}

export function useNotion() {
  const { data, error, mutate } = useSWR<{ tasks: Task[] }>('/api/notion', fetcher, {
    refreshInterval: 60000,
  })
  return { tasks: data?.tasks || [], loading: !data && !error, error, refresh: mutate }
}

export function useWeather(lat = -6.2088, lon = 106.8456, location = 'Jakarta') {
  const { data, error } = useSWR<WeatherData>(
    `/api/weather?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}`,
    fetcher,
    { refreshInterval: 1800000 } // 30 min
  )
  return { weather: data, loading: !data && !error, error }
}

export function useStocks() {
  const { data, error, mutate } = useSWR<{ idx: StockQuote[]; crypto: StockQuote[] }>(
    '/api/stocks', fetcher, { refreshInterval: 300000 } // 5 min
  )
  return {
    idx: data?.idx || [],
    crypto: data?.crypto || [],
    loading: !data && !error,
    error,
    refresh: mutate,
  }
}

export function useNews() {
  const { data, error } = useSWR<{ news: NewsItem[] }>('/api/news', fetcher, {
    refreshInterval: 900000, // 15 min
  })
  return { news: data?.news || [], loading: !data && !error, error }
}

export function useHealth() {
  const { data, error } = useSWR<HealthData>('/api/health', fetcher, {
    refreshInterval: 600000, // 10 min
  })
  return { health: data, loading: !data && !error, error }
}
