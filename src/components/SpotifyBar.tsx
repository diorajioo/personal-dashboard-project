// src/components/SpotifyBar.tsx
'use client'

import { useState } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import { Play, Pause, SkipBack, SkipForward, Music2 } from 'lucide-react'
import { mutate } from 'swr'

export default function SpotifyBar() {
  const { nowPlaying, isLoading, isError } = useSpotify()
  const [pending, setPending] = useState(false)

  async function control(action: 'play' | 'pause' | 'next' | 'previous') {
    setPending(true)
    try {
      await fetch('/api/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      // slight delay so Spotify state updates before we refetch
      setTimeout(() => mutate('/api/spotify/now-playing'), 400)
    } finally {
      setPending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-neutral-900/60 px-4 py-3 animate-pulse">
        <div className="h-10 w-10 rounded-md bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-neutral-800" />
          <div className="h-2 w-1/4 rounded bg-neutral-800" />
        </div>
      </div>
    )
  }

  if (isError || nowPlaying?.error) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-neutral-900/60 px-4 py-3 text-sm text-neutral-400">
        <Music2 size={16} />
        Spotify unavailable — try reconnecting.
      </div>
    )
  }

  const track = nowPlaying?.track
  const queue = nowPlaying?.queue ?? []
  const progress = track ? (track.progressMs / track.durationMs) * 100 : 0

  return (
    <div className="flex items-center gap-4 rounded-xl bg-neutral-900/60 px-4 py-3">
      {/* Album art */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-800">
        {track?.albumArt ? (
          <img src={track.albumArt} alt={track.album} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-600">
            <Music2 size={20} />
          </div>
        )}
      </div>

      {/* Track info + progress */}
      <div className="min-w-0 flex-1">
        {track ? (
          <>
            <p className="truncate text-sm font-medium text-neutral-100">{track.name}</p>
            <p className="truncate text-xs text-neutral-400">{track.artist}</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-500">Nothing playing</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => control('previous')}
          disabled={pending}
          className="rounded-full p-1.5 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => control(nowPlaying?.isPlaying ? 'pause' : 'play')}
          disabled={pending}
          className="rounded-full bg-neutral-100 p-2 text-neutral-900 hover:bg-white disabled:opacity-50"
        >
          {nowPlaying?.isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={() => control('next')}
          disabled={pending}
          className="rounded-full p-1.5 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Queue preview */}
      {queue.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1.5 border-l border-neutral-800 pl-3 lg:flex">
          {queue.slice(0, 3).map((t: any, i: number) => (
            <div
              key={i}
              className="h-8 w-8 overflow-hidden rounded bg-neutral-800"
              title={`${t.name} — ${t.artist}`}
            >
              {t.albumArt && (
                <img src={t.albumArt} alt={t.name} className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
