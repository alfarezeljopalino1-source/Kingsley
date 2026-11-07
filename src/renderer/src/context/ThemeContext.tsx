import React, { createContext, useContext, useEffect, useState } from 'react'
import { THEMES, type ThemeColors, type ThemeId } from '../types/theme'

export type CursorStyleType = 'block' | 'underline' | 'bar'
export type FontFamilyType = 'cascadia' | 'jetbrains' | 'fira' | 'source-code' | 'consolas' | 'monaco'
export type LineHeightType = 1.1 | 1.2 | 1.25 | 1.35 | 1.5
export type PaddingType = 4 | 8 | 12 | 16
export type GlowStyleType = 'gradient' | 'hairline' | 'subtle'

export interface AppearanceSettings {
  fontFamily: FontFamilyType
  fontSize: number
  lineHeight: LineHeightType
  cursorStyle: CursorStyleType
  cursorBlink: boolean
  padding: PaddingType
  glowStyle: GlowStyleType
  ligatures: boolean
}

interface ThemeContextType {
  themeId: ThemeId
  theme: ThemeColors
  setThemeId: (id: ThemeId) => void
  appearance: AppearanceSettings
  updateAppearance: (partial: Partial<AppearanceSettings>) => void
  getFontFamilyString: (f?: FontFamilyType) => string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'ferminterm_theme'
const APPEARANCE_STORAGE_KEY = 'ferminterm_appearance'

const DEFAULT_APPEARANCE: AppearanceSettings = {
  fontFamily: 'cascadia',
  fontSize: 13.5,
  lineHeight: 1.25,
  cursorStyle: 'block',
  cursorBlink: true,
  padding: 8,
  glowStyle: 'gradient',
  ligatures: true,
}

export function getFontFamilyString(f: FontFamilyType = 'cascadia'): string {
  switch (f) {
    case 'cascadia':
      return '"Cascadia Code", "JetBrains Mono", Consolas, monospace'
    case 'jetbrains':
      return '"JetBrains Mono", "Cascadia Code", Consolas, monospace'
    case 'fira':
      return '"Fira Code", "Cascadia Code", Consolas, monospace'
    case 'source-code':
      return '"Source Code Pro", "Cascadia Code", monospace'
    case 'consolas':
      return 'Consolas, "Cascadia Code", monospace'
    case 'monaco':
      return 'Monaco, "Cascadia Code", monospace'
    default:
      return '"Cascadia Code", monospace'
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null
    if (saved && THEMES[saved]) {
      return saved
    }
    return 'obsidian'
  })

  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY)
    if (saved) {
      try {
        return { ...DEFAULT_APPEARANCE, ...JSON.parse(saved) }
      } catch {}
    }
    return DEFAULT_APPEARANCE
  })

  const theme = THEMES[themeId] || THEMES.obsidian

  const setThemeId = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeIdState(id)
      localStorage.setItem(THEME_STORAGE_KEY, id)
    }
  }

  const updateAppearance = (partial: Partial<AppearanceSettings>) => {
    setAppearance((prev) => {
      const next = { ...prev, ...partial }
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  // Dual-sync: apply CSS variables to document.documentElement
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bg-app', theme.ui.background)
    root.style.setProperty('--bg-surface', theme.ui.surface)
    root.style.setProperty('--bg-surface-hover', theme.ui.surfaceHover)
    root.style.setProperty('--border-ui', theme.ui.border)
    root.style.setProperty('--border-active', theme.ui.borderActive)
    root.style.setProperty('--text-main', theme.ui.text)
    root.style.setProperty('--text-muted', theme.ui.textMuted)
    root.style.setProperty('--accent-color', theme.ui.accent)
    root.style.setProperty('--active-pane-border', theme.ui.activePaneBorder)
    root.style.setProperty('--active-pane-glow', theme.ui.activePaneGlow)
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme,
        setThemeId,
        appearance,
        updateAppearance,
        getFontFamilyString: (f) => getFontFamilyString(f || appearance.fontFamily),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
