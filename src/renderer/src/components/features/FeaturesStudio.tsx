import React, { useState } from 'react'
import {
  Globe,
  Share2,
  Plug,
  Monitor,
  Network,
  Sparkles,
  Brain,
  GitPullRequest,
  RotateCcw,
  ExternalLink,
  X,
  Server,
  CheckCircle2,
  Cpu
} from 'lucide-react'
import { useFeatures, FEATURE_DEFINITIONS, type FeatureFlags } from '../../context/FeaturesContext'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

export const FeaturesStudio: React.FC = () => {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { features, toggleFeature, resetDefaults } = useFeatures()
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false)

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'browser':
        return <Globe className="w-4 h-4 text-purple-300" />
      case 'graphify':
        return <Share2 className="w-4 h-4 text-purple-300" />
      case 'mcp':
        return <Plug className="w-4 h-4 text-purple-300" />
      case 'playwright':
        return <Monitor className="w-4 h-4 text-purple-300" />
      case 'orchestration':
        return <Network className="w-4 h-4 text-purple-300" />
      case 'gsd':
        return <Sparkles className="w-4 h-4 text-purple-300" />
      case 'memory':
        return <Brain className="w-4 h-4 text-purple-300" />
      case 'prs':
        return <GitPullRequest className="w-4 h-4 text-purple-300" />
      default:
        return <Cpu className="w-4 h-4 text-purple-300" />
    }
  }

  // Active MCP Servers for inspection
  const mcpServers = [
    {
      name: 'Filesystem MCP',
      command: 'npx @modelcontextprotocol/server-filesystem',
      status: 'Connected',
      toolsCount: 6,
      desc: 'Read, write, edit, and search files inside workspace projects.',
    },
    {
      name: 'Browser Automation (Playwright)',
      command: 'npx @modelcontextprotocol/server-playwright',
      status: 'Standby',
      toolsCount: 8,
      desc: 'Control headless Chromium instances for web verification and screenshots.',
    },
    {
      name: 'GitHub PR & Issues MCP',
      command: 'npx @modelcontextprotocol/server-github',
      status: 'Connected',
      toolsCount: 12,
      desc: 'Query repository status, open pull requests, and manage issue comments.',
    },
    {
      name: 'AI Memory Server',
      command: 'npx @modelcontextprotocol/server-memory',
      status: 'Connected',
      toolsCount: 4,
      desc: 'Long-term persistent semantic memory across coding agent sessions.',
    },
  ]

  return (
    <div className="space-y-4 max-w-4xl font-mono text-xs pb-10">
      {/* Top Header info with reset button */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <h3 className="text-sm font-bold text-white mb-0.5">Features &amp; Modules</h3>
          <p className="text-xs text-neutral-400">
            Control agentic subsystems, MCP integrations, and modular capabilities.
          </p>
        </div>

        <button
          type="button"
          onClick={resetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Reset to default settings"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[11px]">Reset Defaults</span>
        </button>
      </div>

      {/* Feature Cards List (Exact Match to Image 1) */}
      <div className="space-y-2.5">
        {FEATURE_DEFINITIONS.map((item) => {
          const isEnabled = Boolean(features[item.id])

          return (
            <div
              key={item.id}
              onClick={() => toggleFeature(item.id)}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all duration-150 select-none ${
                isEnabled
                  ? 'bg-[#1b1c28]/90 border-purple-500/30 hover:border-purple-400/50 shadow-sm'
                  : 'bg-[#13141f]/70 border-white/5 opacity-60 hover:opacity-85'
              }`}
            >
              {/* Left: Square Icon & Title/Description */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    isEnabled
                      ? 'bg-purple-950/40 border-purple-500/30 shadow-inner'
                      : 'bg-white/[0.02] border-white/10'
                  }`}
                >
                  {getFeatureIcon(item.icon)}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-white truncate">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed line-clamp-1">
                    {item.description}
                  </span>
                </div>
              </div>

              {/* Right: Enabled / Disabled text & Purple Pill Toggle Switch */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-[11px] font-mono ${
                    isEnabled ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>

                {/* Purple Toggle Capsule */}
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                    isEnabled ? 'bg-purple-500' : 'bg-neutral-700/80'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Link: "Review my MCP servers" (Image 1) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsMcpModalOpen(true)}
          className="text-purple-400 hover:text-purple-300 text-xs font-medium underline underline-offset-4 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Review my MCP servers</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* MCP Servers Inspection Modal */}
      {isMcpModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMcpModalOpen(false)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-mono"
        >
          <div
            className="w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[85vh] bg-[#161924] border-white/10 text-white"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm">Registered MCP Servers</h3>
              </div>
              <button
                onClick={() => setIsMcpModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {mcpServers.map((srv) => (
                <div
                  key={srv.name}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{srv.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {srv.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400">{srv.desc}</p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500 font-mono">
                    <span className="truncate max-w-[320px] opacity-75">{srv.command}</span>
                    <span className="text-purple-400 font-semibold">{srv.toolsCount} tools exposed</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsMcpModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
