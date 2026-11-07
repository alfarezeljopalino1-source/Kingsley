import React from 'react'
import {
  Columns,
  Rows,
  X,
  Terminal as TerminalIcon,
  Circle,
  Camera,
  Loader2
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import type { ShellType } from '@shared/types'

interface PaneHeaderProps {
  paneId: string
  title: string
  shell: ShellType
  isFocused: boolean
  canClose: boolean
  onSplit: (direction: 'horizontal' | 'vertical') => void
  onClose: () => void
  onChangeShell: (shell: ShellType) => void
  onCaptureScreenshot?: () => void
  isCapturing?: boolean
}

export const PaneHeader: React.FC<PaneHeaderProps> = ({
  title,
  shell,
  isFocused,
  canClose,
  onSplit,
  onClose,
  onChangeShell,
  onCaptureScreenshot,
  isCapturing,
}) => {
  const { theme, themeId } = useTheme()

  const getShellBadgeColor = (s: ShellType) => {
    switch (s) {
      case 'powershell':
        return '#00a8ff'
      case 'cmd':
        return '#fbc531'
      case 'bash':
        return '#4cd137'
      case 'wsl':
        return '#9c88ff'
    }
  }

  return (
    <div
      className="h-7 px-2.5 flex items-center justify-between text-xs select-none border-b transition-colors duration-150 font-mono"
      style={{
        backgroundColor: isFocused ? theme.ui.surfaceHover : theme.ui.surface,
        borderColor: theme.ui.border,
        color: isFocused ? theme.ui.text : theme.ui.textMuted,
      }}
    >
      {/* Left: Status Dot, Shell Badge & Directory */}
      <div className="flex items-center gap-2 overflow-hidden">
        {/* Active Pulse Dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isFocused ? 'bg-emerald-400 animate-pulse-subtle' : 'bg-neutral-500'
          }`}
          title={isFocused ? 'Active Focused Session' : 'Background Session'}
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <TerminalIcon
            className="w-3.5 h-3.5"
            style={{ color: getShellBadgeColor(shell) }}
          />

          <select
            value={shell}
            onChange={(e) => onChangeShell(e.target.value as ShellType)}
            className="bg-transparent text-[11px] font-mono font-medium focus:outline-none cursor-pointer py-0.5 rounded hover:bg-white/5"
            style={{ color: isFocused ? theme.ui.text : theme.ui.textMuted }}
          >
            <option value="powershell" className="bg-[#0b1226] text-white">PowerShell</option>
            <option value="cmd" className="bg-[#0b1226] text-white">CMD</option>
            <option value="bash" className="bg-[#0b1226] text-white">Git Bash</option>
            <option value="wsl" className="bg-[#0b1226] text-white">WSL</option>
          </select>
        </div>

        {/* Path / Workspace Pill */}
        <span
          className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/5 opacity-70 truncate hidden sm:inline-block max-w-[160px]"
          title={title || 'Terminal'}
        >
          {title ? (title.startsWith('~') ? title : `~/${title}`) : '~/terminal'}
        </span>
      </div>

      {/* Right: Split & Close Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {onCaptureScreenshot && (
          <button
            onClick={onCaptureScreenshot}
            disabled={isCapturing}
            className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-40"
            title="Kirim Screenshot ke Terminal (Ctrl+Shift+S)"
          >
            {isCapturing ? (
              <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
            ) : (
              <Camera className="w-3 h-3 text-emerald-400" />
            )}
          </button>
        )}

        <button
          onClick={() => onSplit('vertical')}
          className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          title="Split Right / Vertically (Ctrl+Shift+E)"
        >
          <Columns className="w-3 h-3 text-cyan-400" />
        </button>

        <button
          onClick={() => onSplit('horizontal')}
          className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          title="Split Down / Horizontally (Ctrl+Shift+D)"
        >
          <Rows className="w-3 h-3 text-blue-400" />
        </button>

        {canClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-500/20 hover:text-red-400 opacity-70 hover:opacity-100 transition-colors ml-1"
            title="Close Pane (Ctrl+Shift+W)"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
