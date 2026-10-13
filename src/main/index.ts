import { app, BrowserWindow, dialog, ipcMain, Menu, screen, shell } from 'electron'
import { existsSync, mkdirSync, readFileSync, statSync } from 'fs'
import { writeFile } from 'fs/promises'
import { homedir } from 'os'
import { basename, dirname, join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { abortComplete, abortDebug, complete, debugStream } from './deepseek'
import { compileProject, runMain, scanMainClasses, stopRun, writeStdin } from './java'
import { detectToolchain } from './jdk'
import { loadSettings, publicSettings, saveSettings } from './settings'
import { clearSecretKey, setSecretKey } from './secretStore'
import { clearExamSession, loadExamSession, saveExamSession } from './examStore'
import { isExamLocked, setExamLocked } from './examGate'
import { applyNativeDialogLanguage, dialogCopy } from './nativeDialogs'
import { snapshotFromFiles } from '../shared/examReport'
import { idleSession, parseSession, type ExamSession } from '../shared/examSession'
import {
  createEmpty,
  createFile,
  createFolder,
  createFrq,
  createPractice,
  deleteEntry,
  getRoot,
  pickFolder,
  readJavaSources,
  readText,
  readTree,
  renameEntry,
  setRoot,
  transferEntry,
  writeText
} from './workspace'
import type {
  AppSettings,
  CompleteRequest,
  CompileResult,
  DebugRequest,
  Locale
} from '../shared/types'
import { THEME_CARDS } from '../shared/themes'
import { initialWindowBounds, WINDOW_MIN_H, WINDOW_MIN_W } from '../shared/windowBounds'

function savedLocale(): Locale {
  try {
    const base =
      process.platform === 'darwin'
        ? join(homedir(), 'Library', 'Application Support', 'jcat')
        : process.platform === 'win32'
          ? join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'jcat')
          : join(homedir(), '.config', 'jcat')
    const raw = JSON.parse(readFileSync(join(base, 'settings.json'), 'utf8')) as { locale?: string }
    if (raw.locale === 'en' || raw.locale === 'ko' || raw.locale === 'zh') return raw.locale
  } catch {
    /* first launch */
  }
  return 'zh'
}

try {
  applyNativeDialogLanguage(savedLocale())
} catch {
  /* Native dialog language is applied again once the app is ready. */
}

let mainWindow: BrowserWindow | null = null

function themeWindowBg(): string {
  const theme = loadSettings().theme
  return THEME_CARDS.find((item) => item.id === theme)?.windowBg ?? '#F6F1EA'
}

function send(channel: string, ...args: unknown[]): void {
  mainWindow?.webContents.send(channel, ...args)
}

function createWindow(): void {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const bounds = initialWindowBounds(display.workArea)
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: WINDOW_MIN_W,
    minHeight: WINDOW_MIN_H,
    show: false,
    frame: false,
    title: 'Jcat',
    backgroundColor: themeWindowBg(),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 14, y: 18 },
    autoHideMenuBar: true,
    ...(process.platform !== 'darwin' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('maximize', () => send('window:maximized', true))
  mainWindow.on('unmaximize', () => send('window:maximized', false))
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const chord = process.platform === 'darwin' ? input.meta : input.control
    if (chord && input.key.toLowerCase() === 'w') event.preventDefault()
  })
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

function denyIfExam(): boolean {
  return isExamLocked()
}

function persistExam(session: ExamSession): ExamSession {
  const next = !!session.active
  const was = isExamLocked()
  setExamLocked(next)
  if (next && !was) {
    abortComplete()
    abortDebug()
    stopRun()
  }
  if (next) saveExamSession(session)
  else clearExamSession()
  return session
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
  ipcMain.handle('window:getPosition', () => mainWindow?.getPosition() ?? [0, 0])
  ipcMain.handle('window:setPosition', (_e, x: unknown, y: unknown) => {
    if (!mainWindow || mainWindow.isMaximized()) return
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
      return
    mainWindow.setPosition(Math.round(x), Math.round(y))
  })
  ipcMain.handle('shell:openExternal', (_e, url: string) => {
    if (typeof url !== 'string') return
    try {
      const parsed = new URL(url)
      const httpsOk = parsed.protocol === 'https:' && parsed.hostname === 'platform.deepseek.com'
      const mailOk =
        parsed.protocol === 'mailto:' && parsed.pathname.toLowerCase() === 'zshovo@163.com'
      if (!httpsOk && !mailOk) return
      return shell.openExternal(parsed.toString())
    } catch {
      return
    }
  })

  ipcMain.handle('settings:get', () => publicSettings())
  ipcMain.handle('settings:save', (_e, partial: Partial<AppSettings>) => {
    const clean = { ...partial } as Partial<AppSettings> & { apiKey?: unknown }
    delete clean.apiKey
    if (isExamLocked()) {
      delete clean.completionEnabled
    }
    const next = saveSettings(clean)
    applyNativeDialogLanguage(next.locale)
    return publicSettings()
  })
  ipcMain.handle('settings:setKey', (_e, key: unknown) => {
    if (typeof key !== 'string') return publicSettings()
    setSecretKey(key)
    return publicSettings()
  })
  ipcMain.handle('settings:clearKey', () => {
    clearSecretKey()
    return publicSettings()
  })
  ipcMain.handle('toolchain:detect', () => detectToolchain())

  ipcMain.handle('exam:getSession', () => loadExamSession())
  ipcMain.handle('exam:saveSession', (_e, raw: unknown) => {
    const parsed = parseSession(raw)
    if (!parsed) return idleSession()
    return persistExam(parsed)
  })
  ipcMain.handle('exam:clearSession', () => persistExam(idleSession()))
  ipcMain.handle('exam:scanAp', () => {
    try {
      return snapshotFromFiles(readJavaSources())
    } catch {
      return {}
    }
  })

  ipcMain.handle('workspace:open', async () => {
    if (denyIfExam()) return null
    if (!mainWindow) return null
    const root = await pickFolder(mainWindow)
    if (root) saveSettings({ lastRoot: root })
    return root
  })
  ipcMain.handle('workspace:restore', (_e, root: string) => {
    if (typeof root !== 'string') return null
    if (denyIfExam()) {
      const exam = loadExamSession()
      if (exam.projectRoot && root !== exam.projectRoot) return null
    }
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
    try {
      if (denyIfExam() && loadExamSession().seg === 'mcq') return null
      if (!mainWindow) return null
      const copy = dialogCopy(loadSettings().locale)
      const result = await dialog.showSaveDialog(mainWindow, {
        title: copy.newFile,
        defaultPath: join(getRoot() || homedir(), 'Main.java'),
        filters: [{ name: 'Java', extensions: ['java'] }]
      })
      if (result.canceled || !result.filePath) return null
      const requested = result.filePath
      const cls = basename(requested, '.java').replace(/[^\w]/g, '_') || 'Main'
      const stub = requested.toLowerCase().endsWith('.java')
        ? `public class ${cls} {\n    public static void main(String[] args) {\n        \n    }\n}\n`
        : ''
      const file = createFile(requested, stub)
      if (!getRoot()) {
        const root = dirname(file)
        setRoot(root)
        saveSettings({ lastRoot: root })
      }
      return { root: getRoot(), file }
    } catch (err) {
      console.error(err)
      return null
    }
  })
  ipcMain.handle('workspace:newFolderDialog', async () => {
    try {
      if (denyIfExam()) return null
      if (!mainWindow) return null
      const copy = dialogCopy(loadSettings().locale)
      const result = await dialog.showOpenDialog(mainWindow, {
        title: copy.newFolder,
        defaultPath: getRoot() || homedir(),
        properties: ['openDirectory', 'createDirectory', 'promptToCreate']
      })
      if (result.canceled || !result.filePaths[0]) return null
      const dir = result.filePaths[0]
      mkdirSync(dir, { recursive: true })
      if (!getRoot()) {
        setRoot(dir)
        saveSettings({ lastRoot: dir })
      }
      return { root: getRoot(), dir }
    } catch (err) {
      console.error(err)
      return null
    }
  })
  ipcMain.handle('workspace:createEmpty', (_e, name: string) => {
    if (denyIfExam()) return null
    const created = createEmpty(typeof name === 'string' ? name : 'untitled')
    saveSettings({ lastRoot: created.root })
    return created
  })
  ipcMain.handle('workspace:createPractice', (_e, kind: 'hello' | 'scanner') => {
    if (denyIfExam()) return null
    const created = createPractice(kind)
    saveSettings({ lastRoot: created.root })
    return created
  })
  ipcMain.handle('workspace:createFrq', (_e, kind: 'methods' | 'class' | 'arraylist' | 'grid') => {
    if (denyIfExam()) return null
    const created = createFrq(kind)
    saveSettings({ lastRoot: created.root })
    return created
  })
  ipcMain.handle('workspace:rename', (_e, from: string, name: string) => renameEntry(from, name))
  ipcMain.handle('workspace:delete', (_e, target: string) => {
    deleteEntry(target)
  })
  ipcMain.handle('workspace:transfer', (_e, from: string, destDir: string, cut: boolean) =>
    transferEntry(from, destDir, cut)
  )
  ipcMain.handle('java:mains', () => {
    const root = getRoot()
    return root ? scanMainClasses(root) : []
  })
  ipcMain.handle('java:compile', () => {
    if (denyIfExam() && loadExamSession().seg === 'mcq') {
      return {
        ok: false,
        output: '',
        diagnostics: [],
        mainClasses: [],
        projectKind: 'folder',
        classpath: null,
        notice: 'EXAM_LOCKED'
      } satisfies CompileResult
    }
    return compileProject()
  })
  ipcMain.handle('java:run', async (_e, mainClass?: string, replay?: string) => {
    if (denyIfExam() && loadExamSession().seg === 'mcq') return
    await runMain(
      mainClass,
      (stream, text) => send('java:data', { stream, text }),
      (code) => send('java:exit', code),
      (compiled: CompileResult) => send('java:compiled', compiled),
      replay,
      (event) => send('java:trace', event),
      (code) => send('java:notice', code)
    )
  })
  ipcMain.handle('java:stop', () => stopRun())
  ipcMain.handle('java:writeStdin', (_e, text: string) =>
    writeStdin(typeof text === 'string' ? text : '')
  )

  ipcMain.handle('ai:complete', (_e, req: CompleteRequest) => complete(req))
  ipcMain.handle('ai:completeAbort', () => abortComplete())
  ipcMain.handle('ai:debug', async (_e, req: DebugRequest) => {
    await debugStream(req, (chunk) => send('ai:debugChunk', chunk))
  })
  ipcMain.handle('ai:debugAbort', () => abortDebug())

  ipcMain.handle('export:savePng', async (_e, dataUrl: string, defaultName: string) => {
    if (denyIfExam()) return null
    if (!mainWindow) return null
    const copy = dialogCopy(loadSettings().locale)
    applyNativeDialogLanguage(loadSettings().locale)
    const result = await dialog.showSaveDialog(mainWindow, {
      title: copy.longImage,
      message: copy.choosePlace,
      buttonLabel: copy.save,
      nameFieldLabel: copy.fileName,
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
  applyNativeDialogLanguage(loadSettings().locale)
  electronApp.setAppUserModelId('com.jcat.ide')
  app.setName('Jcat')
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null)
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  setExamLocked(loadExamSession().active)
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
