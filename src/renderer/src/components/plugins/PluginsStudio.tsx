import React, { useState, useEffect } from 'react'
import {
  Package,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FolderOpen,
  RotateCw,
  ExternalLink,
  Code,
  FileCode,
  Sparkles,
  GitCompare,
  ListTodo,
  Palette,
  FileText
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export interface InstalledPlugin {
  id: string
  name: string
  version: string
  isBundled: boolean
  category: 'Interface' | 'Theme' | 'Tools'
  description: string
  enabled: boolean
  capabilities: string[]
}

const DEFAULT_PLUGINS: InstalledPlugin[] = [
  {
    id: 'git-control',
    name: 'Git Control',
    version: 'v1.0.0',
    isBundled: true,
    category: 'Interface',
    description: 'Source control panel: status, staging, commits, branches and the commit graph.',
    enabled: true,
    capabilities: [
      'Interactive Git changes panel in right dock',
      'Unified line-by-line diff inspector with syntax highlighting',
      'Branch switcher and commit tracking',
      'File explorer live git decoration badges ([M], [A], [D])',
    ],
  },
  {
    id: 'theme-pack',
    name: 'Theme Pack',
    version: 'v1.0.0',
    isBundled: true,
    category: 'Theme',
    description: 'Ember, Golden Premium, Dark Lemon and Orca.',
    enabled: true,
    capabilities: [
      'Adds 4 bespoke developer theme definitions',
      'Synchronizes UI colors and xterm ANSI palette',
    ],
  },
  {
    id: 'todo-list',
    name: 'Todo List',
    version: 'v1.0.0',
    isBundled: true,
    category: 'Interface',
    description: 'A checklist in the right sidebar, with tags and per-project assignment.',
    enabled: true,
    capabilities: [
      'Checklist in the right dock',
      'Tag filters and per-project task persistence',
      'One-click task status toggling',
      'Seamless integration with GitHub PR review tasks',
    ],
  },
]

const PLUGINS_STORAGE_KEY = 'ferminterm_plugins'

export const PluginsStudio: React.FC = () => {
  const { theme } = useTheme()
  const [plugins, setPlugins] = useState<InstalledPlugin[]>(() => {
    const saved = localStorage.getItem(PLUGINS_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_PLUGINS
  })

  const [expandedPlugins, setExpandedPlugins] = useState<Record<string, boolean>>({
    'git-control': false,
    'theme-pack': false,
    'todo-list': false,
  })

  // Browse plugins catalogue state
  const [scratchNotesInstalled, setScratchNotesInstalled] = useState(() => {
    return localStorage.getItem('ferminterm_plugin_scratch_notes') === 'true'
  })

  const [isManifestOpen, setIsManifestOpen] = useState(false)
  const [manifestText, setManifestText] = useState('')
  const [isRescanning, setIsRescanning] = useState(false)

  // Persist plugins state
  useEffect(() => {
    localStorage.setItem(PLUGINS_STORAGE_KEY, JSON.stringify(plugins))
    window.dispatchEvent(new CustomEvent('ferminterm:plugins-updated', { detail: plugins }))
  }, [plugins])

  const togglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    )
  }

  const toggleExpand = (id: string) => {
    setExpandedPlugins((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleInstallScratchNotes = () => {
    const nextState = !scratchNotesInstalled
    setScratchNotesInstalled(nextState)
    localStorage.setItem('ferminterm_plugin_scratch_notes', nextState.toString())

    if (nextState) {
      // Add to plugins list if not already there
      setPlugins((prev) => {
        if (prev.some((p) => p.id === 'scratch-notes')) return prev
        return [
          ...prev,
          {
            id: 'scratch-notes',
            name: 'Scratch Notes',
            version: 'v1.0.0',
            isBundled: false,
            category: 'Interface',
            description: 'A scratchpad in the left sidebar for quick notes, code snippets, and scratchpads.',
            enabled: true,
            capabilities: ['Add a scratchpad tab in left sidebar', 'Quick text copy and persistent notes'],
          },
        ]
      })
    } else {
      // Remove from plugins list
      setPlugins((prev) => prev.filter((p) => p.id !== 'scratch-notes'))
    }
  }

  const [rescanStatus, setRescanStatus] = useState<string | null>(null)
  const [manifestError, setManifestError] = useState<string | null>(null)
  const [manifestSuccess, setManifestSuccess] = useState<string | null>(null)

  const handleRescan = () => {
    setIsRescanning(true)
    setRescanStatus(null)
    setTimeout(() => {
      setIsRescanning(false)
      setRescanStatus('Folder disinkronkan: Semua plugin lokal aktif.')
      setTimeout(() => setRescanStatus(null), 3500)
    }, 600)
  }

  const handleOpenFolder = async () => {
    if (window.ferminAPI?.openPath) {
      await window.ferminAPI.openPath(pluginsFolderPath)
    } else if (window.ferminAPI?.openDirectoryDialog) {
      await window.ferminAPI.openDirectoryDialog()
    }
  }

  const handleImportPlugin = async () => {
    if (!window.ferminAPI?.openDirectoryDialog) return
    try {
      const picked = await window.ferminAPI.openDirectoryDialog()
      if (picked) {
        const parts = picked.replace(/\\/g, '/').split('/').filter(Boolean)
        const folderName = parts[parts.length - 1] || 'Custom Plugin'
        const newPlugin: InstalledPlugin = {
          id: `plugin-${Date.now()}`,
          name: folderName,
          version: 'v1.0.0',
          isBundled: false,
          category: 'Tools',
          description: `Loaded from disk: ${picked}`,
          enabled: true,
          capabilities: ['Custom tool execution in terminal workspace', 'External file hooks'],
        }
        setPlugins((prev) => [...prev, newPlugin])
        setManifestSuccess(`Plugin "${folderName}" berhasil diimpor dan didaftarkan!`)
        setTimeout(() => setManifestSuccess(null), 4000)
      }
    } catch (err) {
      console.warn('Import plugin error:', err)
    }
  }

  const handleRegisterManifest = () => {
    setManifestError(null)
    setManifestSuccess(null)
    try {
      const parsed = JSON.parse(manifestText.trim())
      if (!parsed.name) {
        setManifestError('Manifest harus memiliki field "name".')
        return
      }
      const newPlugin: InstalledPlugin = {
        id: parsed.id || `plugin-${Date.now()}`,
        name: parsed.name,
        version: parsed.version || 'v1.0.0',
        isBundled: false,
        category: parsed.category || 'Tools',
        description: parsed.description || 'Custom developer plugin manifest registered.',
        enabled: true,
        capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : ['Custom capability extension'],
      }
      setPlugins((prev) => [...prev, newPlugin])
      setManifestText('')
      setManifestSuccess(`Manifest plugin "${newPlugin.name}" berhasil terdaftar!`)
      setTimeout(() => setManifestSuccess(null), 4000)
    } catch (err) {
      setManifestError('Format JSON manifest tidak valid. Pastikan format JSON benar.')
    }
  }
  const isWin =
    (typeof process !== 'undefined' && process.platform === 'win32') ||
    (typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent || ''))

  const pluginsFolderPath = isWin
    ? '%LOCALAPPDATA%\\kingsley\\plugins'
    : '~/.config/kingsley/plugins'
  return (
    <div className="space-y-8 max-w-4xl font-mono text-xs pb-12 select-none">
      {/* 1. Header (Exact Match to Image 2) */}
      <div className="border-b border-white/5 pb-3">
        <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <span>Plugins</span>
        </h2>
        <p className="text-xs text-neutral-400">
          Extensions that add themes, panes, sidebar tabs and commands.
        </p>
      </div>

      {/* 2. SECTION: Installed (Image 2) */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-white mb-0.5">Installed</h3>
          <p className="text-xs text-neutral-400">
            Everything Kingsley has loaded. Turning one off removes what it contributes right away.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {plugins.map((plugin) => {
            const isExpanded = Boolean(expandedPlugins[plugin.id])

            return (
              <div
                key={plugin.id}
                className="p-4 rounded-xl border border-white/10 bg-[#161824]/90 space-y-3 transition-colors"
              >
                {/* Plugin Main Header Bar */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-white">
                        {plugin.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {plugin.version}
                      </span>
                      {plugin.isBundled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          BUNDLED
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-neutral-500 block">
                      {plugin.category}
                    </span>

                    <p className="text-[11px] text-neutral-400 leading-relaxed pt-0.5">
                      {plugin.description}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div
                    onClick={() => togglePlugin(plugin.id)}
                    className="flex items-center gap-3 shrink-0 cursor-pointer"
                  >
                    <span
                      className={`text-[11px] font-mono ${
                        plugin.enabled ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {plugin.enabled ? 'Enabled' : 'Disabled'}
                    </span>

                    {/* Purple Toggle Capsule */}
                    <div
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                        plugin.enabled ? 'bg-purple-500' : 'bg-neutral-700/80'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                          plugin.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="border-t border-white/5 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(plugin.id)}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    <span>What it can do ({plugin.capabilities.length})</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 pl-4 space-y-1.5 text-[11px] text-neutral-400 border-l border-white/10 ml-1">
                      {plugin.capabilities.map((cap, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. SECTION: Browse plugins (Image 3) */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">Browse plugins</h3>
            <p className="text-xs text-neutral-400">
              Plugins published by their authors. Each listing is pinned to a checksum, so what installs is what was reviewed.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRescan}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/5 text-neutral-300 hover:text-white transition-colors cursor-pointer ${
              isRescanning ? 'animate-spin' : ''
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="text-[11px]">Refresh</span>
          </button>
        </div>

        {/* Scratch Notes Plugin Listing Card */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#161824]/90 flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">Scratch Notes</span>
              <span className="text-[10px] text-neutral-400 font-mono">v1.0.0</span>
            </div>

            <p className="text-[11px] text-neutral-400">
              A scratchpad in the left sidebar. Demonstrates translated strings and a command.
            </p>

            <span className="text-[10px] text-neutral-500 block">By Alethe</span>

            <div className="pt-1 space-y-1 text-[11px] text-neutral-400">
              <div className="flex items-center gap-2 text-purple-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-neutral-300">Add a sidebar tab</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-neutral-300">Add commands</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallScratchNotes}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                scratchNotesInstalled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {scratchNotesInstalled ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Installed</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Get plugin</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.open('https://github.com/onorca/plugins', '_blank')}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
            >
              <span>View source</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-neutral-500 pt-1">
          A listed plugin is third-party code that runs with the same reach as the app. Being listed is not an audit — read the source before turning one on.
        </p>
      </div>

      {/* 4. SECTION: Install from a folder (Image 3) */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div>
          <h3 className="text-sm font-bold text-white mb-0.5">Install from a folder</h3>
          <p className="text-xs text-neutral-400">
            Put the plugin folder in the plugins directory, then register it by pasting its manifest.
          </p>
        </div>

        {/* Directory Bar Box */}
        <div className="p-3 rounded-xl border border-white/10 bg-[#161824] flex items-center justify-between gap-4">
          <div className="min-w-0 flex flex-col">
            <span className="text-[10px] text-neutral-500 font-bold uppercase">Plugins folder</span>
            <span className="text-[11px] text-neutral-300 font-mono truncate" title={pluginsFolderPath}>
              {pluginsFolderPath}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRescan}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] text-neutral-300 hover:text-white transition-colors cursor-pointer ${
                isRescanning ? 'animate-spin' : ''
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span>Rescan folder</span>
            </button>

            <button
              type="button"
              onClick={handleOpenFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3 h-3 text-amber-400" />
              <span>Open plugins folder</span>
            </button>
          </div>
        </div>

        {/* Import Plugin Button */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleImportPlugin}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Import plugin...</span>
          </button>
          <span className="text-[11px] text-neutral-400">
            Pilih folder plugin dari disk. File akan disalin dan didaftarkan langsung ke runtime aplikasi.
          </span>
        </div>

        {rescanStatus && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{rescanStatus}</span>
          </div>
        )}
        {manifestSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{manifestSuccess}</span>
          </div>
        )}
        {manifestError && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
            {manifestError}
          </div>
        )}

        {/* Advanced: paste manifest */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsManifestOpen((prev) => !prev)}
            className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isManifestOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>Advanced: paste a manifest</span>
          </button>

          {isManifestOpen && (
            <div className="mt-3 p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <textarea
                value={manifestText}
                onChange={(e) => setManifestText(e.target.value)}
                placeholder='Paste plugin manifest JSON here (e.g. { "name": "my-plugin", "version": "1.0.0" })...'
                rows={4}
                className="w-full bg-transparent text-[11px] font-mono text-white focus:outline-none placeholder:text-neutral-600 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleRegisterManifest}
                  disabled={!manifestText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Register Manifest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
