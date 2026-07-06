'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'dim' | 'light'
const THEMES: Theme[] = ['dark', 'dim', 'light']

const ThemeContext = createContext<{
  theme: Theme
  cycleTheme: () => void
}>({ theme: 'dark', cycleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('dio-theme') as Theme
    if (saved && THEMES.includes(saved)) apply(saved)
  }, [])

  function apply(t: Theme) {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('dio-theme', t)
  }

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    apply(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
