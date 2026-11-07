import React, { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Copy, ArrowRightLeft, Clipboard, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export interface FileToastData {
  id?: string
  type: 'success' | 'error' | 'info' | 'copy' | 'move'
  title: string
  message?: string
  duration?: number
}

export function showFileToast(
  title: string,
  message?: string,
  type: 'success' | 'error' | 'info' | 'copy' | 'move' = 'success',
  duration = 3500
): void {
  const detail: FileToastData = {
    id: String(Date.now() + Math.random()),
    title,
    message,
    type,
    duration,
  }
  window.dispatchEvent(new CustomEvent('ferminterm:file-toast', { detail }))
}

export const FileTransferToast: React.FC = () => {
  const { theme } = useTheme()
  const [toasts, setToasts] = useState<FileToastData[]>([])

  useEffect(() => {
    const handleToast = (e: Event) => {
      const custom = e as CustomEvent<FileToastData>
      if (!custom.detail) return
      const toast = custom.detail

      setToasts((prev) => [...prev.slice(-3), toast])

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, toast.duration || 3500)

      return () => clearTimeout(timer)
    }

    window.addEventListener('ferminterm:file-toast', handleToast)
    return () => window.removeEventListener('ferminterm:file-toast', handleToast)
  }, [])

  if (toasts.length === 0) return null

  const getIcon = (type: FileToastData['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
      case 'copy':
        return <Copy className="w-4 h-4 text-cyan-400 shrink-0" />
      case 'move':
        return <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
      case 'info':
      default:
        return <Clipboard className="w-4 h-4 text-cyan-400 shrink-0" />
    }
  }

  return (
    <div className="fixed bottom-12 right-6 z-50 flex flex-col gap-2 pointer-events-none select-none max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-bottom-2 fade-in duration-200"
          style={{
            backgroundColor: `${theme.ui.surface}f0`,
            borderColor: theme.ui.borderActive,
            color: theme.ui.text,
            boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), ${theme.ui.activePaneGlow}`,
          }}
        >
          <div className="mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="text-xs font-semibold tracking-wide truncate font-mono text-neutral-100">
              {toast.title}
            </div>
            {toast.message && (
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5 line-clamp-2 leading-relaxed break-all">
                {toast.message}
              </div>
            )}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-neutral-400 hover:text-white transition-colors p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
