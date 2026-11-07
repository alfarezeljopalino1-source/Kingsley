import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Folder,
  GitBranch,
  Upload,
  Sparkles,
  Bot,
  Terminal,
  Cpu,
  Layers,
  Check,
  Zap,
  Brain,
  Navigation,
  Waves,
  Flame
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import type { WorkspaceFolder } from '../sidebar/Sidebar'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (workspace: WorkspaceFolder) => void
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#14b8a6', // Teal
]

export type AiAgentType =
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

const AI_AGENTS: Array<{
  id: AiAgentType
  name: string
  badge: string
  desc: string
  icon: React.ReactNode
  color: string
}> = [
  {
    id: 'opencode',
    name: 'OpenCode',
    badge: 'Autonomous',
    desc: 'Open-source autonomous terminal AI agent',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    color: '#06b6d4',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    badge: 'Anthropic',
    desc: 'Official Anthropic agentic coding CLI',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    color: '#f59e0b',
  },
  {
    id: 'aider',
    name: 'Aider',
    badge: 'Pair Coding',
    desc: 'Leading AI pair programming CLI with Git sync',
    icon: <Zap className="w-4 h-4 text-emerald-400" />,
    color: '#10b981',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    badge: 'OpenAI',
    desc: 'Autonomous code generation & terminal assistant',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    color: '#a855f7',
  },
  {
    id: 'cursor',
    name: 'Cursor Agent',
    badge: 'Headless CLI',
    desc: 'Automated agentic terminal runner',
    icon: <Navigation className="w-4 h-4 text-blue-400" />,
    color: '#3b82f6',
  },
  {
    id: 'windsurf',
    name: 'Windsurf CLI',
    badge: 'Cascade',
    desc: 'Codeium Cascade flow terminal integration',
    icon: <Waves className="w-4 h-4 text-teal-400" />,
    color: '#14b8a6',
  },
  {
    id: 'omp',
    name: 'OMP',
    badge: 'Multi-Agent',
    desc: 'Open Multi-Agent Platform & orchestrator',
    icon: <Layers className="w-4 h-4 text-pink-400" />,
    color: '#ec4899',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    badge: 'Google AI',
    desc: 'Gemini 2.5 Flash developer coding CLI',
    icon: <Flame className="w-4 h-4 text-orange-400" />,
    color: '#f97316',
  },
  {
    id: 'alethe',
    name: 'Alethe Agent',
    badge: 'Native',
    desc: 'Built-in interactive engineering assistant',
    icon: <Bot className="w-4 h-4 text-emerald-400" />,
    color: '#10b981',
  },
  {
    id: 'none',
    name: 'Standard Shell',
    badge: 'Raw CLI',
    desc: 'PowerShell / Bash without AI pre-launch',
    icon: <Terminal className="w-4 h-4 text-neutral-400" />,
    color: '#94a3b8',
  },
]

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [folderPath, setFolderPath] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [selectedAgent, setSelectedAgent] = useState<AiAgentType>('opencode')
  const [iconUrl, setIconUrl] = useState('')
  const [isBrowsing, setIsBrowsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentUpdateTick, setAgentUpdateTick] = useState(0)

  useEffect(() => {
    const handler = () => setAgentUpdateTick((t) => t + 1)
    window.addEventListener('ferminterm:agents-updated', handler)
    return () => window.removeEventListener('ferminterm:agents-updated', handler)
  }, [])

  // Filter AI agents dynamically by enabled settings (Image 7)
  const availableAgents = React.useMemo(() => {
    const saved = localStorage.getItem('ferminterm_enabled_agents')
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const disabledIds = new Set(
            parsed
              .filter((p): p is { id: string; enabled: boolean } =>
                Boolean(p && typeof p === 'object' && 'id' in p && 'enabled' in p && !p.enabled)
              )
              .map((p) => p.id)
          )
          return AI_AGENTS.filter((a) => !disabledIds.has(a.id))
        }
      } catch {}
    }
    return AI_AGENTS
  }, [isOpen, agentUpdateTick])

  // Ensure selectedAgent is always among available agents
  useEffect(() => {
    if (availableAgents.length > 0 && !availableAgents.some((a) => a.id === selectedAgent)) {
      setSelectedAgent(availableAgents[0].id)
    }
  }, [availableAgents, selectedAgent])
  if (!isOpen) return null

  // Handle Browse Native Folder Dialog
  const handleBrowseFolder = async () => {
    if (!window.ferminAPI?.openDirectoryDialog) return
    setIsBrowsing(true)
    setError(null)
    try {
      const selected = await window.ferminAPI.openDirectoryDialog()
      if (selected) {
        setFolderPath(selected)
        if (!name.trim()) {
          const parts = selected.replace(/\\/g, '/').split('/').filter(Boolean)
          const folderName = parts[parts.length - 1] || 'New Project'
          setName(folderName)
        }
      }
    } catch (err) {
      console.warn('Browse error:', err)
    } finally {
      setIsBrowsing(false)
    }
  }

  // Handle local image upload for icon
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (base64) {
        setIconUrl(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const finalPath = folderPath.trim() || '.'
    let projectName = name.trim()
    if (!projectName) {
      const parts = finalPath.replace(/\\/g, '/').split('/').filter(Boolean)
      projectName = parts[parts.length - 1] || 'New Project'
    }

    let isGit = false
    let branch: string | null = null
    if (window.ferminAPI?.getGitInfo && finalPath) {
      try {
        const info = await window.ferminAPI.getGitInfo(finalPath)
        isGit = info.isGit
        branch = info.branch
      } catch {}
    }

    const newWorkspace: WorkspaceFolder = {
      id: `ws-${Date.now()}`,
      name: projectName,
      path: finalPath,
      branch: branch || (isGit ? 'main' : null),
      isGit,
      color: selectedColor,
      icon: iconUrl || undefined,
      agent: selectedAgent,
      repoUrl: repoUrl.trim() || undefined,
    }

    onCreateProject(newWorkspace)
    onClose()
  }

  const initialLetter = (name.trim() || 'P').charAt(0).toUpperCase()

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-mono select-none"
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        style={{
          backgroundColor: '#161922',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#e6ebf5',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span>{t.newProject.title}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
              {error}
            </div>
          )}

          {/* 1. NAME */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              {t.newProject.nameLabel}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.newProject.namePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-xs text-white focus:outline-none transition-colors placeholder:text-neutral-500"
            />
          </div>

          {/* 2. PROJECT FOLDER */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              {t.newProject.folderLabel}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 focus-within:border-purple-400 transition-colors">
                <Folder className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder={t.newProject.folderPlaceholder}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-neutral-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleBrowseFolder}
                disabled={isBrowsing}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-xs transition-colors cursor-pointer shrink-0"
              >
                {isBrowsing ? t.common.loading : t.common.browse}
              </button>
            </div>
            <p className="text-[10px] text-neutral-500">
              {t.newProject.folderDesc}
            </p>
          </div>

          {/* 3. GITHUB REPOSITORY (OPTIONAL) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.newProject.githubLabel}</span>
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repository"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-cyan-400 text-xs text-white focus:outline-none transition-colors placeholder:text-neutral-500"
            />
            <p className="text-[10px] text-neutral-500">
              {t.newProject.githubDesc}
            </p>
          </div>

          {/* 4. AI CODING AGENT SELECTION */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.newProject.aiAgentLabel}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableAgents.map((agent) => {
                const isSelected = selectedAgent === agent.id
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-400 bg-purple-500/10 shadow-sm'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 shrink-0 mt-0.5">
                      {agent.icon}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">
                          {agent.name}
                        </span>
                        <span
                          className="text-[9px] px-1 py-0.2 rounded font-mono font-bold"
                          style={{
                            backgroundColor: `${agent.color}20`,
                            color: agent.color,
                          }}
                        >
                          {agent.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                        {agent.desc}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-neutral-500">
              {t.newProject.aiAgentDesc}
            </p>
          </div>

          {/* 5. COLOR */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              {t.newProject.colorLabel}
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PRESET_COLORS.map((c) => {
                const isSelected = selectedColor === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                      isSelected ? 'scale-110 ring-2 ring-white/60 shadow-lg' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 6. ICON */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              {t.newProject.iconLabel}
            </label>
            <div className="flex items-center gap-3">
              {/* Icon / Avatar preview square */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base shrink-0 shadow-md border border-white/10 overflow-hidden"
                style={{ backgroundColor: selectedColor }}
              >
                {iconUrl ? (
                  <img src={iconUrl} alt="icon" className="w-full h-full object-cover" />
                ) : (
                  initialLetter
                )}
              </div>

              {/* URL input */}
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus-within:border-purple-400 transition-colors">
                <input
                  type="text"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://example.com/icon.png"
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-neutral-500"
                />
              </div>

              {/* Upload local image button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Upload local image icon"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-neutral-500">
              {t.newProject.iconDesc}
            </p>
          </div>

          {/* 7. Action Footer Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-xs text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {t.common.cancel}
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer bg-purple-600 hover:bg-purple-500 text-white"
            >
              {t.newProject.createAndOpen}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
