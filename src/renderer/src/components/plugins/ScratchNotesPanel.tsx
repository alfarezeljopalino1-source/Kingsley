import React, { useState, useEffect } from 'react'
import {
  FileText,
  Copy,
  Check,
  Trash2,
  X,
  Sparkles,
  Code,
  Download
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

const SCRATCH_STORAGE_KEY = 'ferminterm_scratch_notes'

const DEFAULT_NOTE = `# Kingsley Scratch Notes ⚡
// Catatan koding kilat, snippet curl, query SQL, atau draft perintah terminal:

curl -X GET "https://api.github.com/repos" \\
  -H "Accept: application/vnd.github.v3+json"

// Status: Siap eksekusi
`

interface ScratchNotesPanelProps {
  onClose: () => void
  width?: number
  isResizing?: boolean
}

export const ScratchNotesPanel: React.FC<ScratchNotesPanelProps> = ({ onClose, width, isResizing = false }) => {
  const { theme } = useTheme()
  const { language } = useLanguage()
  const [noteContent, setNoteContent] = useState<string>(() => {
    return localStorage.getItem(SCRATCH_STORAGE_KEY) || DEFAULT_NOTE
  })
  const [copied, setCopied] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>('Tersimpan di disk')

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(SCRATCH_STORAGE_KEY, noteContent)
      } catch {}
      const t = new Date().toLocaleTimeString()
      setLastSaved(language === 'id' ? `Tersimpan ${t}` : `Saved at ${t}`)
    }, 400)
    return () => clearTimeout(timer)
  }, [noteContent, language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(noteContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleClear = () => {
    if (window.confirm(language === 'id' ? 'Kosongkan lembar catatan scratchpad ini?' : 'Clear all scratchpad notes?')) {
      setNoteContent('')
    }
  }

  const linesCount = noteContent.split('\n').length
  const charsCount = noteContent.length

  return (
    <div
      className="h-full flex flex-col font-mono text-xs border-l z-20 shrink-0 select-none"
      style={{
        width: width ? `${width}px` : '380px',
        transition: isResizing ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
      }}
    >
      {/* Header */}
      <div className="p-3.5 border-b flex items-center justify-between" style={{ borderColor: theme.ui.border }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <span>{language === 'id' ? 'Scratch Notes & Pad' : 'Scratch Notes'}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v1.0.0
              </span>
            </h3>
            <span className="text-[10px] text-neutral-400">
              {language === 'id' ? 'Lembar Cakar Kode Kilat' : 'Sidebar Code & Note Scratchpad'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Tutup Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Toolbar */}
      <div
        className="px-3 py-2 border-b flex items-center justify-between text-[11px] bg-black/20"
        style={{ borderColor: theme.ui.border }}
      >
        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {lastSaved}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer text-[10px]"
            title="Salin semua isi catatan ke clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
            <span>{copied ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin' : 'Copy')}</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 border border-white/10 transition-colors cursor-pointer text-[10px]"
            title="Kosongkan catatan"
          >
            <Trash2 className="w-3 h-3" />
            <span>{language === 'id' ? 'Hapus' : 'Clear'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-3 overflow-hidden flex flex-col">
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder={language === 'id' ? 'Ketik catatan cepat atau tempelkan snippet kode di sini...' : 'Type quick notes or paste code snippets here...'}
          className="flex-1 w-full h-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-400 resize-none leading-relaxed selection:bg-purple-500/30"
          spellCheck={false}
        />
      </div>

      {/* Footer Metrics */}
      <div className="px-3 py-2 border-t flex items-center justify-between text-[10px] text-neutral-500" style={{ borderColor: theme.ui.border }}>
        <span>{linesCount} {linesCount === 1 ? 'baris' : 'baris'} • {charsCount} karakter</span>
        <span className="text-purple-400 font-semibold">Auto-Persistent Disk</span>
      </div>
    </div>
  )
}
