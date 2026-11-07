import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { CreateTerminalOptions, FerminAPI, WindowAction, CopyOrMoveResult } from './types'

const ferminAPI: FerminAPI = {
  createTerminal: (options: CreateTerminalOptions) => {
    return ipcRenderer.invoke('terminal:create', options)
  },

  sendInput: (id: string, data: string) => {
    ipcRenderer.send('terminal:input', id, data)
  },

  resizeTerminal: (id: string, cols: number, rows: number) => {
    ipcRenderer.send('terminal:resize', id, cols, rows)
  },

  closeTerminal: (id: string) => {
    ipcRenderer.send('terminal:close', id)
  },

  onTerminalData: (callback: (id: string, data: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, id: string, data: string) => {
      callback(id, data)
    }
    ipcRenderer.on('terminal:data', handler)
    return () => {
      ipcRenderer.removeListener('terminal:data', handler)
    }
  },

  onTerminalExit: (callback: (id: string, exitCode: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, id: string, exitCode: number) => {
      callback(id, exitCode)
    }
    ipcRenderer.on('terminal:exit', handler)
    return () => {
      ipcRenderer.removeListener('terminal:exit', handler)
    }
  },

  detectTerminalAgent: (paneId: string) => {
    return ipcRenderer.invoke('terminal:detectAgent', paneId)
  },

  windowControl: (action: WindowAction) => {
    ipcRenderer.send('window:control', action)
  },

  isWindowMaximized: () => {
    return ipcRenderer.invoke('window:isMaximized')
  },

  onWindowStateChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => {
      callback(isMaximized)
    }
    ipcRenderer.on('window:stateChange', handler)
    return () => {
      ipcRenderer.removeListener('window:stateChange', handler)
    }
  },

  getAvailableShells: () => {
    return ipcRenderer.invoke('shells:list')
  },

  openDirectoryDialog: () => {
    return ipcRenderer.invoke('dialog:openDirectory')
  },

  getGitInfo: (folderPath: string) => {
    return ipcRenderer.invoke('git:getInfo', folderPath)
  },

  getGitStatus: (folderPath: string) => {
    return ipcRenderer.invoke('git:getStatus', folderPath)
  },

  getGitDiff: (folderPath: string, filePath?: string) => {
    return ipcRenderer.invoke('git:getDiff', folderPath, filePath)
  },

  readDirectory: (folderPath: string) => {
    return ipcRenderer.invoke('fs:readDir', folderPath)
  },

  readFile: (filePath: string) => {
    return ipcRenderer.invoke('fs:readFile', filePath)
  },

  openExternal: (url: string) => {
    return ipcRenderer.invoke('shell:openExternal', url)
  },

  openPath: (targetPath: string) => {
    return ipcRenderer.invoke('shell:openPath', targetPath)
  },

  forceClose: () => {
    ipcRenderer.send('window:force-close')
  },

  onRequestClose: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('app:request-close', listener)
    return () => {
      ipcRenderer.removeListener('app:request-close', listener)
    }
  },

  relaunchApp: () => {
    return ipcRenderer.invoke('app:relaunch')
  },

  runInstaller: () => {
    return ipcRenderer.invoke('app:runInstaller')
  },

  getAppVersion: () => {
    return ipcRenderer.invoke('app:getVersion')
  },

  onUpdateReady: (callback: (info?: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: unknown) => callback(info)
    ipcRenderer.on('app:update-ready', listener)
    return () => {
      ipcRenderer.removeListener('app:update-ready', listener)
    }
  },

  getPathForFile: (file: File) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file)
      }
    } catch {}
    if (file && typeof file === 'object' && 'path' in file && typeof file.path === 'string') {
      return file.path
    }
    return ''
  },

  copyOrMovePaths: (
    sourcePaths: string[],
    targetDir: string,
    operation: 'copy' | 'move',
    conflictStrategy?: 'auto-rename' | 'overwrite'
  ) => {
    return ipcRenderer.invoke('fs:copyOrMove', sourcePaths, targetDir, operation, conflictStrategy)
  },

  getClipboardFiles: () => {
    return ipcRenderer.invoke('fs:getClipboardFiles')
  },

  writeClipboardFiles: (paths: string[]) => {
    return ipcRenderer.invoke('fs:writeClipboardFiles', paths)
  },

  deletePath: (targetPath: string) => {
    return ipcRenderer.invoke('fs:deletePath', targetPath)
  },

  renamePath: (oldPath: string, newName: string) => {
    return ipcRenderer.invoke('fs:renamePath', oldPath, newName)
  },

  createFolder: (parentDir: string, folderName: string) => {
    return ipcRenderer.invoke('fs:createFolder', parentDir, folderName)
  },

  createFile: (parentDir: string, fileName: string) => {
    return ipcRenderer.invoke('fs:createFile', parentDir, fileName)
  },

  showItemInFolder: (targetPath: string) => {
    return ipcRenderer.invoke('shell:showItemInFolder', targetPath)
  },

  isDir: (targetPath: string) => {
    return ipcRenderer.invoke('fs:isDir', targetPath)
  },

  captureScreenshot: (workspacePath?: string) => {
    return ipcRenderer.invoke('screenshot:capture', workspacePath)
  },

  captureClipboardImage: (workspacePath?: string) => {
    return ipcRenderer.invoke('screenshot:fromClipboard', workspacePath)
  },

  saveScreenshotDataUrl: (dataUrl: string, workspacePath?: string) => {
    return ipcRenderer.invoke('screenshot:saveDataUrl', dataUrl, workspacePath)
  },

  openScreenshotFolder: () => {
    return ipcRenderer.invoke('screenshot:openFolder')
  },
}

contextBridge.exposeInMainWorld('ferminAPI', ferminAPI)
