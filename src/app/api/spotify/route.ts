import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const SPOTIFY_BASE = 'https://api.spotify.com/v1'

async function spotifyFetch(endpoint: string, token: string, options?: RequestInit) {
  const res = await fetch(`${SPOTIFY_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`Spotify ${res.status}`)
  return res.json()
}

// GET /api/spotify — now playing + queue
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken || session.provider !== 'spotify') {
    return NextResponse.json({ error: 'Spotify not connected' }, { status: 401 })
  }

  try {
    const [playback, queueData] = await Promise.all([
      spotifyFetch('/me/player/currently-playing', session.accessToken),
      spotifyFetch('/me/player/queue', session.accessToken),
    ])

    const formatTrack = (item: any) => ({
      id: item.id,
      name: item.name,
      artist: item.artists.map((a: any) => a.name).join(', '),
      album: item.album.name,
      albumArt: item.album.images?.[0]?.url || null,
      durationMs: item.duration_ms,
    })

    return NextResponse.json({
      current: playback?.item ? {
        ...formatTrack(playback.item),
        progressMs: playback.progress_ms || 0,
        isPlaying: playback.is_playing,
      } : null,
      queue: (queueData?.queue || []).slice(0, 3).map(formatTrack),
    })
  } catch (err) {
    console.error('Spotify error:', err)
    return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 })
  }
}

// POST /api/spotify — playback controls
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken || session.provider !== 'spotify') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action } = await req.json()
  const token = session.accessToken

  try {
    const actionMap: Record<string, { endpoint: string; method: string }> = {
      play:     { endpoint: '/me/player/play',     method: 'PUT' },
      pause:    { endpoint: '/me/player/pause',    method: 'PUT' },
      next:     { endpoint: '/me/player/next',     method: 'POST' },
      previous: { endpoint: '/me/player/previous', method: 'POST' },
    }

    const target = actionMap[action]
    if (!target) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    await spotifyFetch(target.endpoint, token, { method: target.method })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Spotify control error:', err)
    return NextResponse.json({ error: 'Control failed' }, { status: 500 })
  }
}
