import {
  ipcMain,
  dialog,
  shell,
  app,
  clipboard,
  type BrowserWindow,
} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { exec, execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import type { PtyManager } from './pty-manager'
import type { CreateTerminalOptions, WindowAction } from '../preload/types'

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

function samePath(a: string, b: string): boolean {
  return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase()
}

function isInside(child: string, parent: string): boolean {
  const rel = path.relative(path.resolve(parent), path.resolve(child))
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

function getAvailableName(destDir: string, baseName: string, isDirectory: boolean): string {
  const ext = isDirectory ? '' : path.extname(baseName)
  const stem = isDirectory ? baseName : path.basename(baseName, ext)
  let candidate = path.join(destDir, baseName)
  let counter = 1

  while (fs.existsSync(candidate)) {
    const newName = `${stem} (${counter})${ext}`
    candidate = path.join(destDir, newName)
    counter++
  }
  return candidate
}

function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * Copies with Node's fs.cp first. If that fails (locked file, OneDrive
 * placeholder that has not been hydrated, restricted attribute, long path,
 * etc.) fall back to PowerShell Copy-Item which lets Windows resolve it.
 */
async function copyPathWithFallback(src: string, dest: string, isDirectory: boolean): Promise<void> {
  try {
    await fs.promises.cp(src, dest, {
      recursive: true,
      force: true,
      errorOnExist: false,
      preserveTimestamps: true,
    })
    return
  } catch (primaryError) {
    if (process.platform !== 'win32') throw primaryError
    // A partially written destination would make Copy-Item nest the source
    // inside it, so remove the leftovers before retrying.
    await fs.promises.rm(dest, { recursive: true, force: true }).catch(() => undefined)
  }

  const cmd = `powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference='Stop'; Copy-Item -LiteralPath ${psQuote(
    src
  )} -Destination ${psQuote(dest)}${isDirectory ? ' -Recurse' : ''} -Force"`
  await execAsync(cmd, { timeout: 0, windowsHide: true, maxBuffer: 1024 * 1024 * 16 })
}

async function copyOrMoveItem(
  srcPath: string,
  targetDir: string,
  operation: 'copy' | 'move',
  conflictStrategy: 'auto-rename' | 'overwrite' = 'auto-rename'
): Promise<{ src: string; dest: string }> {
  const resolvedSrc = path.resolve(srcPath)
  const resolvedTarget = path.resolve(targetDir)

  if (!fs.existsSync(resolvedSrc)) {
    throw new Error(`Source does not exist: ${resolvedSrc}`)
  }

  const stat = await fs.promises.stat(resolvedSrc)
  const isDirectory = stat.isDirectory()
  const baseName = path.basename(resolvedSrc)

  // Only directories can be copied into themselves. A file living in the
  // target folder is a perfectly valid drop (it simply gets auto-renamed).
  if (isDirectory && isInside(resolvedTarget, resolvedSrc)) {
    throw new Error(`Cannot ${operation} a folder into itself or one of its subfolders`)
  }

  let destPath = path.join(resolvedTarget, baseName)

  if (samePath(destPath, resolvedSrc)) {
    // Source already sits in the destination folder
    if (operation === 'move') {
      return { src: resolvedSrc, dest: destPath }
    }
    destPath = getAvailableName(resolvedTarget, baseName, isDirectory)
  } else if (fs.existsSync(destPath)) {
    if (conflictStrategy === 'overwrite') {
      await fs.promises.rm(destPath, { recursive: true, force: true })
    } else {
      destPath = getAvailableName(resolvedTarget, baseName, isDirectory)
    }
  }

  if (operation === 'copy') {
    await copyPathWithFallback(resolvedSrc, destPath, isDirectory)
  } else {
    try {
      await fs.promises.rename(resolvedSrc, destPath)
    } catch {
      // Cross-device move, OneDrive placeholder or file lock:
      // copy first, then remove the original.
      await copyPathWithFallback(resolvedSrc, destPath, isDirectory)
      await fs.promises.rm(resolvedSrc, { recursive: true, force: true })
    }
  }

  return { src: resolvedSrc, dest: destPath }
}

// ---------------------------------------------------------------------------
// Screenshot & Clipboard Image helpers
// ---------------------------------------------------------------------------

function ensureLocalGitExclude(workspacePath: string): void {
  try {
    const gitDir = path.join(workspacePath, '.git')
    if (!fs.existsSync(gitDir)) return
    const infoDir = path.join(gitDir, 'info')
    fs.mkdirSync(infoDir, { recursive: true })
    const excludeFile = path.join(infoDir, 'exclude')
    const current = fs.existsSync(excludeFile) ? fs.readFileSync(excludeFile, 'utf8') : ''
    if (!/^\s*\.kingsley\/?\s*$/m.test(current)) {
      const prefix = current && !current.endsWith('\n') ? '\n' : ''
      fs.appendFileSync(excludeFile, `${prefix}.kingsley/\n`, 'utf8')
    }
  } catch {
    // purely cosmetic, never block a screenshot
  }
}

function getScreenshotDir(workspacePath?: string): string {
  try {
    const candidate = workspacePath ? path.resolve(workspacePath) : ''
    if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      const dir = path.join(candidate, '.kingsley', 'screenshots')
      fs.mkdirSync(dir, { recursive: true })
      ensureLocalGitExclude(candidate)
      return dir
    }
  } catch {}

  const dir = path.join(app.getPath('temp'), 'kingsley-screenshots')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function buildScreenshotPath(ext = 'png', workspacePath?: string): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const ms = String(now.getMilliseconds()).padStart(3, '0')
  const stamp = `${yyyy}${mm}${dd}-${hh}${min}${ss}-${ms}`
  return path.join(getScreenshotDir(workspacePath), `screenshot-${stamp}.${ext}`)
}

async function saveScreenshotBuffer(
  buffer: Buffer,
  ext = 'png',
  workspacePath?: string
): Promise<string> {
  const dest = buildScreenshotPath(ext, workspacePath)
  await fs.promises.writeFile(dest, buffer)
  return dest
}

// ---------------------------------------------------------------------------
// Agent CLI detection (walks the PTY process tree, Windows only)
// ---------------------------------------------------------------------------

type AgentSignature = { id: string; pattern: RegExp }

const AGENT_SIGNATURES: AgentSignature[] = [
  { id: 'opencode', pattern: /opencode/i },
  { id: 'claude', pattern: /claude/i },
  { id: 'gemini', pattern: /gemini/i },
  { id: 'antigravity', pattern: /antigravity/i },
  { id: 'codex', pattern: /codex/i },
  { id: 'aider', pattern: /aider/i },
  { id: 'cursor', pattern: /cursor-agent/i },
  { id: 'windsurf', pattern: /windsurf/i },
  { id: 'alethe', pattern: /alethe/i },
  { id: 'omp', pattern: /\bomp(\.exe)?\b|one\s*model\s*prompt/i },
]

interface AgentProcessRow {
  name?: string
  cmd?: string
}

async function detectAgentFromProcessTree(rootPid: number): Promise<string> {
  if (process.platform !== 'win32' || !rootPid) return 'none'

  const script = `
$root = ${rootPid}
$procs = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine
$frontier = @($root)
$seen = @{}
$rows = @()
for ($i = 0; $i -lt 4; $i++) {
  $next = @()
  foreach ($p in $procs) {
    $key = [string]$p.ProcessId
    if (($frontier -contains $p.ParentProcessId) -and (-not $seen.ContainsKey($key))) {
      $seen[$key] = $true
      $rows += [pscustomobject]@{ name = $p.Name; cmd = $p.CommandLine }
      $next += $p.ProcessId
    }
  }
  $frontier = $next
  if ($frontier.Count -eq 0) { break }
}
if ($rows.Count -gt 0) { $rows | ConvertTo-Json -Compress } else { '[]' }
`.trim()

  const { stdout } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { timeout: 15000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 }
  )

  const raw = (stdout || '').trim()
  if (!raw) return 'none'

  let rows: AgentProcessRow[] = []
  try {
    const parsed = JSON.parse(raw)
    rows = Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return 'none'
  }

  const haystack = rows
    .map((row) => `${row?.name || ''} ${row?.cmd || ''}`)
    .join('\n')
    .toLowerCase()

  if (!haystack) return 'none'

  for (const signature of AGENT_SIGNATURES) {
    if (signature.pattern.test(haystack)) return signature.id
  }
  return 'none'
}

const agentDetectionCache = new Map<string, { at: number; agent: string }>()
const agentProbeInFlight = new Set<string>()
const AGENT_CACHE_TTL = 30000

async function detectAgentForPane(
  ptyManager: PtyManager,
  paneId: string
): Promise<{ success: boolean; agent: string }> {
  // 1. Instant: banner already seen in this terminal's output.
  const hint = ptyManager.getAgentHint(paneId)
  if (hint && hint !== 'none') {
    return { success: true, agent: hint }
  }

  // 2. Recent process-tree result.
  const cached = agentDetectionCache.get(paneId)
  if (cached && Date.now() - cached.at < AGENT_CACHE_TTL) {
    return cached.agent === 'none'
      ? { success: false, agent: 'none' }
      : { success: true, agent: cached.agent }
  }

  const pid = ptyManager.getTerminalPid(paneId)
  if (!pid) return { success: false, agent: 'none' }

  // 3. WMI can take several seconds, so never block the drop/paste action on
  //    it. Probe in the background and try the cached answer next time.
  if (!agentProbeInFlight.has(paneId)) {
    agentProbeInFlight.add(paneId)
    void detectAgentFromProcessTree(pid)
      .then((agent) => {
        agentDetectionCache.set(paneId, { at: Date.now(), agent })
      })
      .catch(() => undefined)
      .finally(() => {
        agentProbeInFlight.delete(paneId)
      })
  }

  return { success: false, agent: 'none' }
}


export function setupIpcHandlers(mainWindow: BrowserWindow, ptyManager: PtyManager): void {
  // Wire up PTY output callbacks to forward to the Renderer window
  ptyManager.setCallbacks(
    (id: string, data: string) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:data', id, data)
      }
    },
    (id: string, exitCode: number) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:exit', id, exitCode)
      }
    }
  )

  // Terminal lifecycle
  ipcMain.handle('terminal:create', async (_event, options: CreateTerminalOptions) => {
    return ptyManager.createTerminal(options)
  })

  ipcMain.handle('terminal:detectAgent', async (_event, paneId: string) => {
    return detectAgentForPane(ptyManager, paneId)
  })

  ipcMain.on('terminal:input', (_event, id: string, data: string) => {
    ptyManager.write(id, data)
  })

  ipcMain.on('terminal:resize', (_event, id: string, cols: number, rows: number) => {
    ptyManager.resize(id, cols, rows)
  })

  ipcMain.on('terminal:close', (_event, id: string) => {
    ptyManager.closeTerminal(id)
    agentDetectionCache.delete(id)
  })

  // Shells list
  ipcMain.handle('shells:list', async () => {
    return ptyManager.getAvailableShells()
  })

  // Open Directory Dialog
  ipcMain.handle('dialog:openDirectory', async () => {
    if (mainWindow.isDestroyed()) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Project / Workspace Folder',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // Get Git info for a folder
  ipcMain.handle('git:getInfo', async (_event, folderPath: string) => {
    try {
      const gitHead = path.join(folderPath, '.git', 'HEAD')
      if (fs.existsSync(gitHead)) {
        const content = fs.readFileSync(gitHead, 'utf8').trim()
        const match = content.match(/ref: refs\/heads\/(.+)/)
        return { isGit: true, branch: match ? match[1] : 'HEAD' }
      }
      return { isGit: false, branch: null }
    } catch {
      return { isGit: false, branch: null }
    }
  })

  // Git Status (Orca Changes system)
  ipcMain.handle('git:getStatus', async (_event, folderPath: string) => {
    try {
      if (!folderPath || !fs.existsSync(path.join(folderPath, '.git'))) {
        return { success: true, files: [] }
      }
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: folderPath,
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true,
      })
      const files = stdout.split('\n').filter(Boolean).map((line) => {
        const status = line.slice(0, 2).trim()
        const filePath = line.slice(3).trim()
        return { status, path: filePath }
      })
      return { success: true, files }
    } catch {
      return { success: false, files: [] }
    }
  })

  // Git Diff (Orca Diff Inspector)
  ipcMain.handle('git:getDiff', async (_event, folderPath: string, filePath?: string) => {
    try {
      const cmd = filePath ? `git diff HEAD -- "${filePath}"` : 'git diff HEAD'
      const { stdout } = await execAsync(cmd, { cwd: folderPath, encoding: 'utf8' })
      return { success: true, diff: stdout }
    } catch {
      return { success: false, diff: '' }
    }
  })

  // Read Directory for File Explorer Tree
  ipcMain.handle('fs:readDir', async (_event, targetPath: string) => {
    try {
      const resolvedPath = path.resolve(targetPath)
      const entries = await fs.promises.readdir(resolvedPath, { withFileTypes: true })
      const items = entries
        .filter((e) => e.name !== '.git')
        .map((entry) => ({
          name: entry.name,
          path: path.join(resolvedPath, entry.name),
          isDirectory: entry.isDirectory(),
        }))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1
          if (!a.isDirectory && b.isDirectory) return 1
          return a.name.localeCompare(b.name)
        })
      return { success: true, items }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      return { success: false, items: [], error: errorMsg }
    }
  })

  // Read File for Code Viewer & Image Preview
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      const resolved = path.resolve(filePath)
      if (!fs.existsSync(resolved)) {
        return { success: false, content: '', error: `File not found: ${resolved}` }
      }
      const stat = await fs.promises.stat(resolved)
      if (stat.isDirectory()) {
        return { success: false, content: '', error: `Path is a directory: ${resolved}` }
      }
      if (stat.size > 5 * 1024 * 1024) {
        return {
          success: false,
          content: '',
          error: `File is too large (${(stat.size / (1024 * 1024)).toFixed(1)} MB). Kingsley supports up to 5 MB for preview.`,
        }
      }

      const ext = path.extname(resolved).toLowerCase().replace('.', '')
      const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp']
      if (imageExts.includes(ext)) {
        const buffer = await fs.promises.readFile(resolved)
        const mime = ext === 'ico' ? 'image/x-icon' : `image/${ext}`
        const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
        return { success: true, content: dataUrl, fullPath: resolved, isImage: true }
      }

      const content = await fs.promises.readFile(resolved, 'utf8')
      return { success: true, content, fullPath: resolved, isImage: false }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      return { success: false, content: '', error: errorMsg }
    }
  })

  // Open external URL in system default browser (Chrome, Edge, etc.)
  ipcMain.handle('shell:openExternal', async (_event, targetUrl: string) => {
    try {
      await shell.openExternal(targetUrl)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('shell:openPath', async (_event, targetPath: string) => {
    try {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true })
      }
      const err = await shell.openPath(targetPath)
      if (err) return { success: false, error: err }
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })
  // Copy or Move Files and Folders
  ipcMain.handle(
    'fs:copyOrMove',
    async (
      _event,
      sourcePaths: string[],
      targetDir: string,
      operation: 'copy' | 'move',
      conflictStrategy: 'auto-rename' | 'overwrite' = 'auto-rename'
    ) => {
      try {
        if (!sourcePaths || !Array.isArray(sourcePaths) || sourcePaths.length === 0) {
          return { success: false, operation, count: 0, items: [], errors: ['No source paths provided'] }
        }
        const resolvedTarget = path.resolve(targetDir)
        if (!fs.existsSync(resolvedTarget)) {
          await fs.promises.mkdir(resolvedTarget, { recursive: true })
        }

        const items: Array<{ src: string; dest: string }> = []
        const errors: string[] = []

        for (const src of sourcePaths) {
          try {
            const res = await copyOrMoveItem(src, resolvedTarget, operation, conflictStrategy)
            items.push(res)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push(`${src}: ${msg}`)
          }
        }

        return {
          success: items.length > 0,
          operation,
          count: items.length,
          items,
          errors: errors.length > 0 ? errors : undefined,
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        return { success: false, operation, count: 0, items: [], errors: [errorMsg] }
      }
    }
  )

  // Get Files/Folders from System Clipboard
  ipcMain.handle('fs:getClipboardFiles', async () => {
    try {
      // 1. Check plain text lines for absolute file paths
      const text = clipboard.readText()
      if (text && text.trim()) {
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim().replace(/^"|"$/g, '').trim())
          .filter(Boolean)
        const validPaths = lines.filter((p) => {
          try {
            return path.isAbsolute(p) && fs.existsSync(p)
          } catch {
            return false
          }
        })
        if (validPaths.length > 0) {
          return { success: true, files: validPaths }
        }
      }

      // 2. Windows Explorer FileDropList via PowerShell
      if (process.platform === 'win32') {
        try {
          const psCmd = `powershell.exe -NoProfile -NonInteractive -Command "$list = Get-Clipboard -Format FileDropList; if ($list) { $list | ForEach-Object { $_.FullName } }"`
          const { stdout } = await execAsync(psCmd, { timeout: 3000, encoding: 'utf8' })
          const psFiles = stdout
            .split(/\r?\n/)
            .map((l) => l.trim().replace(/^"|"$/g, '').trim())
            .filter((l) => Boolean(l) && fs.existsSync(l))
          if (psFiles.length > 0) {
            return { success: true, files: psFiles }
          }
        } catch {}
      }

      return { success: true, files: [] }
    } catch (err: unknown) {
      return { success: false, files: [], error: String(err) }
    }
  })

  // Write Files/Folders to System Clipboard
  ipcMain.handle('fs:writeClipboardFiles', async (_event, paths: string[]) => {
    try {
      if (!paths || paths.length === 0) return { success: false }
      const valid = paths.filter((p) => fs.existsSync(p))
      if (valid.length === 0) return { success: false }

      clipboard.writeText(valid.join('\r\n'))

      if (process.platform === 'win32') {
        const escaped = valid.map((p) => `'${p.replace(/'/g, "''")}'`).join(',')
        const psCmd = `powershell.exe -NoProfile -NonInteractive -Command "Set-Clipboard -Path @(${escaped})"`
        exec(psCmd, () => {})
      }
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  // Read and save image from system clipboard (e.g. Snipping Tool, Win+Shift+S, PrtScn)
  ipcMain.handle('clipboard:readImage', async (_event, workspacePath?: string) => {
    try {
      const image = clipboard.readImage()
      if (!image || image.isEmpty()) {
        return { success: false, error: 'Clipboard tidak berisi gambar.' }
      }
      const pngBuffer = image.toPNG()
      if (!pngBuffer || pngBuffer.length === 0) {
        return { success: false, error: 'Gagal mengonversi gambar clipboard ke PNG.' }
      }
      const savedPath = await saveScreenshotBuffer(pngBuffer, 'png', workspacePath)
      return { success: true, path: savedPath }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // Save base64 / dataUrl image (e.g. from Drag & Drop or HTML5 ClipboardEvent)
  ipcMain.handle('clipboard:saveDataUrl', async (_event, dataUrl: string, workspacePath?: string) => {
    try {
      const match = /^data:image\/([a-zA-Z0-9+.-]+);base64,([\s\S]+)$/.exec(dataUrl || '')
      if (!match) {
        return { success: false, error: 'Format gambar tidak valid.' }
      }
      const rawExt = match[1].toLowerCase()
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt
      const savedPath = await saveScreenshotBuffer(
        Buffer.from(match[2], 'base64'),
        ext,
        workspacePath
      )
      return { success: true, path: savedPath }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // Safe Delete (Recycle Bin with fallback to rm)
  ipcMain.handle('fs:deletePath', async (_event, targetPath: string) => {
    try {
      const resolved = path.resolve(targetPath)
      if (!fs.existsSync(resolved)) {
        return { success: false, error: 'Path does not exist' }
      }
      await shell.trashItem(resolved)
      return { success: true }
    } catch (err: unknown) {
      try {
        await fs.promises.rm(targetPath, { recursive: true, force: true })
        return { success: true }
      } catch (rmErr) {
        return { success: false, error: String(err) }
      }
    }
  })

  // Rename File or Folder
  ipcMain.handle('fs:renamePath', async (_event, oldPath: string, newName: string) => {
    try {
      const resolvedOld = path.resolve(oldPath)
      if (!fs.existsSync(resolvedOld)) {
        return { success: false, error: 'Target does not exist' }
      }
      const dir = path.dirname(resolvedOld)
      const newPath = path.join(dir, newName.trim())
      if (fs.existsSync(newPath) && path.resolve(newPath).toLowerCase() !== resolvedOld.toLowerCase()) {
        return { success: false, error: 'A file or folder with that name already exists' }
      }
      await fs.promises.rename(resolvedOld, newPath)
      return { success: true, newPath }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  // Create Directory
  ipcMain.handle('fs:createFolder', async (_event, parentDir: string, folderName: string) => {
    try {
      const resolvedParent = path.resolve(parentDir)
      if (!fs.existsSync(resolvedParent)) {
        return { success: false, error: 'Parent directory does not exist' }
      }
      const newFolder = path.join(resolvedParent, folderName.trim())
      if (fs.existsSync(newFolder)) {
        return { success: false, error: 'Folder already exists' }
      }
      await fs.promises.mkdir(newFolder, { recursive: true })
      return { success: true, path: newFolder }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  // Create File
  ipcMain.handle('fs:createFile', async (_event, parentDir: string, fileName: string) => {
    try {
      const resolvedParent = path.resolve(parentDir)
      if (!fs.existsSync(resolvedParent)) {
        return { success: false, error: 'Parent directory does not exist' }
      }
      const newFile = path.join(resolvedParent, fileName.trim())
      if (fs.existsSync(newFile)) {
        return { success: false, error: 'File already exists' }
      }
      await fs.promises.writeFile(newFile, '', 'utf8')
      return { success: true, path: newFile }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  // Reveal in Windows Explorer
  ipcMain.handle('shell:showItemInFolder', async (_event, targetPath: string) => {
    try {
      const resolved = path.resolve(targetPath)
      if (fs.existsSync(resolved)) {
        shell.showItemInFolder(resolved)
        return { success: true }
      }
      return { success: false, error: 'Path does not exist' }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
  ipcMain.handle('fs:isDir', async (_event, targetPath: string) => {
    try {
      const resolved = path.resolve(targetPath)
      if (!fs.existsSync(resolved)) {
        return { success: false, isDirectory: false, name: path.basename(targetPath) }
      }
      const stat = await fs.promises.stat(resolved)
      return { success: true, isDirectory: stat.isDirectory(), name: path.basename(resolved) }
    } catch {
      return { success: false, isDirectory: false, name: path.basename(targetPath) }
    }
  })



  ipcMain.handle('app:relaunch', async () => {
    try {
      app.relaunch()
      app.exit(0)
      return { success: true }
    } catch (err: unknown) {
      console.warn('[IPC] app:relaunch error:', err)
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('app:runInstaller', async () => {
    try {
      const currentVersion = app.getVersion()
      const releaseDir = path.join(process.cwd(), 'release')
      const exactInstaller = path.join(releaseDir, `Kingsley Setup ${currentVersion}.exe`)
      if (fs.existsSync(exactInstaller)) {
        await shell.openPath(exactInstaller)
        app.exit(0)
        return { success: true }
      }
      if (fs.existsSync(releaseDir)) {
        const files = fs.readdirSync(releaseDir)
        const installers = files
          .filter((f) => (f.startsWith('Kingsley Setup') || f.startsWith('Kingsley-')) && (f.endsWith('.exe') || f.endsWith('.AppImage') || f.endsWith('.dmg')))
          .sort()
          .reverse()
        if (installers.length > 0) {
          await shell.openPath(path.join(releaseDir, installers[0]))
          app.exit(0)
          return { success: true }
        }
      }
    } catch {}
    return { success: false }
  })

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  // Auto Update Detection Subsystem
  let lastMtime: number | null = null
  const getBuildStamp = (): number | null => {
    try {
      // 2. Check build-stamp.json in resourcesPath or dist
      const stampPath = app.isPackaged
        ? path.join(process.resourcesPath, 'build-stamp.json')
        : path.join(process.cwd(), 'dist', 'build-stamp.json')
      if (fs.existsSync(stampPath)) {
        const parsed = JSON.parse(fs.readFileSync(stampPath, 'utf8'))
        if (typeof parsed.timestamp === 'number') return parsed.timestamp
      }

      // 3. Check app.asar in resourcesPath or dist/index.html
      const targetFile = app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar')
        : path.join(process.cwd(), 'dist', 'index.html')
      if (fs.existsSync(targetFile)) {
        return fs.statSync(targetFile).mtimeMs
      }
    } catch {}
    return null
  }

  const getLatestReleaseInfo = (): { newVersion: string; isNewer: boolean } => {
    const currentVersion = app.getVersion()
    try {
      const repoPkg = path.join(process.cwd(), 'package.json')
      if (fs.existsSync(repoPkg)) {
        const parsed = JSON.parse(fs.readFileSync(repoPkg, 'utf8'))
        if (parsed.version && parsed.version !== currentVersion) {
          return { newVersion: parsed.version, isNewer: true }
        }
      }
    } catch {}
    return { newVersion: currentVersion, isNewer: false }
  }

  lastMtime = getBuildStamp()
  // Check for updates on a gentle 15-minute cadence in production (30s in dev)
  // to prevent synchronous disk I/O from stuttering the main process event loop.
  const checkIntervalMs = app.isPackaged ? 15 * 60 * 1000 : 30 * 1000
  const updateInterval = setInterval(() => {
    if (mainWindow.isDestroyed()) {
      clearInterval(updateInterval)
      return
    }
    const currentMtime = getBuildStamp()
    const releaseInfo = getLatestReleaseInfo()
    const hasUpdate = Boolean(
      releaseInfo.isNewer || (lastMtime && currentMtime && currentMtime > lastMtime + 2000)
    )

    if (hasUpdate) {
      if (currentMtime) lastMtime = currentMtime
      if (!mainWindow.isDestroyed()) {
        mainWindow.flashFrame(true)
        mainWindow.webContents.send('app:update-ready', {
          timestamp: currentMtime,
          newVersion: releaseInfo.newVersion,
          currentVersion: app.getVersion(),
        })
      }
    } else if (!lastMtime && currentMtime) {
      lastMtime = currentMtime
    }
  }, checkIntervalMs)

  mainWindow.on('focus', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.flashFrame(false)
    }
  })

  mainWindow.on('closed', () => {
    clearInterval(updateInterval)
  })

  ipcMain.handle('app:checkUpdate', () => {
    const currentMtime = getBuildStamp()
    const releaseInfo = getLatestReleaseInfo()
    const isNewer = Boolean(
      releaseInfo.isNewer || (lastMtime && currentMtime && currentMtime > lastMtime + 2000)
    )
    return {
      hasUpdate: isNewer,
      timestamp: currentMtime,
      newVersion: releaseInfo.newVersion,
      currentVersion: app.getVersion(),
    }
  })

  // Window Controls & Safe Close Interception
  let isForceQuit = false

  ipcMain.on('window:force-close', () => {
    isForceQuit = true
    if (!mainWindow.isDestroyed()) {
      mainWindow.close()
    }
  })

  mainWindow.on('close', (e) => {
    if (!isForceQuit && !mainWindow.isDestroyed()) {
      e.preventDefault()
      mainWindow.webContents.send('app:request-close')
    }
  })

  ipcMain.on('window:control', (_event, action: WindowAction) => {
    if (mainWindow.isDestroyed()) return

    switch (action) {
      case 'minimize':
        mainWindow.minimize()
        break
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
        break
      case 'close':
        mainWindow.webContents.send('app:request-close')
        break
    }
  })

  ipcMain.handle('window:isMaximized', () => {
    return !mainWindow.isDestroyed() && mainWindow.isMaximized()
  })

  // Window state changes
  mainWindow.on('maximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:stateChange', true)
    }
  })

  mainWindow.on('unmaximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:stateChange', false)
    }
  })
}
