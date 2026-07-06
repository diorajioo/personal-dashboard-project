'use client'

import { useTheme } from '@/lib/theme'
import { Moon, Sun, Contrast, Bell, Settings, HelpCircle } from 'lucide-react'

const THEME_META = {
  dark:  { label: 'Dark',  Icon: Moon },
  dim:   { label: 'Dim',   Icon: Contrast },
  light: { label: 'Light', Icon: Sun },
}

export function Topbar() {
  const { theme, cycleTheme } = useTheme()
  const { label, Icon } = THEME_META[theme]
  const isOn = theme === 'dark'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--s1)', border: '0.5px solid var(--b)',
      borderRadius: 'var(--r)', padding: '10px 16px', marginBottom: 10,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t)', letterSpacing: '-0.01em' }}>
        Dio's <span style={{ color: 'var(--acc)' }}>Dashboard</span>
      </div>

      <button
        onClick={cycleTheme}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--s2)', border: '0.5px solid var(--b)',
          borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        title={`Switch theme (${label})`}
      >
        <Icon size={13} color="var(--t2)" />
        <span style={{ fontSize: 11, color: 'var(--t2)' }}>{label}</span>
        <div style={{
          width: 28, height: 16, borderRadius: 10,
          background: theme === 'dark' ? 'var(--acc)' : theme === 'dim' ? 'var(--pur)' : 'var(--t3)',
          position: 'relative', transition: 'background 0.25s', flexShrink: 0,
        }}>
          <div style={{
            width: 11, height: 11, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 2.5,
            left: theme === 'dark' ? 14.5 : 2.5,
            transition: 'left 0.22s cubic-bezier(0.34,1.4,0.64,1)',
          }} />
        </div>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconBtn title="Notifications" dot><Bell size={15} /></IconBtn>
        <IconBtn title="Settings"><Settings size={15} /></IconBtn>
        <IconBtn title="Help"><HelpCircle size={15} /></IconBtn>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--acc)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#0d0e12', cursor: 'pointer',
        }}>D</div>
      </div>
    </div>
  )
}

function IconBtn({ children, title, dot }: { children: React.ReactNode; title: string; dot?: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      <button title={title} style={{
        width: 30, height: 30, background: 'transparent',
        border: '0.5px solid var(--b)', borderRadius: 'var(--rs)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--t2)', transition: 'all 0.15s',
      }}>
        {children}
      </button>
      {dot && <div style={{
        width: 6, height: 6, borderRadius: '50%', background: 'var(--red)',
        position: 'absolute', top: 4, right: 4,
      }} />}
    </div>
  )
}
