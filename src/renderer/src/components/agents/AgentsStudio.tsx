import React, { useState, useEffect } from 'react'
import {
  Terminal,
  Monitor,
  Sparkles,
  Brain,
  Bot,
  Box,
  Cpu,
  Zap,
  Globe,
  Code2,
  Check
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export interface AgentConfigItem {
  id: string
  name: string
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  enabled: boolean
  command: string
  installHint: string
}

export const DEFAULT_AGENTS_CONFIG: AgentConfigItem[] = [
  {
    id: 'shell',
    name: 'Shell',
    subtitle: 'PowerShell · cmd',
    icon: <Terminal className="w-4 h-4 text-neutral-300" />,
    iconBg: 'bg-white/10',
    enabled: true,
    command: 'powershell',
    installHint: 'Built into Windows 11',
  },
  {
    id: 'wsl',
    name: 'WSL',
    subtitle: 'Windows Subsystem for Linux',
    icon: <Monitor className="w-4 h-4 text-neutral-300" />,
    iconBg: 'bg-white/10',
    enabled: true,
    command: 'wsl',
    installHint: 'wsl --install',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    subtitle: 'Anthropic CLI',
    icon: <Sparkles className="w-4 h-4 text-amber-300" />,
    iconBg: 'bg-amber-500/20',
    enabled: true,
    command: 'claude',
    installHint: 'npm install -g @anthropic-ai/claude-code',
  },
  {
    id: 'codex',
    name: 'Codex',
    subtitle: 'OpenAI CLI',
    icon: <Brain className="w-4 h-4 text-purple-300" />,
    iconBg: 'bg-purple-500/20',
    enabled: true,
    command: 'codex',
    installHint: 'npm install -g @openai/codex',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    subtitle: 'GitHub CLI agent',
    icon: <Bot className="w-4 h-4 text-cyan-300" />,
    iconBg: 'bg-cyan-500/20',
    enabled: true,
    command: 'gh copilot',
    installHint: 'gh extension install github/gh-copilot',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    subtitle: 'Cursor CLI (cursor-agent)',
    icon: <Box className="w-4 h-4 text-blue-300" />,
    iconBg: 'bg-blue-500/20',
    enabled: true,
    command: 'cursor',
    installHint: 'Installed via Cursor Command Palette',
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    subtitle: 'Google Antigravity CLI',
    icon: <Globe className="w-4 h-4 text-emerald-300" />,
    iconBg: 'bg-emerald-500/20',
    enabled: true,
    command: 'antigravity',
    installHint: 'gcloud components install antigravity',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    subtitle: 'Open source',
    icon: <Cpu className="w-4 h-4 text-cyan-300" />,
    iconBg: 'bg-cyan-500/20',
    enabled: true,
    command: 'opencode',
    installHint: 'npm install -g opencode-ai',
  },
  {
    id: 'freebuff',
    name: 'Freebuff',
    subtitle: 'Free coding agent',
    icon: <Code2 className="w-4 h-4 text-pink-300" />,
    iconBg: 'bg-pink-500/20',
    enabled: true,
    command: 'freebuff',
    installHint: 'pip install freebuff-agent',
  },
  {
    id: 'aider',
    name: 'Aider',
    subtitle: 'AI pair programming CLI',
    icon: <Zap className="w-4 h-4 text-yellow-300" />,
    iconBg: 'bg-yellow-500/20',
    enabled: true,
    command: 'aider',
    installHint: 'pip install aider-chat',
  },
]

const AGENTS_STORAGE_KEY = 'ferminterm_enabled_agents'

interface SavedAgentState {
  id: string
  enabled: boolean
}

function isSavedAgentState(item: unknown): item is SavedAgentState {
  return Boolean(
    item &&
    typeof item === 'object' &&
    'id' in item &&
    typeof item.id === 'string' &&
    'enabled' in item &&
    typeof item.enabled === 'boolean'
  )
}

export const AgentsStudio: React.FC = () => {
  const { theme } = useTheme()
  const [agents, setAgents] = useState<AgentConfigItem[]>(() => {
    const saved = localStorage.getItem(AGENTS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const validStates = parsed.filter(isSavedAgentState)
          return DEFAULT_AGENTS_CONFIG.map((def) => {
            const found = validStates.find((p) => p.id === def.id)
            return found ? { ...def, enabled: found.enabled } : def
          })
        }
      } catch {}
    }
    return DEFAULT_AGENTS_CONFIG
  })

  // Persist enabled states
  useEffect(() => {
    localStorage.setItem(
      AGENTS_STORAGE_KEY,
      JSON.stringify(agents.map((a) => ({ id: a.id, enabled: a.enabled })))
    )
    window.dispatchEvent(
      new CustomEvent('ferminterm:agents-updated', { detail: agents })
    )
  }, [agents])

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    )
  }

  const enabledCount = agents.filter((a) => a.enabled).length
  const totalCount = agents.length

  return (
    <div className="space-y-4 max-w-4xl font-mono text-xs pb-12 select-none">
      {/* 1. Header (Exact Match to Image 4) */}
      <div className="border-b border-white/5 pb-3">
        <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <span>Enabled agents ({totalCount}/{enabledCount})</span>
        </h2>
        <p className="text-xs text-neutral-400">
          Choose which agents are available when creating terminals and sub-tabs.
        </p>
      </div>

      {/* 2. Agents Card List (Exact Match to Image 4) */}
      <div className="space-y-2">
        {agents.map((agent) => {
          return (
            <div
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all duration-150 select-none ${
                agent.enabled
                  ? 'bg-[#181a26]/90 border-white/10 hover:border-purple-500/40 shadow-sm'
                  : 'bg-[#12131d]/60 border-white/5 opacity-50 hover:opacity-80'
              }`}
            >
              {/* Left: Square Icon & Title/Subtitle */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-white/10 ${agent.iconBg}`}
                >
                  {agent.icon}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-white truncate">
                    {agent.name}
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-0.5 truncate">
                    {agent.subtitle}
                  </span>
                </div>
              </div>

              {/* Right: Purple Square Checkbox (Image 4) */}
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  agent.enabled
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white/5 border border-white/20'
                }`}
              >
                {agent.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
