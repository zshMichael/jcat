import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type JSX
} from 'react'
import type { AppSettings, Diagnostic, FileNode, ThemeId, Toolchain } from '@shared/types'
import { THEME_CARDS } from '@shared/themes'
import { FileTree } from './components/FileTree'
import { SettingsModal } from './components/SettingsModal'
import { applyMarkers } from './editor/markers'
import { renderCodePng } from './editor/exportImage'
import {
  registerInlineCompletions,
  setInlineCompletionDelay,
  setInlineCompletionEnabled
} from './editor/inlineCompletions'
import { defineJcatThemes, monacoThemeName } from './editor/theme'
import { CatIcon } from './theme/CatIcon'

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker()
  }
}
loader.config({ monaco })

type EditorView = monaco.editor.IStandaloneCodeEditor
type NameAsk = { kind: 'file' | 'folder'; value: string } | null
type PaneKind = 'main' | 'thumb' | 'dormant'

const ZOOM_MIN = 0.6
const ZOOM_MAX = 2.4
const THUMB = { w: 248, h: 164, pad: 18, hover: 1.055 }

function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n))
}

function joinPath(root: string, name: string): string {
  const sep = root.includes('\\') && !root.includes('/') ? '\\' : '/'
  return `${root.replace(/[\\/]+$/, '')}${sep}${name.replace(/^[\\/]+/, '')}`
}

function javaStub(fileName: string): string {
  const cls = fileName.replace(/\.java$/i, '').replace(/[^\w]/g, '_') || 'Main'
  return `public class ${cls} {\n    public static void main(String[] args) {\n        \n    }\n}\n`
}

function classFromJava(path: string, source: string): string | null {
  if (!/\.java$/i.test(path)) return null
  const base =
    path
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      ?.replace(/\.java$/i, '') || ''
  const pkg = source.match(/^\s*package\s+([\w.]+)\s*;/m)?.[1]
  const cls = source.match(/\bclass\s+(\w+)/)?.[1] || base
  if (!cls) return null
  return pkg ? `${pkg}.${cls}` : cls
}

function pickMain(path: string | null, source: string, mains: string[], fallback = ''): string {
  if (!path) return mains.includes(fallback) ? fallback : mains[0] || fallback
  const cand = classFromJava(path, source)
  if (!cand) return fallback || mains[0] || ''
  if (mains.includes(cand)) return cand
  const simple = cand.split('.').pop() || cand
  const hit = mains.find((item) => item === cand || item.endsWith(`.${simple}`))
  return hit || cand
}

function paneStyle(kind: PaneKind, hover: boolean, sw: number, sh: number): CSSProperties {
  if (kind !== 'thumb' || sw < 8 || sh < 8) {
    return { transform: 'translate3d(0,0,0) scale(1)', borderRadius: '0px' }
  }
  const scale = Math.min(THUMB.w / sw, THUMB.h / sh) * (hover ? THUMB.hover : 1)
  const tx = sw - THUMB.pad - sw * scale
  const ty = sh - THUMB.pad - sh * scale
  return {
    transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
    borderRadius: `${18 / scale}px`
  }
}

export default function App(): JSX.Element {
  const [root, setRoot] = useState<string | null>(null)
  const [tree, setTree] = useState<FileNode[]>([])
  const [openFile, setOpenFile] = useState<string | null>(null)
  const [buffers, setBuffers] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [toolchain, setToolchain] = useState<Toolchain | null>(null)
  const [output, setOutput] = useState('Jcat 已就绪。打开一个 Java 文件夹即可编译运行。')
  const [running, setRunning] = useState(false)
  const [debugOpen, setDebugOpen] = useState(true)
  const [debugText, setDebugText] = useState('')
  const [debugReasoning, setDebugReasoning] = useState('')
  const [debugNote, setDebugNote] = useState('')
  const [debugging, setDebugging] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [mains, setMains] = useState<string[]>([])
  const [mainClass, setMainClass] = useState('')
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [exporting, setExporting] = useState(false)
  const [stage, setStage] = useState<'editor' | 'run'>('editor')
  const [zoom, setZoom] = useState(1)
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })
  const [thumbHover, setThumbHover] = useState<'editor' | 'run' | null>(null)
  const [nameAsk, setNameAsk] = useState<NameAsk>(null)
  const editorRef = useRef<EditorView | null>(null)
  const monacoRef = useRef<typeof monaco | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
  const zoomRef = useRef(1)
  const gestureStartRef = useRef(1)

  const themeId: ThemeId = settings?.theme ?? 'paper'

  const dirty = openFile ? (buffers[openFile] ?? '') !== (saved[openFile] ?? '') : false
  const currentCode = openFile ? (buffers[openFile] ?? '') : ''
  const fileName = openFile ? openFile.split(/[/\\]/).pop() || openFile : ''
  const runOptions = useMemo(() => {
    if (!mainClass) return mains
    return mains.includes(mainClass) ? mains : [mainClass, ...mains]
  }, [mainClass, mains])

  const refreshTree = useCallback(async () => {
    const nodes = await window.jcat.workspace.tree()
    setTree(nodes)
    const list = await window.jcat.java.mains()
    setMains(list)
    setMainClass((current) =>
      current && list.includes(current) ? current : current || list[0] || ''
    )
  }, [])

  const applyTheme = useCallback((id: ThemeId): void => {
    document.documentElement.setAttribute('data-theme', id)
    const card = THEME_CARDS.find((item) => item.id === id)
    if (card) void window.jcat.window.setBackground(card.windowBg)
    monacoRef.current?.editor.setTheme(monacoThemeName(id))
  }, [])

  useEffect(() => {
    zoomRef.current = zoom
    document.documentElement.style.setProperty('--ui-zoom', String(zoom))
    editorRef.current?.updateOptions({ fontSize: Math.round(14 * zoom * 10) / 10 })
  }, [zoom])

  useEffect(() => {
    document.body.classList.add(window.jcat.platform === 'darwin' ? 'mac' : window.jcat.platform)
    const offData = window.jcat.java.onData(({ text }) => {
      setOutput((prev) => prev + text)
    })
    const offExit = window.jcat.java.onExit((code) => {
      setRunning(false)
      setOutput((prev) => prev + `\n进程结束，退出码 ${code ?? 'null'}\n`)
    })
    const offChunk = window.jcat.ai.onDebugChunk((chunk) => {
      if (chunk.kind === 'reasoning') setDebugReasoning((prev) => prev + chunk.text)
      else setDebugText((prev) => prev + chunk.text)
    })
    void (async () => {
      const s = await window.jcat.settings.get()
      setSettings(s)
      document.documentElement.setAttribute('data-theme', s.theme)
      const card = THEME_CARDS.find((item) => item.id === s.theme)
      if (card) void window.jcat.window.setBackground(card.windowBg)
      setInlineCompletionEnabled(s.completionEnabled)
      setInlineCompletionDelay(s.completionDelayMs)
      setToolchain(await window.jcat.toolchain.detect())
      if (s.lastRoot) {
        const restored = await window.jcat.workspace.restore(s.lastRoot)
        if (restored) {
          setRoot(restored)
          setTree(await window.jcat.workspace.tree())
          const list = await window.jcat.java.mains()
          setMains(list)
          if (list[0]) setMainClass(list[0])
        }
      }
    })()
    return () => {
      offData()
      offExit()
      offChunk()
    }
  }, [])

  useEffect(() => {
    const monacoApi = monacoRef.current
    if (!monacoApi) return
    applyMarkers(monacoApi, diagnostics, openFile)
  }, [diagnostics, openFile])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = (): void => {
      const rect = el.getBoundingClientRect()
      setStageSize({ w: rect.width, h: rect.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [debugOpen])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0025)
      setZoom((z) => clamp(z * factor, ZOOM_MIN, ZOOM_MAX))
    }
    const onGestureStart = (e: Event): void => {
      e.preventDefault()
      gestureStartRef.current = zoomRef.current
    }
    const onGestureChange = (e: Event): void => {
      e.preventDefault()
      const scale = (e as Event & { scale: number }).scale || 1
      setZoom(clamp(gestureStartRef.current * scale, ZOOM_MIN, ZOOM_MAX))
    }
    el.addEventListener('wheel', onWheel, { passive: false, capture: true })
    el.addEventListener('gesturestart', onGestureStart, { capture: true })
    el.addEventListener('gesturechange', onGestureChange, { capture: true })
    return () => {
      el.removeEventListener('wheel', onWheel, { capture: true })
      el.removeEventListener('gesturestart', onGestureStart, { capture: true })
      el.removeEventListener('gesturechange', onGestureChange, { capture: true })
    }
  }, [])

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (): void => {
      editorRef.current?.layout()
      if (performance.now() - start < 520) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stage, debugOpen, stageSize.w, stageSize.h])

  const saveCurrent = useCallback(async () => {
    if (!openFile) return
    const content = buffers[openFile] ?? ''
    await window.jcat.workspace.write(openFile, content)
    setSaved((prev) => ({ ...prev, [openFile]: content }))
    setStatusMsg('已保存')
  }, [buffers, openFile])

  const saveAllDirty = useCallback(async () => {
    const entries = Object.keys(buffers).filter((path) => buffers[path] !== saved[path])
    for (const path of entries) {
      await window.jcat.workspace.write(path, buffers[path])
    }
    if (entries.length) setSaved({ ...buffers })
  }, [buffers, saved])

  const openFolder = useCallback(async (): Promise<void> => {
    const next = await window.jcat.workspace.open()
    if (!next) return
    setRoot(next)
    setOpenFile(null)
    setBuffers({})
    setSaved({})
    setMainClass('')
    setDiagnostics([])
    setOutput(`已打开 ${next}\n`)
    await refreshTree()
  }, [refreshTree])

  const openPath = useCallback(
    async (path: string, text?: string): Promise<void> => {
      let source = text ?? buffers[path]
      if (source === undefined) {
        source = await window.jcat.workspace.read(path)
      }
      setBuffers((prev) => ({
        ...prev,
        [path]: prev[path] !== undefined && text === undefined ? prev[path] : source!
      }))
      setSaved((prev) => ({
        ...prev,
        [path]: prev[path] !== undefined && text === undefined ? prev[path] : source!
      }))
      setOpenFile(path)
      setMainClass((current) => pickMain(path, source || '', mains, current))
    },
    [buffers, mains]
  )

  const newFile = useCallback(async (): Promise<void> => {
    if (!root) {
      const created = await window.jcat.workspace.newFileDialog()
      if (!created) return
      if (created.root) setRoot(created.root)
      await refreshTree()
      await openPath(created.file)
      setStatusMsg('已新建文件')
      return
    }
    setNameAsk({ kind: 'file', value: 'Main.java' })
  }, [openPath, refreshTree, root])

  const newFolder = useCallback(async (): Promise<void> => {
    if (!root) {
      const created = await window.jcat.workspace.newFolderDialog()
      if (!created) return
      if (created.root) setRoot(created.root)
      await refreshTree()
      setStatusMsg('已新建文件夹')
      return
    }
    setNameAsk({ kind: 'folder', value: 'src' })
  }, [refreshTree, root])

  const confirmName = useCallback(async (): Promise<void> => {
    if (!nameAsk || !root) return
    const raw = nameAsk.value.trim()
    if (!raw || /[\\/]/.test(raw)) {
      setStatusMsg('名字不能包含路径分隔符')
      return
    }
    if (nameAsk.kind === 'file') {
      const file = joinPath(root, raw.includes('.') ? raw : `${raw}.java`)
      const stub = file.toLowerCase().endsWith('.java')
        ? javaStub(file.split(/[/\\]/).pop() || 'Main.java')
        : ''
      await window.jcat.workspace.createFile(file, stub)
      const written = await window.jcat.workspace.read(file)
      setNameAsk(null)
      await refreshTree()
      await openPath(file, written)
      setStatusMsg('已新建文件')
      return
    }
    await window.jcat.workspace.createFolder(joinPath(root, raw))
    setNameAsk(null)
    await refreshTree()
    setStatusMsg('已新建文件夹')
  }, [nameAsk, openPath, refreshTree, root])

  const compile = useCallback(async (): Promise<boolean> => {
    await saveAllDirty()
    setStatusMsg('正在编译…')
    const result = await window.jcat.java.compile()
    setDiagnostics(result.diagnostics)
    setMains(result.mainClasses)
    setMainClass((current) =>
      pickMain(openFile, openFile ? (buffers[openFile] ?? '') : '', result.mainClasses, current)
    )
    setOutput(result.output + '\n')
    if (result.ok) {
      setStatusMsg('编译成功')
    } else {
      setDebugOpen(true)
      setStage('run')
      setStatusMsg('编译失败')
    }
    return result.ok
  }, [buffers, openFile, saveAllDirty])

  const run = useCallback(async (): Promise<void> => {
    await saveAllDirty()
    setOutput('')
    setRunning(true)
    setStage('run')
    setStatusMsg('运行中')
    await window.jcat.java.run(mainClass || undefined)
  }, [mainClass, saveAllDirty])

  const stop = useCallback(async (): Promise<void> => {
    await window.jcat.java.stop()
    setRunning(false)
  }, [])

  const toggleCompletion = async (): Promise<void> => {
    if (!settings) return
    if (!settings.apiKey && !settings.completionEnabled) {
      setSettingsOpen(true)
      setStatusMsg('先填写 DeepSeek API Key')
      return
    }
    const next = await window.jcat.settings.save({ completionEnabled: !settings.completionEnabled })
    setSettings(next)
    setInlineCompletionEnabled(next.completionEnabled)
    setStatusMsg(
      next.completionEnabled ? '补全已开启，停一下就会出现灰色预写，Tab 采纳' : '补全已关闭'
    )
  }

  const runDebug = async (): Promise<void> => {
    if (!settings?.apiKey) {
      setSettingsOpen(true)
      setStatusMsg('先填写 DeepSeek API Key')
      return
    }
    setDebugOpen(true)
    setDebugging(true)
    setDebugText('')
    setDebugReasoning('')
    try {
      await window.jcat.ai.debug({
        filePath: openFile || '',
        source: currentCode,
        errorOutput: output,
        note: debugNote
      })
    } catch (err) {
      setDebugText((err as Error).message)
    } finally {
      setDebugging(false)
    }
  }

  const extractFix = (text: string): string => {
    const match = text.match(/```(?:java)?\n([\s\S]*?)```/)
    return match?.[1] ?? text
  }

  const copyFix = async (): Promise<void> => {
    await navigator.clipboard.writeText(extractFix(debugText))
    setStatusMsg('已复制修复')
  }

  const insertFix = (): void => {
    const editor = editorRef.current
    if (!editor) return
    const text = extractFix(debugText)
    const sel = editor.getSelection()
    if (!sel) return
    editor.executeEdits('jcat-debug', [{ range: sel, text }])
  }

  const exportImage = async (): Promise<void> => {
    const monacoApi = monacoRef.current
    if (!monacoApi || !openFile) return
    const editor = editorRef.current
    const selected = editor?.getModel()
      ? editor.getModel()!.getValueInRange(editor.getSelection()!)
      : ''
    const code = selected && selected.trim() ? selected : currentCode
    if (!code) return
    setExporting(true)
    setStatusMsg('正在导出长图…')
    try {
      const dataUrl = await renderCodePng(monacoApi, code, fileName || 'code.java')
      const savedPath = await window.jcat.exportImage.savePng(dataUrl, `${fileName || 'code'}.png`)
      setStatusMsg(savedPath ? `已导出 ${savedPath}` : '已取消导出')
    } catch (err) {
      setStatusMsg((err as Error).message)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveCurrent()
      }
      if (meta && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        void openFolder()
      }
      if (meta && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        void newFile()
      }
      if (meta && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        void compile()
      }
      if (meta && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault()
        setZoom(1)
      }
      if (e.key === 'F5' && !e.shiftKey) {
        e.preventDefault()
        void run()
      }
      if (e.key === 'F5' && e.shiftKey) {
        e.preventDefault()
        void stop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [compile, newFile, openFolder, run, saveCurrent, stop])

  const jdkLabel = useMemo(() => {
    if (!toolchain) return 'JDK …'
    if (toolchain.javaVersion) return toolchain.javaVersion.replace(/^"/, '').replace(/"$/, '')
    return '未找到 JDK'
  }, [toolchain])

  const editorKind: PaneKind = stage === 'editor' ? 'main' : 'thumb'
  const runKind: PaneKind = stage === 'run' ? 'main' : running ? 'thumb' : 'dormant'

  return (
    <div className={`app ${debugOpen ? '' : 'debug-collapsed'}`}>
      <header className="titlebar">
        <div className="brand">
          <CatIcon />
          <h1>Jcat</h1>
        </div>
        <div className="actions">
          <button onClick={() => void openFolder()}>打开</button>
          <button onClick={() => void saveCurrent()} disabled={!openFile}>
            保存
          </button>
          <button onClick={() => void compile()} disabled={!root}>
            编译
          </button>
          <button className="primary" onClick={() => void run()} disabled={!root || running}>
            运行
          </button>
          <button onClick={() => void stop()} disabled={!running}>
            停止
          </button>
          <select
            value={mainClass}
            onChange={(e) => setMainClass(e.target.value)}
            disabled={!runOptions.length}
            title="运行选择"
          >
            {runOptions.length === 0 ? <option value="">没有 main</option> : null}
            {runOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button onClick={() => void exportImage()} disabled={!openFile || exporting}>
            长图
          </button>
          <button onClick={() => setDebugOpen((v) => !v)}>
            {debugOpen ? '收起分析' : 'Debug'}
          </button>
          <button onClick={() => setSettingsOpen(true)}>设置</button>
        </div>
        {window.jcat.platform !== 'darwin' ? (
          <div className="window-controls">
            <button onClick={() => void window.jcat.window.minimize()}>–</button>
            <button onClick={() => void window.jcat.window.maximize()}>□</button>
            <button onClick={() => void window.jcat.window.close()}>×</button>
          </div>
        ) : null}
      </header>

      <FileTree
        nodes={tree}
        active={openFile}
        onOpen={(path) => void openPath(path)}
        onNewFile={() => void newFile()}
        onNewFolder={() => void newFolder()}
      />

      <section className="stage" ref={stageRef}>
        <div
          className={`pane ${editorKind === 'main' ? 'is-main' : 'is-thumb'}`}
          style={paneStyle(editorKind, thumbHover === 'editor', stageSize.w, stageSize.h)}
          onMouseEnter={() => {
            if (editorKind === 'thumb') setThumbHover('editor')
          }}
          onMouseLeave={() => setThumbHover((v) => (v === 'editor' ? null : v))}
          onClick={() => {
            if (editorKind === 'thumb') setStage('editor')
          }}
        >
          {openFile ? (
            <>
              <div className="tabs">
                <span className={`file ${dirty ? 'dirty' : ''}`}>{fileName}</span>
              </div>
              <div className="editor-wrap">
                <Editor
                  path={openFile}
                  language={openFile.endsWith('.java') ? 'java' : undefined}
                  theme={monacoThemeName(themeId)}
                  value={currentCode}
                  onChange={(value) => {
                    if (!openFile) return
                    setBuffers((prev) => ({ ...prev, [openFile]: value ?? '' }))
                  }}
                  onMount={(editor, monacoApi) => {
                    editorRef.current = editor
                    monacoRef.current = monacoApi
                    defineJcatThemes(monacoApi)
                    monacoApi.editor.setTheme(monacoThemeName(themeId))
                    registerInlineCompletions(monacoApi)
                    editor.updateOptions({ fontSize: Math.round(14 * zoomRef.current * 10) / 10 })
                    editor.onDidChangeCursorPosition((ev) => {
                      setCursor({ line: ev.position.lineNumber, column: ev.position.column })
                    })
                    applyMarkers(monacoApi, diagnostics, openFile)
                  }}
                  options={{
                    fontFamily: 'SF Mono, ui-monospace, Menlo, Consolas, monospace',
                    fontSize: Math.round(14 * zoom * 10) / 10,
                    minimap: { enabled: false },
                    padding: { top: 12, bottom: 12 },
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    inlineSuggest: { enabled: true, suppressSuggestions: false },
                    tabCompletion: 'off',
                    acceptSuggestionOnEnter: 'off',
                    quickSuggestions: { other: true, comments: false, strings: false },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    renderLineHighlight: 'line',
                    wordWrap: 'off',
                    mouseWheelZoom: false,
                    scrollbar: { horizontal: 'auto', vertical: 'auto', useShadows: false }
                  }}
                />
              </div>
            </>
          ) : (
            <div className="editor-empty">
              <CatIcon size={48} />
              <p>{root ? '选一个源文件' : 'Jcat 在等你打开工程'}</p>
              <span>线条安静，代码自己说话。</span>
              <div className="empty-actions">
                <button className="primary" onClick={() => void newFile()}>
                  新建文件
                </button>
                <button onClick={() => void newFolder()}>新建文件夹</button>
                <button onClick={() => void openFolder()}>打开工程</button>
              </div>
            </div>
          )}
        </div>

        <div
          className={`pane run-pane ${
            runKind === 'main' ? 'is-main' : runKind === 'thumb' ? 'is-thumb' : 'is-dormant'
          }`}
          style={paneStyle(runKind, thumbHover === 'run', stageSize.w, stageSize.h)}
          onMouseEnter={() => {
            if (runKind === 'thumb') setThumbHover('run')
          }}
          onMouseLeave={() => setThumbHover((v) => (v === 'run' ? null : v))}
          onClick={() => {
            if (runKind === 'thumb') setStage('run')
          }}
        >
          <div className="run-head">
            <span>运行</span>
            <button onClick={() => setOutput('')}>清空</button>
          </div>
          <pre>{output}</pre>
        </div>
      </section>

      <aside className="debug">
        <div className="debug-head">
          <h2>AI Debug</h2>
          <button type="button" onClick={() => setDebugOpen(false)}>
            收起
          </button>
        </div>
        <div className="debug-body">
          {debugReasoning ? <div className="reasoning">{debugReasoning}</div> : null}
          {debugText || (debugging ? '正在想…' : '出错后点分析。')}
        </div>
        <div className="debug-note">
          <input
            value={debugNote}
            placeholder="补充现象（可选）"
            onChange={(e) => setDebugNote(e.target.value)}
          />
          <div className="debug-actions">
            <button className="primary" onClick={() => void runDebug()} disabled={debugging}>
              分析
            </button>
            <button onClick={() => void copyFix()} disabled={!debugText}>
              复制
            </button>
            <button onClick={insertFix} disabled={!debugText || !openFile}>
              插入
            </button>
          </div>
        </div>
      </aside>

      <footer className="statusbar">
        <span className={toolchain?.javac ? 'status-ok' : 'status-err'}>{jdkLabel}</span>
        <button
          className={`toggle ${settings?.completionEnabled ? 'on' : ''}`}
          onClick={() => void toggleCompletion()}
        >
          补全 {settings?.completionEnabled ? '开' : '关'}
        </button>
        <span>
          {cursor.line}:{cursor.column}
        </span>
        <span>{Math.round(zoom * 100)}%</span>
        <span className="spacer" />
        <span>{statusMsg}</span>
        <span>{root ? root : '没有工程'}</span>
      </footer>

      {settingsOpen && settings ? (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onTheme={(id) => {
            applyTheme(id)
            setSettings((prev) => (prev ? { ...prev, theme: id } : prev))
            void window.jcat.settings.save({ theme: id })
          }}
          onSave={async (next) => {
            const savedSettings = await window.jcat.settings.save(next)
            setSettings(savedSettings)
            applyTheme(savedSettings.theme)
            setInlineCompletionEnabled(savedSettings.completionEnabled)
            setInlineCompletionDelay(savedSettings.completionDelayMs)
            setToolchain(await window.jcat.toolchain.detect())
            setSettingsOpen(false)
          }}
        />
      ) : null}

      {nameAsk ? (
        <div className="modal-backdrop" onClick={() => setNameAsk(null)}>
          <div className="modal name-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{nameAsk.kind === 'file' ? '新建文件' : '新建文件夹'}</h3>
            <div className="field">
              <label htmlFor="jcat-new-name">名称</label>
              <input
                id="jcat-new-name"
                autoFocus
                value={nameAsk.value}
                onChange={(e) => setNameAsk({ ...nameAsk, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void confirmName()
                  if (e.key === 'Escape') setNameAsk(null)
                }}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setNameAsk(null)}>取消</button>
              <button className="primary" onClick={() => void confirmName()}>
                创建
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div id="jcat-export-host" />
    </div>
  )
}
