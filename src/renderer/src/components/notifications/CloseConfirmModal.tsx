import React, { useEffect } from 'react'
import { AlertTriangle, X, Power, LogOut } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

interface CloseConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const CloseConfirmModal: React.FC<CloseConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { theme } = useTheme()
  const { language, t } = useLanguage()

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onConfirm])

  if (!isOpen) return null

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono select-none"
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl p-6 bg-[#11131e] border-red-500/30 text-white space-y-4 relative overflow-hidden"
        style={{
          boxShadow: '0 20px 50px rgba(239, 68, 68, 0.15)',
        }}
      >
        {/* Glow Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none bg-red-500/20" />

        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{t.closeModal.title}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                {t.closeModal.warning}
              </span>
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed pt-1">
              {t.closeModal.message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            {t.closeModal.cancel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.closeModal.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
