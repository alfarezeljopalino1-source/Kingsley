import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  FileCode,
  FileText,
  FileJson,
  Image,
  File,
  Copy,
  Check,
  RotateCw,
  AlertCircle
} from 'lucide-react'
import Prism from 'prismjs'
// Import syntax definitions
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-dart'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-yaml'

import { useTheme } from '../../context/ThemeContext'

interface CodeViewerPaneProps {
  filePath: string
  fileName?: string
  onClose?: () => void
}

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'dart':
      return 'dart'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript'
    case 'json':
      return 'json'
    case 'py':
      return 'python'
    case 'html':
    case 'xml':
    case 'svg':
      return 'markup'
    case 'css':
    case 'scss':
      return 'css'
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'sh':
    case 'bash':
    case 'ps1':
      return 'bash'
    case 'yaml':
    case 'yml':
      return 'yaml'
    default:
      return 'clike'
  }
}

export const CodeViewerPane: React.FC<CodeViewerPaneProps> = ({
  filePath,
  fileName,
  onClose,
}) => {
  const { theme, appearance, getFontFamilyString } = useTheme()
  const [content, setContent] = useState<string>('')
  const [fullPath, setFullPath] = useState<string>(filePath)
  const [isImage, setIsImage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayName = fileName || filePath.split(/[/\\]/).pop() || filePath
  const language = useMemo(() => detectLanguage(filePath), [filePath])

  // Load file content from disk
  const loadFile = useCallback(() => {
    let isMounted = true
    setIsLoading(true)
    setError(null)
    setIsImage(false)

    if (window.ferminAPI?.readFile) {
      window.ferminAPI
        .readFile(filePath)
        .then((res) => {
          if (!isMounted) return
          if (res.success) {
            setIsImage(Boolean(res.isImage))
            setContent(res.content)
            if (res.fullPath) setFullPath(res.fullPath)
          } else {
            setError(res.error || 'Failed to read file.')
          }
        })
        .catch((err) => {
          if (!isMounted) return
          setError(err instanceof Error ? err.message : String(err))
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })
    } else {
      setError('File reader bridge is unavailable.')
      setIsLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [filePath])

  useEffect(() => {
    const cleanup = loadFile()
    return cleanup
  }, [loadFile])

  // Syntax highlight content using Prism with resilient fallback
  const highlightedLines = useMemo(() => {
    if (!content || isImage) return []
    try {
      const grammar = Prism.languages[language] || Prism.languages.clike || Prism.languages.javascript
      if (!grammar) {
        return content.split('\n')
      }
      const html = Prism.highlight(content, grammar, language)
      return html.split('\n')
    } catch (err) {
      console.warn('Prism highlighting fallback:', err)
      return content.split('\n')
    }
  }, [content, language, isImage])

  // Copy full code to clipboard
  const handleCopy = () => {
    if (!content || isImage) return
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="h-full w-full flex flex-col relative select-none font-mono overflow-hidden"
      style={{
        backgroundColor: theme.ui.background,
        color: theme.ui.text,
      }}
    >
      {/* 1. Top Breadcrumb & Actions Bar */}
      <div
        className="px-4 py-2 border-b flex items-center justify-between text-xs shrink-0 select-none bg-black/20"
        style={{ borderColor: theme.ui.border }}
      >
        {/* Left: Breadcrumb Path */}
        <div className="flex items-center gap-2 truncate max-w-[70%]">
          <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
          <span
            className="text-[11px] font-mono text-neutral-400 truncate hover:text-white transition-colors"
            title={fullPath}
          >
            {fullPath}
          </span>
        </div>

        {/* Right: Meta Info & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 uppercase font-bold">
            {language}
          </span>

          <span className="text-[11px] text-neutral-500 hidden sm:inline">
            {highlightedLines.length} lines
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all text-[11px] cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Code Viewer Body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 select-text font-mono"
        style={{
          fontFamily: getFontFamilyString(appearance.fontFamily),
          fontSize: `${appearance.fontSize}px`,
          lineHeight: `${appearance.lineHeight * 1.5}`,
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-neutral-400 text-xs">
            <RotateCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Loading {displayName}...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 max-w-xl mx-auto my-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <div className="font-bold text-sm">Failed to Open File</div>
            <div className="text-xs opacity-75 font-mono break-all">{error}</div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => loadFile()}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  Close Tab
                </button>
              )}
            </div>
          </div>
        ) : isImage ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-8 select-none">
            <div className="p-4 rounded-2xl border border-white/10 bg-black/40 flex flex-col items-center gap-3 shadow-2xl backdrop-blur-sm max-w-full max-h-full">
              <img
                src={content}
                alt={displayName}
                className="max-h-[60vh] max-w-[80vw] object-contain rounded-lg border border-white/5"
              />
              <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                <span className="font-bold text-neutral-200">{displayName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-cyan-300 uppercase">Image Preview</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-w-fit">
            {highlightedLines.map((lineHtml, idx) => (
              <div
                key={idx}
                className="flex items-baseline hover:bg-white/[0.03] transition-colors leading-relaxed group"
              >
                {/* Line Number Column (Unselectable) */}
                <span
                  className="w-12 pr-4 text-right select-none text-neutral-600 group-hover:text-neutral-400 shrink-0 font-mono text-[11px]"
                  style={{ userSelect: 'none' }}
                >
                  {idx + 1}
                </span>

                {/* Highlighted Code Line */}
                <span
                  className="flex-1 whitespace-pre font-mono select-text"
                  dangerouslySetInnerHTML={{
                    __html: lineHtml || '<span>&nbsp;</span>',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
