import React, { useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  ShieldCheck,
  Terminal as TerminalIcon,
  CornerDownLeft,
  FolderTree,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import type { WorkspaceFolder } from '../sidebar/Sidebar'
import type { CopyOrMoveResult } from '@shared/types'
import type { PaneData } from '../../types/layout'
import { isPathInside } from '../../lib/path-format'


interface GlobalDropOverlayProps {
  activeWorkspace: WorkspaceFolder | null
  activePaneId?: string
  activePaneTitle?: string
  panes?: Map<string, PaneData>
  /** Types the paths into a terminal (default drop behaviour). */
  onInsertPaths: (paths: string[], paneId?: string) => Promise<boolean>
  onFilesDropped?: (
    sourcePaths: string[],
    targetDir: string,
    operation: 'copy' | 'move'
  ) => Promise<CopyOrMoveResult | void>
  onCreateWorkspace: (ws: WorkspaceFolder) => void
}

/**
 * Electron's DataTransfer.types can be a plain array or a DOMStringList
 * depending on the platform/version. Normalise both.
 */
function dataTransferHasFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false
  const types = dataTransfer.types as unknown
  if (Array.isArray(types)) return types.includes('Files')
  const list = types as { contains?: (value: string) => boolean; length?: number }
  if (typeof list?.contains === 'function') return list.contains('Files')
  if (typeof list?.length === 'number') {
    for (let i = 0; i < list.length; i++) {
      if ((types as unknown as string[])[i] === 'Files') return true
    }
  }
  return false
}

function fileUrlToPath(value: string): string {
  try {
    let decoded = decodeURIComponent(value.replace(/^file:\/{2,}/i, '').trim())
    // file:///C:/Users/... -> C:/Users/...
    if (/^\/[a-zA-Z]:/.test(decoded)) decoded = decoded.slice(1)
    return decoded.replace(/\//g, '\\')
  } catch {
    return ''
  }
}

/**
 * Resolve every dropped item into an absolute filesystem path.
 * webUtils.getPathForFile is the supported Electron API; file.path and
 * text/uri-list are kept as defensive fallbacks.
 */
function collectDroppedPaths(dataTransfer: DataTransfer | null): string[] {
  const found = new Set<string>()
  if (!dataTransfer) return []

  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files.item(i)
      if (!file) continue
      let resolved = ''
      try {
        resolved = window.ferminAPI?.getPathForFile?.(file) || ''
      } catch {
        resolved = ''
      }
      if (!resolved) {
        const legacy = file as File & { path?: string }
        if (typeof legacy.path === 'string') resolved = legacy.path
      }
      if (resolved) found.add(resolved.trim())
    }
  }

  if (found.size === 0) {
    const uriList = dataTransfer.getData('text/uri-list')
    const plain = dataTransfer.getData('text/plain')
    const candidates = `${uriList}\n${plain}`
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.toLowerCase().startsWith('file://'))
    candidates.forEach((line) => {
      const parsed = fileUrlToPath(line)
      if (parsed) found.add(parsed)
    })
  }

  return Array.from(found)
}

export const GlobalDropOverlay: React.FC<GlobalDropOverlayProps> = ({
  activeWorkspace,
  activePaneId,
  activePaneTitle,
  panes,
  onInsertPaths,
  onFilesDropped,
  onCreateWorkspace,
}) => {
  const { theme } = useTheme()
  const [isDragging, setIsDragging] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isAltPressed, setIsAltPressed] = useState(false)

  const dragDepth = useRef(0)
  // Keep the latest props/state reachable from listeners that are bound once.
  const propsRef = useRef({
    activeWorkspace,
    activePaneId,
    activePaneTitle,
    panes,
    onInsertPaths,
    onFilesDropped,
    onCreateWorkspace,
  })

  useEffect(() => {
    propsRef.current = {
      activeWorkspace,
      activePaneId,
      activePaneTitle,
      panes,
      onInsertPaths,
      onFilesDropped,
      onCreateWorkspace,
    }
  }, [activeWorkspace, activePaneId, activePaneTitle, panes, onInsertPaths, onFilesDropped, onCreateWorkspace])

  useEffect(() => {
    const reset = () => {
      dragDepth.current = 0
      setIsDragging(false)
      setIsShiftPressed(false)
      setIsAltPressed(false)
    }

    const handleDragEnter = (e: DragEvent) => {
      if (!dataTransferHasFiles(e.dataTransfer)) return
      e.preventDefault()
      dragDepth.current += 1
      setIsShiftPressed(e.shiftKey)
      setIsAltPressed(e.altKey)
      setIsDragging(true)
    }

    const handleDragOver = (e: DragEvent) => {
      const hasFiles = dataTransferHasFiles(e.dataTransfer)
      e.preventDefault()
      if (!hasFiles) return

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = e.shiftKey ? 'move' : 'copy'
      }

      setIsShiftPressed(e.shiftKey)
      setIsAltPressed(e.altKey)

      dragDepth.current = Math.max(dragDepth.current, 1)
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (dragDepth.current === 0) return
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) {
        setIsDragging(false)
        setIsShiftPressed(false)
        setIsAltPressed(false)
      }
    }

    const openAsWorkspace = async (paths: string[]) => {
      const { onCreateWorkspace: createWorkspace } = propsRef.current
      if (paths.length === 1 && window.ferminAPI?.isDir) {
        const check = await window.ferminAPI.isDir(paths[0])
        if (check.isDirectory) {
          createWorkspace({
            id: `ws-${Date.now()}`,
            name: check.name || 'Project',
            path: paths[0],
            isGit: false,
            color: '#3b82f6',
          })
          return
        }
      }

      const parentDir = paths[0].replace(/[/\\][^/\\]+$/, '') || paths[0]
      const folderName = parentDir.split(/[/\\]/).pop() || 'Workspace'
      createWorkspace({
        id: `ws-${Date.now()}`,
        name: folderName,
        path: parentDir,
        isGit: false,
        color: '#10b981',
      })
    }

    const handleDrop = async (e: DragEvent) => {
      if (!dataTransferHasFiles(e.dataTransfer)) return
      e.preventDefault()
      e.stopPropagation()
      reset()

      const paths = collectDroppedPaths(e.dataTransfer)
      if (paths.length === 0) return

      // Resolve exact target pane under cursor using document.elementFromPoint
      const elAtPoint = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const paneEl = elAtPoint?.closest?.('[data-terminal-pane-id]') as HTMLElement | null
      const targetPaneId = paneEl?.getAttribute('data-terminal-pane-id') || propsRef.current.activePaneId || ''

      // Directly insert paths into terminal without copying to workspace (leaves project files clean)
      if (targetPaneId || propsRef.current.activePaneId) {
        await propsRef.current.onInsertPaths(paths, targetPaneId || propsRef.current.activePaneId)
      } else if (!propsRef.current.activeWorkspace?.path) {
        await openAsWorkspace(paths)
      }
    }

    window.addEventListener('dragenter', handleDragEnter, true)
    window.addEventListener('dragover', handleDragOver, true)
    window.addEventListener('dragleave', handleDragLeave, true)
    window.addEventListener('drop', handleDrop, true)
    window.addEventListener('dragend', reset)
    window.addEventListener('blur', reset)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter, true)
      window.removeEventListener('dragover', handleDragOver, true)
      window.removeEventListener('dragleave', handleDragLeave, true)
      window.removeEventListener('drop', handleDrop, true)
      window.removeEventListener('dragend', reset)
      window.removeEventListener('blur', reset)
    }
  }, [])

  const title = 'Bedah File / Folder di Terminal'
  const subtitle = 'Lepaskan untuk menempelkan path file/folder ke prompt terminal OMP:'
  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-8 bg-black/75 backdrop-blur-md select-none pointer-events-none transition-all duration-150 ${
        isDragging ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!isDragging}
    >
      <div
        className="w-full max-w-lg p-8 rounded-2xl border-2 border-dashed flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: `${theme.ui.surface}f8`,
          borderColor: theme.ui.borderActive,
          boxShadow: `0 20px 50px -10px rgba(0,0,0,0.8), ${theme.ui.activePaneGlow}`,
        }}
      >
        {/* Glow accent */}
        <div
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: theme.ui.accent }}
        />

        {/* Icon header */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200"
          style={{
            backgroundColor: `${theme.ui.accent}20`,
            border: `1px solid ${theme.ui.borderActive}`,
            color: theme.ui.accent,
            transform: isDragging ? 'scale(1.06)' : 'scale(1)',
          }}
        >
          <TerminalIcon className="w-8 h-8 text-cyan-400" />
        </div>

        <div className="text-base font-bold font-mono tracking-wider text-neutral-100 uppercase mb-1">
          {title}
        </div>

        <div className="text-xs text-neutral-400 font-mono mb-4">{subtitle}</div>

        {/* Destination */}
        <div
          className="w-full px-4 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 mb-5 font-mono text-xs overflow-hidden"
          style={{
            backgroundColor: theme.ui.background,
            borderColor: theme.ui.borderActive,
          }}
        >
          {activeWorkspace?.path ? (
            <>
              <span className="font-semibold text-neutral-200 truncate max-w-full flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{activePaneTitle || 'Terminal OMP'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PROMPT INPUT
                </span>
              </span>
              <span className="text-[11px] text-neutral-400 truncate max-w-full flex items-center gap-1 font-mono">
                <CornerDownLeft className="w-3 h-3 text-emerald-400 shrink-0" />
                {activeWorkspace.path}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium mt-0.5">
                ✨ Path file/folder ditempel langsung ke terminal tanpa menduplikasi ke project
              </span>
            </>
          ) : (
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              Folder akan dibuka sebagai workspace
            </span>
          )}
        </div>


        <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
          <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>Tinggal seret & lepas = path otomatis ditempel ke prompt terminal untuk dibedah</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 mt-2">
          <ShieldCheck className="w-3 h-3 text-emerald-500/80 shrink-0" />
          <span>Mendukung file & seluruh folder. Nama bentrok di-rename otomatis dengan aman.</span>
        </div>
      </div>
    </div>
  )
}
