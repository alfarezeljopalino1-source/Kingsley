import React from 'react'
import { GitBranch, Command, Terminal, Sparkles, Layout, Globe, Rocket, ListTodo, FileText, Share2, Server } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useFeatures } from '../../context/FeaturesContext'
import type { ShellType } from '@shared/types'

interface StatusBarProps {
  totalPanes: number
  activeShell: ShellType
  isBrowserOpen?: boolean
  isGitPanelOpen?: boolean
  onToggleGitPanel?: () => void
  gitChangesCount?: number
  branch?: string
  onOpenPalette: () => void
  onToggleSidebar: () => void
  onToggleBrowser?: () => void
  onTriggerUpdate?: () => void
  isUpdateAvailable?: boolean
  isTodoOpen?: boolean
  onToggleTodo?: () => void
  isTodoEnabled?: boolean
  isScratchNotesOpen?: boolean
  onToggleScratchNotes?: () => void
  isScratchNotesEnabled?: boolean
  isGraphifyOpen?: boolean
  onToggleGraphify?: () => void
  onOpenMcpSkills?: () => void
}

export const StatusBar: React.FC<StatusBarProps> = ({
  totalPanes,
  activeShell,
  isBrowserOpen,
  isGitPanelOpen,
  onToggleGitPanel,
  gitChangesCount,
  branch = 'main',
  onOpenPalette,
  onToggleSidebar,
  onToggleBrowser,
  onTriggerUpdate,
  isUpdateAvailable,
  isTodoOpen,
  onToggleTodo,
  isTodoEnabled,
  isScratchNotesOpen,
  onToggleScratchNotes,
  isScratchNotesEnabled,
  isGraphifyOpen,
  onToggleGraphify,
  onOpenMcpSkills,
}) => {
  const { theme } = useTheme()
  const { features } = useFeatures()
  return (
    <div
      className="h-6 px-3 border-t select-none flex items-center justify-between text-[11px] font-mono shrink-0 transition-colors z-20"
      style={{
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
        color: theme.ui.textMuted,
      }}
    >
      {/* Left: Git Branch & Workspace */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
          title="Toggle Sidebar (Ctrl+B)"
        >
          <Layout className="w-3 h-3 text-amber-400" />
          <span className="font-medium">Sidebar</span>
        </button>

        <div className="h-3 w-[1px] bg-white/10" />

        <button
          onClick={onToggleGitPanel}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            isGitPanelOpen ? 'text-emerald-300 font-bold' : 'hover:text-white'
          }`}
          title="Toggle Git Changes Panel (Ctrl+Shift+G)"
        >
          <GitBranch className="w-3 h-3 text-emerald-400" />
          <span>{branch}</span>
          {typeof gitChangesCount === 'number' && gitChangesCount > 0 && (
            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 font-mono">
              {gitChangesCount}
            </span>
          )}
        </button>
        <div className="h-3 w-[1px] bg-white/10" />

        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${features.statusPulse ? 'animate-pulse-subtle' : ''}`} />
          <span>{totalPanes} {totalPanes > 1 ? 'Panes' : 'Pane'}</span>
        </div>

        {(features.browser || features.browserPreview) && onToggleBrowser && (
          <>
            <div className="h-3 w-[1px] bg-white/10" />
            <button
              onClick={onToggleBrowser}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                isBrowserOpen ? 'text-cyan-400 font-bold' : 'hover:text-white text-neutral-400'
              }`}
              title="Toggle Web Browser Preview"
            >
              <Globe className="w-3 h-3 text-purple-400" />
              <span>Browser</span>
            </button>
          </>
        )}

        {features.graphify && onToggleGraphify && (
          <>
            <div className="h-3 w-[1px] bg-white/10" />
            <button
              onClick={onToggleGraphify}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                isGraphifyOpen ? 'text-cyan-400 font-bold' : 'hover:text-white text-neutral-400'
              }`}
              title="Visualisasikan diagram ketergantungan kode (Graphify)"
            >
              <Share2 className="w-3 h-3 text-cyan-400" />
              <span>Graphify</span>
            </button>
          </>
        )}

        {features.mcpSkills && onOpenMcpSkills && (
          <>
            <div className="h-3 w-[1px] bg-white/10" />
            <button
              onClick={onOpenMcpSkills}
              className="flex items-center gap-1.5 hover:text-white text-neutral-400 transition-colors cursor-pointer"
              title="Kelola Server MCP & Agent Tools"
            >
              <Server className="w-3 h-3 text-purple-400" />
              <span>MCP</span>
            </button>
          </>
        )}

        {isTodoEnabled && onToggleTodo && (
          <>
            <div className="h-3 w-[1px] bg-white/10" />
            <button
              onClick={onToggleTodo}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                isTodoOpen ? 'text-amber-400 font-bold' : 'hover:text-white text-neutral-400'
              }`}
              title="Buka Checklist Todo List (Plugin)"
            >
              <ListTodo className="w-3 h-3 text-amber-400" />
              <span>Todo</span>
            </button>
          </>
        )}

        {isScratchNotesEnabled && onToggleScratchNotes && (
          <>
            <div className="h-3 w-[1px] bg-white/10" />
            <button
              onClick={onToggleScratchNotes}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                isScratchNotesOpen ? 'text-purple-400 font-bold' : 'hover:text-white text-neutral-400'
              }`}
              title="Buka Lembar Cakar Scratch Notes (Plugin)"
            >
              <FileText className="w-3 h-3 text-purple-400" />
              <span>Notes</span>
            </button>
          </>
        )}
      </div>

      {/* Center: Command Palette Hint */}
      <div
        onClick={onOpenPalette}
        className="hidden md:flex items-center gap-2 hover:text-white cursor-pointer px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
        title="Open Command Palette (Ctrl+K)"
      >
        <Command className="w-3 h-3" />
        <span>Command Palette (Ctrl + K)</span>
      </div>

      {/* Right: Shell, ConPTY, Theme */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-blue-400" />
          <span className="uppercase font-semibold" style={{ color: theme.ui.text }}>
            {activeShell}
          </span>
        </div>

        <div className="h-3 w-[1px] bg-white/10" />

        <div className="flex items-center gap-1">
          <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ConPTY
          </span>
        </div>

        <div className="h-3 w-[1px] bg-white/10" />

        <div className="flex items-center gap-1.5" style={{ color: theme.ui.accent }}>
          <Sparkles className="w-3 h-3" />
          <span className="capitalize">{theme.name}</span>
        </div>


        <div className="h-3 w-[1px] bg-white/10" />


        <button
          onClick={
            onTriggerUpdate ||
            (() => window.dispatchEvent(new CustomEvent('ferminterm:show-update-toast')))
          }
          className={`flex items-center gap-1.5 transition-all cursor-pointer group px-2 py-0.5 rounded-lg ${
            isUpdateAvailable
              ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold shadow-lg shadow-cyan-500/20'
              : 'hover:text-cyan-300 text-cyan-400'
          }`}
          title={
            isUpdateAvailable
              ? 'Pembaruan Tersedia! Klik untuk Restart & Terapkan Sekarang'
              : 'Notifikasi Update & 1-Klik Restart Desktop App'
          }
        >
          {isUpdateAvailable && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          )}
          <Rocket className="w-3 h-3 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
          <span>{isUpdateAvailable ? 'Update Ready' : 'Update'}</span>
        </button>
      </div>
    </div>
  )
}
