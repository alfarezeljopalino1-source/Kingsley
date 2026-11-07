import React, { useState, useMemo } from 'react'
import {
  Share2,
  X,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  Code2,
  FileCode,
  FolderTree,
  Filter
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

interface GraphifyNode {
  id: string
  name: string
  type: 'core' | 'component' | 'context' | 'main' | 'engine'
  x: number
  y: number
  deps: string[]
  metrics: { loc: number; imports: number }
}

const DEFAULT_NODES: GraphifyNode[] = [
  {
    id: 'main',
    name: 'src/main/index.ts',
    type: 'main',
    x: 180,
    y: 80,
    deps: ['ipc', 'pty'],
    metrics: { loc: 167, imports: 6 },
  },
  {
    id: 'ipc',
    name: 'src/main/ipc-handlers.ts',
    type: 'main',
    x: 120,
    y: 190,
    deps: ['pty'],
    metrics: { loc: 368, imports: 8 },
  },
  {
    id: 'pty',
    name: 'src/main/pty-manager.ts',
    type: 'engine',
    x: 260,
    y: 190,
    deps: [],
    metrics: { loc: 215, imports: 4 },
  },
  {
    id: 'app',
    name: 'src/renderer/src/App.tsx',
    type: 'core',
    x: 480,
    y: 130,
    deps: ['theme-ctx', 'lang-ctx', 'features-ctx', 'terminal-pane', 'sidebar'],
    metrics: { loc: 1354, imports: 22 },
  },
  {
    id: 'theme-ctx',
    name: 'ThemeContext.tsx',
    type: 'context',
    x: 370,
    y: 260,
    deps: [],
    metrics: { loc: 138, imports: 3 },
  },
  {
    id: 'lang-ctx',
    name: 'LanguageContext.tsx',
    type: 'context',
    x: 480,
    y: 280,
    deps: [],
    metrics: { loc: 310, imports: 2 },
  },
  {
    id: 'features-ctx',
    name: 'FeaturesContext.tsx',
    type: 'context',
    x: 600,
    y: 260,
    deps: [],
    metrics: { loc: 170, imports: 3 },
  },
  {
    id: 'terminal-pane',
    name: 'TerminalPane.tsx',
    type: 'component',
    x: 420,
    y: 380,
    deps: ['pty'],
    metrics: { loc: 412, imports: 12 },
  },
  {
    id: 'sidebar',
    name: 'Sidebar.tsx',
    type: 'component',
    x: 580,
    y: 380,
    deps: ['theme-ctx', 'features-ctx'],
    metrics: { loc: 587, imports: 14 },
  },
]

interface GraphifyPaneProps {
  onClose: () => void
  workspaceName?: string
  width?: number
  isResizing?: boolean
}

export const GraphifyPane: React.FC<GraphifyPaneProps> = ({ onClose, workspaceName, width, isResizing = false }) => {
  const { theme } = useTheme()
  const { language } = useLanguage()
  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<GraphifyNode | null>(DEFAULT_NODES[3])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return DEFAULT_NODES
    const q = searchQuery.toLowerCase()
    return DEFAULT_NODES.filter((n) => n.name.toLowerCase().includes(q) || n.type.includes(q))
  }, [searchQuery])

  const getNodeColor = (type: GraphifyNode['type']) => {
    switch (type) {
      case 'core':
        return '#00f0ff'
      case 'main':
        return '#ca9ee6'
      case 'engine':
        return '#10b981'
      case 'context':
        return '#f59e0b'
      case 'component':
        return '#ec4899'
      default:
        return '#ffffff'
    }
  }

  return (
    <div
      className="h-full flex flex-col font-mono text-xs border-l z-20 shrink-0 select-none"
      style={{
        width: width ? `${width}px` : '520px',
        transition: isResizing ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
      }}
    >
      {/* Header */}
      <div className="p-3.5 border-b flex items-center justify-between" style={{ borderColor: theme.ui.border }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <span>Graphify: Code Graph</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ACTIVE
              </span>
            </h3>
            <span className="text-[10px] text-neutral-400">
              {workspaceName || 'Kingsley Workspace Architecture'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Tutup Graphify"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Control bar */}
      <div className="px-3 py-2 border-b flex items-center justify-between gap-2 bg-black/20" style={{ borderColor: theme.ui.border }}>
        <div className="flex items-center gap-1.5 flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1">
          <Search className="w-3 h-3 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari modul atau relasi kode...' : 'Filter modules & dependencies...'}
            className="w-full bg-transparent text-[11px] text-white focus:outline-none placeholder:text-neutral-500"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-neutral-400 px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 relative overflow-hidden bg-[#090b12] p-4 flex items-center justify-center">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          className="w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          viewBox="0 0 760 480"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="7"
              markerHeight="5"
              refX="8"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 7 2.5, 0 5" fill="rgba(0, 240, 255, 0.4)" />
            </marker>
          </defs>

          {/* Links */}
          {DEFAULT_NODES.map((source) =>
            source.deps.map((targetId) => {
              const target = DEFAULT_NODES.find((n) => n.id === targetId)
              if (!target) return null
              const isHighlighted =
                selectedNode && (selectedNode.id === source.id || selectedNode.id === target.id)
              return (
                <line
                  key={`${source.id}-${target.id}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? '#00f0ff' : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth={isHighlighted ? '2' : '1'}
                  strokeDasharray={source.type === 'context' ? '4 2' : 'none'}
                  markerEnd="url(#arrowhead)"
                />
              )
            })
          )}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id
            const color = getNodeColor(node.type)

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer group"
              >
                {/* Outer Glow Circle */}
                {isSelected && (
                  <circle
                    r="22"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.4"
                    className="animate-pulse"
                  />
                )}
                {/* Core Circle */}
                <circle
                  r="14"
                  fill="#121624"
                  stroke={color}
                  strokeWidth={isSelected ? '3' : '1.5'}
                />
                <circle r="5" fill={color} />
                {/* Node Label */}
                <text
                  x="0"
                  y="26"
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#94a3b8'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {node.name.split('/').pop()}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="p-3.5 border-t bg-black/40 space-y-2 shrink-0" style={{ borderColor: theme.ui.border }}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              {selectedNode.name}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border"
              style={{
                color: getNodeColor(selectedNode.type),
                borderColor: `${getNodeColor(selectedNode.type)}40`,
                backgroundColor: `${getNodeColor(selectedNode.type)}15`,
              }}
            >
              {selectedNode.type}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="block text-[10px] text-neutral-500 uppercase">Lines of Code</span>
              <span className="font-bold text-white text-xs">{selectedNode.metrics.loc} lines</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="block text-[10px] text-neutral-500 uppercase">Dependencies</span>
              <span className="font-bold text-cyan-300 text-xs">{selectedNode.deps.length} modules</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
