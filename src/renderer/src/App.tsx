import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Terminal, Plus, Sparkles } from 'lucide-react'
import { TitleBar } from './components/titlebar/TitleBar'
import { Sidebar, type WorkspaceFolder } from './components/sidebar/Sidebar'
import { StatusBar } from './components/statusbar/StatusBar'
import { SplitLayout } from './components/layout/SplitLayout'
import { ResizeHandle } from './components/layout/ResizeHandle'
import { DiffViewer } from './components/diff/DiffViewer'
import { GitChangesPanel } from './components/git/GitChangesPanel'
import { CodeViewerPane } from './components/editor/CodeViewerPane'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { CommandPalette } from './components/palette/CommandPalette'
import { SettingsModal, type SettingsSection } from './components/settings/SettingsModal'
import { IntroExperience } from './components/intro/IntroExperience'
import { BrowserPane } from './components/browser/BrowserPane'
import { UpdateToast } from './components/notifications/UpdateToast'
import { FileTransferToast, showFileToast } from './components/notifications/FileTransferToast'
import { GlobalDropOverlay } from './components/common/GlobalDropOverlay'
import { TodoListPanel } from './components/plugins/TodoListPanel'
import { ScratchNotesPanel } from './components/plugins/ScratchNotesPanel'
import { GraphifyPane } from './components/features/GraphifyPane'
import { McpSkillsModal } from './components/features/McpSkillsModal'
import { CloseConfirmModal } from './components/notifications/CloseConfirmModal'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import { useFeatures } from './context/FeaturesContext'
import { formatPathForPane, formatAgentPath, formatShellPath, resolveAgentKind, isPathInside } from './lib/path-format'
import type { LayoutNode, LeafNode, SplitNode, PaneData, SplitDirection, TabData } from './types/layout'
import type { ShellType, GitFileChange } from '@shared/types'

// Tree manipulation helpers
function collectPaneIds(node: LayoutNode): string[] {
  if (node.type === 'leaf') return [node.paneId]
  return [...collectPaneIds(node.children[0]), ...collectPaneIds(node.children[1])]
}

function splitLeafNode(
  node: LayoutNode,
  targetPaneId: string,
  direction: SplitDirection,
  newPaneId: string
): LayoutNode {
  if (node.type === 'leaf') {
    if (node.paneId === targetPaneId) {
      return {
        id: `split-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'split',
        direction,
        ratio: 0.5,
        children: [
          { type: 'leaf', paneId: targetPaneId },
          { type: 'leaf', paneId: newPaneId },
        ],
      }
    }
    return node
  }

  return {
    ...node,
    children: [
      splitLeafNode(node.children[0], targetPaneId, direction, newPaneId),
      splitLeafNode(node.children[1], targetPaneId, direction, newPaneId),
    ],
  }
}

function removeLeafNode(node: LayoutNode, targetPaneId: string): LayoutNode | null {
  if (node.type === 'leaf') {
    return node.paneId === targetPaneId ? null : node
  }

  const child0 = removeLeafNode(node.children[0], targetPaneId)
  const child1 = removeLeafNode(node.children[1], targetPaneId)

  if (!child0 && !child1) return null
  if (!child0) return child1
  if (!child1) return child0

  return {
    ...node,
    children: [child0, child1],
  }
}

function updateNodeRatio(
  root: LayoutNode,
  targetNodeOrId: LayoutNode | string,
  newRatio: number
): LayoutNode {
  if (root.type === 'split') {
    const isTarget =
      typeof targetNodeOrId === 'string'
        ? root.id === targetNodeOrId
        : root === targetNodeOrId ||
          (Boolean(root.id) &&
            Boolean((targetNodeOrId as SplitNode).id) &&
            root.id === (targetNodeOrId as SplitNode).id)

    if (isTarget) {
      return { ...root, ratio: newRatio }
    }
    return {
      ...root,
      children: [
        updateNodeRatio(root.children[0], targetNodeOrId, newRatio),
        updateNodeRatio(root.children[1], targetNodeOrId, newRatio),
      ],
    }
  }
  return root
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getAgentStartupCommand(agent: string, wsName: string): string {  switch (agent) {
    case 'claude':
      return "if (Get-Command claude -ErrorAction SilentlyContinue) { claude } else { Write-Host \"`n✨ Claude Code: run 'npm install -g @anthropic-ai/claude-code' to install.`n\" -ForegroundColor Yellow }\r"
    case 'opencode':
      return "if (Get-Command opencode -ErrorAction SilentlyContinue) { opencode } else { Write-Host \"`n🚀 OpenCode AI Agent: run 'npm install -g opencode-ai' (or pip install opencode) to install.`n\" -ForegroundColor Cyan }\r"
    case 'aider':
      return "if (Get-Command aider -ErrorAction SilentlyContinue) { aider } else { Write-Host \"`n⚡ Aider AI Pair Programmer: run 'pip install aider-chat' (or npm install -g @aider/cli) to install.`n\" -ForegroundColor Green }\r"
    case 'codex':
      return "if (Get-Command codex -ErrorAction SilentlyContinue) { codex } else { Write-Host \"`n🧠 OpenAI Codex CLI: run 'npm install -g @openai/codex' to install.`n\" -ForegroundColor Magenta }\r"
    case 'cursor':
      return "if (Get-Command cursor -ErrorAction SilentlyContinue) { cursor . } else { Write-Host \"`n🚀 Cursor CLI: run 'cursor' from system PATH or install via Cursor editor.`n\" -ForegroundColor Blue }\r"
    case 'windsurf':
      return "if (Get-Command windsurf -ErrorAction SilentlyContinue) { windsurf . } else { Write-Host \"`n🌊 Windsurf CLI: run 'windsurf' from system PATH or install via Windsurf editor.`n\" -ForegroundColor Cyan }\r"
    case 'omp':
      return "if (Get-Command omp -ErrorAction SilentlyContinue) { omp } else { Write-Host \"`n❖ OMP Multi-Agent Platform: run 'npm install -g @omp/cli' to install.`n\" -ForegroundColor Magenta }\r"
    case 'gemini':
      return "if (Get-Command gemini -ErrorAction SilentlyContinue) { gemini } else { Write-Host \"`n🔥 Gemini Developer CLI: run 'pip install google-genai-cli' to install.`n\" -ForegroundColor Yellow }\r"
    case 'alethe':
      return `Write-Host "\`n🤖 === Alethe Agent Connected to [${wsName}] ===\`n" -ForegroundColor Green\r`
    default:
      return ''
  }
}

export const AppContent: React.FC = () => {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { features } = useFeatures()
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)
  const paneIdCounter = useRef(1)
  const tabIdCounter = useRef(1)

  const WORKSPACES_STORAGE_KEY = 'ferminterm_workspaces'
  const SESSION_TABS_STORAGE_KEY = 'ferminterm_session_tabs'
  const SESSION_PANES_STORAGE_KEY = 'ferminterm_session_panes'

  // Workspaces List state (Single Source of Truth)
  const [workspaces, setWorkspaces] = useState<WorkspaceFolder[]>(() => {
    const saved = localStorage.getItem(WORKSPACES_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed.filter((w) => w.id !== 'ws-default' || w.path !== '.')
        }
      } catch {}
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces))
  }, [workspaces])

  // Active Workspace Folder (Orca System)
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceFolder | null>(() => {
    const saved = localStorage.getItem(WORKSPACES_STORAGE_KEY)
    if (saved) {
      try {
        const list = JSON.parse(saved)
        if (Array.isArray(list)) {
          const valid = list.filter((w) => w.id !== 'ws-default' || w.path !== '.')
          if (valid.length > 0) return valid[0]
        }
      } catch {}
    }
    return null
  })

  // Tabs List - restore from session and sanitize workspace metadata & unique pane IDs
  const [tabs, setTabs] = useState<TabData[]>(() => {
    const savedTabs = localStorage.getItem(SESSION_TABS_STORAGE_KEY)
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const usedPaneIds = new Set<string>()
          let nextPaneSeq = 1

          const upgraded: TabData[] = parsed.map((tab: TabData, idx: number) => {
            let matchedWs = workspaces.find((w) => w.id === tab.workspaceId)
            if (!matchedWs && tab.workspacePath) {
              matchedWs = workspaces.find(
                (w) => w.path.toLowerCase() === tab.workspacePath?.toLowerCase()
              )
            }
            const wsId = matchedWs?.id || tab.workspaceId
            const wsName = matchedWs?.name || tab.workspaceName || 'Terminal'
            const wsColor = matchedWs?.color || tab.workspaceColor || '#3b82f6'
            const wsPath = matchedWs?.path || tab.workspacePath

            // Editor tabs do not have terminal panes
            if (tab.type === 'editor') {
              return {
                ...tab,
                workspaceId: wsId,
                workspaceName: wsName,
                workspaceColor: wsColor,
                workspacePath: wsPath,
              }
            }

            // Ensure each terminal tab has a unique paneId
            let currentPaneId =
              tab.rootNode?.type === 'leaf'
                ? tab.rootNode.paneId
                : tab.activePaneId || `pane-${idx + 1}`

            if (usedPaneIds.has(currentPaneId)) {
              while (usedPaneIds.has(`pane-${nextPaneSeq}`)) {
                nextPaneSeq++
              }
              currentPaneId = `pane-${nextPaneSeq}`
            }
            usedPaneIds.add(currentPaneId)

            return {
              ...tab,
              workspaceId: wsId,
              workspaceName: wsName,
              workspaceColor: wsColor,
              workspacePath: wsPath,
              rootNode: tab.rootNode || { type: 'leaf', paneId: currentPaneId },
              activePaneId: currentPaneId,
            }
          })
          return upgraded
        }
      } catch {}
    }
    if (activeWorkspace) {
      const agentPrefix =
        activeWorkspace.agent && activeWorkspace.agent !== 'none'
          ? `[${activeWorkspace.agent.toUpperCase()}] `
          : ''
      return [
        {
          id: 'tab-1',
          title: `${agentPrefix}${activeWorkspace.name}`,
          type: 'terminal',
          rootNode: { type: 'leaf', paneId: 'pane-1' },
          activePaneId: 'pane-1',
          workspaceId: activeWorkspace.id,
          workspaceName: activeWorkspace.name,
          workspaceColor: activeWorkspace.color,
          workspacePath: activeWorkspace.path,
        },
      ]
    }
    return []
  })

  // Panes Map - constructed in complete harmony with tabs and workspaces
  const [panes, setPanes] = useState<Map<string, PaneData>>(() => {
    const initialMap = new Map<string, PaneData>()
    const savedDefaultShell =
      (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'

    // Try loading saved panes
    const savedPanesStr = localStorage.getItem(SESSION_PANES_STORAGE_KEY)
    if (savedPanesStr) {
      try {
        const parsed = JSON.parse(savedPanesStr)
        if (Array.isArray(parsed)) {
          parsed.forEach(([id, pData]: [string, PaneData]) => {
            if (id && pData) initialMap.set(id, pData)
          })
        }
      } catch {}
    }

    // Ensure EVERY terminal tab has its required panes registered with the correct cwd
    tabs.forEach((tab) => {
      if (tab.type === 'terminal' && tab.rootNode) {
        const pIds = collectPaneIds(tab.rootNode)
        pIds.forEach((pId) => {
          if (!pId) return
          const existing = initialMap.get(pId)
          const ws = workspaces.find((w) => w.id === tab.workspaceId)
          const targetCwd = tab.workspacePath || ws?.path || ''
          const targetWsId = tab.workspaceId || ws?.id

          if (!existing) {
            initialMap.set(pId, {
              id: pId,
              title: tab.title,
              shell: savedDefaultShell,
              cwd: targetCwd,
              workspaceId: targetWsId,
            })
          } else if (targetCwd && existing.cwd?.toLowerCase() !== targetCwd.toLowerCase()) {
            // Correct outdated cwd from previous sessions
            initialMap.set(pId, {
              ...existing,
              cwd: targetCwd,
              workspaceId: targetWsId,
            })
          }
        })
      }
    })

    if (initialMap.size === 0 && activeWorkspace) {
      const agentPrefix =
        activeWorkspace.agent && activeWorkspace.agent !== 'none'
          ? `[${activeWorkspace.agent.toUpperCase()}] `
          : ''
      initialMap.set('pane-1', {
        id: 'pane-1',
        title: `${agentPrefix}${activeWorkspace.name}`,
        shell: savedDefaultShell,
        cwd: activeWorkspace.path,
        workspaceId: activeWorkspace.id,
      })
    }
    return initialMap
  })

  // Keep tab and pane counters above existing maximum IDs
  useEffect(() => {
    const maxTabNum = tabs.reduce((max, t) => {
      const m = t.id.match(/tab-(\d+)/)
      return m ? Math.max(max, parseInt(m[1], 10)) : max
    }, 0)
    tabIdCounter.current = Math.max(tabIdCounter.current, maxTabNum)

    const maxPaneNum = Array.from(panes.keys()).reduce((max, pId) => {
      const m = pId.match(/pane-(\d+)/)
      return m ? Math.max(max, parseInt(m[1], 10)) : max
    }, 0)
    paneIdCounter.current = Math.max(paneIdCounter.current, maxPaneNum)
  }, [tabs, panes])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(SESSION_TABS_STORAGE_KEY, JSON.stringify(tabs))
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [tabs])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          SESSION_PANES_STORAGE_KEY,
          JSON.stringify(Array.from(panes.entries()))
        )
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [panes])

  const [activeTabId, setActiveTabId] = useState<string>(() => (tabs.length > 0 ? tabs[0].id : ''))
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDiffOpen, setIsDiffOpen] = useState(false)
  const [selectedDiffFile, setSelectedDiffFile] = useState<string | undefined>(undefined)
  const [isGitPanelOpen, setIsGitPanelOpen] = useState(true)

  // Resizable Sidebar & Panels state
  const SIDEBAR_WIDTH_STORAGE_KEY = 'ferminterm_sidebar_width'
  const RIGHT_PANEL_WIDTH_STORAGE_KEY = 'ferminterm_right_panel_width'
  const TERMINAL_RIGHT_MARGIN_STORAGE_KEY = 'ferminterm_terminal_right_margin'

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)
      if (saved) {
        const val = parseInt(saved, 10)
        if (!isNaN(val) && val >= 160 && val <= 600) return val
      }
    } catch {}
    return 256
  })

  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(RIGHT_PANEL_WIDTH_STORAGE_KEY)
      if (saved) {
        const val = parseInt(saved, 10)
        if (!isNaN(val) && val >= 200 && val <= 800) return val
      }
    } catch {}
    return 320
  })

  const [terminalRightMargin, setTerminalRightMargin] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(TERMINAL_RIGHT_MARGIN_STORAGE_KEY)
      if (saved) {
        const val = parseInt(saved, 10)
        if (!isNaN(val) && val >= 0 && val <= 800) return val
      }
    } catch {}
    return 0
  })

  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)

  // Sidebar and right-panel widths are persisted on drag completion (handleMouseUp)
  // to prevent synchronous localStorage writes on every mousemove pixel during resize.

  const [gitChanges, setGitChanges] = useState<GitFileChange[]>([])
  const [isRefreshingGit, setIsRefreshingGit] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('account')
  const [isTodoOpen, setIsTodoOpen] = useState(false)
  const [isScratchNotesOpen, setIsScratchNotesOpen] = useState(false)
  const [isGraphifyOpen, setIsGraphifyOpen] = useState(false)
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)

  const [plugins, setPlugins] = useState<Array<{ id: string; enabled: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('ferminterm_plugins')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [
      { id: 'git-control', enabled: true },
      { id: 'theme-pack', enabled: true },
      { id: 'todo-list', enabled: true },
      { id: 'scratch-notes', enabled: true },
    ]
  })

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Array<{ id: string; enabled: boolean }>>
      if (Array.isArray(custom.detail)) setPlugins(custom.detail)
    }
    window.addEventListener('ferminterm:plugins-updated', handler)
    return () => window.removeEventListener('ferminterm:plugins-updated', handler)
  }, [])

  const isPluginEnabled = useCallback(
    (id: string) => {
      const found = plugins.find((p) => p.id === id)
      return found ? found.enabled : true
    },
    [plugins]
  )

  useEffect(() => {
    if (window.ferminAPI?.onRequestClose) {
      const unsub = window.ferminAPI.onRequestClose(() => {
        setIsCloseConfirmOpen(true)
      })
      return unsub
    }
    return undefined
  }, [])

  const handleConfirmClose = () => {
    if (window.ferminAPI?.forceClose) {
      window.ferminAPI.forceClose()
    } else {
      window.close()
    }
  }

  const handleOpenSettings = (section: SettingsSection = 'account') => {
    setSettingsSection(section)
    setIsSettingsOpen(true)
  }
  const [showIntro, setShowIntro] = useState(true)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  useEffect(() => {
    if (window.ferminAPI?.onUpdateReady) {
      const unsubscribe = window.ferminAPI.onUpdateReady(() => {
        setIsUpdateAvailable(true)
      })
      return unsubscribe
    }
    return undefined
  }, [])
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const activePane =
    (activeTab?.activePaneId && panes.get(activeTab.activePaneId)) || panes.values().next().value

  // Capture a screenshot / clipboard image, save it as PNG and send the path
  // to the active terminal so CLI agents can open it.
  const sendScreenshotToTerminal = useCallback(
    async (source: 'screen' | 'clipboard' = 'screen') => {
      const pane = activePane
      const api = window.ferminAPI
      if (!pane?.id || !api) {
        showFileToast(
          'Tidak Ada Terminal Aktif',
          'Buka terminal dulu sebelum mengirim screenshot.',
          'info'
        )
        return
      }

      const result =
        source === 'clipboard'
          ? await api.captureClipboardImage?.(activeWorkspace?.path)
          : await api.captureScreenshot?.(activeWorkspace?.path)

      if (!result || !result.success || !result.path) {
        showFileToast(
          'Screenshot Gagal',
          result?.error || 'Tidak dapat mengambil screenshot.',
          'error'
        )
        return
      }

      const formatted = await formatPathForPane(result.path, {
        paneId: pane.id,
        shell: pane.shell,
        workspaceAgent: activeWorkspace?.agent,
        workspacePath: activeWorkspace?.path,
      })
      api.sendInput(pane.id, `${formatted} `)
      showFileToast(
        source === 'clipboard' ? 'Screenshot Ditempel' : 'Screenshot Terkirim',
        formatted,
        'success'
      )
    },
    [activePane, activeWorkspace]
  )

  // Add new Tab
  // Add new Tab (named after active project from Image 3, never generic Workspace)
  const handleAddTab = useCallback((customTitle?: unknown) => {
    tabIdCounter.current += 1
    paneIdCounter.current += 1
    const newTabId = `tab-${tabIdCounter.current}`
    const newPaneId = `pane-${paneIdCounter.current}`
    const savedDefaultShell =
      (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'

    const targetWs =
      activeWorkspace ||
      (tabs.length > 0 && tabs[0].workspaceId
        ? workspaces.find((w) => w.id === tabs[0].workspaceId)
        : null) ||
      (workspaces.length > 0 ? workspaces[0] : null)

    const validTitle =
      typeof customTitle === 'string' && customTitle.trim() !== ''
        ? customTitle.trim()
        : undefined

    let titleName: string
    if (validTitle) {
      titleName = validTitle
    } else if (targetWs) {
      const sameWorkspaceTabs = tabs.filter(
        (t) =>
          t.type === 'terminal' &&
          (t.workspaceId
            ? t.workspaceId === targetWs.id
            : t.workspacePath
            ? t.workspacePath.toLowerCase() === targetWs.path.toLowerCase()
            : t.title && t.title.includes(targetWs.name))
      )
      const count = sameWorkspaceTabs.length + 1
      titleName =
        count > 1
          ? `${targetWs.name} (${count})`
          : targetWs.name
    } else {
      titleName = `Terminal ${tabIdCounter.current}`
    }

    setPanes((prev) => {
      const next = new Map(prev)
      next.set(newPaneId, {
        id: newPaneId,
        title: titleName,
        shell: savedDefaultShell,
        cwd: targetWs?.path,
        workspaceId: targetWs?.id,
      })
      return next
    })

    const newTab: TabData = {
      id: newTabId,
      title: titleName,
      type: 'terminal',
      rootNode: { type: 'leaf', paneId: newPaneId },
      activePaneId: newPaneId,
      workspaceId: targetWs?.id,
      workspaceName: targetWs?.name,
      workspaceColor: targetWs?.color,
      workspacePath: targetWs?.path,
    }

    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTabId)
    if (targetWs && activeWorkspace?.id !== targetWs.id) {
      setActiveWorkspace(targetWs)
    }
  }, [activeWorkspace, workspaces, tabs])

  const handleSelectTab = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId)
      const clickedTab = tabs.find((t) => t.id === tabId)
      if (clickedTab) {
        let matchingWs = workspaces.find((w) => w.id === clickedTab.workspaceId)
        if (!matchingWs && clickedTab.workspacePath) {
          matchingWs = workspaces.find(
            (w) => w.path.toLowerCase() === clickedTab.workspacePath?.toLowerCase()
          )
        }
        if (matchingWs && activeWorkspace?.id !== matchingWs.id) {
          setActiveWorkspace(matchingWs)
        }

        // Ensure pane is in panes map and has correct cwd (terminal tabs only)
        if (clickedTab.type === 'terminal' && clickedTab.rootNode) {
          const pIds = collectPaneIds(clickedTab.rootNode)
          pIds.forEach((pId) => {
            if (!pId) return
            setPanes((prev) => {
              const current = prev.get(pId)
              const targetCwd = clickedTab.workspacePath || matchingWs?.path || ''
              if (!current || (targetCwd && current.cwd?.toLowerCase() !== targetCwd.toLowerCase())) {
                const next = new Map(prev)
                const savedDefaultShell =
                  (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'
                next.set(pId, {
                  id: pId,
                  title: clickedTab.title,
                  shell: current?.shell || savedDefaultShell,
                  cwd: targetCwd || current?.cwd || '',
                  workspaceId: clickedTab.workspaceId || matchingWs?.id,
                })
                return next
              }
              return prev
            })
          })
        }
      }
    },
    [tabs, workspaces, activeWorkspace]
  )

  const handleCreateWorkspace = useCallback(
    (newWs: WorkspaceFolder) => {
      setWorkspaces((prev) => {
        const filtered = prev.filter((w) => w.path.toLowerCase() !== newWs.path.toLowerCase())
        return [...filtered, newWs]
      })
      setActiveWorkspace(newWs)

      // Check if existing tab
      const existingTab = tabs.find(
        (t) =>
          t.type === 'terminal' &&
          (t.workspaceId === newWs.id ||
            (!t.workspaceId && t.workspacePath && t.workspacePath.toLowerCase() === newWs.path.toLowerCase()))
      )
      if (existingTab) {
        setActiveTabId(existingTab.id)
        return
      }

      tabIdCounter.current += 1
      paneIdCounter.current += 1
      const newTabId = `tab-${tabIdCounter.current}`
      const newPaneId = `pane-${paneIdCounter.current}`
      const savedDefaultShell =
        (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'
      const agentPrefix =
        newWs.agent && newWs.agent !== 'none' ? `[${newWs.agent.toUpperCase()}] ` : ''
      const targetTitle = `${agentPrefix}${newWs.name}`

      setPanes((prev) => {
        const next = new Map(prev)
        next.set(newPaneId, {
          id: newPaneId,
          title: targetTitle,
          shell: savedDefaultShell,
          cwd: newWs.path,
          workspaceId: newWs.id,
        })
        return next
      })

      const newTab: TabData = {
        id: newTabId,
        title: targetTitle,
        type: 'terminal',
        rootNode: { type: 'leaf', paneId: newPaneId },
        activePaneId: newPaneId,
        workspaceId: newWs.id,
        workspaceName: newWs.name,
        workspaceColor: newWs.color,
        workspacePath: newWs.path,
      }

      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTabId)

      if (newWs.agent && newWs.agent !== 'none') {
        const agentCmd = getAgentStartupCommand(newWs.agent, newWs.name)
        if (agentCmd) {
          setTimeout(() => {
            window.ferminAPI?.sendInput(newPaneId, agentCmd)
          }, 800)
        }
      }
    },
    [tabs]
  )

  const handleRenameWorkspace = useCallback((id: string, newName: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: newName } : w))
    )
    setActiveWorkspace((prev) => (prev && prev.id === id ? { ...prev, name: newName } : prev))
    setTabs((prev) =>
      prev.map((t) => (t.workspaceId === id ? { ...t, workspaceName: newName } : t))
    )
  }, [])

  // Select Workspace Folder (Orca System)
  // Fetch git changes for active workspace
  const refreshGitChanges = useCallback(async (manual = false) => {
    if (
      !activeWorkspace ||
      !activeWorkspace.path ||
      !activeWorkspace.isGit ||
      !window.ferminAPI?.getGitStatus
    ) {
      setGitChanges([])
      return
    }
    if (manual) {
      setIsRefreshingGit(true)
    }
    try {
      const res = await window.ferminAPI.getGitStatus(activeWorkspace.path)
      const nextFiles = res.files || []
      setGitChanges((prev) => {
        if (
          prev.length === nextFiles.length &&
          prev.every(
            (f, i) =>
              f.path === nextFiles[i].path &&
              f.status === nextFiles[i].status
          )
        ) {
          return prev
        }
        return nextFiles
      })
    } catch {
      setGitChanges([])
    } finally {
      if (manual) {
        setIsRefreshingGit(false)
      }
    }
  }, [activeWorkspace])
  // Type absolute paths into the active terminal (default drag & drop mode).
  const handleInsertPaths = useCallback(
    async (paths: string[], explicitPaneId?: string) => {
      if (!paths.length) return false
      const pane = (explicitPaneId ? panes.get(explicitPaneId) : undefined) || activePane
      const api = window.ferminAPI

      if (!pane?.id || !api?.sendInput) {
        return false
      }

      const agentKind = await resolveAgentKind(pane.id, activeWorkspace?.agent)
      const targetCwd = pane.cwd || activeWorkspace?.path
      const formatted = paths
        .map((item) =>
          agentKind !== 'none'
            ? formatAgentPath(item, targetCwd)
            : formatShellPath(item, pane.shell)
        )
        .join(' ')

      api.sendInput(pane.id, `${formatted} `)
      return true
    },
    [activePane, activeWorkspace, panes]
  )

  // Global file drop & copy/move handler
  const handleGlobalFilesDropped = useCallback(
    async (sourcePaths: string[], targetDir: string, operation: 'copy' | 'move') => {
      if (!window.ferminAPI?.copyOrMovePaths) return undefined
      const res = await window.ferminAPI.copyOrMovePaths(sourcePaths, targetDir, operation)
      if (res.success) {
        const failed = res.errors?.length ? ` • ${res.errors.length} gagal` : ''
        showFileToast(
          operation === 'move' ? 'File Berhasil Dipindahkan' : 'File Berhasil Disalin',
          `${res.count} item ${operation === 'move' ? 'dipindahkan' : 'disalin'} ke ${targetDir}${failed}`,
          operation === 'move' ? 'move' : 'copy'
        )
        refreshGitChanges()
        window.dispatchEvent(new CustomEvent('ferminterm:refresh-explorer'))
      } else {
        showFileToast(
          'Gagal Mentransfer File',
          res.errors?.join('\n') || 'Terjadi kesalahan saat menyalin file.',
          'error'
        )
      }
      return res
    },
    [refreshGitChanges]
  )

  // Global paste handler:
  // 1. Images -> save as screenshot and send the path to the active terminal
  // 2. Files  -> copy them from Windows clipboard into the active workspace
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      // xterm keeps a hidden textarea focused; treat it as the terminal, not
      // as an editable input, so pasted screenshots still work there.
      const isXterm = !!target?.closest('.xterm')
      const isEditable =
        !isXterm &&
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          !!target.closest('input, textarea, [contenteditable="true"]'))

      if (isEditable) return

      const clipboardFiles = Array.from(e.clipboardData?.files || [])
      const imageFile = clipboardFiles.find((file) => file.type.startsWith('image/'))

      // 1. Pasted screenshot / image
      if (imageFile) {
        e.preventDefault()
        e.stopPropagation()
        const pane = activePane
        const api = window.ferminAPI
        if (!pane?.id || !api) {
          showFileToast(
            'Tidak Ada Terminal Aktif',
            'Buka terminal dulu sebelum mengirim screenshot.',
            'info'
          )
          return
        }

        try {
          const dataUrl = await readFileAsDataUrl(imageFile)
          const saved = dataUrl
            ? await api.saveScreenshotDataUrl?.(dataUrl, activeWorkspace?.path)
            : await api.captureClipboardImage?.(activeWorkspace?.path)

          if (saved?.success && saved.path) {
            const formatted = await formatPathForPane(saved.path, {
              paneId: pane.id,
              shell: pane.shell,
              workspaceAgent: activeWorkspace?.agent,
              workspacePath: activeWorkspace?.path,
            })
            api.sendInput(pane.id, `${formatted} `)
            showFileToast('Screenshot Ditempel', formatted, 'success')
          } else {
            showFileToast(
              'Screenshot Gagal',
              saved?.error || 'Gambar dari clipboard tidak dapat disimpan.',
              'error'
            )
          }
        } catch {
          showFileToast('Screenshot Gagal', 'Gambar dari clipboard tidak dapat dibaca.', 'error')
        }
        return
      }

      // 2. Files pasted while a terminal is focused -> type their paths into
      //    the shell prompt instead of copying anything.
      const clipboardTypes = Array.from(e.clipboardData?.types || [])
      const hasFilePayload = clipboardFiles.length > 0 || clipboardTypes.includes('Files')

      if (isXterm && hasFilePayload) {
        e.preventDefault()
        e.stopPropagation()
        const pane = activePane
        const api = window.ferminAPI
        if (!pane?.id || !api?.sendInput) {
          showFileToast(
            'Tidak Ada Terminal Aktif',
            'Buka terminal dulu sebelum menempel file.',
            'info'
          )
          return
        }

        const paths: string[] = []
        for (const file of clipboardFiles) {
          const p = api.getPathForFile ? api.getPathForFile(file) : ''
          if (p) paths.push(p)
        }
        if (paths.length === 0 && api.getClipboardFiles) {
          const res = await api.getClipboardFiles()
          if (res?.success && res.files?.length) paths.push(...res.files)
        }

        if (paths.length === 0) {
          showFileToast(
            'Clipboard Tidak Berisi File',
            'Copy file dari Explorer dulu, atau seret file langsung ke terminal.',
            'info'
          )
          return
        }

        const formatted = (
          await Promise.all(
            paths.map((item) =>
              formatPathForPane(item, {
                paneId: pane.id,
                shell: pane.shell,
                workspaceAgent: activeWorkspace?.agent,
                workspacePath: activeWorkspace?.path,
              })
            )
          )
        ).join(' ')
        api.sendInput(pane.id, `${formatted} `)
        showFileToast(
          paths.length > 1 ? `${paths.length} Referensi Ditempel` : 'Referensi Ditempel ke Terminal',
          formatted,
          'success'
        )
        return
      }

      if (isXterm) return

      if (!activeWorkspace?.path) return

      // 3. Real files copied from Windows Explorer (outside a terminal)
      if (clipboardFiles.length > 0) {
        e.preventDefault()
        const paths: string[] = []
        for (const file of clipboardFiles) {
          const p = window.ferminAPI?.getPathForFile ? window.ferminAPI.getPathForFile(file) : ''
          if (p) paths.push(p)
        }
        if (paths.length > 0) {
          await handleGlobalFilesDropped(paths, activeWorkspace.path, 'copy')
          return
        }
      }

      // 4. FileDropList fallback (Explorer "Copy" puts paths there)
      if (window.ferminAPI?.getClipboardFiles) {
        const clipRes = await window.ferminAPI.getClipboardFiles()
        if (clipRes.success && clipRes.files && clipRes.files.length > 0) {
          e.preventDefault()
          await handleGlobalFilesDropped(clipRes.files, activeWorkspace.path, 'copy')
        }
      }
    }

    // Capture phase so xterm never swallows pasted screenshots.
    window.addEventListener('paste', handlePaste, true)
    return () => window.removeEventListener('paste', handlePaste, true)
  }, [activePane, activeWorkspace, handleGlobalFilesDropped])
  // Global dragover safety so Chromium allows file drops everywhere
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    window.addEventListener('dragover', handleDragOver, false)
    return () => window.removeEventListener('dragover', handleDragOver, false)
  }, [])



  useEffect(() => {
    refreshGitChanges()
    if (!activeWorkspace) return
    // Gentle 10s polling interval only when the window is in foreground
    const timer = setInterval(() => {
      if (document.hasFocus()) {
        refreshGitChanges()
      }
    }, 10000)
    return () => clearInterval(timer)
  }, [refreshGitChanges, activeWorkspace])

  // Immediate status sync when returning to the application
  useEffect(() => {
    const handleFocus = () => {
      if (activeWorkspace) {
        refreshGitChanges()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshGitChanges, activeWorkspace])

  // Select Workspace Folder (Orca System)
  const handleSelectWorkspace = useCallback(
    (ws: WorkspaceFolder | null, openTerminal = false, launchAgent = false) => {
      setActiveWorkspace(ws)
      if (!ws) return

      const agentPrefix =
        (launchAgent || (ws.agent && ws.agent !== 'none')) && ws.agent && ws.agent !== 'none'
          ? `[${ws.agent.toUpperCase()}] `
          : ''
      const targetTitle = `${agentPrefix}${ws.name}`

      // Check if there is an existing terminal tab for this specific workspace
      const existingTab = tabs.find(
        (t) =>
          t.type === 'terminal' &&
          (t.workspaceId === ws.id ||
            (!t.workspaceId && t.workspacePath && t.workspacePath.toLowerCase() === ws.path.toLowerCase()))
      )

      if (existingTab) {
        const existingPaneId =
          existingTab.activePaneId ||
          (existingTab.rootNode?.type === 'leaf' ? existingTab.rootNode.paneId : undefined)

        if (existingPaneId) {
          setPanes((prev) => {
            const current = prev.get(existingPaneId)
            if (!current || current.cwd?.toLowerCase() !== ws.path.toLowerCase()) {
              const next = new Map(prev)
              const savedDefaultShell =
                (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'
              next.set(existingPaneId, {
                id: existingPaneId,
                title: targetTitle,
                shell: current?.shell || savedDefaultShell,
                cwd: ws.path,
                workspaceId: ws.id,
              })
              return next
            }
            return prev
          })
        }

        // Ensure workspace info is tagged on existing tab if missing
        setTabs((prev) =>
          prev.map((t) =>
            t.id === existingTab.id
              ? {
                  ...t,
                  workspaceId: ws.id,
                  workspaceName: ws.name,
                  workspaceColor: ws.color,
                  workspacePath: ws.path,
                }
              : t
          )
        )

        if (launchAgent && ws.agent && ws.agent !== 'none') {
          const targetPaneId =
            existingTab.activePaneId ||
            (existingTab.rootNode.type === 'leaf' ? existingTab.rootNode.paneId : undefined)
          if (targetPaneId) {
            const agentCmd = getAgentStartupCommand(ws.agent, ws.name)
            if (agentCmd) {
              setTimeout(() => {
                window.ferminAPI?.sendInput(targetPaneId, agentCmd)
              }, 600)
            }
          }
        }
        setActiveTabId(existingTab.id)
        return
      }

      // If no tab exists for this workspace, create one dedicated to it!
      tabIdCounter.current += 1
      paneIdCounter.current += 1
      const newTabId = `tab-${tabIdCounter.current}`
      const newPaneId = `pane-${paneIdCounter.current}`
      const savedDefaultShell =
        (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'

      setPanes((prev) => {
        const next = new Map(prev)
        next.set(newPaneId, {
          id: newPaneId,
          title: targetTitle,
          shell: savedDefaultShell,
          cwd: ws.path,
          workspaceId: ws.id,
        })
        return next
      })

      const newTab: TabData = {
        id: newTabId,
        title: targetTitle,
        type: 'terminal',
        rootNode: { type: 'leaf', paneId: newPaneId },
        activePaneId: newPaneId,
        workspaceId: ws.id,
        workspaceName: ws.name,
        workspaceColor: ws.color,
        workspacePath: ws.path,
      }

      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTabId)

      if (launchAgent && ws.agent && ws.agent !== 'none') {
        const agentCmd = getAgentStartupCommand(ws.agent, ws.name)
        if (agentCmd) {
          setTimeout(() => {
            window.ferminAPI?.sendInput(newPaneId, agentCmd)
          }, 800)
        }
      }
    },
    [tabs, panes]
  )

  // Spawn a fresh terminal dedicated to a specific workspace folder
  const handleSpawnTerminalInWorkspace = useCallback(
    (ws: WorkspaceFolder, e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      setActiveWorkspace(ws)

      tabIdCounter.current += 1
      paneIdCounter.current += 1
      const newTabId = `tab-${tabIdCounter.current}`
      const newPaneId = `pane-${paneIdCounter.current}`
      const savedDefaultShell =
        (localStorage.getItem('ferminterm_default_shell') as ShellType) || 'powershell'

      const sameWorkspaceTabs = tabs.filter(
        (t) =>
          t.type === 'terminal' &&
          (t.workspaceId === ws.id || (!t.workspaceId && t.workspacePath === ws.path))
      )
      const count = sameWorkspaceTabs.length + 1
      const titleName = count > 1 ? `${ws.name} (${count})` : ws.name

      setPanes((prev) => {
        const next = new Map(prev)
        next.set(newPaneId, {
          id: newPaneId,
          title: titleName,
          shell: savedDefaultShell,
          cwd: ws.path,
          workspaceId: ws.id,
        })
        return next
      })

      const newTab: TabData = {
        id: newTabId,
        title: titleName,
        type: 'terminal',
        rootNode: { type: 'leaf', paneId: newPaneId },
        activePaneId: newPaneId,
        workspaceId: ws.id,
        workspaceName: ws.name,
        workspaceColor: ws.color,
        workspacePath: ws.path,
      }

      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTabId)
    },
    [tabs]
  )

  // Delete Workspace and automatically terminate all of its terminals & tabs
  const handleDeleteWorkspace = useCallback(
    (deletedId: string, deletedWs: WorkspaceFolder | undefined, nextWs: WorkspaceFolder | null) => {
      setActiveWorkspace(nextWs)
      setWorkspaces((prev) => prev.filter((w) => w.id !== deletedId))

      setTabs((prevTabs) => {
        // If all workspaces are deleted, terminate all tabs and panes!
        if (!nextWs) {
          panes.forEach((p) => {
            window.ferminAPI?.closeTerminal(p.id)
          })
          setPanes(new Map())
          setActiveTabId('')
          return []
        }

        const deletedPath = deletedWs?.path?.toLowerCase()

        const tabsToClose = prevTabs.filter((t) => {
          if (!deletedWs) return false
          if (t.workspaceId === deletedId) return true
          if (
            t.workspacePath &&
            deletedPath &&
            t.workspacePath.toLowerCase() === deletedPath
          ) {
            return true
          }
          if (
            t.type === 'editor' &&
            t.filePath &&
            deletedPath &&
            t.filePath.toLowerCase().startsWith(deletedPath)
          ) {
            return true
          }
          if (t.rootNode && t.rootNode.type === 'leaf' && t.rootNode.paneId) {
            const pane = panes.get(t.rootNode.paneId)
            if (pane?.workspaceId === deletedId) return true
            if (pane?.cwd && deletedPath && pane.cwd.toLowerCase().startsWith(deletedPath)) {
              return true
            }
          }
          return false
        })

        // Kill processes for tabs to close
        tabsToClose.forEach((t) => {
          if (t.rootNode) {
            const paneIds = collectPaneIds(t.rootNode)
            paneIds.forEach((pId) => {
              window.ferminAPI?.closeTerminal(pId)
              setPanes((prev) => {
                const next = new Map(prev)
                next.delete(pId)
                return next
              })
            })
          }
        })

        const remainingTabs = prevTabs.filter((t) => !tabsToClose.includes(t))
        if (remainingTabs.length === 0) {
          setActiveTabId('')
          return []
        }

        if (tabsToClose.some((t) => t.id === activeTabId)) {
          setActiveTabId(remainingTabs[0].id)
        }

        return remainingTabs
      })
    },
    [panes, activeTabId]
  )
  // Open clicked project file in a dedicated Code Viewer tab
  const handleOpenFile = useCallback(
    (filePath: string) => {
      const isAbsolute = /^[a-zA-Z]:[/\\]|^\//.test(filePath)
      const targetWs = activeWorkspace || (workspaces.length > 0 ? workspaces[0] : null)
      const resolvedPath =
        !isAbsolute && targetWs?.path
          ? `${targetWs.path.replace(/[/\\]+$/, '')}/${filePath.replace(/^[/\\]+/, '')}`
          : filePath

      const fileName = resolvedPath.split(/[/\\]/).pop() || resolvedPath

      // If an editor tab with this filePath already exists, switch focus to it
      const existingTab = tabs.find(
        (t) =>
          t.type === 'editor' &&
          t.filePath &&
          t.filePath.toLowerCase() === resolvedPath.toLowerCase()
      )
      if (existingTab) {
        setActiveTabId(existingTab.id)
        return
      }

      tabIdCounter.current += 1
      const newTabId = `tab-${tabIdCounter.current}`

      const newTab: TabData = {
        id: newTabId,
        title: fileName,
        type: 'editor',
        filePath: resolvedPath,
        rootNode: { type: 'leaf', paneId: '' },
        activePaneId: '',
        workspaceId: targetWs?.id,
        workspaceName: targetWs?.name,
        workspaceColor: targetWs?.color,
        workspacePath: targetWs?.path,
      }

      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTabId)
    },
    [tabs, activeWorkspace, workspaces]
  )

  // Close Tab and terminate underlying PTY terminal processes if terminal
  const handleCloseTab = useCallback((tabIdToClose: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    setTabs((prevTabs) => {
      const closingTab = prevTabs.find((t) => t.id === tabIdToClose)
      if (closingTab && closingTab.type === 'terminal' && closingTab.rootNode) {
        const panesToClean = collectPaneIds(closingTab.rootNode)
        // Kill background PTY terminal sessions
        panesToClean.forEach((pId) => {
          if (pId) window.ferminAPI?.closeTerminal(pId)
        })
        setPanes((prevPanes) => {
          const nextPanes = new Map(prevPanes)
          panesToClean.forEach((pId) => nextPanes.delete(pId))
          return nextPanes
        })
      }

      const filtered = prevTabs.filter((t) => t.id !== tabIdToClose)
      if (filtered.length === 0) {
        setActiveTabId('')
        return []
      }

      if (activeTabId === tabIdToClose) {
        const closingIdx = prevTabs.findIndex((t) => t.id === tabIdToClose)
        const nextActiveIdx = Math.max(0, Math.min(closingIdx, filtered.length - 1))
        const nextActiveTab = filtered[nextActiveIdx]
        setActiveTabId(nextActiveTab.id)

        // Sync active workspace with newly activated tab
        let matchedWs = workspaces.find((w) => w.id === nextActiveTab.workspaceId)
        if (!matchedWs && nextActiveTab.workspacePath) {
          matchedWs = workspaces.find(
            (w) => w.path.toLowerCase() === nextActiveTab.workspacePath?.toLowerCase()
          )
        }
        if (matchedWs) {
          setActiveWorkspace(matchedWs)
        }
      }
      return filtered
    })
  }, [activeTabId, workspaces])

  // Split Pane
  const handleSplitPane = useCallback((targetPaneId: string, direction: SplitDirection, customShell?: ShellType, customTitle?: string) => {
    paneIdCounter.current += 1
    const newPaneId = `pane-${paneIdCounter.current}`

    const targetPane = panes.get(targetPaneId)
    const shell: ShellType = customShell || (targetPane ? targetPane.shell : 'powershell')
    const title = customTitle || shell.toUpperCase()
    const cwd = targetPane?.cwd || activeWorkspace?.path

    setPanes((prev) => {
      const next = new Map(prev)
      next.set(newPaneId, {
        id: newPaneId,
        title,
        shell,
        cwd,
      })
      return next
    })

    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id !== activeTabId) return tab
        const newRoot = splitLeafNode(tab.rootNode, targetPaneId, direction, newPaneId)
        return {
          ...tab,
          rootNode: newRoot,
          activePaneId: newPaneId,
        }
      })
    )
  }, [activeTabId, activeWorkspace, panes])

  // Close Pane and terminate PTY process
  const handleClosePane = useCallback((paneIdToClose: string) => {
    if (!activeTab?.rootNode) return
    const activePanes = collectPaneIds(activeTab.rootNode)
    if (activePanes.length <= 1) {
      if (activeTab) handleCloseTab(activeTab.id)
      return
    }

    // Kill background PTY terminal session
    window.ferminAPI?.closeTerminal(paneIdToClose)

    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id !== activeTabId) return tab
        const newRoot = removeLeafNode(tab.rootNode, paneIdToClose)
        if (!newRoot) return tab

        const remainingPanes = collectPaneIds(newRoot)
        const nextActive = remainingPanes.includes(tab.activePaneId)
          ? tab.activePaneId
          : remainingPanes[0]

        return {
          ...tab,
          rootNode: newRoot,
          activePaneId: nextActive,
        }
      })
    )

    setPanes((prev) => {
      const next = new Map(prev)
      next.delete(paneIdToClose)
      return next
    })
  }, [activeTab, activeTabId, handleCloseTab])

  // Focus Pane: activates the tab owning this pane and syncs workspace
  const handleFocusPane = useCallback((paneId: string) => {
    const ownerTab = tabs.find((t) => t.rootNode && collectPaneIds(t.rootNode).includes(paneId))
    if (ownerTab) {
      setActiveTabId(ownerTab.id)
      let matchedWs = workspaces.find((w) => w.id === ownerTab.workspaceId)
      if (!matchedWs && ownerTab.workspacePath) {
        matchedWs = workspaces.find(
          (w) => w.path.toLowerCase() === ownerTab.workspacePath?.toLowerCase()
        )
      }
      if (matchedWs) {
        setActiveWorkspace(matchedWs)
      }

      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === ownerTab.id ? { ...tab, activePaneId: paneId } : tab
        )
      )
    }
  }, [tabs, workspaces])
  // Change Shell
  const handleChangeShell = useCallback((paneId: string, shell: ShellType) => {
    setPanes((prev) => {
      const next = new Map(prev)
      const current = next.get(paneId)
      if (current) {
        next.set(paneId, { ...current, shell, title: shell.toUpperCase() })
      }
      return next
    })
  }, [])

  // Update Ratio
  const handleUpdateRatio = useCallback((splitNodeOrId: LayoutNode | string, newRatio: number) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id !== activeTabId) return tab
        return {
          ...tab,
          rootNode: updateNodeRatio(tab.rootNode, splitNodeOrId, newRatio),
        }
      })
    )
  }, [activeTabId])

  // Active right panel detection
  const hasActiveRightPanel = Boolean(
    (features.gitDiff && isPluginEnabled('git-control') && isGitPanelOpen) ||
    (isPluginEnabled('todo-list') && isTodoOpen) ||
    (isPluginEnabled('scratch-notes') && isScratchNotesOpen) ||
    (features.graphify && isGraphifyOpen) ||
    ((features.browser || features.browserPreview) && isBrowserOpen) ||
    (features.gitDiff && isDiffOpen)
  )

  const handleLeftReset = useCallback(() => {
    setSidebarWidth(256)
  }, [])

  const handleRightReset = useCallback(() => {
    if (hasActiveRightPanel) {
      setRightPanelWidth(380)
      try {
        localStorage.setItem(RIGHT_PANEL_WIDTH_STORAGE_KEY, '380')
      } catch {}
    } else {
      setTerminalRightMargin(0)
      try {
        localStorage.setItem(TERMINAL_RIGHT_MARGIN_STORAGE_KEY, '0')
      } catch {}
    }
  }, [hasActiveRightPanel])

  const handleLeftMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDraggingLeft(true)
      const startX = e.clientX
      const startWidth = sidebarWidth
      let latestWidth = startWidth

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX
        const maxAllowed = Math.min(600, Math.floor(window.innerWidth * 0.5))
        latestWidth = Math.max(160, Math.min(maxAllowed, startWidth + delta))
        setSidebarWidth(latestWidth)
      }

      const handleMouseUp = () => {
        setIsDraggingLeft(false)
        try {
          localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, latestWidth.toString())
        } catch {}
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [sidebarWidth]
  )

  const handleRightMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDraggingRight(true)
      const startX = e.clientX

      if (hasActiveRightPanel) {
        const startWidth = rightPanelWidth
        let latestWidth = startWidth
        const handleMouseMove = (moveEvent: MouseEvent) => {
          const delta = startX - moveEvent.clientX
          const maxAllowed = Math.min(800, Math.floor(window.innerWidth * 0.6))
          latestWidth = Math.max(200, Math.min(maxAllowed, startWidth + delta))
          setRightPanelWidth(latestWidth)
        }

        const handleMouseUp = () => {
          setIsDraggingRight(false)
          try {
            localStorage.setItem(RIGHT_PANEL_WIDTH_STORAGE_KEY, latestWidth.toString())
          } catch {}
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
      } else {
        const startMargin = terminalRightMargin
        let latestMargin = startMargin
        const handleMouseMove = (moveEvent: MouseEvent) => {
          const delta = startX - moveEvent.clientX
          const maxAllowed = Math.min(800, Math.floor(window.innerWidth * 0.5))
          latestMargin = Math.max(0, Math.min(maxAllowed, startMargin + delta))
          setTerminalRightMargin(latestMargin)
        }

        const handleMouseUp = () => {
          setIsDraggingRight(false)
          try {
            localStorage.setItem(TERMINAL_RIGHT_MARGIN_STORAGE_KEY, latestMargin.toString())
          } catch {}
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('mouseup', handleMouseUp)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
      }
    },
    [hasActiveRightPanel, rightPanelWidth, terminalRightMargin]
  )

  // Open Diff Viewer
  const handleOpenDiff = useCallback((filePath?: string) => {
    setSelectedDiffFile(filePath)
    setIsDiffOpen(true)
  }, [])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey

      if (isCtrl && e.key.toLowerCase() === 't' && !e.shiftKey) {
        e.preventDefault()
        handleAddTab()
      } else if (isCtrl && e.key.toLowerCase() === 'w' && !e.shiftKey) {
        e.preventDefault()
        handleCloseTab(activeTabId)
      } else if (isCtrl && e.shiftKey && e.key.toUpperCase() === 'D') {
        e.preventDefault()
        if (activeTab?.activePaneId) {
          handleSplitPane(activeTab.activePaneId, 'horizontal')
        }
      } else if (isCtrl && e.shiftKey && e.key.toUpperCase() === 'E') {
        e.preventDefault()
        if (activeTab?.activePaneId) {
          handleSplitPane(activeTab.activePaneId, 'vertical')
        }
      } else if (isCtrl && e.shiftKey && e.key.toUpperCase() === 'W') {
        e.preventDefault()
        if (activeTab?.activePaneId) {
          handleClosePane(activeTab.activePaneId)
        }
      } else if (isCtrl && e.shiftKey && e.key.toUpperCase() === 'S') {
        e.preventDefault()
        void sendScreenshotToTerminal('screen')
      } else if (isCtrl && e.shiftKey && e.key.toUpperCase() === 'G') {
        e.preventDefault()
        setIsGitPanelOpen((prev) => !prev)
      } else if (isCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setIsSidebarOpen((prev) => !prev)
      } else if (isCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsPaletteOpen((prev) => !prev)
      } else if (isCtrl && e.key === ',') {
        e.preventDefault()
        setIsSettingsOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        if (isPaletteOpen) setIsPaletteOpen(false)
        if (isSettingsOpen) setIsSettingsOpen(false)
        if (isDiffOpen) setIsDiffOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeTab?.activePaneId,
    activeTabId,
    handleAddTab,
    handleClosePane,
    handleCloseTab,
    handleSplitPane,
    isDiffOpen,
    isPaletteOpen,
    isSettingsOpen,
    sendScreenshotToTerminal,
  ])

  const totalActivePanes = activeTab?.rootNode ? collectPaneIds(activeTab.rootNode).length : 0

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: theme.ui.background }}
    >
      {/* 1. Frameless Integrated Titlebar with Search & Sidebar Toggle */}
      <TitleBar
        tabs={tabs}
        activeTabId={activeTabId}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isGitPanelOpen={isGitPanelOpen}
        onToggleGitPanel={() => setIsGitPanelOpen((prev) => !prev)}
        gitChangesCount={gitChanges.length}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onSelectTab={handleSelectTab}
        onAddTab={() => handleAddTab()}
        onCloseTab={handleCloseTab}
        onOpenSettings={() => handleOpenSettings('account')}
      />

      {/* 2. Middle Body: Sidebar + Multiplexer Panes + Diff Viewer */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        {/* Orca-Style Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          panes={panes}
          workspaces={workspaces}
          tabs={tabs}
          activeTab={activeTab}
          activePaneId={activeTab?.activePaneId || ''}
          activeWorkspace={activeWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          onSelectWorkspace={handleSelectWorkspace}
          onFocusPane={handleFocusPane}
          onSplit={(dir) => {
            if (activeTab?.activePaneId) handleSplitPane(activeTab.activePaneId, dir)
          }}
          onNewTab={() => handleAddTab()}
          onOpenSettings={() => handleOpenSettings('account')}
          onOpenDiff={handleOpenDiff}
          onAddTerminalToWorkspace={handleSpawnTerminalInWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          width={sidebarWidth}
          isResizing={isDraggingLeft}
        />

        {/* Left Resize Handle: Between Sidebar & Terminal */}
        {isSidebarOpen && (
          <ResizeHandle
            direction="vertical"
            isDragging={isDraggingLeft}
            onMouseDown={handleLeftMouseDown}
            onDoubleClick={handleLeftReset}
            title="Tarik untuk mengecilkan / melebarkan Sidebar & Terminal (Klik 2x reset 256px)"
          />
        )}
        {/* Center Workspace: Empty Welcome Canvas, Code Editor, or Multiplexer Terminals */}
        <div className="flex-1 h-full overflow-hidden relative">
          {!activeTab || tabs.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center p-8 select-none text-center font-mono">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4 shadow-xl">
                <Terminal className="w-8 h-8 text-neutral-500" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">
                {activeWorkspace ? activeWorkspace.name : t.welcome.noActiveProject}
              </h3>
              <p className="text-xs text-neutral-400 max-w-md leading-relaxed mb-6">
                {activeWorkspace
                  ? `${activeWorkspace.name} • ${t.welcome.projectActiveDesc}`
                  : t.welcome.noProjectDesc}
              </p>

              <div className="flex items-center gap-3">
                {activeWorkspace ? (
                  <button
                    onClick={() => handleAddTab()}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {t.welcome.openTerminalIn} {activeWorkspace.name}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('ferminterm:open-new-project'))
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t.welcome.newProjectAi}</span>
                  </button>
                )}
              </div>
            </div>
          ) : activeTab.type === 'editor' ? (
            activeTab.filePath ? (
              <ErrorBoundary fallbackTitle={`Code Viewer [${activeTab.title}]`}>
                <CodeViewerPane
                  filePath={activeTab.filePath}
                  fileName={activeTab.title}
                  onClose={() => handleCloseTab(activeTab.id)}
                />
              </ErrorBoundary>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-neutral-500 font-mono">
                No file selected.
              </div>
            )
          ) : activeTab.rootNode && activeTab.activePaneId ? (
            <SplitLayout
              node={activeTab.rootNode}
              panes={panes}
              activePaneId={activeTab.activePaneId}
              totalPanesCount={totalActivePanes}
              onFocus={handleFocusPane}
              onSplit={(targetId, dir) => handleSplitPane(targetId, dir)}
              onClose={handleClosePane}
              onChangeShell={handleChangeShell}
              onUpdateRatio={handleUpdateRatio}
            />
          ) : null}
        </div>
        {/* Right Resize Handle: Between Terminal & Right Panel (or Right Margin) */}
        <ResizeHandle
          direction="vertical"
          isDragging={isDraggingRight}
          onMouseDown={handleRightMouseDown}
          onDoubleClick={handleRightReset}
          title={
            hasActiveRightPanel
              ? 'Tarik untuk mengecilkan / melebarkan Terminal & Panel Kanan (Klik 2x reset 320px)'
              : 'Tarik untuk mengecilkan / melebarkan batas kanan Terminal (Klik 2x reset)'
          }
        />

        {/* Git Changes Right Panel */}
        {/* Git Changes & Files Right Panel */}
        {/* 1. Git Changes Panel (Active only if Git plugin & gitDiff feature are enabled) */}
        {features.gitDiff && isPluginEnabled('git-control') && isGitPanelOpen && (
          <GitChangesPanel
            gitChanges={gitChanges}
            isRefreshing={isRefreshingGit}
            onRefresh={() => refreshGitChanges(true)}
            onOpenDiff={handleOpenDiff}
            onOpenFileAsTerminal={handleOpenFile}
            onClose={() => setIsGitPanelOpen(false)}
            branch={activeWorkspace?.branch || 'None'}
            workspacePath={activeWorkspace?.path}
            workspaceName={activeWorkspace?.name}
            width={rightPanelWidth}
            isResizing={isDraggingRight}
          />
        )}

        {/* 2. Todo List Panel (Bundled Dock Plugin) */}
        {isPluginEnabled('todo-list') && isTodoOpen && (
          <TodoListPanel
            onClose={() => setIsTodoOpen(false)}
            width={rightPanelWidth}
            isResizing={isDraggingRight}
          />
        )}

        {/* 3. Scratch Notes Panel (Sidebar Code Scratchpad Plugin) */}
        {isPluginEnabled('scratch-notes') && isScratchNotesOpen && (
          <ScratchNotesPanel
            onClose={() => setIsScratchNotesOpen(false)}
            width={rightPanelWidth}
            isResizing={isDraggingRight}
          />
        )}

        {/* 4. Graphify: Code Graph Visualizer (Feature Module) */}
        {features.graphify && isGraphifyOpen && (
          <GraphifyPane
            onClose={() => setIsGraphifyOpen(false)}
            workspaceName={activeWorkspace?.name}
            width={rightPanelWidth}
            isResizing={isDraggingRight}
          />
        )}

        {/* 5. Workspace Web Browser Preview */}
        {(features.browser || features.browserPreview) && isBrowserOpen && (
          <div
            style={{ width: `${rightPanelWidth}px`, transition: isDraggingRight ? 'none' : undefined }}
            className="h-full overflow-hidden z-20 border-l border-white/10 shrink-0"
          >
            <BrowserPane onClose={() => setIsBrowserOpen(false)} />
          </div>
        )}
        {features.gitDiff && (
          <DiffViewer
            isOpen={isDiffOpen}
            onClose={() => setIsDiffOpen(false)}
            workspacePath={activeWorkspace?.path || '.'}
            selectedFile={selectedDiffFile}
            width={rightPanelWidth}
            isResizing={isDraggingRight}
          />
        )}

        {/* Flexible Right Margin Spacer when panels are closed */}
        {!hasActiveRightPanel && terminalRightMargin > 0 && (
          <div
            style={{ width: `${terminalRightMargin}px` }}
            className="h-full shrink-0 flex flex-col items-center justify-center select-none bg-black/20 border-l border-white/5 font-mono text-[10px] text-neutral-500"
            title="Klik 2x pada garis pembatas untuk reset ke ukuran penuh"
          >
            <span className="opacity-40">+{terminalRightMargin}px</span>
          </div>
        )}
      </div>

      {/* 3. Bottom Status Bar (Orca & Alethe Signature) */}
      <StatusBar
        totalPanes={totalActivePanes}
        activeShell={activePane?.shell || 'powershell'}
        isBrowserOpen={isBrowserOpen}
        isGitPanelOpen={isGitPanelOpen && isPluginEnabled('git-control')}
        onToggleGitPanel={isPluginEnabled('git-control') ? () => setIsGitPanelOpen((prev) => !prev) : undefined}
        gitChangesCount={gitChanges.length}
        branch={activeWorkspace?.branch || 'None'}
        onOpenPalette={() => (features.commandPalette ? setIsPaletteOpen(true) : undefined)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleBrowser={() => setIsBrowserOpen((prev) => !prev)}
        isUpdateAvailable={isUpdateAvailable}
        isTodoOpen={isTodoOpen}
        onToggleTodo={() => setIsTodoOpen((prev) => !prev)}
        isTodoEnabled={isPluginEnabled('todo-list')}
        isScratchNotesOpen={isScratchNotesOpen}
        onToggleScratchNotes={() => setIsScratchNotesOpen((prev) => !prev)}
        isScratchNotesEnabled={isPluginEnabled('scratch-notes')}
        isGraphifyOpen={isGraphifyOpen}
        onToggleGraphify={() => setIsGraphifyOpen((prev) => !prev)}
        onOpenMcpSkills={() => setIsMcpModalOpen(true)}
        onCaptureScreenshot={() => void sendScreenshotToTerminal('screen')}
      />

      {/* MCP & Skills Inspector Modal */}
      <McpSkillsModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
      />

      {/* Close FerminTerm Confirmation Modal */}
      <CloseConfirmModal
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={handleConfirmClose}
      />

      {/* 4. Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNewTab={() => handleAddTab()}
        onSplit={(dir) => {
          if (activeTab?.activePaneId) handleSplitPane(activeTab.activePaneId, dir)
        }}
        onClosePane={() => {
          if (activeTab?.activePaneId) handleClosePane(activeTab.activePaneId)
        }}
        onLaunchShell={(s) => {
          if (activeTab?.activePaneId) handleSplitPane(activeTab.activePaneId, 'vertical', s)
        }}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleGitPanel={() => setIsGitPanelOpen((prev) => !prev)}
        onOpenSettings={() => handleOpenSettings('account')}
        onReplayIntro={() => setShowIntro(true)}
        onCaptureScreenshot={() => void sendScreenshotToTerminal('screen')}
      />

      {/* 5. Settings & Theme Modal (Ctrl+,) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReplayIntro={() => setShowIntro(true)}
        initialSection={settingsSection}
      />

      {/* 6. Opening Animation & Interactive Slide Deck Walkthrough */}
      {/* 6. Opening Animation & Welcome Back / Slides Walkthrough */}
      {features.onboardingTour && showIntro && (
        <IntroExperience
          onComplete={() => setShowIntro(false)}
          onContinue={() => {
            setShowIntro(false)
            if (activeWorkspace) {
              const existingTab = tabs.find(
                (t) => t.type === 'terminal' && t.title.includes(activeWorkspace.name)
              )
              if (existingTab) {
                setActiveTabId(existingTab.id)
              } else {
                handleAddTab()
              }
            }
          }}
        />
      )}

      {/* 7. Bottom-Right Update Notification Toast with 1-Click Relaunch */}
      <UpdateToast />
      {/* 8. Global Drag & Drop Overlay */}
      <GlobalDropOverlay
        activeWorkspace={activeWorkspace}
        activePaneId={activePane?.id}
        activePaneTitle={
          activePane
            ? `${activePane.title || 'Terminal'} • ${(activePane.shell || 'powershell').toUpperCase()}`
            : undefined
        }
        panes={panes}
        onInsertPaths={handleInsertPaths}
        onFilesDropped={handleGlobalFilesDropped}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {/* 9. File & Clipboard Notifications Toast */}
      <FileTransferToast />
    </div>
  )
}
