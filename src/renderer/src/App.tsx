import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type PointerEvent as ReactPointerEvent
} from 'react'
import type { CompileResult, Diagnostic, FileNode, Locale, PublicSettings, ThemeId, Toolchain } from '@shared/types'
import { THEME_CARDS } from '@shared/themes'
import { addedTokens } from '@shared/examReport'
import {
  idleSession,
  reduce,
  type ExamEvent,
  type ExamSeg,
  type ExamSession
} from '@shared/examSession'
import { formatAiError, formatCompile, formatNotice } from './notices'
import { traceSteps, type TraceEvent } from '@shared/instrumentJava'
import { FileTree } from './components/FileTree'
import { AnimSelect } from './components/AnimSelect'
import { EditorBar } from './components/EditorBar'
import { ModalShell } from './components/ModalShell'
import { ExamReference, SidePanel } from './components/SidePanel'
import { SettingsModal } from './components/SettingsModal'
import { dailyMotto, t, type Msg } from './i18n'
import { applyMarkers } from './editor/markers'
import { renderCodePng } from './editor/exportImage'
import {
  registerInlineCompletions,
  setInlineCompletionDelay,
  setInlineCompletionEnabled,
  setInlineCompletionLocale,
  onGhostError,
  onGhostWhy
} from './editor/inlineCompletions'
import { defineJcatThemes, monacoThemeName } from './editor/theme'
import { CatIcon } from './theme/CatIcon'
import { WindowControls } from './components/WindowControls'
import { splitOutput } from './run/outputLinks'
import { TraceView } from './run/TraceView'
import { formatJava } from './editor/formatJava'
import { parseJavaOutline, publicClassInfo, isJavaClassName } from './editor/javaOutline'
import { paintApHints, registerApLanguage, setApHintsEnabled, setApLocale } from './editor/apLanguage'

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker()
  }
}
loader.config({ monaco })

type EditorView = monaco.editor.IStandaloneCodeEditor
type NameAsk = { kind: 'file' | 'folder' | 'project'; value: string } | null
type PaneKind = 'main' | 'thumb' | 'dormant'

const ZOOM_MIN = 0.6
const ZOOM_MAX = 2.4
const THUMB = { w: 248, h: 164, pad: 18, hover: 1.055 }
const THUMB_LONG_MS = 320
const THUMB_MOVE_CANCEL = 8
const INPUT_MIN_H = 32
type FrqKind = 'methods' | 'class' | 'arraylist' | 'grid'
const TREE_DEFAULT = 236
const TREE_MIN = 168
const TREE_MAX = 440
const TREE_COLLAPSE_AT = 118

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ExamTimeCtrl({
  paused,
  stage,
  onPause,
  onRestart,
  pauseLabel,
  resumeLabel,
  restartLabel
}: {
  paused: boolean
  stage?: boolean
  onPause: () => void
  onRestart: () => void
  pauseLabel: string
  resumeLabel: string
  restartLabel: string
}): JSX.Element {
  return (
    <div className={`exam-time-ctrl ${stage ? 'is-stage' : ''}`}>
      <button type="button" className={paused ? 'is-on' : ''} onClick={onPause}>
        {paused ? resumeLabel : pauseLabel}
      </button>
      <button type="button" onClick={onRestart}>
        {restartLabel}
      </button>
    </div>
  )
}

function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n))
}

function joinPath(root: string, name: string): string {
  const sep = root.includes('\\') && !root.includes('/') ? '\\' : '/'
  return `${root.replace(/[\\/]+$/, '')}${sep}${name.replace(/^[\\/]+/, '')}`
}

function remapPaths(map: Record<string, string>, from: string, to: string): Record<string, string> {
  const next: Record<string, string> = {}
  for (const [path, text] of Object.entries(map)) {
    if (path === from) next[to] = text
    else if (path.startsWith(`${from}/`) || path.startsWith(`${from}\\`)) {
      next[to + path.slice(from.length)] = text
    } else next[path] = text
  }
  return next
}

function dropPaths(map: Record<string, string>, target: string): Record<string, string> {
  const next: Record<string, string> = {}
  for (const [path, text] of Object.entries(map)) {
    if (path === target || path.startsWith(`${target}/`) || path.startsWith(`${target}\\`)) continue
    next[path] = text
  }
  return next
}

function remapTabPaths(list: string[], from: string, to: string): string[] {
  return list.map((path) => {
    if (path === from) return to
    if (path.startsWith(`${from}/`) || path.startsWith(`${from}\\`)) return to + path.slice(from.length)
    return path
  })
}

function dropTabPaths(list: string[], target: string): string[] {
  return list.filter(
    (path) =>
      path !== target &&
      !path.startsWith(`${target}/`) &&
      !path.startsWith(`${target}\\`)
  )
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

function firstJavaFile(nodes: FileNode[]): string | null {
  for (const node of nodes) {
    if (!node.isDir && node.name.toLowerCase().endsWith('.java')) return node.path
    if (node.children) {
      const hit = firstJavaFile(node.children)
      if (hit) return hit
    }
  }
  return null
}

function readEditorSelection(
  editor: EditorView | null
): { text: string; startLine: number; endLine: number } | null {
  if (!editor) return null
  const model = editor.getModel()
  const sel = editor.getSelection()
  if (!model || !sel || sel.isEmpty()) return null
  const text = model.getValueInRange(sel)
  if (!text.trim()) return null
  const startLine = Math.min(sel.startLineNumber, sel.endLineNumber)
  const endLine = Math.max(sel.startLineNumber, sel.endLineNumber)
  return { text, startLine, endLine }
}

function parseDebugLine(text: string): number | null {
  const m =
    text.match(/(?:^|\n)\s*(?:行|Line)\s*[:：]\s*(?:Line\s*)?(\d+)/i) ||
    text.match(/第\s*(\d+)\s*行/)
  if (!m) return null
  const n = Number(m[1])
  return n >= 1 ? n : null
}

function runExcerpt(output: string): string {
  const lines = output.split('\n').filter((line) => {
    const t = line.trim()
    if (!t) return false
    if (t.startsWith('进程结束') || t.startsWith('Process ended') || t.includes('프로세스 종료')) return false
    if (t.includes('Jcat 已就绪') || t.includes('Jcat is ready')) return false
    return true
  })
  return lines.slice(-8).join('\n').slice(0, 360)
}

function resolveJumpFile(file: string, root: string | null, nodes: FileNode[]): string {
  const needle = file.replace(/\\/g, '/')
  const name = needle.split('/').pop() || needle
  const hits: string[] = []
  const walk = (list: FileNode[]): void => {
    for (const node of list) {
      if (!node.isDir && node.name === name) hits.push(node.path)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  const exact = hits.find((path) => path.replace(/\\/g, '/').endsWith(needle))
  if (exact) return exact
  if (hits[0]) return hits[0]
  if (root && !/[\\/]/.test(file)) return joinPath(root, file)
  return file
}

type ThumbNorm = { x: number; y: number }

function thumbMetrics(
  sw: number,
  sh: number,
  lift: number,
  hover: boolean
): { scale: number; minTx: number; minTy: number; maxTx: number; maxTy: number } {
  const scale = Math.min(THUMB.w / sw, THUMB.h / sh) * (hover ? THUMB.hover : 1)
  const visualW = sw * scale
  const visualH = sh * scale
  const minTx = THUMB.pad
  const minTy = THUMB.pad
  return {
    scale,
    minTx,
    minTy,
    maxTx: Math.max(minTx, sw - THUMB.pad - visualW),
    maxTy: Math.max(minTy, sh - THUMB.pad - visualH - Math.max(0, lift))
  }
}

function paneStyle(
  kind: PaneKind,
  hover: boolean,
  sw: number,
  sh: number,
  lift: number,
  norm: ThumbNorm,
  dragging: boolean
): CSSProperties {
  if (kind !== 'thumb' || sw < 8 || sh < 8) {
    return { transform: 'translate3d(0,0,0) scale(1)', borderRadius: '0px' }
  }
  const { scale, minTx, minTy, maxTx, maxTy } = thumbMetrics(sw, sh, lift, hover && !dragging)
  const tx = minTx + (maxTx - minTx) * clamp(norm.x, 0, 1)
  const ty = minTy + (maxTy - minTy) * clamp(norm.y, 0, 1)
  return {
    transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
    borderRadius: `${18 / scale}px`,
    ...(dragging ? { transition: 'box-shadow 0.2s var(--ease)' } : {})
  }
}

export default function App(): JSX.Element {
  const [root, setRoot] = useState<string | null>(null)
  const [tree, setTree] = useState<FileNode[]>([])
  const [openFile, setOpenFile] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [buffers, setBuffers] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [toolchain, setToolchain] = useState<Toolchain | null>(null)
  const [output, setOutput] = useState('')
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([])
  const [traceStep, setTraceStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [sideOpen, setSideOpen] = useState(true)
  const [debugText, setDebugText] = useState('')
  const [debugReasoning, setDebugReasoning] = useState('')
  const [debugNote, setDebugNote] = useState('')
  const [debugSel, setDebugSel] = useState<{
    text: string
    startLine: number
    endLine: number
  } | null>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [findIndex, setFindIndex] = useState(0)
  const [findTotal, setFindTotal] = useState(0)
  const [debugging, setDebugging] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [mains, setMains] = useState<string[]>([])
  const [mainClass, setMainClass] = useState('')
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [lastCompileOk, setLastCompileOk] = useState<boolean | null>(null)
  const [classClash, setClassClash] = useState<Diagnostic | null>(null)
  const [exporting, setExporting] = useState(false)
  const [stage, setStage] = useState<'editor' | 'run'>('editor')
  const [zoom, setZoom] = useState(1)
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })
  const [thumbHover, setThumbHover] = useState<'editor' | 'run' | null>(null)
  const [nameAsk, setNameAsk] = useState<NameAsk>(null)
  const [exam, setExam] = useState<ExamSession>(idleSession)
  const [examAsk, setExamAsk] = useState(false)
  const [examSwitching, setExamSwitching] = useState(false)
  const [examReport, setExamReport] = useState<string[] | null>(null)
  const [frqOpen, setFrqOpen] = useState(false)
  const [examRefOpen, setExamRefOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [clipboard, setClipboard] = useState<{ path: string; cut: boolean } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [stdinLine, setStdinLine] = useState('')
  const [lastStdin, setLastStdin] = useState('')
  const [pendingJump, setPendingJump] = useState<{ path: string; line: number; column: number } | null>(
    null
  )
  const [inputLift, setInputLift] = useState(0)
  const [thumbNorm, setThumbNorm] = useState<{ editor: ThumbNorm; run: ThumbNorm }>({
    editor: { x: 1, y: 1 },
    run: { x: 1, y: 1 }
  })
  const [thumbDragging, setThumbDragging] = useState<'editor' | 'run' | null>(null)
  const [treeOpen, setTreeOpen] = useState(true)
  const [treeWidth, setTreeWidth] = useState(TREE_DEFAULT)
  const [treeResizing, setTreeResizing] = useState(false)
  const [winMaximized, setWinMaximized] = useState(false)
  const editorRef = useRef<EditorView | null>(null)
  const monacoRef = useRef<typeof monaco | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
  const zoomRef = useRef(1)
  const gestureStartRef = useRef(1)
  const treeWidthRef = useRef(TREE_DEFAULT)
  const treeOpenRef = useRef(true)
  const replayNextRef = useRef(false)
  const examRef = useRef<ExamSession>(idleSession())
  const localeRef = useRef<Locale>('zh')
  const sessionStdinRef = useRef('')
  const stdinRef = useRef<HTMLTextAreaElement | null>(null)
  const findRef = useRef<HTMLInputElement | null>(null)
  const findDecosRef = useRef<string[]>([])
  const findRangesRef = useRef<monaco.Range[]>([])
  const traceDecosRef = useRef<string[]>([])
  const ghostWhyDecosRef = useRef<string[]>([])
  const debugLineJumpedRef = useRef(false)
  const traceStepCountRef = useRef(0)
  const runInputRef = useRef<HTMLFormElement | null>(null)
  const thumbNormRef = useRef(thumbNorm)
  const thumbPressRef = useRef<{
    key: 'editor' | 'run'
    pointerId: number
    startX: number
    startY: number
  } | null>(null)
  const thumbDragRef = useRef<{
    key: 'editor' | 'run'
    startX: number
    startY: number
    startNorm: ThumbNorm
  } | null>(null)
  const thumbTimerRef = useRef(0)
  const skipThumbClickRef = useRef(false)

  const themeId: ThemeId = settings?.theme ?? 'paper'
  const locale: Locale = settings?.locale ?? 'zh'
  const tr = useCallback((key: Msg) => t(locale, key), [locale])
  const examMode = exam.active
  const examSeg = exam.seg
  const examPaused = exam.paused
  const examMcqLeft = exam.mcqRemainingMs
  const examFrqLeft = exam.frqRemainingMs

  const applyExam = useCallback(
    async (event: ExamEvent): Promise<ExamSession> => {
      const tick = reduce(examRef.current, event)
      examRef.current = tick.session
      setExam(tick.session)
      if (tick.justZeroed) setStatusMsg(tr('examSegDone'))
      await window.jcat.exam.saveSession(tick.session)
      return tick.session
    },
    [tr]
  )

  const currentCode = openFile ? (buffers[openFile] ?? '') : ''
  const fileName = openFile ? openFile.split(/[/\\]/).pop() || openFile : ''
  const outlineItems = useMemo(() => parseJavaOutline(currentCode), [currentCode])
  const outlineOptions = useMemo(
    () =>
      outlineItems
        .filter((item) => item.kind !== 'class')
        .map((item) => ({ id: item.id, label: item.name })),
    [outlineItems]
  )
  const outlineValue =
    [...outlineItems].reverse().find((item) => item.kind !== 'class' && item.line <= cursor.line)
      ?.id || ''
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
    const platform = window.jcat.platform
    const bodyClass = platform === 'darwin' ? 'mac' : platform === 'win32' ? 'win' : platform
    document.body.classList.remove('mac', 'win', 'win32', 'linux')
    document.body.classList.add(bodyClass)
    const offData = window.jcat.java.onData(({ text }) => {
      setOutput((prev) => prev + text)
    })
    const offTrace = window.jcat.java.onTrace((event) => {
      setTraceEvents((prev) => [...prev, event])
      if (event.kind === 'step') {
        traceStepCountRef.current += 1
        setTraceStep(traceStepCountRef.current - 1)
      }
    })
    const offExit = window.jcat.java.onExit((code) => {
      setRunning(false)
      if (sessionStdinRef.current) setLastStdin(sessionStdinRef.current)
      setOutput(
        (prev) =>
          prev +
          `\n${t(localeRef.current, 'processEnded').replace('{code}', String(code ?? 'null'))}\n`
      )
    })
    const offNotice = window.jcat.java.onNotice((code) => {
      setOutput((prev) => `${prev}${prev.endsWith('\n') || !prev ? '' : '\n'}${formatNotice( (k) => t(localeRef.current, k), code)}\n`)
    })
    const offChunk = window.jcat.ai.onDebugChunk((chunk) => {
      if (chunk.kind === 'reasoning') setDebugReasoning((prev) => prev + chunk.text)
      else {
        setDebugText((prev) => {
          const next = prev + chunk.text
          const line = parseDebugLine(next)
          if (line && !debugLineJumpedRef.current) {
            debugLineJumpedRef.current = true
            const ed = editorRef.current
            ed?.revealLineInCenter(line)
            ed?.setPosition({ lineNumber: line, column: 1 })
          }
          return next
        })
      }
    })
    const offCompiled = window.jcat.java.onCompiled((result: CompileResult) => {
      setDiagnostics(result.diagnostics)
      setLastCompileOk(result.ok)
      setMains(result.mainClasses)
      setMainClass((current) =>
        current && result.mainClasses.includes(current)
          ? current
          : result.mainClasses[0] || current
      )
    })
    const offMax = window.jcat.window.onMaximized(setWinMaximized)
    onGhostError((message) => {
      if (message) setStatusMsg(formatAiError((k) => t(localeRef.current, k), message))
    })
    onGhostWhy((why) => {
      const editor = editorRef.current
      if (!editor) return
      if (!why) {
        ghostWhyDecosRef.current = editor.deltaDecorations(ghostWhyDecosRef.current, [])
        return
      }
      const pos = editor.getPosition()
      if (!pos) return
      const model = editor.getModel()
      const col = model?.getLineMaxColumn(pos.lineNumber) ?? pos.column
      ghostWhyDecosRef.current = editor.deltaDecorations(ghostWhyDecosRef.current, [
        {
          range: new monaco.Range(pos.lineNumber, col, pos.lineNumber, col),
          options: {
            after: {
              content: `  ${why}`,
              inlineClassName: 'ghost-why',
              cursorStops: monaco.editor.InjectedTextCursorStops.None
            }
          }
        }
      ])
    })
    void window.jcat.window.isMaximized().then(setWinMaximized)
    void (async () => {
      const s = await window.jcat.settings.get()
      setSettings(s)
      document.documentElement.setAttribute('data-theme', s.theme)
      const card = THEME_CARDS.find((item) => item.id === s.theme)
      if (card) void window.jcat.window.setBackground(card.windowBg)
      setInlineCompletionEnabled(s.completionEnabled)
      setInlineCompletionDelay(s.completionDelayMs)
      setInlineCompletionLocale(s.locale)
      setApHintsEnabled(s.apHintsEnabled !== false)
      setToolchain(await window.jcat.toolchain.detect())
      if (s.lastRoot) {
        const restored = await window.jcat.workspace.restore(s.lastRoot)
        if (restored) {
          setRoot(restored)
          const nodes = await window.jcat.workspace.tree()
          setTree(nodes)
          const list = await window.jcat.java.mains()
          setMains(list)
          const first = firstJavaFile(nodes)
          if (first) {
            const source = await window.jcat.workspace.read(first)
            setBuffers({ [first]: source })
            setSaved({ [first]: source })
            setOpenFile(first)
            setOpenTabs([first])
            setMainClass(pickMain(first, source, list, list[0] || ''))
          } else if (list[0]) setMainClass(list[0])
        }
      }
      setOutput(t(s.locale, 'ready'))
      if (s.secretError === 'SECRET_UNAVAILABLE') setStatusMsg(t(s.locale, 'secretUnavailable'))
      else if (s.secretError === 'SECRET_CORRUPT') setStatusMsg(t(s.locale, 'secretCorrupt'))
      else if (s.secretStorage === 'legacy' && s.hasApiKey) setStatusMsg(t(s.locale, 'secretLegacy'))
      const session = await window.jcat.exam.getSession()
      if (session.active) {
        const tick = reduce(session, { type: 'tick', now: Date.now() })
        examRef.current = tick.session
        setExam(tick.session)
        await window.jcat.exam.saveSession(tick.session)
        if (tick.justZeroed) setStatusMsg(t(s.locale, 'examSegDone'))
        setExamAsk(true)
      }
    })()
    return () => {
      offData()
      offTrace()
      offExit()
      offNotice()
      offChunk()
      offCompiled()
      offMax()
    }
  }, [])

  useEffect(() => {
    localeRef.current = locale
  }, [locale])

  useEffect(() => {
    const monacoApi = monacoRef.current
    if (!monacoApi) return
    applyMarkers(monacoApi, diagnostics, openFile, classClash ? [classClash] : [])
  }, [classClash, diagnostics, openFile])

  useEffect(() => {
    if (!pendingJump || openFile !== pendingJump.path) return
    const editor = editorRef.current
    if (!editor) return
    editor.revealLineInCenter(pendingJump.line)
    editor.setPosition({ lineNumber: pendingJump.line, column: pendingJump.column })
    editor.focus()
    setPendingJump(null)
  }, [openFile, pendingJump])

  useEffect(() => {
    if (running && stage === 'run') stdinRef.current?.focus()
  }, [running, stage])

  useEffect(() => {
    thumbNormRef.current = thumbNorm
  }, [thumbNorm])

  useEffect(() => {
    return () => window.clearTimeout(thumbTimerRef.current)
  }, [])

  useLayoutEffect(() => {
    const el = stdinRef.current
    if (!el) return
    el.style.height = '0px'
    const app = el.closest('.app') as HTMLElement | null
    const max = Math.max(INPUT_MIN_H, Math.floor((app?.clientHeight ?? window.innerHeight) / 3))
    el.style.height = `${Math.min(max, Math.max(INPUT_MIN_H, el.scrollHeight))}px`
  }, [stdinLine, running, stage, stageSize.h])

  useLayoutEffect(() => {
    const el = runInputRef.current
    if (!el) return
    const measure = (): void => {
      setInputLift(stage === 'run' ? el.getBoundingClientRect().height : 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [stage, stdinLine, running])

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
  }, [sideOpen, examMode, treeOpen, treeWidth])

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
  }, [stage, sideOpen, examMode, stageSize.w, stageSize.h])

  const persistPath = useCallback(
    async (path: string, quiet = false): Promise<string> => {
      const content = buffers[path] ?? ''
      await window.jcat.workspace.write(path, content)
      if (!path.toLowerCase().endsWith('.java')) {
        setSaved((prev) => ({ ...prev, [path]: content }))
        if (!quiet) setStatusMsg(tr('saved'))
        return path
      }
      const info = publicClassInfo(content)
      const base = (path.split(/[/\\]/).pop() || path).replace(/\.java$/i, '')
      if (!info || info.name === base) {
        setSaved((prev) => ({ ...prev, [path]: content }))
        setClassClash((cur) => (cur?.file === path ? null : cur))
        if (!quiet) setStatusMsg(tr('saved'))
        return path
      }
      const clashOf = (message: string): Diagnostic => ({
        file: path,
        line: info.line,
        column: info.column,
        endColumn: info.endColumn,
        severity: 'error',
        message
      })
      if (!isJavaClassName(info.name)) {
        setSaved((prev) => ({ ...prev, [path]: content }))
        setClassClash(clashOf(tr('classNameBad')))
        setStatusMsg(tr('classNameBad'))
        return path
      }
      try {
        const dest = await window.jcat.workspace.rename(path, `${info.name}.java`)
        setBuffers((prev) => remapPaths(prev, path, dest))
        setSaved((prev) => ({ ...remapPaths(prev, path, dest), [dest]: content }))
        setOpenFile((current) => (current === path ? dest : current))
        setOpenTabs((prev) => remapTabPaths(prev, path, dest))
        setClassClash((cur) => (cur?.file === path || cur?.file === dest ? null : cur))
        await refreshTree()
        setStatusMsg(tr('classRenamed').replace('{name}', `${info.name}.java`))
        return dest
      } catch {
        const taken = `${info.name}.java`
        const message = tr('classNameTaken').replace('{name}', taken)
        setSaved((prev) => ({ ...prev, [path]: content }))
        setClassClash(clashOf(message))
        setStatusMsg(message)
        return path
      }
    },
    [buffers, refreshTree, tr]
  )

  const saveCurrent = useCallback(async () => {
    if (!openFile) return
    await persistPath(openFile)
  }, [openFile, persistPath])

  const saveAllDirty = useCallback(async () => {
    const entries = Object.keys(buffers).filter((path) => buffers[path] !== saved[path])
    for (const path of entries) {
      await persistPath(path, true)
    }
  }, [buffers, persistPath, saved])

  const loadProject = useCallback(
    async (next: string, preferredFile?: string): Promise<void> => {
      setRoot(next)
      setOpenFile(null)
      setOpenTabs([])
      setBuffers({})
      setSaved({})
      setMainClass('')
      setDiagnostics([])
      setLastCompileOk(null)
      setOutput(`${tr('opened')} ${next}\n`)
      const nodes = await window.jcat.workspace.tree()
      setTree(nodes)
      const list = await window.jcat.java.mains()
      setMains(list)
      const first = preferredFile || firstJavaFile(nodes)
      if (first) {
        const source = await window.jcat.workspace.read(first)
        setBuffers({ [first]: source })
        setSaved({ [first]: source })
        setOpenFile(first)
        setOpenTabs([first])
        setMainClass(pickMain(first, source, list, list[0] || ''))
      } else if (list[0]) setMainClass(list[0])
    },
    [tr]
  )

  const openFolder = useCallback(async (): Promise<void> => {
    const next = await window.jcat.workspace.open()
    if (!next) return
    await loadProject(next)
  }, [loadProject])

  const startPractice = useCallback(
    async (kind: 'hello' | 'scanner'): Promise<void> => {
      const created = await window.jcat.workspace.createPractice(kind)
      if (!created) {
        setStatusMsg(tr('examLocked'))
        return
      }
      await loadProject(created.root, created.file)
      setStatusMsg(tr('fileCreated'))
    },
    [loadProject, tr]
  )

  const startFrq = useCallback(
    async (kind: FrqKind): Promise<void> => {
      setFrqOpen(false)
      const created = await window.jcat.workspace.createFrq(kind)
      if (!created) {
        setStatusMsg(tr('examLocked'))
        return
      }
      await loadProject(created.root, created.file)
      setStatusMsg(tr('fileCreated'))
    },
    [loadProject, tr]
  )

  const continueLast = useCallback(async (): Promise<void> => {
    if (!settings?.lastRoot) return
    const restored = await window.jcat.workspace.restore(settings.lastRoot)
    if (!restored) {
      await openFolder()
      return
    }
    await loadProject(restored)
  }, [loadProject, openFolder, settings])

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
      setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]))
      setMainClass((current) => pickMain(path, source || '', mains, current))
    },
    [buffers, mains]
  )

  const closeTab = useCallback(
    async (path: string): Promise<void> => {
      const content = buffers[path]
      if (content !== undefined && content !== saved[path]) {
        await window.jcat.workspace.write(path, content)
        setSaved((prev) => ({ ...prev, [path]: content }))
      }
      setBuffers((prev) => {
        const next = { ...prev }
        delete next[path]
        return next
      })
      setSaved((prev) => {
        const next = { ...prev }
        delete next[path]
        return next
      })
      setOpenTabs((prev) => {
        const index = prev.indexOf(path)
        const next = prev.filter((item) => item !== path)
        setOpenFile((current) => {
          if (current !== path) return current
          return next[index] || next[index - 1] || next[0] || null
        })
        return next
      })
    },
    [buffers, saved]
  )

  const clearFind = useCallback((): void => {
    const editor = editorRef.current
    if (editor) findDecosRef.current = editor.deltaDecorations(findDecosRef.current, [])
    findRangesRef.current = []
    setFindTotal(0)
    setFindIndex(0)
  }, [])

  const paintFind = useCallback((query: string, index: number): void => {
    const editor = editorRef.current
    const model = editor?.getModel()
    if (!editor || !model || !query) {
      clearFind()
      return
    }
    const matches = model.findMatches(query, true, false, false, null, true)
    findRangesRef.current = matches.map((item) => item.range)
    const safe = matches.length ? ((index % matches.length) + matches.length) % matches.length : 0
    findDecosRef.current = editor.deltaDecorations(
      findDecosRef.current,
      matches.map((item, i) => ({
        range: item.range,
        options: { className: i === safe ? 'jcat-find-on' : 'jcat-find' }
      }))
    )
    const hit = findRangesRef.current[safe]
    if (hit) editor.revealRangeInCenter(hit)
    setFindTotal(matches.length)
    setFindIndex(safe)
  }, [clearFind])

  const formatCurrent = useCallback((): void => {
    if (!openFile || !openFile.toLowerCase().endsWith('.java')) return
    const editor = editorRef.current
    const model = editor?.getModel()
    const source = buffers[openFile] ?? ''
    const formatted = formatJava(source)
    if (formatted === source) {
      setStatusMsg(tr('formatted'))
      return
    }
    if (editor && model) {
      editor.executeEdits('jcat-format', [{ range: model.getFullModelRange(), text: formatted }])
    }
    setBuffers((prev) => ({ ...prev, [openFile]: formatted }))
    setStatusMsg(tr('formatted'))
  }, [buffers, openFile, tr])

  useEffect(() => {
    if (!findOpen) return
    paintFind(findQuery, 0)
  }, [findOpen, findQuery, openFile, paintFind])

  const newFile = useCallback(async (): Promise<void> => {
    if (!root) {
      const created = await window.jcat.workspace.newFileDialog()
      if (!created) return
      if (created.root) setRoot(created.root)
      await refreshTree()
      await openPath(created.file)
      setStatusMsg(tr('fileCreated'))
      return
    }
    setNameAsk({ kind: 'file', value: 'Main.java' })
  }, [openPath, refreshTree, root, tr])

  const newFolder = useCallback(async (): Promise<void> => {
    if (!root) {
      const created = await window.jcat.workspace.newFolderDialog()
      if (!created) return
      if (created.root) setRoot(created.root)
      await refreshTree()
      setStatusMsg(tr('folderCreated'))
      return
    }
    setNameAsk({ kind: 'folder', value: 'src' })
  }, [refreshTree, root, tr])

  const startEmpty = useCallback((): void => {
    setNameAsk({ kind: 'project', value: 'untitled' })
  }, [])

  const confirmName = useCallback(async (): Promise<void> => {
    if (!nameAsk) return
    const raw = nameAsk.value.trim()
    if (!raw || /[\\/]/.test(raw)) {
      setStatusMsg(tr('badName'))
      return
    }
    if (nameAsk.kind === 'project') {
      const created = await window.jcat.workspace.createEmpty(raw)
      if (!created) {
        setStatusMsg(tr('examLocked'))
        return
      }
      setNameAsk(null)
      await loadProject(created.root)
      setStatusMsg(tr('folderCreated'))
      return
    }
    if (!root) return
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
      setStatusMsg(tr('fileCreated'))
      return
    }
    await window.jcat.workspace.createFolder(joinPath(root, raw))
    setNameAsk(null)
    await refreshTree()
    setStatusMsg(tr('folderCreated'))
  }, [loadProject, nameAsk, openPath, refreshTree, root, tr])

  const compile = useCallback(async (): Promise<boolean> => {
    if (examRef.current.active && examRef.current.seg === 'mcq') {
      setStatusMsg(tr('examLocked'))
      return false
    }
    await saveAllDirty()
    setStatusMsg(tr('compiling'))
    const result = await window.jcat.java.compile()
    setDiagnostics(result.diagnostics)
    setMains(result.mainClasses)
    setMainClass((current) =>
      pickMain(openFile, openFile ? (buffers[openFile] ?? '') : '', result.mainClasses, current)
    )
    setOutput(formatCompile(tr, result) + (result.output && result.notice ? `\n${result.output}` : result.notice ? '\n' : '\n'))
    setLastCompileOk(result.ok)
    if (result.ok) {
      setStatusMsg(tr('compileOk'))
    } else {
      if (!examMode) setSideOpen(true)
      setStage('run')
      setStatusMsg(tr('compileFail'))
    }
    return result.ok
  }, [buffers, examMode, openFile, saveAllDirty, tr])

  const run = useCallback(async (): Promise<void> => {
    if (examRef.current.active && examRef.current.seg === 'mcq') {
      setStatusMsg(tr('examLocked'))
      return
    }
    await saveAllDirty()
    const replay = replayNextRef.current ? lastStdin : undefined
    replayNextRef.current = false
    sessionStdinRef.current = replay || ''
    const echoed = replay
      ? `${replay
          .replace(/\n$/, '')
          .split('\n')
          .map((line) => `› ${line}`)
          .join('\n')}\n`
      : ''
    setOutput(echoed)
    setTraceEvents([])
    traceStepCountRef.current = 0
    setTraceStep(0)
    setRunning(true)
    setStage('run')
    setStatusMsg(tr('running'))
    await window.jcat.java.run(mainClass || undefined, replay)
  }, [lastStdin, mainClass, saveAllDirty, tr])

  const sendStdin = useCallback(async (): Promise<void> => {
    if (!running) return
    const line = stdinLine
    setStdinLine('')
    sessionStdinRef.current += `${line}\n`
    await window.jcat.java.writeStdin(line)
    setOutput((prev) => {
      const shown = line.split('\n').map((row) => `› ${row}`).join('\n')
      return `${prev}${prev.endsWith('\n') || !prev ? '' : '\n'}${shown}\n`
    })
  }, [running, stdinLine])

  const replayInput = useCallback((): void => {
    if (!lastStdin.trim()) return
    if (running) {
      sessionStdinRef.current += lastStdin.endsWith('\n') ? lastStdin : `${lastStdin}\n`
      void window.jcat.java.writeStdin(lastStdin)
      setOutput((prev) => prev + lastStdin)
      return
    }
    replayNextRef.current = true
    void run()
  }, [lastStdin, run, running])

  const jumpTo = useCallback(
    async (file: string, line: number, column: number): Promise<void> => {
      const path = resolveJumpFile(file, root, tree)
      setStage('editor')
      if (openFile === path) {
        const editor = editorRef.current
        editor?.revealLineInCenter(line)
        editor?.setPosition({ lineNumber: line, column })
        editor?.focus()
        return
      }
      try {
        setPendingJump({ path, line, column })
        await openPath(path)
      } catch {
        setPendingJump(null)
        setStatusMsg(file)
      }
    },
    [openFile, openPath, root, tree]
  )

  const stop = useCallback(async (): Promise<void> => {
    await window.jcat.java.stop()
    setRunning(false)
  }, [])

  const setGhost = async (on: boolean): Promise<void> => {
    if (!settings) return
    if (!on) {
      const saved = await window.jcat.settings.save({ completionEnabled: false })
      setSettings(saved)
      setInlineCompletionEnabled(false)
      setStatusMsg(tr('ghostOff'))
      return
    }
    if (!settings.hasApiKey) {
      setSettingsOpen(true)
      setStatusMsg(tr('needKey'))
      return
    }
    const saved = await window.jcat.settings.save({ completionEnabled: true })
    setSettings(saved)
    setInlineCompletionEnabled(!examMode)
    setStatusMsg(tr('ghostOn'))
    if (!examMode) {
      window.setTimeout(() => {
        editorRef.current?.focus()
        editorRef.current?.trigger('jcat', 'editor.action.inlineSuggest.trigger', {})
      }, Math.max(80, saved.completionDelayMs || 400) + 40)
    }
  }

  const runDebug = async (): Promise<void> => {
    if (!settings?.hasApiKey) {
      setSettingsOpen(true)
      setStatusMsg(tr('needKey'))
      return
    }
    if (examMode) return
    setSideOpen(true)
    setDebugging(true)
    debugLineJumpedRef.current = false
    const err = diagnostics.find((item) => item.severity === 'error')
    if (err && !debugSel) void jumpTo(err.file, err.line, err.column)
    try {
      await window.jcat.ai.debug({
        filePath: openFile || '',
        source: currentCode,
        errorOutput: output,
        note: debugNote,
        locale,
        errorLine: debugSel?.startLine ?? err?.line,
        errorMessage: err?.message,
        ...(debugSel
          ? {
              selectedSource: debugSel.text,
              selectedRange: { startLine: debugSel.startLine, endLine: debugSel.endLine }
            }
          : {})
      })
    } catch (e) {
      const code = (e as Error).message
      if (code !== 'AI_ABORTED') setDebugText((prev) => prev || formatAiError(tr, code))
    } finally {
      setDebugging(false)
    }
  }

  const stopDebug = (): void => {
    void window.jcat.ai.debugAbort()
    setDebugging(false)
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
    setStatusMsg(tr('exporting'))
    try {
      const card = THEME_CARDS.find((item) => item.id === themeId)
      const cls =
        publicClassInfo(currentCode)?.name || fileName.replace(/\.java$/i, '') || 'Main'
      const dataUrl = await renderCodePng(monacoApi, code, {
        className: cls,
        fileName: fileName || 'code.java',
        compileOk: lastCompileOk,
        runExcerpt: runExcerpt(output),
        hideLines: !!settings?.homeworkHideLines,
        paper: card?.swatches[0] ?? '#F6F1EA',
        ink: card?.swatches[1] ?? '#2C241B',
        accent: card?.swatches[2] ?? '#C46B4A',
        muted: card?.swatches[3] ?? '#E6DCD0',
        themeName: card?.name ?? 'Jcat',
        cardLabel: tr('homeworkCard'),
        compileLabel:
          lastCompileOk === null
            ? tr('compileUnknown')
            : lastCompileOk
              ? tr('compileOk')
              : tr('compileFail'),
        runLabel: tr('runExcerpt')
      })
      const savedPath = await window.jcat.exportImage.savePng(dataUrl, `${cls}.png`)
      setStatusMsg(savedPath ? tr('exportSaved').replace('{path}', savedPath) : tr('exportCancel'))
    } catch (err) {
      setStatusMsg((err as Error).message)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey
      const ex = examRef.current
      if (ex.active) {
        if (meta && (e.key.toLowerCase() === 'o' || e.key.toLowerCase() === 'n')) {
          e.preventDefault()
          setStatusMsg(tr('examLocked'))
          return
        }
        if (ex.seg === 'mcq' && (meta && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'f') || e.key === 'F5' || (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f'))) {
          e.preventDefault()
          setStatusMsg(tr('examLocked'))
          return
        }
      }
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
      if (meta && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setStage('editor')
        setFindOpen(true)
        window.setTimeout(() => findRef.current?.focus(), 20)
      }
      if (meta && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (openFile) void closeTab(openFile)
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        formatCurrent()
      }
      if (e.key === 'Escape' && findOpen) {
        e.preventDefault()
        setFindOpen(false)
        clearFind()
        editorRef.current?.focus()
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
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [clearFind, closeTab, compile, findOpen, formatCurrent, newFile, openFile, openFolder, run, saveCurrent, stop, tr])

  const jdkLabel = useMemo(() => {
    if (!toolchain) return 'JDK …'
    if (toolchain.javaVersion) return toolchain.javaVersion.replace(/^"/, '').replace(/"$/, '')
    return tr('jdkMissing')
  }, [toolchain, tr])

  const editorKind: PaneKind = stage === 'editor' ? 'main' : 'thumb'
  const runKind: PaneKind = stage === 'run' ? 'main' : running ? 'thumb' : 'dormant'
  const editorLift = editorKind === 'thumb' ? inputLift : 0

  const endThumbDrag = useCallback((): void => {
    window.clearTimeout(thumbTimerRef.current)
    thumbPressRef.current = null
    thumbDragRef.current = null
    setThumbDragging(null)
  }, [])

  const onThumbPointerDown = (key: 'editor' | 'run', e: ReactPointerEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return
    if (key === 'editor' && editorKind !== 'thumb') return
    if (key === 'run' && runKind !== 'thumb') return
    skipThumbClickRef.current = false
    window.clearTimeout(thumbTimerRef.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    thumbPressRef.current = {
      key,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY
    }
    thumbTimerRef.current = window.setTimeout(() => {
      const press = thumbPressRef.current
      if (!press || press.key !== key) return
      skipThumbClickRef.current = true
      thumbDragRef.current = {
        key,
        startX: press.startX,
        startY: press.startY,
        startNorm: { ...thumbNormRef.current[key] }
      }
      setThumbDragging(key)
    }, THUMB_LONG_MS)
  }

  const onThumbPointerMove = (key: 'editor' | 'run', e: ReactPointerEvent<HTMLDivElement>): void => {
    const press = thumbPressRef.current
    if (press && press.key === key && !thumbDragRef.current) {
      const dist = Math.hypot(e.clientX - press.startX, e.clientY - press.startY)
      if (dist > THUMB_MOVE_CANCEL) {
        window.clearTimeout(thumbTimerRef.current)
        thumbPressRef.current = null
      }
    }
    const drag = thumbDragRef.current
    if (!drag || drag.key !== key) return
    e.preventDefault()
    const lift = key === 'editor' ? editorLift : 0
    const { minTx, maxTx, minTy, maxTy } = thumbMetrics(stageSize.w, stageSize.h, lift, false)
    const rangeX = Math.max(1, maxTx - minTx)
    const rangeY = Math.max(1, maxTy - minTy)
    const next = {
      x: clamp(drag.startNorm.x + (e.clientX - drag.startX) / rangeX, 0, 1),
      y: clamp(drag.startNorm.y + (e.clientY - drag.startY) / rangeY, 0, 1)
    }
    setThumbNorm((prev) => ({ ...prev, [key]: next }))
  }

  const onThumbPointerUp = (key: 'editor' | 'run'): void => {
    const dragged = thumbDragRef.current?.key === key || thumbDragging === key
    if (dragged) skipThumbClickRef.current = true
    endThumbDrag()
  }

  const onThumbClick = (key: 'editor' | 'run'): void => {
    if (skipThumbClickRef.current) {
      skipThumbClickRef.current = false
      return
    }
    if (key === 'editor' && editorKind === 'thumb') setStage('editor')
    if (key === 'run' && runKind === 'thumb') setStage('run')
  }

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale === 'ko' ? 'ko' : 'en'
  }, [locale])

  useEffect(() => {
    setInlineCompletionEnabled(!examMode && !!settings?.completionEnabled)
  }, [examMode, settings?.completionEnabled])

  useEffect(() => {
    examRef.current = exam
  }, [exam])

  useEffect(() => {
    if (!exam.active) return
    const pulse = (): void => {
      void applyExam({ type: 'tick', now: Date.now() })
    }
    const id = window.setInterval(pulse, 500)
    const onVis = (): void => {
      if (document.visibilityState === 'visible') pulse()
    }
    window.addEventListener('focus', pulse)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', pulse)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [applyExam, exam.active])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const clear = (): void => {
      traceDecosRef.current = editor.deltaDecorations(traceDecosRef.current, [])
    }
    if (examMode) {
      clear()
      return
    }
    const steps = traceSteps(traceEvents)
    const current = steps[traceStep]
    if (!current) {
      clear()
      return
    }
    const model = editor.getModel()
    const last = model?.getLineCount() ?? current.line
    const line = Math.min(Math.max(1, current.line), last)
    traceDecosRef.current = editor.deltaDecorations(traceDecosRef.current, [
      {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'jcat-trace-line'
        }
      }
    ])
    editor.revealLineInCenterIfOutsideViewport(line)
  }, [examMode, openFile, traceEvents, traceStep])

  useEffect(() => {
    setApLocale(locale, tr('examOutHint'))
    setApHintsEnabled(settings?.apHintsEnabled !== false)
    const editor = editorRef.current
    const api = monacoRef.current
    if (!editor || !api) return
    paintApHints(editor, api, currentCode)
  }, [currentCode, openFile, locale, settings?.apHintsEnabled, tr])

  useEffect(() => {
    if (!moreOpen && !langOpen) return
    const onDoc = (e: MouseEvent): void => {
      const el = e.target as HTMLElement
      if (!el.closest('.more-menu')) setMoreOpen(false)
      if (!el.closest('.lang-menu')) setLangOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [moreOpen, langOpen])

  const toggleExam = (): void => {
    setExamSwitching(true)
    window.setTimeout(() => {
      void (async () => {
        if (!examRef.current.active) {
          void window.jcat.ai.completeAbort()
          void window.jcat.ai.debugAbort()
          void window.jcat.java.stop()
          setDebugging(false)
          setDebugText('')
          setDebugReasoning('')
          setSideOpen(false)
          setSettingsOpen(false)
          setMoreOpen(false)
          setLangOpen(false)
          setFrqOpen(false)
          setExamRefOpen(false)
          setExamReport(null)
          let baseline: Record<string, string[]> = {}
          try {
            baseline = await window.jcat.exam.scanAp()
          } catch {
            baseline = {}
          }
          await applyExam({
            type: 'start',
            now: Date.now(),
            projectRoot: root || '',
            baseline
          })
          setStatusMsg(tr('examReady'))
        } else {
          let current: Record<string, string[]> = {}
          try {
            current = await window.jcat.exam.scanAp()
          } catch {
            current = {}
          }
          setExamRefOpen(false)
          setExamReport(addedTokens(examRef.current.baseline, current))
          await applyExam({ type: 'finish' })
          setStatusMsg(tr('examLeft'))
        }
      })()
    }, 240)
    window.setTimeout(() => setExamSwitching(false), 780)
  }

  const switchExamSeg = (next: ExamSeg): void => {
    if (next === examSeg) return
    setExamSwitching(true)
    window.setTimeout(() => {
      void applyExam({ type: 'switch', now: Date.now(), seg: next })
      if (next === 'mcq') setExamRefOpen(false)
    }, 220)
    window.setTimeout(() => setExamSwitching(false), 780)
  }

  const toggleExamPause = (): void => {
    const pausing = !examRef.current.paused
    void applyExam({ type: pausing ? 'pause' : 'resume', now: Date.now() })
    setStatusMsg(pausing ? tr('examPaused') : tr('examClock'))
  }

  const restartExam = (): void => {
    setExamRefOpen(false)
    setExamReport(null)
    setExamSwitching(true)
    void (async () => {
      let baseline: Record<string, string[]> = {}
      try {
        baseline = await window.jcat.exam.scanAp()
      } catch {
        baseline = {}
      }
      await applyExam({
        type: 'restart',
        now: Date.now(),
        projectRoot: root || '',
        baseline
      })
      setStatusMsg(tr('examReady'))
    })()
    window.setTimeout(() => setExamSwitching(false), 780)
  }

  const changeLocale = (next: Locale): void => {
    setLangOpen(false)
    void (async () => {
      const savedSettings = await window.jcat.settings.save({ locale: next })
      setSettings(savedSettings)
      setInlineCompletionLocale(savedSettings.locale)
    })()
  }

  const retargetOpen = (from: string, to: string): void => {
    setBuffers((prev) => remapPaths(prev, from, to))
    setSaved((prev) => remapPaths(prev, from, to))
    setOpenFile((current) => {
      if (!current) return current
      if (current === from) return to
      if (current.startsWith(`${from}/`) || current.startsWith(`${from}\\`)) {
        return to + current.slice(from.length)
      }
      return current
    })
    setOpenTabs((prev) => remapTabPaths(prev, from, to))
  }

  const renameNode = async (path: string, name: string): Promise<void> => {
    try {
      const dest = await window.jcat.workspace.rename(path, name)
      retargetOpen(path, dest)
      if (clipboard?.path === path) setClipboard({ ...clipboard, path: dest })
      await refreshTree()
      setStatusMsg(tr('renamed'))
    } catch {
      setStatusMsg(tr('badName'))
    }
  }

  const copyNode = (path: string): void => {
    setClipboard({ path, cut: false })
    setStatusMsg(tr('copied'))
  }

  const cutNode = (path: string): void => {
    setClipboard({ path, cut: true })
    setStatusMsg(tr('cutDone'))
  }

  const pasteNode = async (target: string): Promise<void> => {
    if (!clipboard) return
    try {
      const dest = await window.jcat.workspace.transfer(clipboard.path, target, clipboard.cut)
      if (clipboard.cut) {
        retargetOpen(clipboard.path, dest)
        setClipboard(null)
      }
      await refreshTree()
      setStatusMsg(tr('pasted'))
    } catch {
      setStatusMsg(tr('badName'))
    }
  }

  const confirmDeleteNode = async (): Promise<void> => {
    if (!pendingDelete) return
    const target = pendingDelete
    setPendingDelete(null)
    try {
      await window.jcat.workspace.delete(target)
      setBuffers((prev) => dropPaths(prev, target))
      setSaved((prev) => dropPaths(prev, target))
      setOpenTabs((prev) => {
        const next = dropTabPaths(prev, target)
        setOpenFile((current) => {
          if (
            current &&
            (current === target ||
              current.startsWith(`${target}/`) ||
              current.startsWith(`${target}\\`))
          ) {
            return next[0] || null
          }
          return current
        })
        return next
      })
      if (clipboard?.path === target) setClipboard(null)
      await refreshTree()
      setStatusMsg(tr('deleted'))
    } catch {
      setStatusMsg(tr('badName'))
    }
  }

  const localeLabel =
    locale === 'en' ? tr('localeEn') : locale === 'ko' ? tr('localeKo') : tr('localeZh')

  const editorFont =
    window.jcat.platform === 'win32'
      ? 'Cascadia Code, Cascadia Mono, Consolas, Courier New, monospace'
      : 'SF Mono, ui-monospace, Menlo, Consolas, monospace'

  const startTreeResize = (startX: number): void => {
    const origin = treeOpenRef.current ? treeWidthRef.current : 0
    setTreeResizing(true)
    const onMove = (e: PointerEvent): void => {
      const next = origin + (e.clientX - startX)
      if (next < TREE_COLLAPSE_AT) {
        treeOpenRef.current = false
        setTreeOpen(false)
        return
      }
      const width = clamp(next, TREE_MIN, TREE_MAX)
      treeOpenRef.current = true
      treeWidthRef.current = width
      setTreeOpen(true)
      setTreeWidth(width)
    }
    const onUp = (): void => {
      setTreeResizing(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className={`app ${sideOpen ? '' : 'side-collapsed'} ${treeOpen ? '' : 'tree-collapsed'} ${treeResizing ? 'is-resizing' : ''} ${thumbDragging ? 'thumb-dragging' : ''} ${winMaximized ? 'is-max' : ''} ${examMode ? 'exam-mode' : ''} ${examMode && examSeg === 'mcq' ? 'exam-mcq' : ''} ${examSwitching ? 'exam-switching' : ''}`}
      style={
        examMode
          ? undefined
          : treeOpen
            ? ({ ['--tree-w']: `${treeWidth}px`, ['--brand-w']: `${treeWidth}px` } as CSSProperties)
            : undefined
      }
    >
      <header
        className="titlebar"
        onDoubleClick={(e) => {
          if (window.jcat.platform === 'darwin') return
          const target = e.target as HTMLElement
          if (target.closest('button, a, input, select, .anim-select, .more-menu, .lang-menu, .window-controls'))
            return
          void window.jcat.window.maximize()
        }}
      >
        <div className="brand">
          <CatIcon size={26} />
          <h1>Jcat</h1>
        </div>
        <div className="actions">
          {examMode && examSeg === 'mcq' ? null : (
            <>
              <button className="primary" onClick={() => void run()} disabled={!root || running}>
                {tr('run')}
              </button>
              {running ? (
                <button onClick={() => void stop()}>{tr('stop')}</button>
              ) : null}
              <button onClick={() => void compile()} disabled={!root}>
                {tr('compile')}
              </button>
              <AnimSelect
                value={mainClass}
                disabled={!runOptions.length}
                title={tr('runPick')}
                placeholder={tr('noMain')}
                className="run-select"
                options={runOptions.map((item) => ({ id: item, label: item }))}
                onChange={setMainClass}
              />
            </>
          )}
        </div>
        <div className="title-end">
          {examMode ? (
            <>
              <div className="exam-seg">
                <button
                  type="button"
                  className={examSeg === 'mcq' ? 'is-on' : ''}
                  onClick={() => switchExamSeg('mcq')}
                >
                  {tr('examMcq')}
                  {examSeg === 'mcq' ? (
                    <>
                      {' '}
                      <span className="exam-clock">{formatClock(examMcqLeft)}</span>
                    </>
                  ) : null}
                </button>
                <button
                  type="button"
                  className={examSeg === 'frq' ? 'is-on' : ''}
                  onClick={() => switchExamSeg('frq')}
                >
                  {tr('examFrq')}
                  {examSeg === 'frq' ? (
                    <>
                      {' '}
                      <span className="exam-clock">{formatClock(examFrqLeft)}</span>
                    </>
                  ) : null}
                </button>
              </div>
              <ExamTimeCtrl
                paused={examPaused}
                onPause={toggleExamPause}
                onRestart={restartExam}
                pauseLabel={tr('examPause')}
                resumeLabel={tr('examResume')}
                restartLabel={tr('examRestart')}
              />
              {examSeg === 'frq' ? (
                <button type="button" onClick={() => setExamRefOpen((v) => !v)}>
                  {tr('examRef')}
                </button>
              ) : null}
              <button type="button" className="primary" onClick={toggleExam}>
                {tr('exitExam')}
              </button>
            </>
          ) : null}
          <div className={`lang-menu ${langOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              title={tr('lang')}
              onClick={() => {
                setMoreOpen(false)
                setLangOpen((v) => !v)
              }}
            >
              {localeLabel}
            </button>
            <div className="lang-menu-list">
              <div className="lang-menu-inner">
                <button
                  type="button"
                  className={locale === 'zh' ? 'is-on' : ''}
                  onClick={() => changeLocale('zh')}
                >
                  {tr('localeZh')}
                </button>
                <button
                  type="button"
                  className={locale === 'en' ? 'is-on' : ''}
                  onClick={() => changeLocale('en')}
                >
                  {tr('localeEn')}
                </button>
                <button
                  type="button"
                  className={locale === 'ko' ? 'is-on' : ''}
                  onClick={() => changeLocale('ko')}
                >
                  {tr('localeKo')}
                </button>
              </div>
            </div>
          </div>
          <div className={`more-menu ${moreOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              title={tr('more')}
              onClick={() => {
                setLangOpen(false)
                setMoreOpen((v) => !v)
              }}
            >
              {tr('more')}
            </button>
            <div className="more-menu-list">
              <div className="more-menu-inner">
                {examMode ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      startEmpty()
                    }}
                  >
                    {tr('newEmpty')}
                  </button>
                )}
                {examMode ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      setFrqOpen(true)
                    }}
                  >
                    {tr('newFrq')}
                  </button>
                )}
                {examMode ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      void openFolder()
                    }}
                  >
                    {tr('open')}
                  </button>
                )}
                {examMode && examSeg === 'mcq' ? null : (
                <button
                  type="button"
                  disabled={!openFile}
                  onClick={() => {
                    setMoreOpen(false)
                    void saveCurrent()
                  }}
                >
                  {tr('save')}
                </button>
                )}
                {examMode ? null : (
                  <button
                    type="button"
                    disabled={!openFile || exporting}
                    onClick={() => {
                      setMoreOpen(false)
                      void exportImage()
                    }}
                  >
                    {tr('longImage')}
                  </button>
                )}
                {examMode ? null : (
                  <button
                    type="button"
                    className={settings?.homeworkHideLines ? 'is-on' : ''}
                    onClick={() => {
                      setMoreOpen(false)
                      if (!settings) return
                      void (async () => {
                        const saved = await window.jcat.settings.save({
                          homeworkHideLines: !settings.homeworkHideLines
                        })
                        setSettings(saved)
                      })()
                    }}
                  >
                    {settings?.homeworkHideLines ? tr('homeworkShowLines') : tr('homeworkHideLines')}
                  </button>
                )}
                {examMode ? null : (
                  <button
                    type="button"
                    className={settings?.completionEnabled ? 'is-on' : ''}
                    onClick={() => {
                      setMoreOpen(false)
                      void setGhost(!settings?.completionEnabled)
                    }}
                  >
                    {settings?.completionEnabled ? tr('disableGhost') : tr('enableGhost')}
                  </button>
                )}
                <button
                  type="button"
                  className={settings?.apHintsEnabled !== false ? 'is-on' : ''}
                  onClick={() => {
                    setMoreOpen(false)
                    if (!settings) return
                    void (async () => {
                      const nextOn = settings.apHintsEnabled === false
                      const saved = await window.jcat.settings.save({ apHintsEnabled: nextOn })
                      setSettings(saved)
                      setApHintsEnabled(nextOn)
                      const editor = editorRef.current
                      const api = monacoRef.current
                      if (editor && api) paintApHints(editor, api, editor.getValue())
                    })()
                  }}
                >
                  {settings?.apHintsEnabled !== false ? tr('apHintHide') : tr('apHintShow')}
                </button>
                {examMode ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      toggleExam()
                    }}
                  >
                    {tr('examMode')}
                  </button>
                )}
              </div>
            </div>
          </div>
          {examMode ? null : (
            <button type="button" onClick={() => setSettingsOpen(true)}>
              {tr('settings')}
            </button>
          )}
          {window.jcat.platform !== 'darwin' ? (
            <WindowControls maximized={winMaximized} t={tr} />
          ) : null}
        </div>
      </header>

      <FileTree
        nodes={tree}
        active={openFile}
        projectRoot={root}
        hasClipboard={!!clipboard}
        onOpen={(path) => void openPath(path)}
        onNewFile={() => void newFile()}
        onNewFolder={() => void newFolder()}
        onRename={(path, name) => void renameNode(path, name)}
        onDelete={setPendingDelete}
        onCopy={copyNode}
        onCut={cutNode}
        onPaste={(target) => void pasteNode(target)}
        onCollapse={() => {
          treeOpenRef.current = false
          setTreeOpen(false)
        }}
        onResizeStart={startTreeResize}
        t={tr}
      />

      {examMode || treeOpen ? null : (
        <div className="tree-chip">
          <span className="tree-chip-name">{fileName || tr('project')}</span>
          <button
            type="button"
            className="tree-mini"
            onClick={() => {
              treeOpenRef.current = true
              setTreeOpen(true)
            }}
          >
            {tr('expandTree')}
          </button>
        </div>
      )}

      <section className={`stage ${examMode && examSeg === 'mcq' ? 'is-mcq' : ''}`} ref={stageRef}>
        <div className="exam-veil" aria-hidden />
        <div className="exam-mcq-stage">
          <p className="exam-mcq-label">{tr('examMcqNow')}</p>
          <div className={`exam-mcq-clock ${examPaused ? 'is-paused' : ''}`}>
            {formatClock(examMcqLeft)}
          </div>
          {examPaused ? <p className="exam-mcq-paused">{tr('examPaused')}</p> : null}
          <ExamTimeCtrl
            paused={examPaused}
            stage
            onPause={toggleExamPause}
            onRestart={restartExam}
            pauseLabel={tr('examPause')}
            resumeLabel={tr('examResume')}
            restartLabel={tr('examRestart')}
          />
        </div>
        <div
          className={`pane ${editorKind === 'main' ? 'is-main' : 'is-thumb'} ${thumbDragging === 'editor' ? 'is-dragging' : ''}`}
          style={paneStyle(
            editorKind,
            thumbHover === 'editor',
            stageSize.w,
            stageSize.h,
            editorLift,
            thumbNorm.editor,
            thumbDragging === 'editor'
          )}
          onMouseEnter={() => {
            if (editorKind === 'thumb') setThumbHover('editor')
          }}
          onMouseLeave={() => setThumbHover((v) => (v === 'editor' ? null : v))}
          onPointerDown={(e) => onThumbPointerDown('editor', e)}
          onPointerMove={(e) => onThumbPointerMove('editor', e)}
          onPointerUp={() => onThumbPointerUp('editor')}
          onPointerCancel={() => onThumbPointerUp('editor')}
          onClick={() => onThumbClick('editor')}
        >
          {openFile ? (
            <>
              <EditorBar
                tabs={openTabs.map((path) => ({
                  path,
                  name: path.split(/[/\\]/).pop() || path,
                  dirty: (buffers[path] ?? '') !== (saved[path] ?? '')
                }))}
                active={openFile}
                onSelect={(path) => void openPath(path)}
                onClose={(path) => void closeTab(path)}
                outline={outlineOptions}
                outlineValue={outlineValue}
                onOutline={(id) => {
                  const item = outlineItems.find((entry) => entry.id === id)
                  if (!item) return
                  setStage('editor')
                  const editor = editorRef.current
                  editor?.revealLineInCenter(item.line)
                  editor?.setPosition({ lineNumber: item.line, column: 1 })
                  editor?.focus()
                }}
                canFormat={openFile.toLowerCase().endsWith('.java')}
                findOpen={findOpen}
                findQuery={findQuery}
                findIndex={findIndex}
                findTotal={findTotal}
                findRef={findRef}
                onFindQuery={(value) => {
                  setFindQuery(value)
                  paintFind(value, 0)
                }}
                onFindNext={() => paintFind(findQuery, findIndex + 1)}
                onFindPrev={() => paintFind(findQuery, findIndex - 1)}
                onFindOpen={() => {
                  setFindOpen(true)
                  window.setTimeout(() => findRef.current?.focus(), 20)
                }}
                onFindClose={() => {
                  setFindOpen(false)
                  clearFind()
                  editorRef.current?.focus()
                }}
                onFormat={formatCurrent}
                t={tr}
              />
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
                    registerApLanguage(monacoApi)
                    setApLocale(locale, tr('examOutHint'))
                    setApHintsEnabled(settings?.apHintsEnabled !== false)
                    paintApHints(editor, monacoApi, editor.getValue())
                    editor.updateOptions({ fontSize: Math.round(14 * zoomRef.current * 10) / 10 })
                    editor.onDidChangeCursorPosition((ev) => {
                      setCursor({ line: ev.position.lineNumber, column: ev.position.column })
                    })
                    editor.onDidChangeCursorSelection(() => {
                      setDebugSel(readEditorSelection(editor))
                    })
                    setDebugSel(readEditorSelection(editor))
                    applyMarkers(monacoApi, diagnostics, openFile, classClash ? [classClash] : [])
                    if (pendingJump && pendingJump.path === openFile) {
                      editor.revealLineInCenter(pendingJump.line)
                      editor.setPosition({
                        lineNumber: pendingJump.line,
                        column: pendingJump.column
                      })
                      editor.focus()
                      setPendingJump(null)
                    }
                  }}
                  options={{
                    fontFamily: editorFont,
                    fontSize: Math.round(14 * zoom * 10) / 10,
                    minimap: { enabled: false },
                    padding: { top: 12, bottom: 12 },
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    inlineSuggest: { enabled: true, suppressSuggestions: true },
                    tabCompletion: 'off',
                    acceptSuggestionOnEnter: 'off',
                    quickSuggestions: { other: true, comments: false, strings: false },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    renderLineHighlight: 'line',
                    wordWrap: 'off',
                    mouseWheelZoom: false,
                    fixedOverflowWidgets: true,
                    scrollbar: { horizontal: 'auto', vertical: 'auto', useShadows: false }
                  }}
                />
              </div>
            </>
          ) : (
            <div className="editor-empty">
              <CatIcon size={48} />
              <p>{root ? tr('pickSource') : tr('waitingProject')}</p>
              <span>{dailyMotto(locale)}</span>
              {examMode ? null : (
                <div className="empty-actions">
                  {!root && settings?.lastRoot ? (
                    <button onClick={() => void continueLast()}>{tr('continueLast')}</button>
                  ) : null}
                  <button className="primary" onClick={() => void startPractice('hello')}>
                    {tr('newHello')}
                  </button>
                  <button className="primary" onClick={() => void startPractice('scanner')}>
                    {tr('newScanner')}
                  </button>
                  <button className="primary" onClick={() => setFrqOpen(true)}>
                    {tr('newFrq')}
                  </button>
                  <button onClick={() => startEmpty()}>{tr('newEmpty')}</button>
                  <button onClick={() => void openFolder()}>{tr('openProject')}</button>
                  {root ? (
                    <>
                      <button onClick={() => void newFile()}>{tr('newFile')}</button>
                      <button onClick={() => void newFolder()}>{tr('newFolder')}</button>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`pane run-pane ${
            runKind === 'main' ? 'is-main' : runKind === 'thumb' ? 'is-thumb' : 'is-dormant'
          } ${thumbDragging === 'run' ? 'is-dragging' : ''}`}
          style={paneStyle(
            runKind,
            thumbHover === 'run',
            stageSize.w,
            stageSize.h,
            0,
            thumbNorm.run,
            thumbDragging === 'run'
          )}
          onMouseEnter={() => {
            if (runKind === 'thumb') setThumbHover('run')
          }}
          onMouseLeave={() => setThumbHover((v) => (v === 'run' ? null : v))}
          onPointerDown={(e) => onThumbPointerDown('run', e)}
          onPointerMove={(e) => onThumbPointerMove('run', e)}
          onPointerUp={() => onThumbPointerUp('run')}
          onPointerCancel={() => onThumbPointerUp('run')}
          onClick={() => onThumbClick('run')}
        >
          <div className="run-head">
            <span>{tr('runPane')}</span>
            <button
              onClick={() => {
                setOutput('')
                setTraceEvents([])
                traceStepCountRef.current = 0
                setTraceStep(0)
              }}
            >
              {tr('clear')}
            </button>
          </div>
          {examMode ? null : (
            <TraceView events={traceEvents} step={traceStep} onStep={setTraceStep} t={tr} />
          )}
          <div className="run-log">
            {splitOutput(output).map((part, i) =>
              part.loc ? (
                <button
                  type="button"
                  className="loc"
                  key={`loc-${i}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    void jumpTo(part.loc!.file, part.loc!.line, part.loc!.column)
                  }}
                >
                  {part.text}
                </button>
              ) : (
                <span key={`txt-${i}`}>{part.text}</span>
              )
            )}
          </div>
          <form
            ref={runInputRef}
            className="run-input"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void sendStdin()
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              ref={stdinRef}
              rows={1}
              value={stdinLine}
              disabled={!running}
              placeholder={running ? tr('waitingInput') : tr('runInput')}
              onChange={(e) => setStdinLine(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendStdin()
                }
              }}
            />
            <button type="submit" disabled={!running}>
              Enter
            </button>
            <button
              type="button"
              disabled={!lastStdin.trim()}
              onClick={() => replayInput()}
            >
              {tr('replayInput')}
            </button>
          </form>
        </div>
        {examMode ? <ExamReference locale={locale} open={examRefOpen && examSeg === 'frq'} t={tr} /> : null}
      </section>

      <SidePanel
        t={tr}
        themeId={themeId}
        debugText={debugText}
        debugReasoning={debugReasoning}
        debugNote={debugNote}
        debugging={debugging}
        selectionHint={
          debugSel
            ? tr('debugHintSelect').replace(
                '{n}',
                String(debugSel.endLine - debugSel.startLine + 1)
              )
            : null
        }
        onNote={setDebugNote}
        onAnalyze={() => void runDebug()}
        onStop={stopDebug}
      />
      {examMode ? null : (
        <button
          type="button"
          className="side-tab"
          title={sideOpen ? tr('collapseSide') : tr('expandSide')}
          aria-label={sideOpen ? tr('collapseSide') : tr('expandSide')}
          onClick={() => setSideOpen((v) => !v)}
        >
          <span>{sideOpen ? '›' : '‹'}</span>
        </button>
      )}

      <footer className="statusbar">
        <span className={toolchain?.javac ? 'status-ok' : 'status-err'}>{jdkLabel}</span>
        <span>
          {cursor.line}:{cursor.column}
        </span>
        <span>{Math.round(zoom * 100)}%</span>
        {examMode ? (
          <span className={`exam-clock ${examPaused ? 'is-paused' : ''}`}>
            {examSeg === 'mcq' ? tr('examMcq') : tr('examFrq')}{' '}
            {formatClock(examSeg === 'mcq' ? examMcqLeft : examFrqLeft)}
            {examPaused ? ` · ${tr('examPaused')}` : ''}
          </span>
        ) : null}
        <span className="spacer" />
        <span>{statusMsg}</span>
        <span>{examMode ? tr('examMode') : root ? root : tr('noProject')}</span>
      </footer>

      {examAsk ? (
        <ModalShell open onClose={() => undefined} className="name-modal">
          <h3>{tr('examMode')}</h3>
          <p className="ap-blurb">{tr('examResumeAsk')}</p>
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => {
                setExamAsk(false)
                void applyExam({ type: 'tick', now: Date.now() })
              }}
            >
              {tr('examResumeContinue')}
            </button>
            <button type="button" onClick={() => { setExamAsk(false); restartExam() }}>
              {tr('examResumeRestart')}
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setExamAsk(false)
                void applyExam({ type: 'abandon' })
              }}
            >
              {tr('examResumeAbandon')}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {settings ? (
        <SettingsModal
          open={settingsOpen}
          settings={settings}
          t={tr}
          onClose={() => setSettingsOpen(false)}
          onTheme={(id) => {
            applyTheme(id)
            setSettings((prev) => (prev ? { ...prev, theme: id } : prev))
            void window.jcat.settings.save({ theme: id })
          }}
          onSave={async (next) => {
            await window.jcat.settings.save(next)
            const savedSettings = await window.jcat.settings.get()
            setSettings(savedSettings)
            applyTheme(savedSettings.theme)
            setInlineCompletionEnabled(savedSettings.completionEnabled && !examMode)
            setInlineCompletionDelay(savedSettings.completionDelayMs)
            setInlineCompletionLocale(savedSettings.locale)
            setApHintsEnabled(savedSettings.apHintsEnabled !== false)
            setToolchain(await window.jcat.toolchain.detect())
            setSettingsOpen(false)
          }}
        />
      ) : null}

      <ModalShell open={!!nameAsk} onClose={() => setNameAsk(null)} className="name-modal">
        <h3>
          {nameAsk?.kind === 'project'
            ? tr('newEmpty')
            : nameAsk?.kind === 'folder'
              ? tr('newFolder')
              : tr('newFile')}
        </h3>
        <div className="field">
          <label htmlFor="jcat-new-name">{tr('name')}</label>
          <input
            id="jcat-new-name"
            autoFocus
            value={nameAsk?.value ?? ''}
            onChange={(e) => {
              if (!nameAsk) return
              setNameAsk({ ...nameAsk, value: e.target.value })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void confirmName()
              if (e.key === 'Escape') setNameAsk(null)
            }}
          />
        </div>
        <div className="modal-actions">
          <button onClick={() => setNameAsk(null)}>{tr('cancel')}</button>
          <button className="primary" onClick={() => void confirmName()}>
            {tr('create')}
          </button>
        </div>
      </ModalShell>
      <ModalShell
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        className="name-modal"
      >
        <h3>{tr('deleteFile')}</h3>
        <p className="ap-blurb">{tr('confirmDelete')}</p>
        <div className="modal-actions">
          <button onClick={() => setPendingDelete(null)}>{tr('cancel')}</button>
          <button className="primary" onClick={() => void confirmDeleteNode()}>
            {tr('deleteFile')}
          </button>
        </div>
      </ModalShell>
      <ModalShell
        open={frqOpen}
        onClose={() => setFrqOpen(false)}
        className="name-modal frq-modal"
      >
        <h3>{tr('frqPick')}</h3>
        <div className="frq-picks">
          {(
            [
              ['methods', 'frqMethods'],
              ['class', 'frqClass'],
              ['arraylist', 'frqList'],
              ['grid', 'frqGrid']
            ] as const
          ).map(([kind, key]) => (
            <button key={kind} type="button" onClick={() => void startFrq(kind)}>
              {tr(key)}
            </button>
          ))}
        </div>
      </ModalShell>
      <ModalShell
        open={examReport !== null}
        onClose={() => setExamReport(null)}
        className="name-modal"
      >
        <h3>{tr('examReport')}</h3>
        {examReport && examReport.length > 0 ? (
          <>
            <p className="ap-blurb">{tr('examOutAdded')}</p>
            <ul className="exam-out-list">
              {examReport.map((token) => (
                <li key={token}>
                  <code>{token}</code>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="ap-blurb">{tr('examOutNone')}</p>
        )}
        <div className="modal-actions">
          <button className="primary" onClick={() => setExamReport(null)}>
            {tr('examOutClose')}
          </button>
        </div>
      </ModalShell>
      <div id="jcat-export-host" />
    </div>
  )
}
