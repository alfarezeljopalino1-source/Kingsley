import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import * as pty from 'node-pty'
import type { CreateTerminalOptions, ShellInfo, ShellType } from '../preload/types'

interface ActivePty {
  id: string
  ptyProcess: pty.IPty
  shell: ShellType
  cwd: string
  history: string
  /** CLI agent detected from the terminal output (sticky for the session). */
  agentHint: string
  /** Rolling tail used to detect agent banners split across chunks. */
  probe: string
  /** Timestamp of last agent probe to prevent running regex on every chunk */
  lastAgentCheck: number
}

/**
 * Cheap, instant agent detection from terminal output. The process-tree scan
 * is accurate but slow on Windows (WMI cold start can take seconds), so the
 * drop/paste path relies on these banners first.
 */
const AGENT_OUTPUT_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: 'opencode', pattern: /\bopencode\b/i },
  { id: 'antigravity', pattern: /antigravity/i },
  { id: 'gemini', pattern: /gemini\s+(cli|pro|flash|\d)/i },
  { id: 'claude', pattern: /claude\s+code|claude-code|claude\s+(sonnet|opus|haiku)/i },
  { id: 'codex', pattern: /\bcodex\b/i },
  { id: 'aider', pattern: /\baider\b/i },
  { id: 'cursor', pattern: /cursor-agent/i },
  { id: 'windsurf', pattern: /windsurf/i },
  { id: 'alethe', pattern: /\balethe\b/i },
  { id: 'omp', pattern: /\bomp\b|one\s*model\s*prompt/i },
]

function detectAgentFromOutput(sample: string): string {
  // Strip ANSI escapes so banners split by colour codes still match.
  let clean = sample.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')

  // Shell prompts echo the working directory (e.g. D:\work\opencode>), which
  // would otherwise look like an agent name. Drop paths before matching.
  clean = clean
    .replace(/[A-Za-z]:[\\/][^\r\n"'<>|]*/g, ' ')
    .replace(/(^|\s)\/(?:[\w.@+-]+\/)+[\w.@+-]*/g, ' ')

  for (const signature of AGENT_OUTPUT_PATTERNS) {
    if (signature.pattern.test(clean)) return signature.id
  }
  return 'none'
}
export class PtyManager {
  private terminals = new Map<string, ActivePty>()
  private onDataCallback?: (id: string, data: string) => void
  private onExitCallback?: (id: string, exitCode: number) => void

  constructor(
    onData?: (id: string, data: string) => void,
    onExit?: (id: string, exitCode: number) => void
  ) {
    this.onDataCallback = onData
    this.onExitCallback = onExit
  }

  public setCallbacks(
    onData: (id: string, data: string) => void,
    onExit: (id: string, exitCode: number) => void
  ) {
    this.onDataCallback = onData
    this.onExitCallback = onExit
  }

  public resolveShellPath(shell: ShellType = 'powershell'): { command: string; args: string[] } {
    const isWindows = process.platform === 'win32'
    if (!isWindows) {
      const isMac = process.platform === 'darwin'
      const userShell = process.env.SHELL || (isMac ? '/bin/zsh' : '/bin/bash')
      if (shell === 'bash') {
        const bashPath = this.findExecutable('bash') || '/bin/bash'
        return { command: bashPath, args: ['-l'] }
      }
      if (shell === 'powershell') {
        const pwsh = this.findExecutable('pwsh')
        if (pwsh) return { command: pwsh, args: ['-NoLogo'] }
        return { command: userShell, args: ['-l'] }
      }
      return { command: userShell, args: ['-l'] }
    }

    switch (shell) {
      case 'powershell': {
        const pwshPath = this.findExecutable('pwsh.exe')
        if (pwshPath) {
          return { command: pwshPath, args: ['-NoLogo'] }
        }
        return { command: 'powershell.exe', args: ['-NoLogo'] }
      }
      case 'cmd':
        return { command: 'cmd.exe', args: [] }
      case 'bash': {
        const gitBashPaths = [
          'C:\\Program Files\\Git\\bin\\bash.exe',
          'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
          path.join(process.env.LOCALAPPDATA || '', 'Programs\\Git\\bin\\bash.exe')
        ]
        for (const p of gitBashPaths) {
          if (fs.existsSync(p)) {
            return { command: p, args: ['--login', '-i'] }
          }
        }
        return { command: 'bash.exe', args: ['--login', '-i'] }
      }
      case 'wsl':
        return { command: 'wsl.exe', args: [] }
      default:
        return { command: 'powershell.exe', args: ['-NoLogo'] }
    }
  }

  public getAvailableShells(): ShellInfo[] {
    const isWindows = process.platform === 'win32'
    if (!isWindows) {
      const isMac = process.platform === 'darwin'
      const userShell = process.env.SHELL || (isMac ? '/bin/zsh' : '/bin/bash')
      const hasPwsh = Boolean(this.findExecutable('pwsh'))
      return [
        {
          type: 'bash',
          name: isMac ? 'Zsh / Terminal' : 'Bash',
          command: userShell,
          available: true
        },
        {
          type: 'powershell',
          name: 'PowerShell Core (pwsh)',
          command: 'pwsh',
          available: hasPwsh
        }
      ]
    }

    const gitBashPaths = [
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Programs\\Git\\bin\\bash.exe')
    ]
    const hasGit = gitBashPaths.some((p) => fs.existsSync(p)) || Boolean(this.findExecutable('bash.exe'))

    return [
      {
        type: 'powershell',
        name: 'PowerShell',
        command: this.findExecutable('pwsh.exe') || 'powershell.exe',
        available: true
      },
      {
        type: 'cmd',
        name: 'Command Prompt',
        command: 'cmd.exe',
        available: true
      },
      {
        type: 'bash',
        name: 'Git Bash',
        command: 'bash.exe',
        available: hasGit
      },
      {
        type: 'wsl',
        name: 'WSL (Linux)',
        command: 'wsl.exe',
        available: Boolean(this.findExecutable('wsl.exe'))
      }
    ]
  }

  public createTerminal(options: CreateTerminalOptions): {
    success: boolean
    pid?: number
    history?: string
    alreadyExists?: boolean
    error?: string
  } {
    try {
      const { id, shell = 'powershell', cols = 80, rows = 24 } = options

      const existing = this.terminals.get(id)
      if (existing) {
        return {
          success: true,
          pid: existing.ptyProcess.pid,
          history: existing.history,
          alreadyExists: true,
        }
      }
      const { command, args } = this.resolveShellPath(shell)
      const cwd = options.cwd || os.homedir() || process.cwd()

      const env = {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      }

      const ptyProcess = pty.spawn(command, args, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env,
        useConpty: process.platform === 'win32'
      })

      ptyProcess.onData((data: string) => {
        const current = this.terminals.get(id)
        if (current && current.ptyProcess === ptyProcess) {
          // 1. Immediately forward data to frontend for zero-latency keystroke echo
          this.onDataCallback?.(id, data)

          // 2. Append history buffer with hysteresis: trim down to 300k only after 600k
          // to completely eliminate huge string allocations and GC pauses on every chunk.
          current.history += data
          if (current.history.length > 600000) {
            current.history = current.history.slice(-300000)
          }

          // 3. Agent detection: throttled to at most once per 500ms, only on substantial chunks
          if (current.agentHint === 'none') {
            current.probe = (current.probe + data).slice(-2000)
            const now = Date.now()
            if (
              now - current.lastAgentCheck >= 500 &&
              (data.length > 10 || current.probe.length > 100)
            ) {
              current.lastAgentCheck = now
              const hint = detectAgentFromOutput(current.probe)
              if (hint !== 'none') {
                current.agentHint = hint
                current.probe = ''
              }
            }
          }
        }
      })

      ptyProcess.onExit(({ exitCode }) => {
        const current = this.terminals.get(id)
        if (current && current.ptyProcess === ptyProcess) {
          this.terminals.delete(id)
          this.onExitCallback?.(id, exitCode ?? 0)
        }
      })

      this.terminals.set(id, {
        id,
        ptyProcess,
        shell,
        cwd,
        history: '',
        agentHint: 'none',
        probe: '',
        lastAgentCheck: 0,
      })

      return { success: true, pid: ptyProcess.pid }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[PtyManager] Failed to spawn terminal ${options.id}:`, errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  public getTerminalPid(id: string): number | null {
    const term = this.terminals.get(id)
    return term ? term.ptyProcess.pid : null
  }

  public getAgentHint(id: string): string {
    return this.terminals.get(id)?.agentHint || 'none'
  }

  public write(id: string, data: string): void {
    const term = this.terminals.get(id)
    if (term) {
      try {
        term.ptyProcess.write(data)
      } catch (err) {
        console.error(`[PtyManager] Write error on terminal ${id}:`, err)
      }
    } else {
      console.warn(`[PtyManager] write: Terminal "${id}" not found. Active:`, Array.from(this.terminals.keys()))
    }
  }

  public resize(id: string, cols: number, rows: number): void {
    const term = this.terminals.get(id)
    if (term && cols > 0 && rows > 0) {
      try {
        term.ptyProcess.resize(cols, rows)
      } catch (err) {
        console.warn(`[PtyManager] Resize error for ${id}:`, err)
      }
    }
  }

  public closeTerminal(id: string): void {
    const term = this.terminals.get(id)
    if (term) {
      this.terminals.delete(id)
      try {
        term.ptyProcess.kill()
      } catch (err) {
        console.warn(`[PtyManager] Kill error for ${id}:`, err)
      }
    }
  }

  public closeAll(): void {
    for (const term of this.terminals.values()) {
      try {
        term.ptyProcess.kill()
      } catch {
        // ignore cleanup errors on app exit
      }
    }
    this.terminals.clear()
  }

  private findExecutable(exeName: string): string | null {
    const paths = (process.env.PATH || '').split(path.delimiter)
    for (const p of paths) {
      const fullPath = path.join(p, exeName)
      if (fs.existsSync(fullPath)) {
        return fullPath
      }
    }
    return null
  }
}
