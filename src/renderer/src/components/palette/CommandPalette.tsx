import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Terminal,
  Columns,
  Rows,
  Palette,
  Plus,
  Trash2,
  Sparkles,
  Maximize2,
  GitCompare,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { THEMES, type ThemeId } from '../../types/theme'
import type { ShellType } from '@shared/types'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: 'Terminal' | 'Layout' | 'Theme' | 'Action'
  icon: React.ReactNode
  action: () => void
  shortcut?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNewTab: () => void
  onSplit: (direction: 'horizontal' | 'vertical') => void
  onClosePane: () => void
  onLaunchShell: (shell: ShellType) => void
  onToggleSidebar: () => void
  onToggleGitPanel?: () => void
  onOpenSettings: () => void
  onReplayIntro?: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewTab,
  onSplit,
  onClosePane,
  onLaunchShell,
  onToggleSidebar,
  onToggleGitPanel,
  onOpenSettings,
  onReplayIntro,
}) => {
  const { theme, setThemeId } = useTheme()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Build command list
  const commands: CommandItem[] = [
    {
      id: 'new-tab',
      title: 'New Tab',
      subtitle: 'Create a new independent workspace tab',
      category: 'Action',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      action: onNewTab,
      shortcut: 'Ctrl+T',
    },
    {
      id: 'split-right',
      title: 'Split Pane Right (Vertical)',
      subtitle: 'Divide active pane into two columns',
      category: 'Layout',
      icon: <Columns className="w-4 h-4 text-cyan-400" />,
      action: () => onSplit('vertical'),
      shortcut: 'Ctrl+Shift+E',
    },
    {
      id: 'split-down',
      title: 'Split Pane Down (Horizontal)',
      subtitle: 'Divide active pane into top and bottom rows',
      category: 'Layout',
      icon: <Rows className="w-4 h-4 text-blue-400" />,
      action: () => onSplit('horizontal'),
      shortcut: 'Ctrl+Shift+D',
    },
    {
      id: 'close-pane',
      title: 'Close Active Pane',
      subtitle: 'Terminate and close current terminal pane',
      category: 'Layout',
      icon: <Trash2 className="w-4 h-4 text-red-400" />,
      action: onClosePane,
      shortcut: 'Ctrl+Shift+W',
    },
    {
      id: 'toggle-sidebar',
      title: 'Toggle Agent Sidebar',
      subtitle: 'Show or hide workspace and preset agent drawer',
      category: 'Action',
      icon: <Maximize2 className="w-4 h-4 text-amber-400" />,
      action: onToggleSidebar,
      shortcut: 'Ctrl+B',
    },
    ...(onToggleGitPanel
      ? [
          {
            id: 'toggle-git-panel',
            title: 'Toggle Git Changes Panel',
            subtitle: 'Show or hide Git changes right panel',
            category: 'Action' as const,
            icon: <GitCompare className="w-4 h-4 text-cyan-400" />,
            action: onToggleGitPanel,
            shortcut: 'Ctrl+Shift+G',
          },
        ]
      : []),
    {
      id: 'spawn-pwsh',
      title: 'Launch PowerShell Session',
      subtitle: 'Windows ConPTY PowerShell 7 session',
      category: 'Terminal',
      icon: <Terminal className="w-4 h-4 text-blue-400" />,
      action: () => onLaunchShell('powershell'),
    },
    {
      id: 'spawn-cmd',
      title: 'Launch Command Prompt',
      subtitle: 'Windows cmd.exe session',
      category: 'Terminal',
      icon: <Terminal className="w-4 h-4 text-yellow-400" />,
      action: () => onLaunchShell('cmd'),
    },
    {
      id: 'spawn-bash',
      title: 'Launch Git Bash',
      subtitle: 'Git Bash Unix environment',
      category: 'Terminal',
      icon: <Terminal className="w-4 h-4 text-green-400" />,
      action: () => onLaunchShell('bash'),
    },
    {
      id: 'spawn-wsl',
      title: 'Launch WSL (Linux)',
      subtitle: 'Windows Subsystem for Linux session',
      category: 'Terminal',
      icon: <Terminal className="w-4 h-4 text-purple-400" />,
      action: () => onLaunchShell('wsl'),
    },
    ...Object.values(THEMES).map((t) => ({
      id: `theme-${t.id}`,
      title: `Theme: ${t.name}`,
      subtitle: `${t.subtitle} (${t.category})`,
      category: 'Theme' as const,
      icon: <Palette className="w-4 h-4 text-amber-400" />,
      action: () => setThemeId(t.id),
    })),
    {
      id: 'open-settings',
      title: 'Open Settings & Preferences',
      subtitle: 'Configure themes and shortcuts',
      category: 'Action',
      icon: <Palette className="w-4 h-4 text-neutral-400" />,
      action: onOpenSettings,
      shortcut: 'Ctrl+,',
    },
    {
      id: 'replay-intro',
      title: 'Replay Intro Animation & Product Tour',
      subtitle: 'Display opening sequence and walkthrough slides',
      category: 'Action',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => onReplayIntro?.(),
    },
  ]

  // Filter commands by search query
  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
    )
  })

  // Keyboard navigation within palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
        onClose()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
        style={{
          backgroundColor: theme.ui.surface,
          borderColor: theme.ui.borderActive,
          color: theme.ui.text,
        }}
      >
        {/* Search Input Box */}
        <div
          className="p-3.5 border-b flex items-center gap-3"
          style={{ borderColor: theme.ui.border }}
        >
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search actions... (Esc to close)"
            className="w-full bg-transparent text-sm font-mono focus:outline-none placeholder:text-neutral-500"
            style={{ color: theme.ui.text }}
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 text-neutral-400 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-neutral-500">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors duration-100 font-mono text-xs ${
                    isSelected
                      ? 'bg-white/10 shadow-sm'
                      : 'hover:bg-white/[0.04] opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? theme.ui.surfaceHover : 'transparent',
                    borderLeft: isSelected ? `3px solid ${theme.ui.accent}` : '3px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">{cmd.icon}</div>
                    <div className="flex flex-col">
                      <span className="font-medium" style={{ color: theme.ui.text }}>
                        {cmd.title}
                      </span>
                      {cmd.subtitle && (
                        <span className="text-[11px] opacity-60">
                          {cmd.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="px-2 py-0.5 rounded text-[10px] bg-white/10 font-bold shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div
          className="px-4 py-2 border-t text-[11px] font-mono flex items-center justify-between text-neutral-500"
          style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.background }}
        >
          <span>Navigate: ↑ ↓ • Select: Enter</span>
          <span>Kingsley Command Palette</span>
        </div>
      </div>
    </div>
  )
}
