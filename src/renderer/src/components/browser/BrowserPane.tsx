import React, { useState, useRef } from 'react'
import {
  Globe,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  X,
  Lock,
  Search,
  Bookmark,
  Home,
  AlertCircle
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface BrowserPaneProps {
  initialUrl?: string
  onClose: () => void
}

const PRESET_BOOKMARKS = [
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'Localhost:5173', url: 'http://localhost:5173/' },
  { name: 'Localhost:3000', url: 'http://localhost:3000/' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
]

function formatTargetUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return 'https://www.google.com'

  // If search query (no dots, or has spaces), route through Google Search
  if (
    (!trimmed.includes('.') || trimmed.includes(' ')) &&
    !trimmed.startsWith('localhost') &&
    !trimmed.startsWith('127.0.0.1') &&
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://')
  ) {
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
  }

  // Local dev server
  if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
    return trimmed.startsWith('http') ? trimmed : `http://${trimmed}`
  }

  // Absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Default web URL
  return `https://${trimmed}`
}

export const BrowserPane: React.FC<BrowserPaneProps> = ({
  initialUrl = 'https://www.google.com',
  onClose,
}) => {
  const { theme } = useTheme()
  const [url, setUrl] = useState(initialUrl)
  const [inputUrl, setInputUrl] = useState(initialUrl)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleNavigate = (target?: string) => {
    const destination = formatTargetUrl(target || inputUrl)
    setUrl(destination)
    setInputUrl(destination)
    setIsLoading(true)
    setHasError(false)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleNavigate()
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setHasError(false)
    if (iframeRef.current) {
      iframeRef.current.src = url
    }
  }

  const handleGoBack = () => {
    try {
      iframeRef.current?.contentWindow?.history.back()
    } catch {
      window.history.back()
    }
  }

  const handleGoForward = () => {
    try {
      iframeRef.current?.contentWindow?.history.forward()
    } catch {
      window.history.forward()
    }
  }

  const handleOpenExternal = () => {
    if (window.ferminAPI?.openExternal) {
      window.ferminAPI.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const isHttps = url.startsWith('https://')

  return (
    <div
      className="h-full w-full flex flex-col border-l overflow-hidden select-none font-mono text-xs shadow-2xl"
      style={{
        backgroundColor: theme.ui.background,
        borderColor: theme.ui.borderActive,
      }}
    >
      {/* 1. Main Navigation & Address Bar Header */}
      <div
        className="px-3 py-2 flex items-center justify-between border-b gap-2 shrink-0 select-none"
        style={{
          backgroundColor: theme.ui.surface,
          borderColor: theme.ui.border,
          color: theme.ui.text,
        }}
      >
        {/* Navigation History & Refresh Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleGoBack}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleGoForward}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRefresh}
            className={`p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer ${
              isLoading ? 'animate-spin text-cyan-400' : ''
            }`}
            title="Reload page"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleNavigate('https://www.google.com')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Home (Google)"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Omnibox / Search & URL Input Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 focus-within:border-cyan-400 transition-colors">
            {isHttps ? (
              <span title="Secure Connection (HTTPS)" className="flex items-center shrink-0">
                <Lock className="w-3 h-3 text-emerald-400" />
              </span>
            ) : (
              <Globe className="w-3 h-3 text-neutral-400 shrink-0" />
            )}
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent text-[11px] font-mono focus:outline-none text-white placeholder:text-neutral-500"
              placeholder="Search Google or enter web address..."
            />
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl('')}
                className="text-neutral-500 hover:text-white transition-colors"
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </form>

        {/* External Browser & Close Pane Action */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleOpenExternal}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Open in System Default Browser (Chrome/Edge)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Close Browser Pane"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Quick Bookmarks Bar */}
      <div
        className="px-3 py-1 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-black/30 text-[10px]"
        style={{ borderColor: theme.ui.border }}
      >
        <Bookmark className="w-3 h-3 text-amber-400 shrink-0 mr-1" />
        {PRESET_BOOKMARKS.map((b) => (
          <button
            key={b.url}
            onClick={() => handleNavigate(b.url)}
            className={`px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors shrink-0 ${
              url === b.url
                ? 'bg-white/10 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* 3. Live Browser View Screen */}
      <div className="flex-1 w-full relative bg-white overflow-hidden">
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 animate-pulse z-30" />
        )}

        {hasError ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-[#0b1226] text-white text-center font-mono">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
            <h3 className="text-sm font-bold mb-1">Failed to Load Page</h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
              Could not connect to {url}. If this is a local server, ensure your dev server is running (e.g. npm run dev).
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={handleOpenExternal}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs transition-colors cursor-pointer"
              >
                Open in System Browser
              </button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={url}
            title="Kingsley Live Browser Preview"
            className="w-full h-full border-none bg-white"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )}
      </div>
    </div>
  )
}
