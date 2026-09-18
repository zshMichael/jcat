import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { existsSync, statSync } from 'fs'
import { writeFile } from 'fs/promises'
import { homedir } from 'os'
import { basename, dirname, join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { abortComplete, abortDebug, complete, debugStream } from './deepseek'
import { compileProject, runMain, scanMainClasses, stopRun } from './java'
import { detectToolchain } from './jdk'
import { loadSettings, saveSettings } from './settings'
import {
  createFile,
  createFolder,
  getRoot,
  pickFolder,
  readText,
  readTree,
  setRoot,
  writeText
} from './workspace'
import type { CompleteRequest, DebugRequest } from '../shared/types'
import { THEME_CARDS } from '../shared/themes'

let mainWindow: BrowserWindow | null = null

function themeWindowBg(): string {
  const theme = loadSettings().theme
  return THEME_CARDS.find((item) => item.id === theme)?.windowBg ?? '#F6F1EA'
}

function send(channel: string, ...args: unknown[]): void {
  mainWindow?.webContents.send(channel, ...args)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    frame: false,
    title: 'Jcat',
    backgroundColor: themeWindowBg(),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 14, y: 12 },
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return false
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
    return mainWindow.isMaximized()
  })
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
  ipcMain.handle('window:setBackground', (_e, color: string) => {
    if (typeof color === 'string' && color.startsWith('#')) mainWindow?.setBackgroundColor(color)
  })

  ipcMain.handle('settings:get', () => loadSettings())
  ipcMain.handle('settings:save', (_e, partial) => saveSettings(partial))
  ipcMain.handle('toolchain:detect', () => detectToolchain())

  ipcMain.handle('workspace:open', async () => {
    if (!mainWindow) return null
    const root = await pickFolder(mainWindow)
    if (root) saveSettings({ lastRoot: root })
    return root
  })
  ipcMain.handle('workspace:restore', (_e, root: string) => {
    setRoot(root)
    return existsRoot(root) ? root : null
  })
  ipcMain.handle('workspace:root', () => getRoot())
  ipcMain.handle('workspace:tree', () => readTree())
  ipcMain.handle('workspace:read', (_e, file: string) => readText(file))
  ipcMain.handle('workspace:write', (_e, file: string, content: string) => {
    writeText(file, content)
  })
  ipcMain.handle('workspace:createFile', (_e, file: string, content?: string) =>
    createFile(file, content ?? '')
  )
  ipcMain.handle('workspace:createFolder', (_e, dir: string) => createFolder(dir))
  ipcMain.handle('workspace:newFileDialog', async () => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '新建文件',
      defaultPath: join(getRoot() || homedir(), 'Main.java'),
      filters: [
        { name: 'Java', extensions: ['java'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    if (result.canceled || !result.filePath) return null
    const file = result.filePath
    const cls = basename(file, '.java').replace(/[^\w]/g, '_') || 'Main'
    const stub = file.toLowerCase().endsWith('.java')
      ? `public class ${cls} {\n    public static void main(String[] args) {\n        \n    }\n}\n`
      : ''
    if (!existsSync(file)) writeText(file, stub)
    if (!getRoot()) {
      const root = dirname(file)
      setRoot(root)
      saveSettings({ lastRoot: root })
    }
    return { root: getRoot(), file }
  })
  ipcMain.handle('workspace:newFolderDialog', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '新建文件夹',
      defaultPath: getRoot() || homedir(),
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    const dir = result.filePaths[0]
    createFolder(dir)
    if (!getRoot()) {
      setRoot(dir)
      saveSettings({ lastRoot: dir })
    }
    return { root: getRoot(), dir }
  })
  ipcMain.handle('java:mains', () => {
    const root = getRoot()
    return root ? scanMainClasses(root) : []
  })
  ipcMain.handle('java:compile', () => compileProject())
  ipcMain.handle('java:run', async (_e, mainClass?: string) => {
    await runMain(
      mainClass,
      (stream, text) => send('java:data', { stream, text }),
      (code) => send('java:exit', code)
    )
  })
  ipcMain.handle('java:stop', () => stopRun())

  ipcMain.handle('ai:complete', (_e, req: CompleteRequest) => complete(req))
  ipcMain.handle('ai:completeAbort', () => abortComplete())
  ipcMain.handle('ai:debug', async (_e, req: DebugRequest) => {
    await debugStream(req, (chunk) => send('ai:debugChunk', chunk))
  })
  ipcMain.handle('ai:debugAbort', () => abortDebug())

  ipcMain.handle('export:savePng', async (_e, dataUrl: string, defaultName: string) => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出代码长图',
      defaultPath: defaultName.endsWith('.png') ? defaultName : `${defaultName}.png`,
      filters: [{ name: 'PNG', extensions: ['png'] }]
    })
    if (result.canceled || !result.filePath) return null
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    await writeFile(result.filePath, Buffer.from(base64, 'base64'))
    return result.filePath
  })
}

function existsRoot(root: string): boolean {
  try {
    return existsSync(root) && statSync(root).isDirectory()
  } catch {
    return false
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.jcat.ide')
  app.setName('Jcat')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopRun()
  abortComplete()
  abortDebug()
  if (process.platform !== 'darwin') app.quit()
})
