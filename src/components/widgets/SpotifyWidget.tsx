'use client'

import { useState, useEffect } from 'react'
import { useSpotify } from '@/hooks/useData'
import { SkipBack, SkipForward, Play, Pause, Music } from 'lucide-react'
import Image from 'next/image'

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function SpotifyWidget() {
  const { spotify, loading } = useSpotify()
  const [localProgress, setLocalProgress] = useState(0)

  const track = spotify?.current
  const queue = spotify?.queue || []

  useEffect(() => {
    if (track) setLocalProgress(track.progressMs)
  }, [track?.progressMs])

  useEffect(() => {
    if (!track?.isPlaying) return
    const id = setInterval(() => setLocalProgress(p => Math.min(p + 1000, track.durationMs)), 1000)
    return () => clearInterval(id)
  }, [track?.isPlaying, track?.durationMs])

  async function control(action: string) {
    await fetch('/api/spotify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
  }

  const pct = track ? (localProgress / track.durationMs) * 100 : 0

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="sec-label">
        <Music size={13} />
        Now playing
        <a href="https://open.spotify.com" target="_blank" rel="noreferrer"
          style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--acc)', opacity: 0.7 }}>
          Spotify
        </a>
      </div>

      {/* Current track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8,
          background: 'var(--spg)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {track?.albumArt
            ? <Image src={track.albumArt} alt="album" width={38} height={38} />
            : <Music size={16} color="#000" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loading ? 'Loading...' : track?.name || 'Nothing playing'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 1 }}>
            {track?.artist || '—'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => control('previous')} style={scBtn}>
            <SkipBack size={16} />
          </button>
          <button onClick={() => control(track?.isPlaying ? 'pause' : 'play')} style={ppBtn}>
            {track?.isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button onClick={() => control('next')} style={scBtn}>
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, cursor: 'pointer' }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'var(--spg)', width: `${pct}%`, transition: 'width 1s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>
            <span>{fmt(localProgress)}</span>
            <span>{track ? fmt(track.durationMs) : '0:00'}</span>
          </div>
        </div>
        <input type="range" min={0} max={100} defaultValue={65}
          style={{ width: 52, accentColor: 'var(--spg)', cursor: 'pointer' }} />
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <>
          <hr className="div-line" />
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 7 }}>
            Up next
          </div>
          {queue.map((t, i) => (
            <div key={t.id || i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '5px 0', borderBottom: i < queue.length - 1 ? '0.5px solid var(--b)' : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 5, flexShrink: 0,
                background: ['rgba(29,185,84,.15)', 'rgba(123,158,248,.1)', 'rgba(155,127,244,.1)'][i],
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {t.albumArt
                  ? <Image src={t.albumArt} alt="" width={28} height={28} />
                  : <Music size={12} color={['var(--spg)', 'var(--acc)', 'var(--pur)'][i]} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#c0c4d6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 1 }}>{t.artist}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{fmt(t.durationMs)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const scBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--t2)',
  cursor: 'pointer', padding: 0, lineHeight: 1, transition: 'color 0.12s',
}
const ppBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%',
  background: 'var(--spg)', border: 'none', color: '#000',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
}
