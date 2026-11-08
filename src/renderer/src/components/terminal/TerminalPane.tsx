import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'
import '@xterm/xterm/css/xterm.css'
import { useTheme } from '../../context/ThemeContext'
import { showFileToast } from '../notifications/FileTransferToast'
import { PaneHeader } from './PaneHeader'
import { formatPathForPane } from '../../lib/path-format'
import type { ShellType } from '@shared/types'

interface TerminalPaneProps {
  paneId: string
  shell: ShellType
  title?: string
  cwd?: string
  isFocused: boolean
  canClose: boolean
  onFocus: () => void
  onSplit: (direction: 'horizontal' | 'vertical') => void
  onClose: () => void
  onChangeShell: (shell: ShellType) => void
}

const TerminalPaneComponent: React.FC<TerminalPaneProps> = ({
  paneId,
  shell,
  title,
  cwd,
  isFocused,
  canClose,
  onFocus,
  onSplit,
  onClose,
  onChangeShell,
}) => {
  const { theme, themeId, appearance, getFontFamilyString } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const webglAddonRef = useRef<WebglAddon | null>(null)
  const isUnmountingRef = useRef(false)
  const isInitialMountRef = useRef(true)
  const [isExited, setIsExited] = useState(false)
  const [exitCode, setExitCode] = useState<number | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  // Capture the primary display, save it as PNG and type the path into this
  // shell so CLI agents (Claude Code, OpenCode, etc.) can read it.
  const handleCaptureScreenshot = async () => {
    const api = window.ferminAPI
    if (!api?.captureScreenshot || isCapturing) return

    setIsCapturing(true)
    try {
      const result = await api.captureScreenshot(cwd)
      if (!result?.success || !result.path) {
        showFileToast(
          'Screenshot Gagal',
          result?.error || 'Tidak dapat mengambil screenshot.',
          'error'
        )
        return
      }

      const formatted = await formatPathForPane(result.path, {
        paneId,
        shell,
        workspacePath: cwd,
      })

      api.sendInput(paneId, `${formatted} `)
      showFileToast('Screenshot Terkirim', formatted, 'success')
      termRef.current?.focus()
    } finally {
      setIsCapturing(false)
    }
  }

  // Initialize xterm instance
  useEffect(() => {
    if (!containerRef.current) return
    isUnmountingRef.current = false

    // Clean container before mounting to handle React StrictMode re-mounts
    containerRef.current.innerHTML = ''

    const term = new XTerm({
      fontFamily: getFontFamilyString(appearance.fontFamily),
      fontSize: appearance.fontSize,
      lineHeight: appearance.lineHeight,
      cursorBlink: appearance.cursorBlink,
      cursorStyle: appearance.cursorStyle,
      cursorWidth: 2,
      theme: theme.xterm,
      allowTransparency: true,
      macOptionIsMeta: true,
      windowsPty: { backend: 'conpty', buildNumber: 22621 },
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)

    term.open(containerRef.current)

    // Hardware-accelerated WebGL renderer for ultra-low typing latency (<2ms)
    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => {
        webglAddon.dispose()
        webglAddonRef.current = null
      })
      term.loadAddon(webglAddon)
      webglAddonRef.current = webglAddon
    } catch (e) {
      console.warn('[TerminalPane] WebGL addon failed to activate, fallback to default renderer:', e)
    }

    termRef.current = term
    fitAddonRef.current = fitAddon

    if (isFocused) {
      term.focus()
    }

    // Initial fit after DOM paint
    const rafId = requestAnimationFrame(() => {
      try {
        if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
          fitAddon.fit()
          if (window.ferminAPI) {
            window.ferminAPI.resizeTerminal(paneId, term.cols || 80, term.rows || 24)
          }
        }
        if (isFocused) {
          term.focus()
        }
      } catch (err) {
        console.warn('[TerminalPane] Initial fit error:', err)
      }
    })
    // Spawn PTY process or re-attach to existing running terminal session
    if (window.ferminAPI) {
      window.ferminAPI
        .createTerminal({
          id: paneId,
          shell,
          cwd,
          cols: term.cols || 80,
          rows: term.rows || 24,
        })
        .then((res) => {
          if (res?.history && termRef.current) {
            termRef.current.write(res.history)
          }
        })
        .catch((err) => {
          console.warn('[TerminalPane] createTerminal error:', err)
        })
    }

    // Forward keystrokes to PTY
    const onDataDispose = term.onData((data) => {
      window.ferminAPI?.sendInput(paneId, data)
    })

    // Listen for PTY output
    const removeDataListener = window.ferminAPI?.onTerminalData((id, data) => {
      if (id === paneId) {
        term.write(data)
      }
    })

    // Listen for PTY exit
    const removeExitListener = window.ferminAPI?.onTerminalExit((id, code) => {
      if (id === paneId && !isUnmountingRef.current) {
        // Don't show exit screen on termination signals or intentional kill
        if (code !== 0 && code !== -1073741510) {
          setIsExited(true)
          setExitCode(code)
        }
      }
    })

    // Auto-fit on pane resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
          fitAddon.fit()
          window.ferminAPI?.resizeTerminal(paneId, term.cols, term.rows)
        }
      } catch (err) {
        console.warn('[TerminalPane] Resize error:', err)
      }
    })

    resizeObserver.observe(containerRef.current)

    // Cleanup on unmount
    return () => {
      isUnmountingRef.current = true
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      onDataDispose.dispose()
      removeDataListener?.()
      removeExitListener?.()
      try {
        webglAddonRef.current?.dispose()
      } catch {}
      webglAddonRef.current = null
      try {
        term.dispose()
      } catch {}
      termRef.current = null
      fitAddonRef.current = null
    }
  }, [paneId, shell, cwd])

  // Dual-sync: update xterm colors, typography and cursor whenever theme or appearance changes (skip initial mount)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }

    if (termRef.current) {
      try {
        termRef.current.options.theme = theme.xterm
        termRef.current.options.fontSize = appearance.fontSize
        termRef.current.options.lineHeight = appearance.lineHeight
        termRef.current.options.fontFamily = getFontFamilyString(appearance.fontFamily)
        termRef.current.options.cursorStyle = appearance.cursorStyle
        termRef.current.options.cursorBlink = appearance.cursorBlink
        fitAddonRef.current?.fit()
        webglAddonRef.current?.clearTextureAtlas()
      } catch (err) {
        console.warn('[TerminalPane] Appearance sync error:', err)
      }
    }
  }, [theme, appearance, getFontFamilyString])

  // Focus terminal when pane is active
  useEffect(() => {
    if (isFocused && termRef.current) {
      termRef.current.focus()
    }
  }, [isFocused])

  // Re-focus terminal when app window regains focus
  useEffect(() => {
    const handleWindowFocus = () => {
      if (isFocused && termRef.current) {
        termRef.current.focus()
      }
    }
    window.addEventListener('focus', handleWindowFocus)
    return () => window.removeEventListener('focus', handleWindowFocus)
  }, [isFocused])
  const handleRestart = () => {
    setIsExited(false)
    setExitCode(null)
    if (termRef.current && fitAddonRef.current) {
      termRef.current.clear()
      try {
        fitAddonRef.current.fit()
      } catch {}
      window.ferminAPI?.createTerminal({
        id: paneId,
        shell,
        cwd,
        cols: termRef.current.cols || 80,
        rows: termRef.current.rows || 24,
      })
    }
  }

  return (
    <div
      data-terminal-pane-id={paneId}
      onClick={() => {
        onFocus()
        termRef.current?.focus()
      }}
      className={`h-full w-full flex flex-col relative transition-[border-color,box-shadow] duration-150 overflow-hidden ${
        isFocused ? 'z-10' : 'z-0'
      }`}
      style={{
        backgroundColor: theme.ui.background,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isFocused ? theme.ui.borderActive : theme.ui.border,
        boxShadow: isFocused ? theme.ui.activePaneGlow : 'none',
      }}
    >

      {/* Pane Header */}
      <PaneHeader
        paneId={paneId}
        title={title || shell.toUpperCase()}
        shell={shell}
        isFocused={isFocused}
        canClose={canClose}
        onSplit={onSplit}
        onClose={onClose}
        onChangeShell={onChangeShell}
        onCaptureScreenshot={handleCaptureScreenshot}
        isCapturing={isCapturing}
      />

      {/* Terminal Canvas Container */}
      <div
        className="flex-1 w-full relative overflow-hidden cursor-text"
        style={{ padding: `${appearance.padding}px` }}
        onClick={() => {
          onFocus()
          termRef.current?.focus()
        }}
      >
        <div
          ref={containerRef}
          className="h-full w-full"
          onClick={() => {
            termRef.current?.focus()
          }}
        />


        {/* Process Exited Overlay */}
        {isExited && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
            <span className="text-xs font-mono text-neutral-300">
              Process exited with code <span className="font-bold text-red-400">{exitCode ?? 0}</span>
            </span>
            <button
              onClick={handleRestart}
              className="px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors"
              style={{
                backgroundColor: theme.ui.surfaceHover,
                color: theme.ui.accent,
                border: `1px solid ${theme.ui.borderActive}`,
              }}
            >
              Restart Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const TerminalPane = React.memo(TerminalPaneComponent, (prev, next) => {
  return (
    prev.paneId === next.paneId &&
    prev.shell === next.shell &&
    prev.title === next.title &&
    prev.cwd === next.cwd &&
    prev.isFocused === next.isFocused &&
    prev.canClose === next.canClose
  )
})
