import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'
import '@xterm/xterm/css/xterm.css'
import { useTheme } from '../../context/ThemeContext'
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
  const shellRef = useRef(shell)
  shellRef.current = shell
  const cwdRef = useRef(cwd)
  cwdRef.current = cwd
  const lastPasteTimeRef = useRef(0)

  const handlePasteToTerminal = async () => {
    const now = Date.now()
    if (now - lastPasteTimeRef.current < 250) return
    lastPasteTimeRef.current = now

    const api = window.ferminAPI
    if (!api?.sendInput) return

    const currentCwd = cwdRef.current
    const currentShell = shellRef.current

    // 1. Text from clipboard
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        api.sendInput(paneId, text)
        return
      }
    } catch {}

    // 2. Screenshot / Image in clipboard (e.g. Snipping Tool, Win+Shift+S, PrtScn, copied image)
    if (api.readClipboardImage) {
      try {
        const imgRes = await api.readClipboardImage(currentCwd)
        if (imgRes?.success && imgRes.path) {
          const formatted = await formatPathForPane(imgRes.path, {
            paneId,
            shell: currentShell,
            workspacePath: currentCwd,
          })
          api.sendInput(paneId, `${formatted} `)
          return
        }
      } catch {}
    }

    // 3. Fallback: Files copied from Windows Explorer
    if (api.getClipboardFiles) {
      try {
        const fileRes = await api.getClipboardFiles()
        if (fileRes?.success && fileRes.files?.length) {
          const formatted = (
            await Promise.all(
              fileRes.files.map((p) =>
                formatPathForPane(p, {
                  paneId,
                  shell: currentShell,
                  workspacePath: currentCwd,
                })
              )
            )
          ).join(' ')
          api.sendInput(paneId, `${formatted} `)
          return
        }
      } catch {}
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
      allowTransparency: false,
      macOptionIsMeta: true,
      windowsPty: { backend: 'conpty', buildNumber: 22621 },
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current)

    // Keyboard shortcuts: Ctrl+C (copy when selected, otherwise send SIGINT), Ctrl+V (paste)
    term.attachCustomKeyEventHandler((arg: KeyboardEvent) => {
      if (arg.type !== 'keydown') return true

      const isCtrl = arg.ctrlKey || arg.metaKey
      const isShift = arg.shiftKey
      const key = arg.key.toLowerCase()

      // 1. Copy: Ctrl+C (when text is selected) or Ctrl+Shift+C
      if (isCtrl && (key === 'c' || arg.code === 'KeyC')) {
        if (isShift || term.hasSelection()) {
          const selection = term.getSelection()
          if (selection) {
            navigator.clipboard.writeText(selection).catch(() => {})
            return false // Prevent sending SIGINT (\x03) to shell
          }
        }
        // No selection: let Ctrl+C pass through to PTY as SIGINT (\x03)
        return true
      }

      // 2. Paste: Ctrl+V or Ctrl+Shift+V
      if (isCtrl && (key === 'v' || arg.code === 'KeyV')) {
        void handlePasteToTerminal()
        return false // Consume event so \x16 is not sent to PTY
      }

      return true
    })
    // Hardware-accelerated WebGL renderer with automatic context recovery
    const initWebgl = () => {
      if (webglAddonRef.current || isUnmountingRef.current) return
      try {
        const webglAddon = new WebglAddon()
        webglAddon.onContextLoss(() => {
          try {
            webglAddon.dispose()
          } catch {}
          webglAddonRef.current = null
          // Automatically restore WebGL when GPU or display recovers
          setTimeout(() => {
            if (!isUnmountingRef.current && termRef.current) {
              initWebgl()
            }
          }, 1000)
        })
        term.loadAddon(webglAddon)
        webglAddonRef.current = webglAddon
      } catch (e) {
        console.warn('[TerminalPane] WebGL addon failed to activate, fallback to default renderer:', e)
      }
    }
    initWebgl()
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

    // Auto-fit on pane resize with requestAnimationFrame throttling & duplicate dimension check
    let prevCols = 0
    let prevRows = 0
    let resizeRafId: number | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId)
      resizeRafId = requestAnimationFrame(() => {
        try {
          if (
            containerRef.current &&
            containerRef.current.clientWidth > 0 &&
            containerRef.current.clientHeight > 0
          ) {
            fitAddon.fit()
            if (term.cols !== prevCols || term.rows !== prevRows) {
              prevCols = term.cols
              prevRows = term.rows
              window.ferminAPI?.resizeTerminal(paneId, term.cols, term.rows)
            }
          }
        } catch (err) {
          console.warn('[TerminalPane] Resize error:', err)
        }
      })
    })

    resizeObserver.observe(containerRef.current)

    // Cleanup on unmount
    return () => {
      isUnmountingRef.current = true
      cancelAnimationFrame(rafId)
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId)
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
  }, [paneId, shell])

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
      />

      {/* Terminal Canvas Container */}
      <div
        className="flex-1 w-full relative overflow-hidden cursor-text"
        style={{ padding: `${appearance.padding}px` }}
        onClick={() => {
          onFocus()
          termRef.current?.focus()
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          if (termRef.current?.hasSelection()) {
            const sel = termRef.current.getSelection()
            if (sel) {
              navigator.clipboard.writeText(sel).catch(() => {})
            }
          } else {
            void handlePasteToTerminal()
          }
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
