import { app, BrowserWindow, session } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PtyManager } from './pty-manager'
import { setupIpcHandlers } from './ipc-handlers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

const logFile = path.join(process.cwd(), 'debug.log')
function log(msg: string) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`)
  } catch {}
}

process.on('uncaughtException', (err) => {
  log(`FATAL uncaughtException: ${err.stack || err}`)
})

let mainWindow: BrowserWindow | null = null
const ptyManager = new PtyManager()

function getPreloadPath(): string {
  const cjsPath = path.join(__dirname, '../preload/index.cjs')
  if (fs.existsSync(cjsPath)) return cjsPath
  const mjsPath = path.join(__dirname, '../preload/index.mjs')
  if (fs.existsSync(mjsPath)) return mjsPath
  return path.join(__dirname, '../preload/index.js')
}

function createWindow(): void {
  const preloadPath = getPreloadPath()
  log('=== CREATE WINDOW ===')
  log(`Preload path: ${preloadPath} (exists: ${fs.existsSync(preloadPath)})`)
  log(`VITE_DEV_SERVER_URL: ${process.env.VITE_DEV_SERVER_URL}`)

  const appRoot = process.env.APP_ROOT || path.join(__dirname, '../..')
  const appIcon = process.platform === 'win32'
    ? path.join(appRoot, 'public/icon.ico')
    : path.join(appRoot, 'public/icon.png')

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 780,
    minWidth: 720,
    minHeight: 480,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#070b19',
    icon: appIcon,
    show: false,
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  })

  // Log renderer console messages and load failures to terminal and debug.log
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    log(`RENDERER CONSOLE [lvl ${level}] ${message} (${sourceId}:${line})`)
    console.log(`[Renderer Console level ${level}]: ${message} (${sourceId}:${line})`)
  })
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    log(`FAIL LOAD ${validatedURL}: ${errorDescription} (${errorCode})`)
  })
  mainWindow.webContents.on('preload-error', (_event, pPath, error) => {
    log(`PRELOAD ERROR in ${pPath}: ${error.stack || error}`)
  })
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log(`RENDER PROCESS GONE: ${JSON.stringify(details)}`)
  })
  mainWindow.webContents.on('did-finish-load', () => {
    log('WebContents did-finish-load successfully')
  })
  // Prevent default Chromium navigation when dropping files
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://') && !url.includes('index.html')) {
      event.preventDefault()
    }
  })


  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  setupIpcHandlers(mainWindow, ptyManager)

  if (process.env.VITE_DEV_SERVER_URL) {
    log(`Loading URL: ${process.env.VITE_DEV_SERVER_URL}`)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).then(() => {
      log('loadURL resolved')
    }).catch((err: Error) => {
      log(`loadURL rejected: ${err.message}`)
    })
  } else {
    const indexPath = path.join(RENDERER_DIST, 'index.html')
    log(`Loading File: ${indexPath}`)
    mainWindow.loadFile(indexPath).then(() => {
      log('loadFile resolved successfully!')
    }).catch((err: Error) => {
      log(`loadFile rejected: ${err.message}`)
    })
  }
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Ensure single instance
const hasLock = app.requestSingleInstanceLock()
if (!hasLock) {
  log('Another instance already running. Quitting.')
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('com.ferminterm.desktop')

    // Bypass X-Frame-Options and frame-ancestors CSP so any website can be accessed in browser pane
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders }
      delete responseHeaders['x-frame-options']
      delete responseHeaders['X-Frame-Options']
      if (responseHeaders['content-security-policy']) {
        responseHeaders['content-security-policy'] = responseHeaders['content-security-policy'].map((csp) =>
          csp.replace(/frame-ancestors\s+[^;]+(;|$)/gi, '')
        )
      }
      if (responseHeaders['Content-Security-Policy']) {
        responseHeaders['Content-Security-Policy'] = responseHeaders['Content-Security-Policy'].map((csp) =>
          csp.replace(/frame-ancestors\s+[^;]+(;|$)/gi, '')
        )
      }
      callback({ responseHeaders })
    })

    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

app.on('before-quit', () => {
  ptyManager.closeAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    ptyManager.closeAll()
    app.quit()
  }
})
