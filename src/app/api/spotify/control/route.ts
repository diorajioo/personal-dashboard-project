// src/app/api/spotify/control/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.spotify?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { action } = await req.json() // 'play' | 'pause' | 'next' | 'previous'

  const endpoints: Record<string, { url: string; method: string }> = {
    play: { url: 'https://api.spotify.com/v1/me/player/play', method: 'PUT' },
    pause: { url: 'https://api.spotify.com/v1/me/player/pause', method: 'PUT' },
    next: { url: 'https://api.spotify.com/v1/me/player/next', method: 'POST' },
    previous: { url: 'https://api.spotify.com/v1/me/player/previous', method: 'POST' },
  }

  const target = endpoints[action]
  if (!target) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const res = await fetch(target.url, {
    method: target.method,
    headers: { Authorization: `Bearer ${session.spotify.accessToken}` },
  })

  // Spotify returns 204 on success, 404 if no active device
  if (res.status === 404) {
    return NextResponse.json(
      { error: 'No active Spotify device. Open Spotify on a device first.' },
      { status: 404 }
    )
  }

  if (!res.ok && res.status !== 204) {
    return NextResponse.json({ error: 'Playback control failed' }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}