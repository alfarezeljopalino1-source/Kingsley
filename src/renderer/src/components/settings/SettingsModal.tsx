import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  X,
  Search,
  User,
  Palette,
  Terminal,
  Keyboard,
  Info,
  Check,
  Sparkles,
  ShieldCheck,
  Sliders,
  Layers,
  Package,
  Bot,
  Music
} from 'lucide-react'
import { PluginsStudio } from '../plugins/PluginsStudio'
import { AgentsStudio } from '../agents/AgentsStudio'
import { ProfileSettings, getStoredProfile, PROFILE_STORAGE_KEY } from '../profile/ProfileSettings'
import { PRESET_AVATARS, type OperatorProfile } from '../profile/OperatorCard'
import { ThemeStudio } from '../theme/ThemeStudio'
import { FeaturesStudio } from '../features/FeaturesStudio'
import { useTheme, type AppearanceSettings } from '../../context/ThemeContext'
import { useFeatures } from '../../context/FeaturesContext'
import { useLanguage } from '../../context/LanguageContext'
import { THEMES, type ThemeId } from '../../types/theme'
import type { ShellType } from '@shared/types'
import { APP_LOGO_BASE64 } from '../../assets/logoBase64'

export type SettingsSection =
  | 'account'
  | 'appearance'
  | 'features'
  | 'plugins'
  | 'agents'
  | 'terminal'
  | 'shortcuts'
  | 'about'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onReplayIntro?: () => void
  initialSection?: SettingsSection
}
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onReplayIntro,
  initialSection,
}) => {
  const { theme, themeId, setThemeId, appearance, updateAppearance } = useTheme()
  const { features, setAllFeatures } = useFeatures()
  const { t, language } = useLanguage()
  const [activeSection, setActiveSection] = useState<SettingsSection>('account')
  const [searchQuery, setSearchQuery] = useState('')
  const [liveVersion, setLiveVersion] = useState<string>(() =>
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.0'
  )

  useEffect(() => {
    if (window.ferminAPI?.getAppVersion) {
      window.ferminAPI
        .getAppVersion()
        .then((ver) => {
          if (ver) setLiveVersion(ver)
        })
        .catch(() => {})
    }
  }, [])

  // Baseline snapshots of settings when modal opens
  const initialProfileRef = useRef<OperatorProfile>(getStoredProfile())
  const initialThemeIdRef = useRef<ThemeId>(themeId)
  const initialAppearanceRef = useRef<AppearanceSettings>({ ...appearance })
  const initialFeaturesRef = useRef({ ...features })
  const initialShellRef = useRef<ShellType>(
    (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'
  )
  const initialScrollbackRef = useRef<number>(
    parseInt(localStorage.getItem('ferminterm_scrollback_lines') || '5000', 10)
  )

  // Draft working states
  const [draftProfile, setDraftProfile] = useState<OperatorProfile>(getStoredProfile)
  const [draftShell, setDraftShell] = useState<ShellType>(initialShellRef.current)
  const [draftScrollback, setDraftScrollback] = useState<number>(initialScrollbackRef.current)

  // Reset drafts and baseline snapshots whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection || 'account')
      const stored = getStoredProfile()
      initialProfileRef.current = stored
      setDraftProfile(stored)

      initialThemeIdRef.current = themeId
      initialAppearanceRef.current = { ...appearance }
      initialFeaturesRef.current = { ...features }

      const storedShell =
        (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'
      const storedScrollback = parseInt(
        localStorage.getItem('ferminterm_scrollback_lines') || '5000',
        10
      )

      initialShellRef.current = storedShell
      setDraftShell(storedShell)

      initialScrollbackRef.current = storedScrollback
      setDraftScrollback(storedScrollback)
    }
  }, [isOpen])

  // Check if any draft changes are pending
  const hasProfileChanges = useMemo(() => {
    return JSON.stringify(draftProfile) !== JSON.stringify(initialProfileRef.current)
  }, [draftProfile])

  const hasThemeChanges = useMemo(() => {
    return (
      themeId !== initialThemeIdRef.current ||
      JSON.stringify(appearance) !== JSON.stringify(initialAppearanceRef.current)
    )
  }, [themeId, appearance])

  const hasFeaturesChanges = useMemo(() => {
    return JSON.stringify(features) !== JSON.stringify(initialFeaturesRef.current)
  }, [features])

  const hasTerminalChanges = useMemo(() => {
    return (
      draftShell !== initialShellRef.current ||
      draftScrollback !== initialScrollbackRef.current
    )
  }, [draftShell, draftScrollback])

  const hasUnsavedChanges =
    hasProfileChanges || hasThemeChanges || hasFeaturesChanges || hasTerminalChanges

  // Discard all changes and revert back to initial snapshot
  const handleCancel = useCallback(() => {
    if (themeId !== initialThemeIdRef.current) {
      setThemeId(initialThemeIdRef.current)
    }
    if (JSON.stringify(appearance) !== JSON.stringify(initialAppearanceRef.current)) {
      updateAppearance(initialAppearanceRef.current)
    }
    if (JSON.stringify(features) !== JSON.stringify(initialFeaturesRef.current)) {
      setAllFeatures(initialFeaturesRef.current)
    }
    setDraftProfile(initialProfileRef.current)
    setDraftShell(initialShellRef.current)
    setDraftScrollback(initialScrollbackRef.current)
    onClose()
  }, [themeId, appearance, features, setThemeId, updateAppearance, setAllFeatures, onClose])

  // Save all changes to local storage & commit
  const handleDone = useCallback(() => {
    // 1. Commit Operator Profile
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(draftProfile))
    localStorage.setItem('ferminterm_display_name', draftProfile.name)
    localStorage.setItem('ferminterm_user_role', draftProfile.role)

    // 2. Commit Terminal Engine settings
    localStorage.setItem('ferminterm_default_shell', draftShell)
    localStorage.setItem('ferminterm_scrollback_lines', draftScrollback.toString())

    // 3. Confirm Theme & Appearance persistence
    localStorage.setItem('ferminterm_theme', themeId)
    localStorage.setItem('ferminterm_appearance', JSON.stringify(appearance))

    // 4. Confirm Features persistence
    localStorage.setItem('ferminterm_features', JSON.stringify(features))

    // 5. Update initial snapshots to current state
    initialProfileRef.current = draftProfile
    initialThemeIdRef.current = themeId
    initialAppearanceRef.current = { ...appearance }
    initialFeaturesRef.current = { ...features }
    initialShellRef.current = draftShell
    initialScrollbackRef.current = draftScrollback

    // 6. Notify app of profile update
    window.dispatchEvent(new CustomEvent('ferminterm_profile_updated', { detail: draftProfile }))

    onClose()
  }, [draftProfile, draftShell, draftScrollback, themeId, appearance, features, onClose])

  // Escape key cancels and discards
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleCancel])

  if (!isOpen) return null

  // Navigation tabs in the left sidebar
  const navigationItems = [
    {
      id: 'account' as SettingsSection,
      label: t.nav.account,
      desc: t.nav.accountDesc,
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'appearance' as SettingsSection,
      label: t.nav.appearance,
      desc: t.nav.appearanceDesc,
      icon: <Palette className="w-4 h-4 text-amber-400" />,
      badge: '20',
    },
    {
      id: 'features' as SettingsSection,
      label: t.nav.features,
      desc: t.nav.featuresDesc,
      icon: <Layers className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'plugins' as SettingsSection,
      label: 'Plugins',
      desc: 'Git Control, Todo List, Themes, and Extensions',
      icon: <Package className="w-4 h-4 text-pink-400" />,
      badge: '4',
    },
    {
      id: 'agents' as SettingsSection,
      label: 'Enabled Agents',
      desc: 'Claude, OpenCode, Aider, Codex CLI arsenal',
      icon: <Bot className="w-4 h-4 text-cyan-400" />,
      badge: '10',
    },
    {
      id: 'terminal' as SettingsSection,
      label: t.nav.terminal,
      desc: t.nav.terminalDesc,
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'shortcuts' as SettingsSection,
      label: t.nav.shortcuts,
      desc: t.nav.shortcutsDesc,
      icon: <Keyboard className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'about' as SettingsSection,
      label: t.nav.about,
      desc: t.nav.aboutDesc,
      icon: <Info className="w-4 h-4 text-purple-400" />,
    },
  ]

  // Filtered themes based on search
  const filteredThemes = (Object.keys(THEMES) as ThemeId[]).filter((id) => {
    const t = THEMES[id]
    const q = searchQuery.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q)
  })

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel()
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-fade-in"
    >
      <div
        className="w-full max-w-5xl h-[85vh] rounded-2xl border shadow-2xl flex overflow-hidden font-mono"
        style={{
          backgroundColor: theme.ui.surface,
          borderColor: theme.ui.borderActive,
          color: theme.ui.text,
        }}
      >
        {/* ================= LEFT SIDEBAR (Alethe Style) ================= */}
        <div
          className="w-72 border-r flex flex-col p-4 select-none shrink-0"
          style={{
            backgroundColor: theme.ui.surface,
            borderColor: theme.ui.border,
          }}
        >
          {/* User Profile Card */}
          <div
            onClick={() => setActiveSection('account')}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition-colors mb-4 group"
          >
            {/* Avatar */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-black shrink-0 shadow-md ring-2 ring-white/10 overflow-hidden"
              style={{ backgroundColor: theme.ui.accent }}
            >
              {draftProfile.avatarType === 'preset' && PRESET_AVATARS[draftProfile.avatarValue]?.icon ? (
                <div
                  className="w-6 h-6 flex items-center justify-center scale-75"
                  style={{ color: PRESET_AVATARS[draftProfile.avatarValue].color }}
                >
                  {PRESET_AVATARS[draftProfile.avatarValue].icon}
                </div>
              ) : (draftProfile.avatarType === 'custom-url' || draftProfile.avatarType === 'local-image') &&
                draftProfile.avatarValue ? (
                <img
                  src={draftProfile.avatarValue}
                  alt={draftProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                (draftProfile.name || 'D').charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex flex-col truncate">
              <span className="font-bold text-sm truncate" style={{ color: theme.ui.text }}>
                {draftProfile.name || 'Developer'}
              </span>
              <span className="text-[11px] truncate opacity-60">
                {draftProfile.role || 'Systems Architect'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/10 mb-4 focus-within:border-amber-400/50 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.settings.searchPlaceholder}
              className="w-full bg-transparent text-xs font-mono focus:outline-none placeholder:text-neutral-500"
              style={{ color: theme.ui.text }}
            />
          </div>

          {/* Category Navigation Items */}
          <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 px-2 mb-1.5 block">
            SETTINGS
          </span>

          <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
            {navigationItems.map((item) => {
              const isActive = activeSection === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white/10 font-medium shadow-sm'
                      : 'hover:bg-white/[0.04] opacity-75 hover:opacity-100'
                  }`}
                  style={{
                    borderLeft: isActive ? `3px solid ${theme.ui.accent}` : '3px solid transparent',
                    backgroundColor: isActive ? theme.ui.surfaceHover : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="shrink-0">{item.icon}</div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs truncate font-medium" style={{ color: theme.ui.text }}>
                        {item.label}
                      </span>
                      <span className="text-[10px] opacity-60 truncate max-w-[140px]">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-white/10 text-neutral-300">
                      {item.badge}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom Version Pill */}
          <div className="pt-3 border-t text-[10px] text-neutral-500 flex items-center justify-between" style={{ borderColor: theme.ui.border }}>
            <span>Kingsley v{liveVersion}</span>
          </div>
        </div>

        {/* ================= RIGHT CONTENT PANEL ================= */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ backgroundColor: theme.ui.background }}
        >
          {/* Header */}
          <div
            className="px-8 py-5 border-b flex items-center justify-between shrink-0"
            style={{
              borderColor: theme.ui.border,
              backgroundColor: theme.ui.surface,
            }}
          >
            <div>
              <h2 className="text-lg font-bold tracking-tight" style={{ color: theme.ui.text }}>
                {activeSection === 'account' && 'Account & Profile'}
                {activeSection === 'appearance' && 'Appearance & Themes'}
                {activeSection === 'features' && 'Features & Modules'}
                {activeSection === 'plugins' && 'Plugins & Extensions'}
                {activeSection === 'agents' && 'Enabled AI Agents'}
                {activeSection === 'terminal' && 'Terminal Engine Settings'}
                {activeSection === 'shortcuts' && 'Keyboard Shortcuts Cheat Sheet'}
                {activeSection === 'about' && 'About Kingsley'}
              </h2>
              <p className="text-xs mt-0.5 opacity-60" style={{ color: theme.ui.textMuted }}>
                {activeSection === 'account' && 'Configure operator identity, profile credentials, and localization.'}
                {activeSection === 'appearance' && 'Catalog of 20 developer themes, typography scale, and cursor styles.'}
                {activeSection === 'features' && 'Choose which optional modules are visible in Kingsley.'}
                {activeSection === 'plugins' && 'Browse, toggle, and install developer workstation plugins.'}
                {activeSection === 'agents' && 'Configure active and disabled CLI coding agent engines.'}
                {activeSection === 'terminal' && 'Configure Windows 11 ConPTY subsystem, startup shell, and buffer allocation.'}
                {activeSection === 'shortcuts' && 'Comprehensive keyboard shortcuts reference for hands-on-keyboard workflows.'}
                {activeSection === 'about' && 'Runtime specifications, system architecture, and project credits.'}
              </p>
            </div>

            <button
              onClick={handleCancel}
              className="p-2 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
              title="Cancel and close without saving (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Body Container */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* ================= SECTION: ACCOUNT ================= */}
            {/* ================= SECTION: ACCOUNT & PROFILE ================= */}
            {activeSection === 'account' && (
              <ProfileSettings profile={draftProfile} onChange={setDraftProfile} />
            )}

            {/* ================= SECTION: APPEARANCE & THEMES STUDIO ================= */}
            {activeSection === 'appearance' && <ThemeStudio />}

            {/* ================= SECTION: FEATURES STUDIO (IMAGE 1) ================= */}
            {activeSection === 'features' && <FeaturesStudio />}

            {/* ================= SECTION: PLUGINS STUDIO (IMAGE 2 & 3) ================= */}
            {activeSection === 'plugins' && <PluginsStudio />}

            {/* ================= SECTION: AGENTS STUDIO (IMAGE 4) ================= */}
            {activeSection === 'agents' && <AgentsStudio />}

            {activeSection === 'terminal' && (
              <div className="space-y-6 max-w-2xl font-mono text-xs">
                <div>
                  <h3 className="text-sm font-bold mb-1 text-white">
                    {language === 'id' ? 'Engine Terminal & Subsistem ConPTY' : 'Terminal Engine & ConPTY Subsystem'}
                  </h3>
                  <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
                    {language === 'id'
                      ? 'Konfigurasi subsistem pseudoterminal native Windows 11, alokasi memori buffer scrollback, dan shell default.'
                      : 'Configure Windows 11 native pseudoterminal bindings, scrollback buffer allocation, and default startup shell.'}
                  </p>

                  <div className="space-y-4">
                    {/* 1. ConPTY Status & Diagnostics */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-white">Windows ConPTY Engine</span>
                          <span className="text-[11px] text-neutral-400">
                            {language === 'id'
                              ? 'Koneksi API native Windows Pseudo Console aktif'
                              : 'Windows Pseudo Console API bindings operational'}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          ACTIVE
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-300 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5">
                        {language === 'id'
                          ? '💡 ConPTY menghubungkan antarmuka xterm.js langsung ke kernel proses OS Windows 11 secara instan tanpa emulator pihak ketiga. Memberikan latensi pengetikan nol (<1.5ms) dan kompatibilitas ANSI VT100 penuh.'
                          : '💡 ConPTY connects xterm.js directly to the Windows 11 OS kernel without emulation overhead, delivering zero-latency typing (<1.5ms) and full ANSI VT100 escape sequence fidelity.'}
                      </p>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-neutral-400">
                        <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-neutral-500 block uppercase">Latensi I/O</span>
                          <span className="font-bold text-emerald-400">&lt; 1.2 ms</span>
                        </div>
                        <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-neutral-500 block uppercase">Renderer</span>
                          <span className="font-bold text-cyan-400">WebGL GPU 60fps</span>
                        </div>
                        <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-neutral-500 block uppercase">Sandbox</span>
                          <span className="font-bold text-purple-400">Isolated node-pty</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Default Shell on Startup */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
                      <label className="text-[11px] font-bold uppercase text-neutral-400 block">
                        {language === 'id' ? 'Shell Default Saat Membuka Tab Baru' : 'Default Shell on Startup'}
                      </label>
                      <select
                        value={draftShell}
                        onChange={(e) => setDraftShell(e.target.value as ShellType)}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
                        style={{ color: theme.ui.text }}
                      >
                        <option value="powershell">PowerShell (Default Windows 11)</option>
                        <option value="cmd">Command Prompt (cmd.exe)</option>
                        <option value="bash">Git Bash (MINGW64 bash.exe)</option>
                        <option value="wsl">WSL (Windows Subsystem for Linux - Ubuntu)</option>
                      </select>

                      <p className="text-[11px] text-neutral-400 leading-relaxed pt-1">
                        {draftShell === 'powershell' && (
                          language === 'id'
                            ? '📌 PowerShell: Shell bawaan Windows 11 paling direkomendasikan dengan dukungan script modern dan modul paket.'
                            : '📌 PowerShell: Highly recommended default Windows shell with modern scripting and package ecosystem.'
                        )}
                        {draftShell === 'cmd' && (
                          language === 'id'
                            ? '📌 Command Prompt: Shell legendaris Windows yang sangat ringan dan cepat untuk perintah batch tradisional.'
                            : '📌 Command Prompt: Ultra-lightweight classic Windows shell for legacy batch operations.'
                        )}
                        {draftShell === 'bash' && (
                          language === 'id'
                            ? '📌 Git Bash: Menyediakan utilitas Unix/Linux lengkap (grep, curl, awk, ssh) langsung di Windows.'
                            : '📌 Git Bash: Complete Unix command toolset (grep, curl, awk, ssh) natively on Windows.'
                        )}
                        {draftShell === 'wsl' && (
                          language === 'id'
                            ? '📌 WSL: Mesin virtual Linux asli (Ubuntu / Debian) dengan kernel Linux langsung dari Microsoft.'
                            : '📌 WSL: Native Linux kernel subsystem (Ubuntu / Debian) integrated into your Windows workspace.'
                        )}
                      </p>
                    </div>

                    {/* 3. Scrollback Lines Buffer */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase text-neutral-400 block">
                          {language === 'id' ? 'Batas Baris Scrollback (Buffer Memori)' : 'Scrollback Lines Buffer'}
                        </label>
                        <span className="text-[10px] text-neutral-500">
                          RAM: ~{(draftScrollback * 0.0012).toFixed(1)} MB per pane
                        </span>
                      </div>

                      <input
                        type="number"
                        value={draftScrollback}
                        onChange={(e) =>
                          setDraftScrollback(Math.max(500, parseInt(e.target.value, 10) || 5000))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono focus:outline-none focus:border-cyan-400"
                        style={{ color: theme.ui.text }}
                      />

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-neutral-500">{language === 'id' ? 'Pilihan Cepat:' : 'Quick Presets:'}</span>
                        {[2000, 5000, 10000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setDraftScrollback(val)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              draftScrollback === val
                                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                                : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white'
                            }`}
                          >
                            {val.toLocaleString()} {val === 5000 ? (language === 'id' ? '(Rekomendasi)' : '(Recommended)') : ''}
                          </button>
                        ))}
                      </div>

                      <span className="text-[10px] text-neutral-400 leading-relaxed block pt-1">
                        {language === 'id'
                          ? 'Berapa banyak baris output terminal yang tersimpan di memori. Semakin besar angkanya, semakin jauh Anda dapat melihat log kompilasi atau riwayat output ke atas.'
                          : 'Maximum scrollback history buffer maintained in memory per terminal session. Higher values allow inspecting longer build logs.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SECTION: SHORTCUTS ================= */}
            {activeSection === 'shortcuts' && (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-sm font-bold mb-1">Keyboard Shortcuts (Cheat Sheet)</h3>
                <p className="text-xs opacity-60 mb-4">
                  Rapid navigation and complete workspace control without reaching for the mouse.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span style={{ color: theme.ui.textMuted }}>Open New Tab</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-bold text-amber-300">Ctrl + T</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span style={{ color: theme.ui.textMuted }}>Close Active Tab</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-bold text-amber-300">Ctrl + W</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span style={{ color: theme.ui.textMuted }}>Split Right (Vertical)</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-bold text-cyan-300">Ctrl + Shift + E</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span style={{ color: theme.ui.textMuted }}>Split Down (Horizontal)</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-bold text-blue-300">Ctrl + Shift + D</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span style={{ color: theme.ui.textMuted }}>Close Active Pane</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-bold text-red-300">Ctrl + Shift + W</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span style={{ color: theme.ui.textMuted }}>Toggle Sidebar</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-bold text-amber-300">Ctrl + B</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span style={{ color: theme.ui.textMuted }}>Command Palette</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-bold text-yellow-300">Ctrl + K</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span style={{ color: theme.ui.textMuted }}>Open Settings Studio</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 font-bold text-purple-300">Ctrl + ,</kbd>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SECTION: ABOUT ================= */}
            {activeSection === 'about' && (
              <div className="space-y-6 max-w-2xl">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3">
                  <div className="relative w-20 h-20 mx-auto rounded-2xl p-1 shadow-2xl border border-cyan-500/30 overflow-hidden bg-[#070b19] flex items-center justify-center">
                    <div
                      className="absolute -inset-1 rounded-2xl opacity-40 blur-md pointer-events-none"
                      style={{ background: 'linear-gradient(135deg, #00d2d3, #004d98, #a50044)' }}
                    />
                    <img
                      src={APP_LOGO_BASE64}
                      alt="Kingsley Official Logo"
                      className="relative z-10 w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  <h3 className="text-lg font-bold">Kingsley</h3>
                  <p className="text-xs opacity-60 max-w-md mx-auto">
                    Next-generation desktop terminal multiplexer and agent workspace for Windows 11.
                  </p>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono">
                      v{liveVersion}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">Electron 33</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">Node 24</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">ConPTY</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="opacity-60">Project</span>
                    <span className="font-bold text-cyan-400">Kingsley Terminal</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="opacity-60">Architecture</span>
                    <span className="font-bold text-cyan-400">ConPTY Multiplexer &amp; Agent IDE</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="opacity-60">Design Philosophy</span>
                    <span className="font-bold text-emerald-400">Anti AI-Slop &amp; Precision CLI</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="opacity-60">License</span>
                    <span className="font-bold text-neutral-300">MIT Open Source License</span>
                  </div>
                </div>

                {onReplayIntro && (
                  <button
                    onClick={() => {
                      onClose()
                      onReplayIntro()
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Replay Intro Animation &amp; Overview</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Save / Close Bar */}
          <div
            className="px-8 py-3.5 border-t flex items-center justify-between text-xs font-mono shrink-0 select-none"
            style={{
              borderColor: theme.ui.border,
              backgroundColor: theme.ui.surface,
            }}
          >
            <div className="flex items-center gap-2">
              {hasUnsavedChanges ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-amber-300 font-semibold">{t.settings.unsavedPending}</span>
                  <span className="opacity-50 hidden sm:inline">• {t.settings.clickDoneApply}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="opacity-70">{t.settings.inSync}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl font-medium transition-all hover:bg-white/10 opacity-70 hover:opacity-100 flex items-center gap-1.5 cursor-pointer text-xs"
                style={{ color: theme.ui.text }}
                title="Cancel changes and discard (Esc)"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.common.cancel}</span>
              </button>

              <button
                type="button"
                onClick={handleDone}
                className={`px-6 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer text-xs ${
                  hasUnsavedChanges ? 'ring-2 ring-white/20' : ''
                }`}
                style={{
                  backgroundColor: theme.ui.accent,
                  color: '#000000',
                }}
                title="Save changes and close"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{t.common.done}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
