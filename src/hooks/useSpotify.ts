// src/hooks/useSpotify.ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useSpotify() {
  const { data, error, isLoading } = useSWR('/api/spotify/now-playing', fetcher, {
    refreshInterval: 5000, // poll every 5s for progress bar
  })

  return {
    nowPlaying: data,
    isLoading,
    isError: error,
  }
}