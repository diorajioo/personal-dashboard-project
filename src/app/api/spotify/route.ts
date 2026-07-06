// src/app/api/spotify/now-playing/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.spotify?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (session.spotify.error === 'RefreshFailed') {
    return NextResponse.json({ error: 'Spotify token refresh failed, please re-login' }, { status: 401 })
  }

  const headers = { Authorization: `Bearer ${session.spotify.accessToken}` }

  const [nowPlayingRes, queueRes] = await Promise.all([
    fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers }),
    fetch('https://api.spotify.com/v1/me/player/queue', { headers }),
  ])

  // 204 = no active playback
  if (nowPlayingRes.status === 204) {
    return NextResponse.json({ isPlaying: false, track: null, queue: [] })
  }

  if (!nowPlayingRes.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch now playing' },
      { status: nowPlayingRes.status }
    )
  }

  const nowPlaying = await nowPlayingRes.json()
  const queueData = queueRes.ok ? await queueRes.json() : { queue: [] }

  return NextResponse.json({
    isPlaying: nowPlaying?.is_playing ?? false,
    track: nowPlaying?.item
      ? {
          name: nowPlaying.item.name,
          artist: nowPlaying.item.artists?.map((a: any) => a.name).join(', '),
          album: nowPlaying.item.album?.name,
          albumArt: nowPlaying.item.album?.images?.[0]?.url,
          progressMs: nowPlaying.progress_ms,
          durationMs: nowPlaying.item.duration_ms,
          url: nowPlaying.item.external_urls?.spotify,
        }
      : null,
    queue: (queueData.queue ?? []).slice(0, 5).map((t: any) => ({
      name: t.name,
      artist: t.artists?.map((a: any) => a.name).join(', '),
      albumArt: t.album?.images?.[0]?.url,
    })),
  })
}