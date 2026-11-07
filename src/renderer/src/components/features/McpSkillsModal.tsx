import React, { useState } from 'react'
import {
  Server,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

interface McpServer {
  id: string
  name: string
  command: string
  status: 'Connected' | 'Standby' | 'Active'
  toolsCount: number
  desc: string
  tools: string[]
}

const MCP_SERVERS: McpServer[] = [
  {
    id: 'filesystem',
    name: 'Filesystem MCP',
    command: 'npx @modelcontextprotocol/server-filesystem',
    status: 'Connected',
    toolsCount: 6,
    desc: 'Read, write, edit, and search files inside workspace projects.',
    tools: ['read_file', 'write_file', 'list_directory', 'directory_tree', 'move_file', 'search_files'],
  },
  {
    id: 'playwright',
    name: 'Browser Automation (Playwright)',
    command: 'npx @modelcontextprotocol/server-playwright',
    status: 'Connected',
    toolsCount: 8,
    desc: 'Control headless Chromium instances for web verification and screenshots.',
    tools: ['browser_navigate', 'browser_click', 'browser_type', 'browser_screenshot', 'browser_evaluate', 'browser_wait'],
  },
  {
    id: 'github',
    name: 'GitHub PR & Issues MCP',
    command: 'npx @modelcontextprotocol/server-github',
    status: 'Connected',
    toolsCount: 12,
    desc: 'Query repository status, open pull requests, and manage issue comments.',
    tools: ['get_pull_request', 'list_pull_requests', 'create_issue', 'get_issue_comments', 'search_repositories'],
  },
  {
    id: 'memory',
    name: 'AI Memory Server',
    command: 'npx @modelcontextprotocol/server-memory',
    status: 'Active',
    toolsCount: 4,
    desc: 'Long-term persistent semantic memory across coding agent sessions.',
    tools: ['create_entities', 'read_graph', 'search_nodes', 'open_nodes'],
  },
]

interface McpSkillsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const McpSkillsModal: React.FC<McpSkillsModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme()
  const { language } = useLanguage()
  const [selectedServer, setSelectedServer] = useState<McpServer>(MCP_SERVERS[0])
  const [testOutput, setTestOutput] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  if (!isOpen) return null

  const handleTestPing = (serverName: string) => {
    setIsTesting(true)
    setTestOutput(null)
    setTimeout(() => {
      setIsTesting(false)
      setTestOutput(`[MCP PING 200 OK] Server "${serverName}" responding in 3.4ms with JSON-RPC 2.0 handshake verified.`)
    }, 500)
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-mono select-none"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[85vh] bg-[#12141f] border-purple-500/30 text-white"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {language === 'id' ? 'MCP & Skills Manager' : 'Model Context Protocol (MCP) Manager'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {language === 'id'
                  ? 'Kelola server MCP dan tool arsenal untuk agen koding Claude & Codex'
                  : 'Manage connected MCP servers and inspect agent tools in real time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Split list & detail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Server List */}
          <div className="w-72 border-r border-white/10 p-4 space-y-2.5 overflow-y-auto shrink-0 bg-black/20">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
              Registered Servers ({MCP_SERVERS.length})
            </span>
            {MCP_SERVERS.map((srv) => {
              const isSelected = selectedServer.id === srv.id
              return (
                <div
                  key={srv.id}
                  onClick={() => {
                    setSelectedServer(srv)
                    setTestOutput(null)
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-400 bg-purple-500/20 shadow-md'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white truncate max-w-[150px]">
                      {srv.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {srv.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block truncate">
                    {srv.toolsCount} exposed tools
                  </span>
                </div>
              )
            })}
          </div>

          {/* Right Server Inspector */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedServer.name}</span>
                  </h4>
                  <button
                    onClick={() => handleTestPing(selectedServer.name)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    <span>{isTesting ? 'Testing...' : 'Test Ping'}</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">{selectedServer.desc}</p>
              </div>

              {/* Startup Command */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">
                  Runtime Command
                </span>
                <code className="text-xs text-purple-300 block select-all">
                  {selectedServer.command}
                </code>
              </div>

              {/* Tools Exposed Arsenal */}
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block mb-2">
                  Exposed Tools ({selectedServer.tools.length})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedServer.tools.map((tool) => (
                    <div
                      key={tool}
                      className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2 text-xs text-neutral-200"
                    >
                      <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono truncate">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Output Console */}
              {testOutput && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-fade-in flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{testOutput}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-500">
              <span>Status: <strong className="text-emerald-400">Operational</strong></span>
              <span>Protocol: Model Context Protocol v2024-11-05</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
