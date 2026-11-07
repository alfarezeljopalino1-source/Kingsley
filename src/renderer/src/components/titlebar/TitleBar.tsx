import React, { useEffect, useState } from 'react'
import {
  Plus,
  Settings,
  Minus,
  Square,
  Copy,
  X,
  PanelLeft,
  Search,
  GitCompare,
  Terminal,
  FileCode
} from 'lucide-react'
import { AppIconBadge, type AppIconId } from '../icons/AppIconBadge'
import { useTheme } from '../../context/ThemeContext'
import type { TabData } from '../../types/layout'
import type { WorkspaceFolder } from '../sidebar/Sidebar'

interface TitleBarProps {
  tabs: TabData[]
  activeTabId: string
  workspaces?: WorkspaceFolder[]
  activeWorkspace?: WorkspaceFolder | null
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  isGitPanelOpen?: boolean
  onToggleGitPanel?: () => void
  gitChangesCount?: number
  onOpenPalette: () => void
  onSelectTab: (tabId: string) => void
  onAddTab: () => void
  onCloseTab: (tabId: string, e: React.MouseEvent) => void
  onOpenSettings: () => void
}
export const TitleBar: React.FC<TitleBarProps> = ({
  tabs,
  activeTabId,
  workspaces,
  activeWorkspace,
  isSidebarOpen,
  onToggleSidebar,
  isGitPanelOpen,
  onToggleGitPanel,
  gitChangesCount,
  onOpenPalette,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onOpenSettings,
}) => {
  void activeWorkspace
  const { theme, themeId } = useTheme()
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeIcon, setActiveIcon] = useState<AppIconId>(() => {
    return (localStorage.getItem('ferminterm_app_icon') as AppIconId) || 'fermin-barca'
  })

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<AppIconId>
      if (custom.detail) setActiveIcon(custom.detail)
    }
    window.addEventListener('ferminterm:icon-changed', handler)
    return () => window.removeEventListener('ferminterm:icon-changed', handler)
  }, [])
  useEffect(() => {
    if (window.ferminAPI?.isWindowMaximized) {
      window.ferminAPI.isWindowMaximized().then(setIsMaximized).catch(console.error)
    }
    if (window.ferminAPI?.onWindowStateChange) {
      return window.ferminAPI.onWindowStateChange((max) => {
        setIsMaximized(max)
      })
    }
  }, [])

  const handleMinimize = () => window.ferminAPI?.windowControl('minimize')
  const handleMaximize = () => window.ferminAPI?.windowControl('maximize')
  const handleClose = () => window.ferminAPI?.windowControl('close')

  return (
    <div
      className="h-10 select-none flex items-center justify-between border-b transition-colors duration-200"
      style={{
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
        // @ts-expect-error WebkitAppRegion is electron-specific
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Left: Sidebar Toggle, Brand & Tabs */}
      <div className="flex items-center h-full overflow-hidden flex-1">
        {/* Brand Logo & Name (Corner / Pojok Paling Kiri) */}
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1 font-mono text-xs font-bold tracking-wider shrink-0 select-none cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            color: theme.ui.text,
            // @ts-expect-error WebkitAppRegion is electron-specific
            WebkitAppRegion: 'no-drag',
          }}
          title="Kingsley • Click to customize theme & app icon"
        >
          <AppIconBadge id={activeIcon} size={20} className="rounded-md" />
          <span>KING<span style={{ color: theme.ui.accent }}>SLEY</span></span>
        </div>

        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-0.5 ${
            isSidebarOpen ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
          }`}
          style={{
            // @ts-expect-error WebkitAppRegion is electron-specific
            WebkitAppRegion: 'no-drag',
          }}
          title="Toggle Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Vertical Divider */}
        <div className="h-4 w-[1px] bg-white/10 mx-1 shrink-0" />

        {/* Tab List */}
        <div
          className="flex items-center h-full overflow-x-auto no-scrollbar gap-1 px-1"
          style={{
            // @ts-expect-error WebkitAppRegion is electron-specific
            WebkitAppRegion: 'no-drag',
          }}
        >
          {tabs.map((tab, idx) => {
            const isActive = tab.id === activeTabId
            const ws = workspaces?.find((w) => w.id === tab.workspaceId)
            const wsColor = tab.workspaceColor || ws?.color || '#3b82f6'
            const wsPath = tab.workspacePath || ws?.path
            const wsName = tab.workspaceName || ws?.name

            // Detect duplicate workspace names
            const isDuplicateWsName = Boolean(
              wsName &&
                workspaces &&
                workspaces.filter((w) => w.name.toLowerCase() === wsName.toLowerCase()).length > 1
            )

            const folderBase = wsPath
              ? wsPath.replace(/\\/g, '/').split('/').filter(Boolean).pop()
              : ''

            // Clean project identifier
            const projectDisplayName =
              isDuplicateWsName && folderBase
                ? folderBase
                : wsName || folderBase || `Project ${idx + 1}`

            // Parse agent from title if present (e.g. "[OMP] ...")
            const rawTitle = typeof tab.title === 'string' ? tab.title : `Tab ${idx + 1}`
            const agentMatch = rawTitle.match(/^\[([A-Z0-9_-]+)\]\s*(.*)$/)
            const agentTag = agentMatch ? agentMatch[1] : null
            const titleWithoutAgent = agentMatch && agentMatch[2] ? agentMatch[2] : rawTitle

            // Check if title has a numbering suffix like "(2)"
            const numberMatch = titleWithoutAgent.match(/\((\d+)\)/)
            const tabNumberSuffix = numberMatch ? ` (${numberMatch[1]})` : ''

            // Format label: if editor show file, if terminal show projectDisplayName + tab number
            const displayTitle =
              tab.type === 'editor'
                ? titleWithoutAgent
                : `${projectDisplayName}${tabNumberSuffix}`

            const tooltipText = [
              projectDisplayName ? `Project: ${projectDisplayName}` : null,
              wsPath ? `Folder: ${wsPath}` : null,
              agentTag ? `AI Agent: ${agentTag}` : null,
              tab.type === 'editor' ? `File: ${rawTitle}` : `Terminal Tab`,
            ]
              .filter(Boolean)
              .join('\n')

            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                title={tooltipText}
                className={`group flex items-center gap-1.5 h-7 px-2.5 text-xs font-mono rounded-t transition-all duration-150 cursor-pointer border-t-2 relative ${
                  isActive
                    ? 'font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03] border-transparent'
                }`}
                style={{
                  backgroundColor: isActive ? theme.ui.background : 'transparent',
                  borderColor: isActive ? wsColor || theme.ui.borderActive : 'transparent',
                  color: isActive ? theme.ui.text : theme.ui.textMuted,
                }}
              >
                {/* Workspace Color Dot */}
                {wsColor && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: wsColor }}
                    title={projectDisplayName ? `Project: ${projectDisplayName}` : undefined}
                  />
                )}

                {/* Tab Icon: Terminal or File Code */}
                {tab.type === 'editor' ? (
                  <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}

                {/* Agent Tag Badge if active */}
                {agentTag && (
                  <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase shrink-0">
                    {agentTag}
                  </span>
                )}

                {/* Display Title */}
                <span className="truncate max-w-[150px]">
                  {displayTitle}
                </span>

                {/* Delete / Close Tab Button 'X' */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCloseTab(tab.id, e)
                  }}
                  className="p-1 rounded-md hover:bg-red-500/20 text-neutral-400 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-all ml-0.5 cursor-pointer flex items-center justify-center shrink-0"
                  title="Tutup & Hapus Terminal (Ctrl+W)"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            )
          })}

          {/* Add Tab Button '+' */}
          <button
            type="button"
            onClick={onAddTab}
            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-cyan-400 transition-colors cursor-pointer flex items-center justify-center shrink-0 ml-0.5"
            title={activeWorkspace ? `Tambah Terminal Baru di ${activeWorkspace.name} (Ctrl+T)` : 'Tambah Terminal Baru (Ctrl+T)'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Quick Command Search, Settings & Window Controls */}
      <div
        className="flex items-center h-full shrink-0"
        style={{
          // @ts-expect-error WebkitAppRegion is electron-specific
          WebkitAppRegion: 'no-drag',
        }}
      >
        {/* Command Search Pill (Orca / Alethe style) */}
        <button
          onClick={onOpenPalette}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 mr-2 text-xs font-mono rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-neutral-400 hover:text-white"
          title="Command Palette (Ctrl+K)"
        >
          <Search className="w-3 h-3 text-amber-400" />
          <span className="text-[11px]">Command</span>
          <kbd className="text-[10px] px-1 py-0.2 rounded bg-white/10 font-bold">
            Ctrl+K
          </kbd>
        </button>

        {/* Git Changes Right Panel Toggle */}
        {onToggleGitPanel && (
          <button
            onClick={onToggleGitPanel}
            className={`p-2 transition-colors flex items-center gap-1.5 rounded hover:bg-white/10 ${
              isGitPanelOpen ? 'text-cyan-400' : 'text-neutral-400 hover:text-white'
            }`}
            title="Toggle Git Changes Panel (Ctrl+Shift+G)"
          >
            <GitCompare className="w-3.5 h-3.5" />
            {typeof gitChangesCount === 'number' && gitChangesCount > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 font-mono">
                {gitChangesCount}
              </span>
            )}
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Settings (Ctrl+,)"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        {/* Window Action Controls */}
        <button
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-red-600 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
