import React, { useState, useEffect } from 'react'
import {
  Rocket,
  RefreshCw,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HardDrive
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'


function playUpdateChime() {
  try {
    const AudioContextClass = typeof window !== 'undefined' ? window.AudioContext : undefined
    if (!AudioContextClass) return
    const audioCtx = new AudioContextClass()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.type = 'sine'
    const now = audioCtx.currentTime
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.15) // A5

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc.start(now)
    osc.stop(now + 0.45)
  } catch {}
}
interface UpdateToastProps {
  forceOpen?: boolean
  onClose?: () => void
}

export const UpdateToast: React.FC<UpdateToastProps> = ({ forceOpen, onClose }) => {
  const { theme } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [hasUpdatedRecently, setHasUpdatedRecently] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{ newVersion?: string; currentVersion?: string }>({})

  useEffect(() => {
    // Check if app was recently updated
    const lastBuild = localStorage.getItem('ferminterm_active_build_time')
    const currentBuild = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 'dev'

    if (lastBuild && lastBuild !== currentBuild) {
      // Just restarted into new version!
      setHasUpdatedRecently(true)
      setIsVisible(true)
      localStorage.setItem('ferminterm_active_build_time', currentBuild)
      const timer = setTimeout(() => setIsVisible(false), 8000)
      return () => clearTimeout(timer)
    } else if (!lastBuild) {
      localStorage.setItem('ferminterm_active_build_time', currentBuild)
    }
  }, [])

  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true)
    }
  }, [forceOpen])

  // Listen to manual or system-triggered update events
  useEffect(() => {
    const handleTrigger = () => setIsVisible(true)
    window.addEventListener('ferminterm:show-update-toast', handleTrigger)
    return () => window.removeEventListener('ferminterm:show-update-toast', handleTrigger)
  }, [])

  // Listen to main process background update-ready detection
  useEffect(() => {
    if (window.ferminAPI?.onUpdateReady) {
      const unsubscribe = window.ferminAPI.onUpdateReady((info?: unknown) => {
        setHasUpdatedRecently(false)
        if (info && typeof info === 'object') {
          setUpdateInfo(info as { newVersion?: string; currentVersion?: string })
        }
        setIsVisible(true)
        playUpdateChime()
      })
      return unsubscribe
    }
    return undefined
  }, [])

  const handleRestart = async () => {
    setIsRestarting(true)
    try {
      if (window.ferminAPI?.relaunchApp) {
        await window.ferminAPI.relaunchApp()
      } else {
        // Fallback for dev server
        window.location.reload()
      }
    } catch {
      window.location.reload()
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    if (onClose) onClose()
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-10 right-6 z-50 max-w-sm w-full animate-fade-in font-mono select-none">
      <div
        className="p-4 rounded-2xl border shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: '#0d111dF2',
          borderColor: hasUpdatedRecently ? 'rgba(16, 185, 129, 0.4)' : 'rgba(6, 182, 212, 0.4)',
          boxShadow: hasUpdatedRecently
            ? '0 12px 36px -8px rgba(16, 185, 129, 0.3)'
            : '0 12px 36px -8px rgba(6, 182, 212, 0.3)',
        }}
      >
        {/* Glow accent */}
        <div
          className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-30"
          style={{
            backgroundColor: hasUpdatedRecently ? '#10b981' : '#06b6d4',
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                hasUpdatedRecently
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              }`}
            >
              {hasUpdatedRecently ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Rocket className="w-4 h-4 animate-bounce" />
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                {hasUpdatedRecently ? 'Update Berhasil' : 'Update Versi Baru Tersedia!'}
              </span>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Kingsley Desktop</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {hasUpdatedRecently
                    ? `v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}`
                    : `v${updateInfo.newVersion || (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0')}`}
                </span>
              </h4>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Message */}
        <p className="text-[11px] text-neutral-300 leading-relaxed mb-3.5 pl-1">
          {hasUpdatedRecently
            ? 'Aplikasi Kingsley sudah berhasil diperbarui ke build terbaru dan siap digunakan.'
            : 'Update versi baru siap diterapkan! Cukup klik "Update & Mulai Ulang" di bawah, aplikasi otomatis berganti ke versi terbaru tanpa perlu instal ulang.'}
        </p>

        {/* Action Button */}
        {!hasUpdatedRecently ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              disabled={isRestarting}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
              <span>{isRestarting ? 'Memperbarui & Restart...' : 'Update & Mulai Ulang'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs transition-colors cursor-pointer"
            >
              Nanti
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-white/5">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Sparkles className="w-3 h-3" />
              Build Aktif Terbaru
            </span>
            <button
              onClick={handleDismiss}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
