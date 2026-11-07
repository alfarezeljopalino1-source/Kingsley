import React, { useState, useEffect, useCallback } from 'react'
import {
  FolderGit2,
  Folder,
  FolderPlus,
  GitCompare,
  Columns,
  Rows,
  ChevronLeft,
  Plus,
  Settings,
  X,
  Trash2,
  Sparkles,
  Bot,
  Pencil,
  Check,
  Terminal
} from 'lucide-react'
import { NewProjectModal } from '../workspace/NewProjectModal'
import { getStoredProfile } from '../profile/ProfileSettings'
import { PRESET_AVATARS, type OperatorProfile } from '../profile/OperatorCard'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { useFeatures } from '../../context/FeaturesContext'
import type { PaneData, TabData } from '../../types/layout'

export interface WorkspaceFolder {
  id: string
  name: string
  path: string
  branch?: string | null
  isGit: boolean
  color?: string
  icon?: string
  agent?:
    | 'opencode'
    | 'claude'
    | 'aider'
    | 'codex'
    | 'cursor'
    | 'windsurf'
    | 'omp'
    | 'gemini'
    | 'alethe'
    | 'none'
  repoUrl?: string
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  panes: Map<string, PaneData>
  workspaces: WorkspaceFolder[]
  tabs?: TabData[]
  activeTab?: TabData
  activePaneId?: string
  activeWorkspace: WorkspaceFolder | null
  onCreateWorkspace: (ws: WorkspaceFolder) => void
  onRenameWorkspace?: (id: string, newName: string) => void
  onSelectWorkspace: (
    ws: WorkspaceFolder | null,
    openTerminal?: boolean,
    launchAgent?: boolean
  ) => void
  onFocusPane: (paneId: string) => void
  onSplit: (direction: 'horizontal' | 'vertical') => void
  onNewTab: () => void
  onOpenSettings: () => void
  onOpenDiff?: (filePath?: string) => void
  onAddTerminalToWorkspace: (ws: WorkspaceFolder, e?: React.MouseEvent) => void
  onDeleteWorkspace?: (
    id: string,
    deletedWs: WorkspaceFolder | undefined,
    nextWs: WorkspaceFolder | null
  ) => void
  width?: number
  isResizing?: boolean
}

const WORKSPACES_STORAGE_KEY = 'ferminterm_workspaces'

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  panes,
  workspaces,
  tabs = [],
  activeTab,
  activePaneId,
  activeWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onSelectWorkspace,
  onFocusPane,
  onSplit,
  onNewTab,
  onOpenSettings,
  onOpenDiff,
  onAddTerminalToWorkspace,
  onDeleteWorkspace,
  width = 256,
  isResizing = false,
}) => {
  const { theme, themeId } = useTheme()
  const { t } = useLanguage()
  const { features } = useFeatures()
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [editingWsId, setEditingWsId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [profile, setProfile] = useState<OperatorProfile>(getStoredProfile)

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<OperatorProfile>
      if (custom.detail) setProfile(custom.detail)
    }
    window.addEventListener('ferminterm_profile_updated', handler)
    return () => window.removeEventListener('ferminterm_profile_updated', handler)
  }, [])

  useEffect(() => {
    const handler = () => setIsNewProjectModalOpen(true)
    window.addEventListener('ferminterm:open-new-project', handler)
    return () => window.removeEventListener('ferminterm:open-new-project', handler)
  }, [])

  const handleOpenNewProject = () => {
    setIsNewProjectModalOpen(true)
  }

  const handleCreateProject = (newWs: WorkspaceFolder) => {
    onCreateWorkspace(newWs)
  }

  const handleStartRename = (ws: WorkspaceFolder, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingWsId(ws.id)
    setEditingName(ws.name)
  }

  const handleSaveRename = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation()
    const trimmed = editingName.trim()
    if (trimmed && onRenameWorkspace) {
      onRenameWorkspace(id, trimmed)
    }
    setEditingWsId(null)
  }

  const handleCancelRename = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingWsId(null)
  }

  // Remove Folder from workspace list (auto-closes project terminal tabs)
  const handleRemoveWorkspace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const deletedWs = workspaces.find((w) => w.id === id)
    const remaining = workspaces.filter((w) => w.id !== id)
    const nextWs =
      remaining.length > 0
        ? activeWorkspace?.id === id
          ? remaining[0]
          : activeWorkspace
        : null

    if (onDeleteWorkspace) {
      onDeleteWorkspace(id, deletedWs, nextWs)
    } else {
      onSelectWorkspace(nextWs, false)
    }
  }
  if (!isOpen) return null

  // Collect panes in the current active tab
  const activePanesList: PaneData[] = []
  panes.forEach((p) => {
    activePanesList.push(p)
  })

  return (
    <div
      data-sidebar-panel="true"
      className="h-full flex flex-col border-r select-none shrink-0 z-20 font-mono text-xs overflow-hidden"
      style={{
        width: `${width}px`,
        transition: isResizing ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
        color: theme.ui.text,
      }}
    >
      {/* Workspace Header */}
      <div
        className="p-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: theme.ui.border }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <FolderGit2 className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex flex-col truncate">
            <span className="font-bold text-xs truncate" style={{ color: theme.ui.text }}>
              {activeWorkspace?.name || t.sidebar.noProjectActive}
            </span>
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: theme.ui.textMuted }}>
              {activeWorkspace ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
                  <span>{activeWorkspace.isGit ? `git: ${activeWorkspace.branch || 'main'}` : 'local folder'}</span>
                </>
              ) : (
                <span className="opacity-50">{t.sidebar.addProjectBegin}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeWorkspace && (
            <button
              onClick={(e) => onAddTerminalToWorkspace(activeWorkspace, e)}
              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title={`Open new terminal in ${activeWorkspace.name}`}
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
            title="Collapse Sidebar (Ctrl+B)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Center Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Section 1: Workspaces & Folders (Sistem Orca) */}
        {features.workspaceManager && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 flex items-center gap-1.5">
              <Folder className="w-3 h-3 text-amber-400" />
              Workspaces ({workspaces.length})
            </span>
            <button
              onClick={handleOpenNewProject}
              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
              title="New Project & AI Agent Setup"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.sidebar.addProject}</span>
            </button>
          </div>

          <div className="space-y-1">
            {workspaces.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center my-1 space-y-1.5">
                <FolderPlus className="w-4 h-4 text-neutral-500 mx-auto" />
                <div className="text-neutral-400 font-medium text-xs">{t.sidebar.noProjects}</div>
                <div className="text-[10px] text-neutral-500 leading-relaxed">
                  {t.sidebar.noProjectsDesc}
                </div>
              </div>
            ) : (
              workspaces.map((ws, wsIdx) => {
                const isActive = activeWorkspace?.id === ws.id
                const wsTabs = tabs.filter(
                  (t) => t.workspaceId === ws.id || (!t.workspaceId && t.workspacePath === ws.path)
                )
                const folderBase = ws.path.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'Project'
                const isDuplicateName =
                  workspaces.filter((w) => w.name.toLowerCase() === ws.name.toLowerCase()).length > 1
                const isGenericOrSame =
                  isDuplicateName ||
                  ws.name.toLowerCase() === 'workspace' ||
                  ws.name.toLowerCase() === 'project'

                const DISTINCT_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']
                const wsColor =
                  ws.color && ws.color !== '#3b82f6'
                    ? ws.color
                    : DISTINCT_PALETTE[wsIdx % DISTINCT_PALETTE.length]

                const avatarInitial = (isGenericOrSame ? folderBase : ws.name).charAt(0).toUpperCase()
                const isEditing = editingWsId === ws.id

                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      if (!isEditing) onSelectWorkspace(ws, false)
                    }}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
                      isActive
                        ? 'bg-white/10 font-medium shadow-sm'
                        : 'hover:bg-white/[0.04] opacity-75 hover:opacity-100'
                    }`}
                    style={{
                      borderLeft: isActive
                        ? `2px solid ${wsColor}`
                        : '2px solid transparent',
                      backgroundColor: isActive ? theme.ui.surfaceHover : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      {ws.icon ? (
                        <img src={ws.icon} alt="" className="w-5 h-5 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: wsColor }}
                        >
                          {avatarInitial}
                        </div>
                      )}

                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(ws.id)
                              if (e.key === 'Escape') handleCancelRename()
                            }}
                            autoFocus
                            className="w-full bg-black/60 border border-purple-400 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRename(ws.id, e)}
                            className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelRename}
                            className="p-1 rounded hover:bg-white/10 text-neutral-400 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col truncate flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate font-bold text-xs" style={{ color: theme.ui.text }}>
                              {isGenericOrSame ? folderBase : ws.name}
                            </span>
                            {isGenericOrSame && ws.name.toLowerCase() !== folderBase.toLowerCase() && (
                              <span className="text-[10px] text-neutral-400 font-normal truncate shrink-0">
                                ({ws.name})
                              </span>
                            )}
                            {ws.agent && ws.agent !== 'none' && (
                              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase shrink-0">
                                {ws.agent}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] opacity-60 truncate max-w-[130px] flex items-center gap-1" title={ws.path}>
                            <Folder className="w-2.5 h-2.5 shrink-0 opacity-50" />
                            <span className="truncate">{ws.path}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {wsTabs.length > 0 && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                            title={`${wsTabs.length} active terminal ${wsTabs.length === 1 ? 'tab' : 'tabs'}`}
                          >
                            {wsTabs.length} {wsTabs.length === 1 ? 'tab' : 'tabs'}
                          </span>
                        )}
                        {ws.isGit && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            {ws.branch || 'git'}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleStartRename(ws, e)}
                          className="p-1 rounded opacity-50 hover:opacity-100 hover:text-amber-300 hover:bg-white/10 transition-all cursor-pointer"
                          title="Rename project"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => onAddTerminalToWorkspace(ws, e)}
                          className="p-1 rounded opacity-70 hover:opacity-100 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
                          title={`Open new terminal in ${ws.name}`}
                        >
                          <Plus className="w-3 h-3 text-cyan-400" />
                        </button>
                        <button
                          onClick={(e) => handleRemoveWorkspace(ws.id, e)}
                          className="p-1 rounded opacity-60 hover:opacity-100 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                          title="Remove project from workspace list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
          )}

            {/* Quick Add Folder Dashed Button */}
            <button
              onClick={handleOpenNewProject}
              className="w-full mt-1.5 p-2 rounded border border-dashed border-white/15 hover:border-amber-400/50 bg-white/[0.01] hover:bg-white/[0.04] text-neutral-400 hover:text-amber-300 flex items-center justify-center gap-2 transition-all text-[11px] cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.sidebar.openProjectDirectory}</span>
            </button>
          </div>
        </div>
        )}

        {/* Section 3: Active Panes / Sessions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400">
              {t.sidebar.activePanes} ({activePanesList.length})
            </span>
            <button
              onClick={onNewTab}
              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
              title="Add Tab (Ctrl+T)"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            {workspaces.map((ws) => {
              const wsPanes = activePanesList.filter((p) => {
                if (p.workspaceId) return p.workspaceId === ws.id
                if (p.cwd && ws.path) return p.cwd.toLowerCase().startsWith(ws.path.toLowerCase())
                return false
              })
              if (wsPanes.length === 0) return null

              return (
                <div key={ws.id} className="rounded-lg bg-white/[0.02] border border-white/5 p-1.5 space-y-1">
                  <div className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ws.color || theme.ui.accent }}
                    />
                    <span className="truncate">{ws.name}</span>
                    <span className="text-[9px] font-normal opacity-60">({wsPanes.length})</span>
                  </div>
                  {wsPanes.map((p) => {
                    const isFocused = p.id === activePaneId
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          onFocusPane(p.id)
                          onSelectWorkspace(ws, false)
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                          isFocused
                            ? 'bg-white/15 font-semibold text-white shadow-sm'
                            : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          borderLeft: isFocused
                            ? `2px solid ${ws.color || theme.ui.accent}`
                            : '2px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate text-xs">{p.title || p.shell.toUpperCase()}</span>
                        </div>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 border border-white/5 opacity-60 uppercase">
                          {p.shell}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Any unassigned panes */}
            {(() => {
              const unassignedPanes = activePanesList.filter((p) => {
                return !workspaces.some((ws) => {
                  if (p.workspaceId) return p.workspaceId === ws.id
                  if (p.cwd && ws.path) return p.cwd.toLowerCase().startsWith(ws.path.toLowerCase())
                  return false
                })
              })
              if (unassignedPanes.length === 0) return null

              return (
                <div className="rounded-lg bg-white/[0.02] border border-white/5 p-1.5 space-y-1">
                  <div className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 shrink-0" />
                    <span>Other Sessions</span>
                  </div>
                  {unassignedPanes.map((p) => {
                    const isFocused = p.id === activePaneId
                    return (
                      <div
                        key={p.id}
                        onClick={() => onFocusPane(p.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                          isFocused
                            ? 'bg-white/15 font-semibold text-white shadow-sm'
                            : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Terminal className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate text-xs">{p.title || p.shell.toUpperCase()}</span>
                        </div>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 border border-white/5 opacity-60 uppercase">
                          {p.shell}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
        {/* Section 4: Split Layout Controls */}
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 block mb-2">
            {t.sidebar.splitPresets}
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onSplit('vertical')}
              className="p-2 rounded border border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] flex items-center gap-2 transition-all"
            >
              <Columns className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.sidebar.split2Col}</span>
            </button>

            <button
              onClick={() => onSplit('horizontal')}
              className="p-2 rounded border border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] flex items-center gap-2 transition-all"
            >
              <Rows className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.sidebar.split2Row}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 5: FITUR PENGATURAN DI BAWAH (Settings Footer) */}
      <div
        className="p-3 border-t flex flex-col gap-2 shrink-0"
        style={{ borderColor: theme.ui.border, backgroundColor: theme.ui.surface }}
      >
        {/* Live Operator ID & Avatar Badge (Image 6) */}
        <div
          onClick={onOpenSettings}
          className="p-2 rounded-xl border border-white/5 hover:border-amber-400/40 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-between group"
          title="Klik untuk kelola Profil Operator & Foto"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/10 shrink-0 flex items-center justify-center bg-black/40">
              {profile.avatarType === 'local-image' || profile.avatarType === 'custom-url' ? (
                <img src={profile.avatarValue} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-cyan-400 flex items-center justify-center">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-black" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                {profile.name}
              </span>
              <span className="text-[10px] text-neutral-400 truncate">
                @{profile.handle}
              </span>
            </div>
          </div>

          <span className="text-xs group-hover:scale-110 transition-transform">
            {profile.statusEmoji || '⚡'}
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 transition-colors" />
            <span className="font-semibold text-xs group-hover:text-white transition-colors">
              {t.sidebar.settings}
            </span>
          </div>

          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-bold opacity-70 group-hover:opacity-100">
            Ctrl+,
          </kbd>
        </button>

        <div className="flex items-center justify-between px-1 text-[11px] text-neutral-500">
          <span>Kingsley • Win11 Native</span>
          <span className="capitalize">{theme.name}</span>
        </div>
      </div>

      {/* New Project Modal (Image 3) */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
