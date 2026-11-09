import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  GitCompare,
  RotateCw,
  FileCode,
  Check,
  GitBranch,
  X,
  FolderTree,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  FileJson,
  Image,
  File,
  Copy,
  Scissors,
  ClipboardPaste,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit2,
  ExternalLink,
  Link2,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { showFileToast } from '../notifications/FileTransferToast'
import type { GitFileChange, DirectoryItem } from '@shared/types'

interface GitChangesPanelProps {
  gitChanges: GitFileChange[]
  isRefreshing: boolean
  onRefresh: () => void
  onOpenDiff: (filePath?: string) => void
  onOpenFileAsTerminal?: (filePath: string) => void
  onClose: () => void
  branch?: string
  workspacePath?: string
  workspaceName?: string
  width?: number
  isResizing?: boolean
}

// Convert absolute filesystem path to relative workspace path with forward slashes
function getRelativePath(itemFullPath: string, rootPath: string): string {
  const normItem = itemFullPath.replace(/\\/g, '/')
  const normRoot = rootPath.replace(/\\/g, '/').replace(/\/+$/, '')
  if (normItem.startsWith(normRoot + '/')) {
    return normItem.slice(normRoot.length + 1)
  }
  return normItem
}

// Individual file/folder item in recursive explorer tree
const FileTreeItem: React.FC<{
  item: DirectoryItem
  depth: number
  workspacePath: string
  gitChangesMap: Map<string, string>
  selectedPath: string | null
  cutPath: string | null
  onOpenDiff: (filePath?: string) => void
  onOpenFileAsTerminal?: (filePath: string) => void
  onSelectItem: (item: DirectoryItem) => void
  onContextMenu: (e: React.MouseEvent, item: DirectoryItem) => void
  onDropOnFolder: (sourcePaths: string[], targetDir: string, op: 'copy' | 'move') => Promise<void>
  refreshSeq: number
}> = ({
  item,
  depth,
  workspacePath,
  gitChangesMap,
  selectedPath,
  cutPath,
  onOpenDiff,
  onOpenFileAsTerminal,
  onSelectItem,
  onContextMenu,
  onDropOnFolder,
  refreshSeq,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [children, setChildren] = useState<DirectoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const isSelected = selectedPath === item.path
  const isCut = cutPath === item.path

  const relPath = useMemo(() => {
    return getRelativePath(item.path, workspacePath)
  }, [item.path, workspacePath])

  const gitStatus = gitChangesMap.get(relPath)

  const loadChildren = useCallback(async () => {
    if (!item.isDirectory) return
    setIsLoading(true)
    try {
      if (window.ferminAPI?.readDirectory) {
        const res = await window.ferminAPI.readDirectory(item.path)
        if (res.success) {
          setChildren(res.items)
        }
      }
    } catch (err) {
      console.warn('Failed to read dir:', err)
    } finally {
      setIsLoading(false)
    }
  }, [item.isDirectory, item.path])

  useEffect(() => {
    if (isOpen && item.isDirectory) {
      loadChildren()
    }
  }, [refreshSeq, isOpen, item.isDirectory, loadChildren])

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectItem(item)

    if (!item.isDirectory) {
      if (onOpenFileAsTerminal) {
        onOpenFileAsTerminal(item.path)
      } else if (gitStatus) {
        onOpenDiff(relPath)
      }
      return
    }

    if (!isOpen) {
      await loadChildren()
    }
    setIsOpen((prev) => !prev)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = e.shiftKey ? 'move' : 'copy'
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return

    const paths: string[] = []
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i]
      const p = window.ferminAPI?.getPathForFile
        ? window.ferminAPI.getPathForFile(file)
        : (file && typeof file === 'object' && 'path' in file && typeof file.path === 'string' ? file.path : '')
      if (p) paths.push(p)
    }

    if (paths.length > 0) {
      const op = e.shiftKey ? 'move' : 'copy'
      const targetDir = item.isDirectory ? item.path : item.path.replace(/[/\\][^/\\]+$/, '')
      await onDropOnFolder(paths, targetDir, op)
      if (item.isDirectory) {
        setIsOpen(true)
        await loadChildren()
      }
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      case 'js':
      case 'jsx':
        return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
      case 'json':
        return <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      case 'css':
      case 'scss':
        return <FileText className="w-3.5 h-3.5 text-pink-400 shrink-0" />
      case 'md':
        return <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      case 'png':
      case 'jpg':
      case 'ico':
      case 'svg':
        return <Image className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      default:
        return <File className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
    }
  }

  const isDimmed =
    item.name === 'node_modules' ||
    item.name === 'dist' ||
    item.name === 'dist-electron' ||
    item.name.startsWith('.')

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      <div
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onSelectItem(item)
          onContextMenu(e, item)
        }}
        className={`flex items-center justify-between py-1 px-1.5 rounded-lg cursor-pointer group transition-all text-[11px] select-none ${
          isDragOver
            ? 'bg-cyan-500/25 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
            : isSelected
            ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
            : 'hover:bg-white/5 border border-transparent'
        } ${gitStatus ? 'bg-white/[0.03]' : ''} ${
          isCut ? 'opacity-40 italic' : isDimmed ? 'opacity-40 hover:opacity-80' : ''
        }`}
        style={{ paddingLeft: `${Math.max(6, depth * 14)}px` }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden truncate">
          {item.isDirectory ? (
            <>
              {isLoading ? (
                <RotateCw className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />
              ) : isOpen ? (
                <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3 shrink-0" />
              {getFileIcon(item.name)}
            </>
          )}

          <span
            className={`truncate ${
              item.isDirectory ? 'font-medium text-neutral-300' : 'text-neutral-300 group-hover:text-white'
            } ${gitStatus ? 'text-amber-300 font-semibold' : ''}`}
          >
            {item.name}
          </span>
        </div>

        {gitStatus && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenDiff(relPath)
            }}
            title="Inspect diff in drawer"
            className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ml-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 transition-colors cursor-pointer"
          >
            {gitStatus.includes('M')
              ? 'M'
              : gitStatus.includes('A') || gitStatus.includes('?')
              ? 'A'
              : 'D'}
          </button>
        )}
      </div>

      {item.isDirectory && isOpen && (
        <div>
          {children.length === 0 && !isLoading && (
            <div
              className="py-0.5 text-[10px] text-neutral-600 italic select-none"
              style={{ paddingLeft: `${(depth + 1) * 14 + 12}px` }}
            >
              (empty)
            </div>
          )}
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              depth={depth + 1}
              workspacePath={workspacePath}
              gitChangesMap={gitChangesMap}
              selectedPath={selectedPath}
              cutPath={cutPath}
              onOpenDiff={onOpenDiff}
              onOpenFileAsTerminal={onOpenFileAsTerminal}
              onSelectItem={onSelectItem}
              onContextMenu={onContextMenu}
              onDropOnFolder={onDropOnFolder}
              refreshSeq={refreshSeq}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const GitChangesPanel: React.FC<GitChangesPanelProps> = ({
  gitChanges,
  isRefreshing,
  onRefresh,
  onOpenDiff,
  onOpenFileAsTerminal,
  onClose,
  branch,
  workspacePath,
  workspaceName,
  width,
  isResizing = false,
}) => {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const panelRef = useRef<HTMLDivElement>(null)

  const hasActiveProject = Boolean(
    workspacePath &&
    workspacePath.trim() !== '' &&
    workspacePath.trim() !== '.'
  )

  // Root directory items for Project Explorer
  const [rootItems, setRootItems] = useState<DirectoryItem[]>([])
  const [isExplorerLoading, setIsExplorerLoading] = useState(false)
  const [refreshSeq, setRefreshSeq] = useState(0)

  // Selection & Clipboard state
  const [selectedItem, setSelectedItem] = useState<DirectoryItem | null>(null)
  const [internalClipboard, setInternalClipboard] = useState<{
    paths: string[]
    operation: 'copy' | 'move'
    sourceDir: string
  } | null>(null)
  const [isRootDragOver, setIsRootDragOver] = useState(false)

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: DirectoryItem | null
  } | null>(null)

  // Inline Modal Dialog State (Rename, New File, New Folder)
  const [dialogState, setDialogState] = useState<{
    type: 'rename' | 'newFile' | 'newFolder'
    targetDir: string
    oldPath?: string
    currentName: string
  } | null>(null)
  const [dialogInput, setDialogInput] = useState('')

  // Map of normalized relative paths to git status
  const gitChangesMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of gitChanges) {
      map.set(c.path.replace(/\\/g, '/'), c.status)
    }
    return map
  }, [gitChanges])

  const loadRootItems = useCallback(async () => {
    if (!hasActiveProject || !workspacePath || !window.ferminAPI?.readDirectory) {
      setRootItems([])
      return
    }
    setIsExplorerLoading(true)
    try {
      const res = await window.ferminAPI.readDirectory(workspacePath)
      if (res.success) {
        setRootItems(res.items)
      } else {
        setRootItems([])
      }
    } catch (err) {
      console.warn('Failed to load project files:', err)
      setRootItems([])
    } finally {
      setIsExplorerLoading(false)
    }
  }, [hasActiveProject, workspacePath])

  useEffect(() => {
    loadRootItems()
  }, [loadRootItems, refreshSeq])

  // Listen to external refresh explorer event
  useEffect(() => {
    const handler = () => {
      setRefreshSeq((p) => p + 1)
      loadRootItems()
    }
    window.addEventListener('ferminterm:refresh-explorer', handler)
    return () => window.removeEventListener('ferminterm:refresh-explorer', handler)
  }, [loadRootItems])


  // Paste handler: pastes files/folders into a target directory
  const handlePasteInto = useCallback(
    async (targetDir: string) => {
      if (!window.ferminAPI?.copyOrMovePaths) return

      // 1. Check internal clipboard
      if (internalClipboard && internalClipboard.paths.length > 0) {
        const { paths, operation } = internalClipboard
        const res = await window.ferminAPI.copyOrMovePaths(paths, targetDir, operation)
        if (res.success) {
          showFileToast(
            operation === 'move' ? 'File Berhasil Dipindahkan' : 'File Berhasil Disalin',
            `${res.count} item ${operation === 'move' ? 'dipindahkan' : 'disalin'} ke ${targetDir}`,
            operation === 'move' ? 'move' : 'copy'
          )
          if (operation === 'move') {
            setInternalClipboard(null)
          }
          setRefreshSeq((p) => p + 1)
          onRefresh()
        } else {
          showFileToast('Gagal Menempel File', res.errors?.join('\n') || 'Terjadi kesalahan', 'error')
        }
        return
      }

      // 2. Check system clipboard via IPC
      if (window.ferminAPI?.getClipboardFiles) {
        const clipRes = await window.ferminAPI.getClipboardFiles()
        if (clipRes.success && clipRes.files && clipRes.files.length > 0) {
          const res = await window.ferminAPI.copyOrMovePaths(clipRes.files, targetDir, 'copy')
          if (res.success) {
            showFileToast(
              'File Disalin dari Clipboard',
              `${res.count} item disalin ke ${targetDir}`,
              'copy'
            )
            setRefreshSeq((p) => p + 1)
            onRefresh()
          } else {
            showFileToast('Gagal Menempel Clipboard', res.errors?.join('\n') || 'Terjadi kesalahan', 'error')
          }
          return
        }
      }

      showFileToast('Clipboard Kosong', 'Tidak ada file atau folder di clipboard untuk disalin.', 'info')
    },
    [internalClipboard, onRefresh]
  )
  // Close context menu on outside click or Esc
  // Close context menu on outside click or Esc / handle explorer shortcuts
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null)
        setDialogState(null)
        return
      }

      // Check if target is an editable input or xterm
      const target = e.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.closest('.xterm')
      ) {
        return
      }

      // Only handle if panel has focus or selectedItem is active
      const panel = document.querySelector('[data-git-panel="true"]')
      if (!panel?.contains(document.activeElement) && !selectedItem) return

      const isCtrl = e.ctrlKey || e.metaKey
      const targetDir = selectedItem
        ? selectedItem.isDirectory
          ? selectedItem.path
          : workspacePath || '.'
        : workspacePath || '.'

      if (isCtrl && e.key.toLowerCase() === 'c' && selectedItem) {
        e.preventDefault()
        setInternalClipboard({
          paths: [selectedItem.path],
          operation: 'copy',
          sourceDir: selectedItem.path,
        })
        window.ferminAPI?.writeClipboardFiles?.([selectedItem.path])
        showFileToast('Disalin ke Clipboard', selectedItem.name, 'copy')
      } else if (isCtrl && e.key.toLowerCase() === 'x' && selectedItem) {
        e.preventDefault()
        setInternalClipboard({
          paths: [selectedItem.path],
          operation: 'move',
          sourceDir: selectedItem.path,
        })
        showFileToast('Dipotong (Cut)', `${selectedItem.name} — tekan Ctrl+V di folder tujuan`, 'move')
      } else if (isCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        void handlePasteInto(targetDir)
      }
    }

    const closeContext = () => setContextMenu(null)
    window.addEventListener('click', closeContext)
    window.addEventListener('keydown', handleWindowKeyDown)
    return () => {
      window.removeEventListener('click', closeContext)
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [selectedItem, workspacePath, handlePasteInto])

  // Drag & drop directly on a folder in the tree
  const handleDropOnFolder = useCallback(
    async (sourcePaths: string[], targetDir: string, op: 'copy' | 'move') => {
      if (!window.ferminAPI?.copyOrMovePaths) return
      const res = await window.ferminAPI.copyOrMovePaths(sourcePaths, targetDir, op)
      if (res.success) {
        showFileToast(
          op === 'move' ? 'File Berhasil Dipindahkan' : 'File Berhasil Disalin',
          `${res.count} item ${op === 'move' ? 'dipindahkan' : 'disalin'} ke ${targetDir}`,
          op === 'move' ? 'move' : 'copy'
        )
        setRefreshSeq((p) => p + 1)
        onRefresh()
      } else {
        showFileToast('Gagal Mentransfer File', res.errors?.join('\n') || 'Terjadi kesalahan', 'error')
      }
    },
    [onRefresh]
  )

  // Explorer root drag & drop handlers
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      setIsRootDragOver(true)
      e.dataTransfer.dropEffect = e.shiftKey ? 'move' : 'copy'
    }
  }

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsRootDragOver(false)
  }

  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsRootDragOver(false)

    if (!workspacePath) return
    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return

    const paths: string[] = []
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i]
      const p = window.ferminAPI?.getPathForFile
        ? window.ferminAPI.getPathForFile(file)
        : (file && typeof file === 'object' && 'path' in file && typeof file.path === 'string' ? file.path : '')
      if (p) paths.push(p)
    }

    if (paths.length > 0) {
      await handleDropOnFolder(paths, workspacePath, e.shiftKey ? 'move' : 'copy')
    }
  }

  // Handle keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Delete, F2) in explorer
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      // Don't intercept if user is typing inside an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      const targetDir = selectedItem
        ? selectedItem.isDirectory
          ? selectedItem.path
          : workspacePath || '.'
        : workspacePath || '.'

      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        if (selectedItem) {
          e.preventDefault()
          setInternalClipboard({
            paths: [selectedItem.path],
            operation: 'copy',
            sourceDir: selectedItem.path,
          })
          window.ferminAPI?.writeClipboardFiles?.([selectedItem.path])
          showFileToast('Disalin ke Clipboard', selectedItem.name, 'copy')
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        if (selectedItem) {
          e.preventDefault()
          setInternalClipboard({
            paths: [selectedItem.path],
            operation: 'move',
            sourceDir: selectedItem.path,
          })
          showFileToast('Dipotong (Cut)', `${selectedItem.name} — tekan Ctrl+V di folder tujuan`, 'move')
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        await handlePasteInto(targetDir)
      } else if (e.key === 'F2') {
        if (selectedItem) {
          e.preventDefault()
          setDialogState({
            type: 'rename',
            targetDir: selectedItem.path,
            oldPath: selectedItem.path,
            currentName: selectedItem.name,
          })
          setDialogInput(selectedItem.name)
        }
      } else if (e.key === 'Delete') {
        if (selectedItem && window.ferminAPI?.deletePath) {
          e.preventDefault()
          const res = await window.ferminAPI.deletePath(selectedItem.path)
          if (res.success) {
            showFileToast('Item Dihapus', `${selectedItem.name} dipindahkan ke Recycle Bin`, 'info')
            setSelectedItem(null)
            setRefreshSeq((p) => p + 1)
            onRefresh()
          } else {
            showFileToast('Gagal Menghapus', res.error || 'Terjadi kesalahan', 'error')
          }
        }
      }
    },
    [selectedItem, workspacePath, handlePasteInto, onRefresh]
  )

  // Context Menu Actions
  const handleContextCopy = () => {
    if (!contextMenu?.item) return
    setInternalClipboard({
      paths: [contextMenu.item.path],
      operation: 'copy',
      sourceDir: contextMenu.item.path,
    })
    window.ferminAPI?.writeClipboardFiles?.([contextMenu.item.path])
    showFileToast('Disalin ke Clipboard', contextMenu.item.name, 'copy')
    setContextMenu(null)
  }

  const handleContextCut = () => {
    if (!contextMenu?.item) return
    setInternalClipboard({
      paths: [contextMenu.item.path],
      operation: 'move',
      sourceDir: contextMenu.item.path,
    })
    showFileToast('Dipotong (Cut)', `${contextMenu.item.name} — tekan Tempel di folder tujuan`, 'move')
    setContextMenu(null)
  }

  const handleContextPaste = async () => {
    const targetDir = contextMenu?.item
      ? contextMenu.item.isDirectory
        ? contextMenu.item.path
        : workspacePath || '.'
      : workspacePath || '.'
    setContextMenu(null)
    await handlePasteInto(targetDir)
  }

  const handleContextReveal = () => {
    const targetPath = contextMenu?.item?.path || workspacePath
    if (targetPath && window.ferminAPI?.showItemInFolder) {
      window.ferminAPI.showItemInFolder(targetPath)
    }
    setContextMenu(null)
  }

  const handleContextCopyPath = (isRelative: boolean) => {
    const targetPath = contextMenu?.item?.path || workspacePath
    if (!targetPath) return
    const textToCopy = isRelative && workspacePath
      ? getRelativePath(targetPath, workspacePath)
      : targetPath
    navigator.clipboard.writeText(textToCopy)
    showFileToast(isRelative ? 'Relative Path Disalin' : 'Path Absolut Disalin', textToCopy, 'info')
    setContextMenu(null)
  }

  const handleContextRename = () => {
    if (!contextMenu?.item) return
    setDialogState({
      type: 'rename',
      targetDir: contextMenu.item.path,
      oldPath: contextMenu.item.path,
      currentName: contextMenu.item.name,
    })
    setDialogInput(contextMenu.item.name)
    setContextMenu(null)
  }

  const handleContextDelete = async () => {
    if (!contextMenu?.item || !window.ferminAPI?.deletePath) return
    const item = contextMenu.item
    setContextMenu(null)
    const res = await window.ferminAPI.deletePath(item.path)
    if (res.success) {
      showFileToast('Item Dihapus', `${item.name} dipindahkan ke Recycle Bin`, 'info')
      if (selectedItem?.path === item.path) setSelectedItem(null)
      setRefreshSeq((p) => p + 1)
      onRefresh()
    } else {
      showFileToast('Gagal Menghapus', res.error || 'Terjadi kesalahan', 'error')
    }
  }

  const handleOpenNewFolderDialog = () => {
    const targetDir = contextMenu?.item
      ? contextMenu.item.isDirectory
        ? contextMenu.item.path
        : workspacePath || '.'
      : workspacePath || '.'
    setDialogState({
      type: 'newFolder',
      targetDir,
      currentName: '',
    })
    setDialogInput('')
    setContextMenu(null)
  }

  const handleOpenNewFileDialog = () => {
    const targetDir = contextMenu?.item
      ? contextMenu.item.isDirectory
        ? contextMenu.item.path
        : workspacePath || '.'
      : workspacePath || '.'
    setDialogState({
      type: 'newFile',
      targetDir,
      currentName: '',
    })
    setDialogInput('')
    setContextMenu(null)
  }

  // Dialog Submit (Rename / New File / New Folder)
  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dialogState || !dialogInput.trim()) return

    const { type, targetDir, oldPath } = dialogState
    const name = dialogInput.trim()

    if (type === 'rename' && oldPath && window.ferminAPI?.renamePath) {
      const res = await window.ferminAPI.renamePath(oldPath, name)
      if (res.success) {
        showFileToast('Nama Berhasil Diubah', name, 'success')
        setRefreshSeq((p) => p + 1)
        onRefresh()
      } else {
        showFileToast('Gagal Mengubah Nama', res.error || 'Terjadi kesalahan', 'error')
      }
    } else if (type === 'newFolder' && window.ferminAPI?.createFolder) {
      const res = await window.ferminAPI.createFolder(targetDir, name)
      if (res.success) {
        showFileToast('Folder Baru Dibuat', name, 'success')
        setRefreshSeq((p) => p + 1)
        onRefresh()
      } else {
        showFileToast('Gagal Membuat Folder', res.error || 'Terjadi kesalahan', 'error')
      }
    } else if (type === 'newFile' && window.ferminAPI?.createFile) {
      const res = await window.ferminAPI.createFile(targetDir, name)
      if (res.success) {
        showFileToast('File Baru Dibuat', name, 'success')
        setRefreshSeq((p) => p + 1)
        onRefresh()
      } else {
        showFileToast('Gagal Membuat File', res.error || 'Terjadi kesalahan', 'error')
      }
    }

    setDialogState(null)
  }

  const getStatusBadge = (status: string) => {
    const isModified = status.includes('M')
    const isAdded = status.includes('A') || status.includes('?')
    const isDeleted = status.includes('D')

    if (isModified) {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          M
        </span>
      )
    }
    if (isAdded) {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {status.includes('?') ? 'U' : 'A'}
        </span>
      )
    }
    if (isDeleted) {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
          D
        </span>
      )
    }
    return (
      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-neutral-300 border border-white/10">
        {status}
      </span>
    )
  }

  // Split path for cleaner visual hierarchy (folder muted, filename prominent)
  const formatFilePath = (filePath: string) => {
    const parts = filePath.split('/')
    if (parts.length === 1) {
      return <span className="font-medium text-neutral-200">{filePath}</span>
    }
    const fileName = parts.pop()
    const dir = parts.join('/') + '/'

    return (
      <span className="truncate">
        <span className="opacity-45 text-[10px]">{dir}</span>
        <span className="font-medium text-neutral-200 group-hover:text-cyan-300 transition-colors">
          {fileName}
        </span>
      </span>
    )
  }

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-git-panel="true"
      className="h-full flex flex-col border-l select-none shrink-0 z-20 font-mono text-xs overflow-hidden outline-none relative"
      style={{
        width: width ? `${width}px` : '320px',
        transition: isResizing ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
        color: theme.ui.text,
      }}
    >
      {/* ================= SECTION 1 (TOP): GIT CHANGES (ONLY IF CHANGES EXIST) ================= */}
      {hasActiveProject && gitChanges.length > 0 && (
        <div
          className="flex flex-col max-h-[45%] shrink-0 border-b overflow-hidden"
          style={{ borderColor: theme.ui.border }}
        >
          {/* Header Bar */}
          <div
            className="px-3.5 py-2.5 border-b flex items-center justify-between shrink-0 bg-white/[0.01]"
            style={{ borderColor: theme.ui.border }}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <GitCompare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-bold text-[11px] tracking-wider uppercase text-neutral-300 truncate">
                {t.rightPanel.gitChanges}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-white/10 text-cyan-300 shrink-0">
                {gitChanges.length}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onRefresh}
                className={`p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer ${
                  isRefreshing ? 'animate-spin text-cyan-400' : ''
                }`}
                title="Refresh Git Status"
              >
                <RotateCw className="w-3 h-3" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close Panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Branch Sub-header */}
          <div
            className="px-3.5 py-1.5 border-b flex items-center justify-between text-[10px] text-neutral-400 bg-black/20 shrink-0"
            style={{ borderColor: theme.ui.border }}
          >
            <div className="flex items-center gap-1.5 truncate">
              <GitBranch className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-neutral-500 uppercase font-bold text-[9px]">{t.rightPanel.branch}</span>
              <span className="text-emerald-400 font-bold truncate">
                {hasActiveProject ? branch || 'main' : 'None'}
              </span>
            </div>
            <span className="text-[10px] opacity-60">
              {hasActiveProject ? `${gitChanges.length} ${t.rightPanel.modified}` : '-'}
            </span>
          </div>

          {/* Changed Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {gitChanges.map((change) => (
              <div
                key={change.path}
                onClick={() => {
                  if (onOpenFileAsTerminal) {
                    const fullPath =
                      workspacePath && !/^[a-zA-Z]:[/\\]|^\//.test(change.path)
                        ? `${workspacePath.replace(/[/\\]+$/, '')}/${change.path.replace(/^[/\\]+/, '')}`
                        : change.path
                    onOpenFileAsTerminal(fullPath)
                  } else {
                    onOpenDiff(change.path)
                  }
                }}
                title={`${change.path} (Click to inspect)`}
                className="flex items-center justify-between p-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="truncate text-[11px] leading-tight">
                    {formatFilePath(change.path)}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenDiff(change.path)
                    }}
                    title="Inspect line-by-line diff"
                    className="cursor-pointer"
                  >
                    {getStatusBadge(change.status)}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Inspect All Diffs button */}
          <div
            className="p-2 border-t shrink-0 bg-black/30"
            style={{ borderColor: theme.ui.border }}
          >
            <button
              onClick={() => onOpenDiff()}
              className="w-full py-1.5 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <GitCompare className="w-3 h-3" />
              <span>{t.rightPanel.inspectAllDiffs} ({gitChanges.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= SECTION 2 (BOTTOM): PROJECT FILES & FOLDERS ================= */}
      <div
        className="flex-1 flex flex-col overflow-hidden min-h-0 relative"
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item: null,
          })
        }}
      >
        {/* Explorer Header */}
        <div
          className="px-3.5 py-2.5 border-b flex items-center justify-between shrink-0 bg-white/[0.01]"
          style={{ borderColor: theme.ui.border }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <FolderTree className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-[11px] tracking-wider uppercase text-neutral-300 truncate">
              {t.rightPanel.filesFolders}
            </span>
            {hasActiveProject && workspaceName && (
              <span className="text-[10px] opacity-50 truncate max-w-[80px]">
                {workspaceName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {hasActiveProject && (
              <>
                {/* Paste from Clipboard Button */}
                <button
                  type="button"
                  onClick={() => handlePasteInto(workspacePath || '.')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Salin dari Clipboard Windows (Ctrl+V)"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                </button>

                {/* New File Button */}
                <button
                  type="button"
                  onClick={handleOpenNewFileDialog}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="File Baru"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>

                {/* New Folder Button */}
                <button
                  type="button"
                  onClick={handleOpenNewFolderDialog}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Folder Baru"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => {
                    loadRootItems()
                    setRefreshSeq((p) => p + 1)
                  }}
                  className={`p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer ${
                    isExplorerLoading ? 'animate-spin text-amber-400' : ''
                  }`}
                  title="Refresh File Tree"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </>
            )}

            {/* Close button when Git Changes is hidden */}
            {(!hasActiveProject || gitChanges.length === 0) && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close Panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Root Drag Overlay Indicator */}
        {isRootDragOver && (
          <div className="absolute inset-0 z-30 bg-cyan-950/70 backdrop-blur-xs border-2 border-dashed border-cyan-400/80 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
            <ClipboardPaste className="w-8 h-8 text-cyan-400 mb-2 animate-bounce" />
            <div className="text-xs font-bold text-neutral-100 font-mono">
              Lepaskan untuk Menyalin ke Root Workspace
            </div>
            <div className="text-[10px] text-cyan-300 font-mono mt-1">
              (Tahan Shift untuk Memindahkan)
            </div>
          </div>
        )}

        {/* File Tree List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {!hasActiveProject ? (
            <div className="p-6 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center my-6 space-y-2">
              <FolderTree className="w-6 h-6 text-neutral-600 mx-auto" />
              <div className="text-neutral-300 font-medium text-xs">{t.rightPanel.noFilesToDisplay}</div>
              <div className="text-[10px] text-neutral-500 leading-relaxed">
                {t.rightPanel.addProjectToBrowse}
              </div>
            </div>
          ) : rootItems.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-[11px] flex flex-col items-center gap-2">
              <FolderTree className="w-6 h-6 text-neutral-600" />
              <div>{isExplorerLoading ? t.rightPanel.loadingFiles : t.rightPanel.noFilesFound}</div>
              <div className="text-[10px] text-neutral-600">
                Tarik file atau folder ke sini atau tekan Ctrl+V untuk menyalin
              </div>
            </div>
          ) : (
            rootItems.map((item) => (
              <FileTreeItem
                key={item.path}
                item={item}
                depth={0}
                workspacePath={workspacePath || ''}
                gitChangesMap={gitChangesMap}
                selectedPath={selectedItem?.path || null}
                cutPath={internalClipboard?.operation === 'move' ? internalClipboard.paths[0] : null}
                onOpenDiff={onOpenDiff}
                onOpenFileAsTerminal={onOpenFileAsTerminal}
                onSelectItem={(it) => setSelectedItem(it)}
                onContextMenu={(e, it) => {
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    item: it,
                  })
                }}
                onDropOnFolder={handleDropOnFolder}
                refreshSeq={refreshSeq}
              />
            ))
          )}
        </div>
      </div>

      {/* ================= FLOATING CONTEXT MENU ================= */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-56 p-1.5 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 font-mono text-xs select-none"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 320),
            left: Math.min(contextMenu.x, window.innerWidth - 240),
            backgroundColor: `${theme.ui.surface}f8`,
            borderColor: theme.ui.borderActive,
            boxShadow: `0 12px 35px -5px rgba(0,0,0,0.7), ${theme.ui.activePaneGlow}`,
          }}
        >
          {contextMenu.item && (
            <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 border-b border-white/10 truncate mb-1">
              {contextMenu.item.name}
            </div>
          )}

          {contextMenu.item && (
            <>
              <button
                type="button"
                onClick={handleContextCopy}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span className="flex-1">Salin (Copy)</span>
                <span className="text-[9px] text-neutral-500">Ctrl+C</span>
              </button>

              <button
                type="button"
                onClick={handleContextCut}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span className="flex-1">Potong (Cut)</span>
                <span className="text-[9px] text-neutral-500">Ctrl+X</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleContextPaste}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
            <span className="flex-1">Tempel di sini</span>
            <span className="text-[9px] text-neutral-500">Ctrl+V</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          <button
            type="button"
            onClick={handleOpenNewFolderDialog}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Folder Baru</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewFileDialog}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>File Baru</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          {contextMenu.item && (
            <>
              <button
                type="button"
                onClick={() => handleContextCopyPath(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Salin Path Absolut</span>
              </button>

              <button
                type="button"
                onClick={() => handleContextCopyPath(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Salin Path Relatif</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleContextReveal}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            <span>Buka di Windows Explorer</span>
          </button>

          {contextMenu.item && (
            <>
              <div className="h-px bg-white/10 my-1" />

              <button
                type="button"
                onClick={handleContextRename}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="flex-1">Ganti Nama</span>
                <span className="text-[9px] text-neutral-500">F2</span>
              </button>

              <button
                type="button"
                onClick={handleContextDelete}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="flex-1">Hapus (Recycle Bin)</span>
                <span className="text-[9px] text-rose-400/70">Del</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ================= MODAL DIALOG (RENAME / NEW FILE / NEW FOLDER) ================= */}
      {dialogState && (
        <div
          onClick={() => setDialogState(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-5 rounded-2xl border shadow-2xl flex flex-col gap-3 font-mono text-xs animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: theme.ui.surface,
              borderColor: theme.ui.borderActive,
              boxShadow: `0 20px 40px -10px rgba(0,0,0,0.8), ${theme.ui.activePaneGlow}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-100 uppercase tracking-wider text-xs flex items-center gap-2">
                {dialogState.type === 'rename' && <Edit2 className="w-3.5 h-3.5 text-amber-400" />}
                {dialogState.type === 'newFolder' && <FolderPlus className="w-3.5 h-3.5 text-amber-400" />}
                {dialogState.type === 'newFile' && <FilePlus className="w-3.5 h-3.5 text-cyan-400" />}
                {dialogState.type === 'rename'
                  ? 'Ganti Nama'
                  : dialogState.type === 'newFolder'
                  ? 'Buat Folder Baru'
                  : 'Buat File Baru'}
              </span>
              <button
                type="button"
                onClick={() => setDialogState(null)}
                className="p-1 rounded-md text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleDialogSubmit} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                value={dialogInput}
                onChange={(e) => setDialogInput(e.target.value)}
                placeholder={
                  dialogState.type === 'rename'
                    ? 'Nama baru...'
                    : dialogState.type === 'newFolder'
                    ? 'nama-folder'
                    : 'nama-file.ext'
                }
                className="w-full px-3 py-2 rounded-xl border bg-black/40 text-neutral-100 focus:outline-none focus:border-cyan-400 transition-colors font-mono text-xs"
                style={{ borderColor: theme.ui.border }}
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDialogState(null)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={!dialogInput.trim()}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold transition-colors cursor-pointer shadow-sm"
                >
                  {dialogState.type === 'rename' ? 'Simpan' : 'Buat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
