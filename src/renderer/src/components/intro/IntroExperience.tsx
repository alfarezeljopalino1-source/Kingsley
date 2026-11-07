import React, { useState, useEffect } from 'react'
import {
  Terminal,
  Cpu,
  Layers,
  GitCompare,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Shield,
  Command,
  LayoutGrid,
  UserCheck
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { APP_LOGO_BASE64 } from '../../assets/logoBase64'
import { PROFILE_STORAGE_KEY, DEFAULT_PROFILE } from '../profile/ProfileSettings'
interface IntroExperienceProps {
  onComplete: () => void
  onContinue?: () => void
}

export const IntroExperience: React.FC<IntroExperienceProps> = ({ onComplete, onContinue }) => {
  const { theme } = useTheme()
  const { t, language } = useLanguage()
  const [phase, setPhase] = useState<'splash' | 'slides' | 'welcome-back' | 'register'>('splash')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [logoRevealed, setLogoRevealed] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const [enteredName, setEnteredName] = useState('')
  const displayName = localStorage.getItem('ferminterm_display_name') || 'Developer'

  // Splash animation sequence
  // Splash animation sequence (runs on every startup for all users)
  useEffect(() => {
    const t1 = setTimeout(() => setLogoRevealed(true), 300)
    const t2 = setTimeout(() => {
      const skipSlides = localStorage.getItem('ferminterm_skip_slides') === 'true'
      if (skipSlides) {
        // User opted out of slides: enter app smoothly after intro animation
        onComplete()
      } else {
        // First time or user wants to keep seeing slides: show slides deck
        setPhase('slides')
      }
    }, 1900)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onComplete])

  // Keyboard navigation for slides and welcome-back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'welcome-back') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (onContinue) {
            onContinue()
          } else {
            handleFinish()
          }
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleFinish()
        }
        return
      }

      if (phase === 'slides') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault()
          handleNext()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handlePrev()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleFinish()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, currentSlide, dontShowAgain, onContinue])

  const handleProceedFromSlides = () => {
    const hasAccount = localStorage.getItem('ferminterm_account_created') === 'true'
    if (!hasAccount) {
      setPhase('register')
    } else {
      handleFinalize()
    }
  }

  const handleNext = () => {
    if (currentSlide < slidesData.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    } else {
      handleProceedFromSlides()
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
    }
  }

  const handleFinalize = (customName?: string) => {
    const finalName = (customName || enteredName || '').trim()
    if (finalName) {
      try {
        const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
        const profile = raw ? JSON.parse(raw) : { ...DEFAULT_PROFILE }
        profile.name = finalName
        profile.handle = finalName.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 16)
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
        localStorage.setItem('ferminterm_display_name', finalName)
        localStorage.setItem('ferminterm_account_created', 'true')
        window.dispatchEvent(new CustomEvent('ferminterm_profile_updated', { detail: profile }))
      } catch {}
    }

    localStorage.setItem('ferminterm_seen_onboarding', 'true')
    if (dontShowAgain) {
      localStorage.setItem('ferminterm_skip_slides', 'true')
    }
    onComplete()
  }

  const handleFinish = () => {
    handleProceedFromSlides()
  }

  const isId = language === 'id'

  // Professional Bilingual Slide Deck Data
  const slidesData = [
    {
      id: 'vision',
      badge: isId ? 'ARSITEKTUR & VISI' : 'ARCHITECTURE & VISION',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      title: isId ? 'Selamat Datang di Kingsley' : 'Welcome to Kingsley',
      subtitle: isId
        ? 'Terminal multiplexer dan workspace pengembang modern berperforma tinggi untuk Windows 11.'
        : 'Next-generation desktop terminal multiplexer and agent workspace for Windows 11.',
      icon: <Terminal className="w-8 h-8 text-amber-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-neutral-300">
            {isId
              ? 'Kingsley dirancang sebagai lingkungan terminal bebas distraksi dan berlatensi ultra-rendah untuk pengembang perangkat lunak modern. Mengintegrasikan eksekusi native ConPTY Windows dengan pembagian pane dinamis dan pelacakan workspace.'
              : 'Kingsley is designed as a distraction-free, low-latency terminal environment for modern software engineers. It integrates native Windows pseudoterminal (ConPTY) execution with dynamic multi-pane multiplexing and live workspace tracking.'}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-white block">
                  {isId ? 'Rekayasa Presisi' : 'Precision Engineering'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {isId
                    ? 'Garis batas 1px hairline, tipografi terkalibrasi, dan antarmuka gelap kontras tinggi.'
                    : 'Hairline 1px borders, calibrated typography, and high-contrast dark surfaces.'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-white block">
                  {isId ? 'Siap Open Source' : 'Open Source Ready'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {isId
                    ? 'Arsitektur modular, bersih, dan dirancang untuk produktivitas maksimal pengembang.'
                    : 'Clean, unencumbered, and modular architecture designed for developer productivity.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'conpty',
      badge: isId ? 'SUBSISTEM UTAMA' : 'CORE SUBSYSTEM',
      badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      title: isId ? 'Windows ConPTY & Akselerasi GPU' : 'Windows ConPTY & Hardware Acceleration',
      subtitle: isId
        ? 'Integrasi langsung dengan API Windows Pseudo Console untuk eksekusi tanpa lag.'
        : 'Direct integration with the Windows Pseudo Console API for native execution.',
      icon: <Cpu className="w-8 h-8 text-blue-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-neutral-300">
            {isId
              ? 'Kingsley berkomunikasi langsung dengan subsistem pseudoterminal OS melalui node-pty. Palet warna ANSI truecolor penuh, escape sequence, dan antarmuka TUI berjalan mulus di 60 FPS.'
              : 'Kingsley communicates directly with the OS pseudoterminal subsystem via node-pty. Full ANSI truecolor palettes, escape sequences, interactive progress monitors, and full-screen TUI utilities render smoothly at 60 FPS.'}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-bold text-blue-300">PowerShell 7 &amp; Windows PowerShell</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">
                {isId ? 'SHELL UTAMA' : 'PRIMARY PROFILE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="font-bold text-yellow-300">Command Prompt (cmd.exe)</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                {isId ? 'RINGAN & CEPAT' : 'INSTANT LAUNCH'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="font-bold text-purple-300">WSL (Linux Subsystem) &amp; Git Bash</span>
              </div>
              <span className="text-[10px] text-neutral-400">POSIX &amp; UNIX</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'multiplexer',
      badge: isId ? 'MULTIPLEXER TATA LETAK' : 'LAYOUT MULTIPLEXER',
      badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      title: isId ? 'Split Pane Dinamis & Multi-Tab' : 'Dynamic Split Panes & Independent Tabs',
      subtitle: isId
        ? 'Bagi sesi terminal secara horizontal atau vertikal dengan garis pembatas yang dapat digeser.'
        : 'Divide terminal sessions horizontally or vertically with real-time draggable dividers.',
      icon: <Layers className="w-8 h-8 text-cyan-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-neutral-300">
            {isId
              ? 'Atur alur kerja koding kompleks melalui tampilan tab fleksibel dan kisi split interaktif. Setiap pane terminal memiliki proses terisolasi, riwayat buffer mandiri, dan penyesuaian ukuran otomatis.'
              : 'Structure complex workflows across tabbed views and flexible split grids. Each terminal pane maintains its own isolated process lifecycle, scrollback history, and automatic viewport dimension fitting.'}
          </p>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-cyan-400 font-bold block mb-1">Ctrl + Shift + E</span>
              <span className="text-[11px] text-neutral-400">{isId ? 'Bagi Kanan' : 'Split Right'}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-blue-400 font-bold block mb-1">Ctrl + Shift + D</span>
              <span className="text-[11px] text-neutral-400">{isId ? 'Bagi Bawah' : 'Split Down'}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-red-400 font-bold block mb-1">Ctrl + Shift + W</span>
              <span className="text-[11px] text-neutral-400">{isId ? 'Tutup Pane' : 'Close Pane'}</span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 italic">
            {isId
              ? 'Garis pembatas antar-pane dapat digeser secara halus menggunakan mouse.'
              : 'Dividers between panes can be adjusted smoothly by dragging with the mouse.'}
          </p>
        </div>
      ),
    },
    {
      id: 'themes-studio',
      badge: isId ? 'TEMA & KALIBRASI' : 'THEMING & CALIBRATION',
      badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      title: isId ? 'Katalog 20+ Tema Developer' : 'Settings Studio & 20+ Developer Themes',
      subtitle: isId
        ? 'Antarmuka konfigurasi dua kolom dengan sinkronisasi palet warna secara instan.'
        : 'Two-column configuration interface with dual-synchronized color palettes.',
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-neutral-300">
            {isId
              ? 'Tekan Ctrl + , untuk membuka Studio Pengaturan. Pilih dari 20+ tema terkalibrasi developer:'
              : 'Press Ctrl + , to open the Settings Studio. Select from 20+ developer-calibrated themes:'}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span>⚡</span>
              <span className="text-cyan-300">Kingsley Obsidian</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span>👑</span>
              <span className="font-bold text-amber-300">Golden Premium</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span>☕</span>
              <span className="text-purple-300">Catppuccin Mocha</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span>🌆</span>
              <span className="text-blue-300">Tokyo Night</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span>🧛</span>
              <span className="text-pink-300">Dracula Pro</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span>🌲</span>
              <span className="text-emerald-300">Gruvbox &amp; Nord</span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400">
            {isId
              ? 'Dual-Sync Engine: Secara bersamaan menyelaraskan bingkai jendela desktop dan palet ANSI terminal secara realtime.'
              : 'Dual-Sync Engine: Simultaneously updates both the desktop window frame and the terminal ANSI palette in real time.'}
          </p>
        </div>
      ),
    },
  ]

  const currentSlideData = slidesData[currentSlide]

  // ================= RENDER: 1. SPLASH OPENING ANIMATION =================
  if (phase === 'splash') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden"
        style={{ backgroundColor: '#070b19' }}
      >
        {/* Subtle Background Glow Matrix */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(0, 210, 211, 0.3) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 80%)',
          }}
        />

        {/* Decorative Grid Lines */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Animated Central Emblem */}
        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-1000 transform ${
            logoRevealed
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Glowing Emblem Box */}
          <div className="relative mb-6">
            <div
              className="absolute -inset-3 rounded-3xl opacity-50 blur-xl animate-pulse-subtle"
              style={{
                background:
                  'linear-gradient(135deg, #00d2d3 0%, #0284c7 50%, #f59e0b 100%)',
              }}
            />

            <div
              className="relative w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl border border-cyan-500/30 overflow-hidden"
              style={{
                backgroundColor: '#070b19',
              }}
            >
              {!imgFailed ? (
                <img
                  src={APP_LOGO_BASE64}
                  alt="Kingsley Official Icon"
                  className="w-full h-full object-cover rounded-2xl"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#070b19] to-[#0d1630] p-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono font-black text-lg mb-1 shadow-lg shadow-cyan-500/20">
                    &gt;_
                  </div>
                  <span className="text-[9px] font-bold tracking-widest text-cyan-400 uppercase font-mono">KINGSLEY</span>
                </div>
              )}
            </div>
          </div>

          {/* Typography Brand Title */}
          <div className="text-center font-mono">
            <h1 className="text-3xl font-black tracking-widest text-white mb-1.5 flex items-center justify-center gap-1">
              <span>KING</span>
              <span className="text-cyan-400">SLEY</span>
            </h1>

            <p className="text-xs font-mono tracking-wider text-neutral-400 uppercase">
              {isId ? 'Terminal Multiplexer & Workspace Developer' : 'Terminal Multiplexer & Developer Workspace'}
            </p>
          </div>

          {/* Progress / Loading line */}
          <div className="w-48 h-1 rounded-full bg-white/10 mt-8 overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: logoRevealed ? '100%' : '0%',
                background:
                  'linear-gradient(90deg, #00d2d3, #0284c7, #f59e0b)',
              }}
            />
          </div>

        </div>
      </div>
    )
  }

  // ================= RENDER: 2. RETURNING USER WELCOME BACK SCREEN =================
  if (phase === 'welcome-back') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in font-mono select-none">
        <div
          className="w-full max-w-md rounded-2xl border shadow-2xl p-8 flex flex-col items-center text-center relative overflow-hidden"
          style={{
            backgroundColor: '#0c101e',
            borderColor: theme.ui.borderActive,
            color: theme.ui.text,
          }}
        >
          {/* Ambient Radial Light */}
          <div
            className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-25 pointer-events-none"
            style={{ backgroundColor: theme.ui.accent, filter: 'blur(60px)' }}
          />

          {/* App Icon Badge with Glow */}
          <div className="relative mb-5">
            <div
              className="absolute -inset-2 rounded-3xl opacity-50 blur-lg animate-pulse-subtle"
              style={{
                background: 'linear-gradient(135deg, #00d2d3, #004d98, #a50044)',
              }}
            />
            <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden bg-[#070a16]">
              {!imgFailed ? (
                <img
                  src={APP_LOGO_BASE64}
                  alt="Kingsley Icon"
                  className="w-full h-full object-cover rounded-2xl"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#070b19] to-[#0d1630] p-2 text-center">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono font-black text-base mb-1 shadow-lg shadow-cyan-500/20">
                    &gt;_
                  </div>
                  <span className="text-[8px] font-bold tracking-widest text-cyan-400 uppercase font-mono">KINGSLEY</span>
                </div>
              )}
            </div>
          </div>

          {/* Brand & Greeting */}
          <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400 mb-1">
            KINGSLEY • DESKTOP
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            {t.welcome.welcomeBackTitle}, {displayName}!
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6 max-w-xs">
            {t.welcome.welcomeBackDesc}
          </p>

          {/* Action Buttons: Lanjut (Continue) or Skip (Lewati) */}
          <div className="flex items-center gap-3 w-full justify-center">
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-neutral-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            >
              {t.welcome.skipBtn}
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem('ferminterm_seen_onboarding', 'true')
                if (dontShowAgain) {
                  localStorage.setItem('ferminterm_skip_splash', 'true')
                }
                if (onContinue) {
                  onContinue()
                } else {
                  handleFinish()
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:via-sky-400 hover:to-blue-500 font-bold text-xs text-slate-950 shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{t.welcome.continueBtn}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-black/40 border border-white/20 text-cyan-400 focus:ring-0 cursor-pointer"
            />
            <span>Jangan tampilkan intro lagi saat startup</span>
          </label>
        </div>
      </div>
    )
  }

  // ================= RENDER: 3. NEW USER OPERATOR IDENTITY SETUP =================
  if (phase === 'register') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none">
        <div
          className="w-full max-w-md rounded-2xl border shadow-2xl p-8 flex flex-col items-center text-center relative overflow-hidden"
          style={{
            backgroundColor: '#0c101e',
            borderColor: theme.ui.borderActive,
            color: theme.ui.text,
          }}
        >
          {/* Ambient Glow Light */}
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-25 pointer-events-none"
            style={{ backgroundColor: theme.ui.accent, filter: 'blur(60px)' }}
          />

          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
            <UserCheck className="w-7 h-7" />
          </div>

          <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400 mb-1">
            {language === 'id' ? 'INISIALISASI OPERATOR' : 'OPERATOR IDENTITY'}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            {language === 'id' ? 'Buat Akun Operator' : 'Create Operator Account'}
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6 max-w-xs">
            {language === 'id'
              ? 'Selamat datang di Kingsley! Masukkan nama Anda untuk menginisialisasi kartu identitas operator dan workspace terminal.'
              : 'Welcome to Kingsley! Enter your name to initialize your operator card and terminal workspace.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (enteredName.trim()) handleFinalize(enteredName.trim())
            }}
            className="w-full space-y-4"
          >
            <div className="text-left space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-neutral-400 block tracking-wider">
                {language === 'id' ? 'Nama Anda / Panggilan' : 'Your Name / Nickname'}
              </label>
              <input
                type="text"
                autoFocus
                value={enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none transition-colors"
              />
            </div>

            <p className="text-[10px] text-neutral-500 text-left leading-relaxed">
              {language === 'id'
                ? '🔒 Nama Anda disimpan secara permanen di komputer ini dan akan tampil di kartu identitas operator sidebar.'
                : '🔒 Stored permanently on this device and displayed on your sidebar operator card.'}
            </p>

            <button
              type="submit"
              disabled={!enteredName.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:via-sky-400 hover:to-blue-500 disabled:opacity-40 font-bold text-xs text-slate-950 shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{language === 'id' ? 'Mulai Koding & Masuk Workspace' : 'Launch Workspace'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ================= RENDER: 4. INTERACTIVE SLIDE DECK WALKTHROUGH =================
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md select-none font-mono animate-fade-in"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden relative"
        style={{
          backgroundColor: theme.ui.surface,
          borderColor: theme.ui.borderActive,
          color: theme.ui.text,
        }}
      >
        {/* Top Header & Skip */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.background }}
        >
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-sm">⚡ KINGSLEY</span>
            <span className="text-neutral-500">•</span>
            <span className="text-xs text-neutral-400">
              {isId ? `Slide ${currentSlide + 1} dari ${slidesData.length}` : `Slide ${currentSlide + 1} of ${slidesData.length}`}
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span>{isId ? 'Lewati ke Terminal' : 'Skip to Terminal'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slide Content Stage */}
        <div className="p-8 flex-1 min-h-[380px] flex flex-col justify-between">
          <div className="space-y-6 animate-fade-in" key={currentSlideData.id}>
            {/* Slide Header */}
            <div className="flex items-start gap-4">
              <div
                className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 shrink-0 shadow-lg"
              >
                {currentSlideData.icon}
              </div>

              <div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border inline-block mb-1.5 ${currentSlideData.badgeColor}`}
                >
                  {currentSlideData.badge}
                </span>

                <h2 className="text-xl font-bold tracking-tight text-white">
                  {currentSlideData.title}
                </h2>

                <p className="text-xs text-neutral-400 mt-1">
                  {currentSlideData.subtitle}
                </p>
              </div>
            </div>

            {/* Slide Body Content */}
            <div className="pt-2">
              {currentSlideData.content}
            </div>
          </div>

          {/* Bottom Slide Controller & Checkbox */}
          <div className="pt-6 border-t mt-6 flex items-center justify-between" style={{ borderColor: theme.ui.border }}>
            {/* "Don't show again" Checkbox */}
            <label className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-black/40 border border-white/20 accent-amber-400 cursor-pointer"
              />
            <span className="text-[11px]">{isId ? 'Jangan tampilkan saat startup' : 'Do not show on startup'}</span>
            </label>

            {/* Navigation Dots & Buttons */}
            <div className="flex items-center gap-3">
              {/* Dots */}
              <div className="flex items-center gap-1.5 mr-2">
                {slidesData.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentSlide
                        ? 'w-6 bg-amber-400'
                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev Button */}
              {currentSlide > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-neutral-300 transition-colors"
            title={isId ? 'Slide Sebelumnya (←)' : 'Previous Slide (←)'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Next / Launch CTA Button */}
              {currentSlide < slidesData.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md text-black hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: theme.ui.accent }}
                  title="Next Slide (→)"
                >
                  <span>{isId ? 'Lanjut' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xl text-black hover:scale-[1.02] active:scale-95"
                  style={{
                    backgroundColor: theme.ui.accent,
                    boxShadow: '0 0 20px rgba(237, 187, 0, 0.4)',
                  }}
                >
                  <span>{isId ? 'Buka Workspace' : 'Launch Workspace'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
