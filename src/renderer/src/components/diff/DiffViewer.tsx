import React, { useEffect, useState } from 'react'
import { GitCompare, X, RotateCw, FileCode, Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface DiffViewerProps {
  isOpen: boolean
  onClose: () => void
  workspacePath?: string
  selectedFile?: string
  width?: number
  isResizing?: boolean
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  isOpen,
  onClose,
  workspacePath,
  selectedFile,
  width,
  isResizing = false,
}) => {
  const { theme } = useTheme()
  const [diffText, setDiffText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchDiff = async () => {
    if (!window.ferminAPI?.getGitDiff) return
    setIsLoading(true)
    try {
      const res = await window.ferminAPI.getGitDiff(workspacePath || '.', selectedFile)
      setDiffText(res.diff || '')
    } catch {
      setDiffText('')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchDiff()
    }
  }, [isOpen, selectedFile, workspacePath])

  if (!isOpen) return null

  // Parse lines for stats and visual styling
  const lines = diffText.split('\n')
  const additions = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length
  const deletions = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length

  return (
    <div
      className="h-full flex flex-col border-l select-none shrink-0 z-20 font-mono text-xs overflow-hidden"
      style={{
        width: width ? `${width}px` : '384px',
        transition: isResizing ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
        color: theme.ui.text,
      }}
    >
      {/* Header */}
      <div
        className="p-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: theme.ui.border }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <GitCompare className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex flex-col truncate">
            <span className="font-bold text-xs truncate" style={{ color: theme.ui.text }}>
              {selectedFile || 'Git Diff Inspector'}
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-emerald-400 font-bold">+{additions}</span>
              <span className="text-red-400 font-bold">-{deletions}</span>
              <span className="text-neutral-500">changes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={fetchDiff}
            className={`p-1.5 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-all ${
              isLoading ? 'animate-spin' : ''
            }`}
            title="Refresh Diff"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
            title="Close Diff Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diff Content Body */}
      <div className="flex-1 overflow-auto p-2 bg-[#050811] select-text">
        {lines.length === 0 || !diffText.trim() ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
            <FileCode className="w-8 h-8 opacity-40" />
            <span className="text-xs">No uncommitted changes detected.</span>
            <span className="text-[10px] opacity-60">Working directory clean</span>
          </div>
        ) : (
          <div className="space-y-[1px] font-mono text-[11px] leading-tight">
            {lines.map((line, idx) => {
              if (line.startsWith('+++') || line.startsWith('---')) {
                return (
                  <div key={idx} className="text-neutral-500 py-0.5 px-2">
                    {line}
                  </div>
                )
              }
              if (line.startsWith('@@')) {
                return (
                  <div
                    key={idx}
                    className="text-amber-400/90 bg-amber-500/10 py-1 px-2 my-1 rounded text-[10px] font-bold"
                  >
                    {line}
                  </div>
                )
              }
              if (line.startsWith('+')) {
                return (
                  <div
                    key={idx}
                    className="bg-emerald-500/15 text-emerald-300 py-0.5 px-2 border-l-2 border-emerald-500"
                  >
                    {line}
                  </div>
                )
              }
              if (line.startsWith('-')) {
                return (
                  <div
                    key={idx}
                    className="bg-red-500/15 text-red-300 py-0.5 px-2 border-l-2 border-red-500"
                  >
                    {line}
                  </div>
                )
              }
              return (
                <div key={idx} className="text-neutral-400 py-0.5 px-2 opacity-80">
                  {line}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-2 border-t text-[10px] flex items-center justify-between text-neutral-500 shrink-0"
        style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.surface }}
      >
        <span>Orca Live Diff Inspector</span>
        <button
          onClick={onClose}
          className="hover:text-white transition-colors"
        >
          Close [Esc]
        </button>
      </div>
    </div>
  )
}
