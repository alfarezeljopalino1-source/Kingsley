import React, { useState } from 'react'
import {
  Sparkles,
  Search,
  Check,
  Type,
  Sliders,
  Maximize2,
  SlidersHorizontal,
  Layers
} from 'lucide-react'
import { useTheme, type FontFamilyType, type CursorStyleType, type LineHeightType, type PaddingType } from '../../context/ThemeContext'
import { THEMES, type ThemeId, type ThemeCategory } from '../../types/theme'
import { AppIconPicker } from './AppIconPicker'
export const ThemeStudio: React.FC = () => {
  const { theme, themeId, setThemeId, appearance, updateAppearance, getFontFamilyString } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [themePackEnabled, setThemePackEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('ferminterm_plugins')
      if (raw) {
        const list = JSON.parse(raw)
        const p = list.find((x: { id: string; enabled: boolean }) => x.id === 'theme-pack')
        if (p) return p.enabled
      }
    } catch {}
    return true
  })

  React.useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ id: string; enabled: boolean }[]>
      if (Array.isArray(custom.detail)) {
        const p = custom.detail.find((x) => x.id === 'theme-pack')
        if (p) setThemePackEnabled(p.enabled)
      }
    }
    window.addEventListener('ferminterm:plugins-updated', handler)
    return () => window.removeEventListener('ferminterm:plugins-updated', handler)
  }, [])

  const themePackThemeIds: ThemeId[] = ['ember', 'golden-premium', 'dark-lemon', 'orca']
  const availableThemeKeys = (Object.keys(THEMES) as ThemeId[]).filter((id) => {
    if (!themePackEnabled && themePackThemeIds.includes(id)) return false
    return true
  })

  const availableThemesList = availableThemeKeys.map((id) => THEMES[id])

  const categories: Array<{ id: string; label: string; count: number }> = [
    { id: 'All', label: 'All Themes', count: availableThemesList.length },
    {
      id: 'Cyber & Dark',
      label: 'Cyber & Dark',
      count: availableThemesList.filter((t) => t.category === 'Cyber & Dark').length,
    },
    {
      id: 'Pastel & Soft',
      label: 'Pastel & Soft',
      count: availableThemesList.filter((t) => t.category === 'Pastel & Soft').length,
    },
    {
      id: 'Retro & Warm',
      label: 'Retro & Warm',
      count: availableThemesList.filter((t) => t.category === 'Retro & Warm').length,
    },
    {
      id: 'High Contrast',
      label: 'High Contrast',
      count: availableThemesList.filter((t) => t.category === 'High Contrast').length,
    },
  ]

  // Filter themes
  const filteredThemes = availableThemeKeys.filter((id) => {
    const t = THEMES[id]
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory
    const q = searchQuery.toLowerCase()
    const matchesQuery =
      t.name.toLowerCase().includes(q) ||
      t.subtitle.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    return matchesCat && matchesQuery
  })

  // Font options
  const fontOptions: Array<{ id: FontFamilyType; label: string; desc: string }> = [
    { id: 'cascadia', label: 'Cascadia Code', desc: 'Microsoft Windows 11 terminal standard with ligatures' },
    { id: 'jetbrains', label: 'JetBrains Mono', desc: 'Engineered specifically for developers with tall x-height' },
    { id: 'fira', label: 'Fira Code', desc: 'Pioneer of programming font ligatures' },
    { id: 'source-code', label: 'Source Code Pro', desc: 'Adobe clean geometric monospaced typeface' },
    { id: 'consolas', label: 'Consolas', desc: 'Classic Windows console monospace' },
    { id: 'monaco', label: 'Monaco', desc: 'Iconic Unix and macOS workstation monospace' },
  ]

  // Line height options
  const lineHeightOptions: LineHeightType[] = [1.1, 1.2, 1.25, 1.35, 1.5]

  // Padding options
  const paddingOptions: Array<{ id: PaddingType; label: string }> = [
    { id: 4, label: 'Compact (4px)' },
    { id: 8, label: 'Standard (8px)' },
    { id: 12, label: 'Comfortable (12px)' },
    { id: 16, label: 'Spacious (16px)' },
  ]

  return (
    <div className="space-y-8 font-mono text-xs max-w-4xl pb-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Theme Catalog ({Object.keys(THEMES).length} Presets)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Click any theme to synchronize the window frame and terminal color palette in real time.
            </p>
          </div>

          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 w-full sm:w-60 focus-within:border-amber-400">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search theme..."
              className="w-full bg-transparent text-xs font-mono focus:outline-none placeholder:text-neutral-500 text-white"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold shadow-sm'
                  : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{cat.label}</span>
              <span className="ml-1.5 text-[10px] opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredThemes.map((id) => {
            const t = THEMES[id]
            const isSelected = id === themeId

            return (
              <div
                key={id}
                onClick={() => setThemeId(id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 relative flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 scale-[1.01] shadow-xl'
                    : 'hover:bg-white/[0.04] opacity-80 hover:opacity-100 hover:border-white/20'
                }`}
                style={{
                  backgroundColor: t.ui.surface,
                  borderColor: isSelected ? t.ui.borderActive : t.ui.border,
                  boxShadow: isSelected ? `0 0 16px ${t.ui.borderActive}35` : undefined,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono" style={{ color: t.ui.text }}>
                      {t.name}
                    </span>

                    {isSelected && (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-black shadow-sm"
                        style={{ backgroundColor: t.ui.accent }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] mb-3 opacity-60 line-clamp-1">
                    {t.subtitle}
                  </p>
                </div>

                {/* Swatch Strip */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: t.xterm.background }}
                      title="Background"
                    />
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: t.ui.accent }}
                      title="Accent"
                    />
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: t.xterm.green }}
                      title="Green"
                    />
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: t.xterm.red }}
                      title="Red"
                    />
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: t.xterm.blue }}
                      title="Blue"
                    />
                  </div>

                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-neutral-400 font-mono">
                    {t.category.split(' ')[0]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. TYPOGRAPHY & FONT CALIBRATION */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-cyan-400" />
            <span>Typography Calibration</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            Monospace font family, sizing, and line height
          </span>
        </div>

        {/* Font Family Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {fontOptions.map((f) => {
            const isSelected = appearance.fontFamily === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => updateAppearance({ fontFamily: f.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-sm ring-1 ring-cyan-400/30'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs" style={{ color: isSelected ? '#38bdf8' : 'white' }}>
                    {f.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <span className="text-[10px] text-neutral-400 line-clamp-1 block">
                  {f.desc}
                </span>
              </button>
            )
          })}
        </div>

        {/* Font Size & Line Height Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Font Size Slider */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-300">Font Size</span>
              <span className="text-xs font-bold text-cyan-400">{appearance.fontSize}px</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={11}
                max={20}
                step={0.5}
                value={appearance.fontSize}
                onChange={(e) => updateAppearance({ fontSize: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Line Height Selector */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-300">Line Spacing</span>
              <span className="text-xs font-bold text-cyan-400">{appearance.lineHeight}x</span>
            </div>

            <div className="flex items-center gap-1.5">
              {lineHeightOptions.map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => updateAppearance({ lineHeight: lh })}
                  className={`flex-1 py-1 rounded-lg text-[11px] text-center transition-all ${
                    appearance.lineHeight === lh
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 border border-white/5'
                  }`}
                >
                  {lh}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CURSOR ENGINE */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Cursor Engine &amp; Behavior</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            Cursor shape, blinking cycle, and accent color
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cursor Style Options */}
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-2">
              Cursor Shape
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'block' as CursorStyleType, label: 'Block █', symbol: '█' },
                { id: 'underline' as CursorStyleType, label: 'Underline _', symbol: '_' },
                { id: 'bar' as CursorStyleType, label: 'Bar |', symbol: '|' },
              ].map((c) => {
                const isSelected = appearance.cursorStyle === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateAppearance({ cursorStyle: c.id })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold'
                        : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cursor Blinking Toggle */}
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-2">
              Blinking Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateAppearance({ cursorBlink: true })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  appearance.cursorBlink
                    ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <span>Blinking (Smooth)</span>
              </button>

              <button
                type="button"
                onClick={() => updateAppearance({ cursorBlink: false })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  !appearance.cursorBlink
                    ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <span>Steady (Solid)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. WINDOW PADDING & CHROME */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Terminal Padding &amp; Viewport</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            Inner canvas margin surrounding terminal text
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paddingOptions.map((p) => {
            const isSelected = appearance.padding === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => updateAppearance({ padding: p.id })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 font-bold'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <span>{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* App Icon Picker */}
      <AppIconPicker />
    </div>
  )
}
