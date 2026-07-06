// src/hooks/useFinance.ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useFinance() {
  const { data, error, isLoading } = useSWR('/api/finance', fetcher, {
    refreshInterval: 60000, // finance data doesn't need to poll as fast as Spotify
  })

  return {
    transactions: data?.transactions ?? [],
    savingsGoals: data?.savingsGoals ?? [],
    summary: data?.summary,
    isLoading,
    isError: error,
  }
}
