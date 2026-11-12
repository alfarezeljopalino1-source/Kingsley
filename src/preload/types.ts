export type ShellType = 'powershell' | 'cmd' | 'bash' | 'wsl'

export interface CreateTerminalOptions {
  id: string
  shell?: ShellType
  cwd?: string
  cols?: number
  rows?: number
}

export interface ShellInfo {
  type: ShellType
  name: string
  command: string
  available: boolean
}

export interface GitFileChange {
  path: string
  status: string
}

export interface DirectoryItem {
  name: string
  path: string
  isDirectory: boolean
}

export interface CopyOrMoveResult {
  success: boolean
  operation: 'copy' | 'move'
  count: number
  items: Array<{ src: string; dest: string }>
  errors?: string[]
}
export interface ScreenshotResult {
  success: boolean
  path?: string
  error?: string
}

export type WindowAction = 'minimize' | 'maximize' | 'close'


export interface FerminAPI {
  // Terminal Lifecycle & I/O
  createTerminal: (options: CreateTerminalOptions) => Promise<{
    success: boolean
    pid?: number
    history?: string
    alreadyExists?: boolean
    error?: string
  }>
  sendInput: (id: string, data: string) => void
  resizeTerminal: (id: string, cols: number, rows: number) => void
  closeTerminal: (id: string) => void
  onTerminalData: (callback: (id: string, data: string) => void) => () => void
  onTerminalExit: (callback: (id: string, exitCode: number) => void) => () => void
  detectTerminalAgent: (paneId: string) => Promise<{ success: boolean; agent: string }>

  // Window Controls
  windowControl: (action: WindowAction) => void
  isWindowMaximized: () => Promise<boolean>
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => () => void

  // System, Workspaces & Git (Orca System)
  getAvailableShells: () => Promise<ShellInfo[]>
  openDirectoryDialog: () => Promise<string | null>
  getGitInfo: (folderPath: string) => Promise<{ isGit: boolean; branch: string | null }>
  getGitStatus: (folderPath: string) => Promise<{ success: boolean; files: GitFileChange[] }>
  getGitDiff: (folderPath: string, filePath?: string) => Promise<{ success: boolean; diff: string }>
  readDirectory: (folderPath: string) => Promise<{ success: boolean; items: DirectoryItem[]; error?: string }>
  readFile: (filePath: string) => Promise<{ success: boolean; content: string; fullPath?: string; isImage?: boolean; error?: string }>
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
  openPath: (targetPath: string) => Promise<{ success: boolean; error?: string }>
  forceClose: () => void
  onRequestClose: (callback: () => void) => () => void
  relaunchApp: () => Promise<void>
  runInstaller: () => Promise<{ success: boolean }>
  getAppVersion: () => Promise<string>
  onUpdateReady: (callback: (info?: unknown) => void) => () => void
  // File Transfer & Clipboard Operations
  getPathForFile: (file: File) => string
  copyOrMovePaths: (
    sourcePaths: string[],
    targetDir: string,
    operation: 'copy' | 'move',
    conflictStrategy?: 'auto-rename' | 'overwrite'
  ) => Promise<CopyOrMoveResult>
  getClipboardFiles: () => Promise<{ success: boolean; files: string[] }>
  writeClipboardFiles: (paths: string[]) => Promise<{ success: boolean; error?: string }>
  deletePath: (targetPath: string) => Promise<{ success: boolean; error?: string }>
  renamePath: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath?: string; error?: string }>
  createFolder: (parentDir: string, folderName: string) => Promise<{ success: boolean; path?: string; error?: string }>
  createFile: (parentDir: string, fileName: string) => Promise<{ success: boolean; path?: string; error?: string }>
  showItemInFolder: (targetPath: string) => Promise<{ success: boolean; error?: string }>
  isDir: (targetPath: string) => Promise<{ success: boolean; isDirectory: boolean; name: string }>
  // Screenshot & Clipboard Image Operations
  readClipboardImage: (workspacePath?: string) => Promise<ScreenshotResult>
  saveClipboardDataUrl: (dataUrl: string, workspacePath?: string) => Promise<ScreenshotResult>

}

declare global {
  interface Window {
    ferminAPI: FerminAPI
  }
}
