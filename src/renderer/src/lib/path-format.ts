import type { ShellType } from '@shared/types'

/**
 * Formats an absolute path for a plain shell prompt (PowerShell / cmd /
 * Git Bash / WSL).
 */
export function formatShellPath(targetPath: string, shell?: ShellType): string {
  if (!targetPath) return ''

  if (shell === 'wsl') {
    const drive = /^([a-zA-Z]):[\\/](.*)$/.exec(targetPath)
    if (drive) {
      return `'/mnt/${drive[1].toLowerCase()}/${drive[2].replace(/\\/g, '/')}'`
    }
    return `'${targetPath.replace(/\\/g, '/')}'`
  }

  if (shell === 'bash') {
    return `'${targetPath.replace(/\\/g, '/')}'`
  }

  return /\s/.test(targetPath) ? `"${targetPath}"` : targetPath
}

function normalizeSlashes(value: string): string {
  return value.trim().replace(/\\/g, '/')
}

/** True when `child` is the same path as, or lives inside, `parent`. */
export function isPathInside(child: string, parent: string): boolean {
  if (!child || !parent) return false
  const base = normalizeSlashes(parent).replace(/\/+$/, '').toLowerCase()
  const target = normalizeSlashes(child).toLowerCase()
  return target === base || target.startsWith(`${base}/`)
}

/**
 * Formats an absolute path as an agent CLI file reference. Gemini CLI (and
 * Claude Code / OpenCode) read `@path` and inject the file/image content.
 *
 * Paths inside the workspace are sent relative to it, because Gemini CLI
 * rejects `@` references that resolve outside its workspace root. Spaces are
 * escaped with a backslash, e.g. `@My\ Docs/shot.png`.
 */
export function formatAgentPath(targetPath: string, workspacePath?: string | null): string {
  const normalized = normalizeSlashes(targetPath)

  if (workspacePath && isPathInside(normalized, workspacePath)) {
    const base = normalizeSlashes(workspacePath).replace(/\/+$/, '')
    const relative = normalized.slice(base.length).replace(/^\/+/, '')
    if (relative) {
      return `@${relative.replace(/ /g, '\\ ')}`
    }
  }

  return /\s/.test(targetPath) ? `"${targetPath}"` : targetPath
}

/**
 * Detects whether the pane is currently running a CLI agent. The main process
 * matches the agent banner in the terminal output first and falls back to a
 * process-tree scan; when neither is available we trust the workspace agent.
 */
export async function resolveAgentKind(
  paneId?: string,
  workspaceAgent?: string | null
): Promise<string> {
  try {
    if (paneId && window.ferminAPI?.detectTerminalAgent) {
      const detected = await window.ferminAPI.detectTerminalAgent(paneId)
      if (detected?.success) {
        return detected.agent || 'none'
      }
    }
  } catch {
    // fall through to the workspace hint
  }

  return workspaceAgent && workspaceAgent !== 'none' ? workspaceAgent : 'none'
}

export async function formatPathForPane(
  targetPath: string,
  options: {
    paneId?: string
    shell?: ShellType
    workspaceAgent?: string | null
    workspacePath?: string | null
  }
): Promise<string> {
  const agent = await resolveAgentKind(options.paneId, options.workspaceAgent)
  if (agent && agent !== 'none') return formatAgentPath(targetPath, options.workspacePath)
  return formatShellPath(targetPath, options.shell)
}
