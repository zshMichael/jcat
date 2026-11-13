import {
  useEffect,
  useRef,
  useState,
  type JSX,
  type PointerEvent as ReactPointerEvent
} from 'react'
import type * as Monaco from 'monaco-editor'
import { moveExportOrder } from '@shared/exportLayout'
import { THEME_CARDS, type ThemeId } from '@shared/themes'
import { renderExportPng, type ExportDirection } from '../editor/exportImage'
import { publicClassInfo } from '../editor/javaOutline'
import { ModalShell } from './ModalShell'

export type ExportSource = {
  path: string
  name: string
  code: string
}

type Box = { w: number; h: number }

type PreviewView = {
  x: number
  y: number
  scale: number
  baseX: number
  baseY: number
  baseScale: number
}

function coverScale(frame: Box, image: Box): number {
  if (frame.w <= 0 || frame.h <= 0 || image.w <= 0 || image.h <= 0) return 1
  return Math.max(frame.w / image.w, frame.h / image.h)
}

function containScale(frame: Box, image: Box): number {
  if (frame.w <= 0 || frame.h <= 0 || image.w <= 0 || image.h <= 0) return 1
  return Math.min(frame.w / image.w, frame.h / image.h)
}

function clampNum(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function clampPan(
  x: number,
  y: number,
  scale: number,
  frame: Box,
  image: Box
): { x: number; y: number } {
  const width = image.w * scale
  const height = image.h * scale
  const xRange: [number, number] = width <= frame.w ? [0, frame.w - width] : [frame.w - width, 0]
  const yRange: [number, number] = height <= frame.h ? [0, frame.h - height] : [frame.h - height, 0]
  return { x: clampNum(x, xRange[0], xRange[1]), y: clampNum(y, yRange[0], yRange[1]) }
}

function scaleBounds(frame: Box, image: Box): { min: number; max: number; cover: number } {
  const cover = coverScale(frame, image)
  const contain = containScale(frame, image)
  return { min: contain * 0.4, max: Math.max(cover, contain) * 6, cover }
}

type Props = {
  open: boolean
  onClose: () => void
  monaco: typeof Monaco | null
  hideLines: boolean
  onHideLines: (value: boolean) => void
  active: ExportSource | null
  loadMerged: () => Promise<ExportSource[]>
  initialTheme: ThemeId
  themeNames: Record<ThemeId, string>
  compileOk: boolean | null
  runExcerpt: string
  labels: {
    title: string
    hideLines: string
    merge: string
    vertical: string
    horizontal: string
    run: string
    order: string
    theme: string
    save: string
    cancel: string
    rendering: string
    empty: string
    reset: string
  }
  compileLabel: string
  runLabel: string
  cardLabel: string
  onSave: (dataUrl: string, fileName: string) => Promise<string | null>
}

export function ExportSheet({
  open,
  onClose,
  monaco,
  hideLines,
  onHideLines,
  active,
  loadMerged,
  initialTheme,
  themeNames,
  compileOk,
  runExcerpt,
  labels,
  compileLabel,
  runLabel,
  cardLabel,
  onSave
}: Props): JSX.Element {
  const [seen, setSeen] = useState(open)
  const [merge, setMerge] = useState(false)
  const [direction, setDirection] = useState<ExportDirection>('vertical')
  const [includeRun, setIncludeRun] = useState(true)
  const [previewTheme, setPreviewTheme] = useState<ThemeId>(initialTheme)
  const [sources, setSources] = useState<ExportSource[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState<number | null>(null)
  const [shifted, setShifted] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const dragFrom = useRef<number | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const view = useRef<PreviewView>({ x: 0, y: 0, scale: 1, baseX: 0, baseY: 0, baseScale: 1 })
  const pan = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null)

  if (open !== seen) {
    setSeen(open)
    if (open) {
      setMerge(false)
      setDirection('vertical')
      setIncludeRun(true)
      setPreviewTheme(initialTheme)
      setPreview('')
      setShifted(false)
      setSources(active ? [active] : [])
      setOrder(active ? [active.path] : [])
    }
  }

  const activePath = active?.path ?? ''
  const activeName = active?.name ?? ''
  const activeCode = active?.code ?? ''

  useEffect(() => {
    if (!open || !merge) return
    let cancel = false
    const current = activePath ? { path: activePath, name: activeName, code: activeCode } : null
    void loadMerged().then((files) => {
      if (cancel) return
      const activeFirst = current
        ? [current.path, ...files.map((file) => file.path).filter((path) => path !== current.path)]
        : files.map((file) => file.path)
      const byPath = new Map(files.map((file) => [file.path, file]))
      if (current && !byPath.has(current.path)) byPath.set(current.path, current)
      setSources([...byPath.values()])
      setOrder(activeFirst.filter((path) => byPath.has(path)))
    })
    return () => {
      cancel = true
    }
  }, [activeCode, activeName, activePath, loadMerged, merge, open])

  const ordered = order
    .map((path) => sources.find((file) => file.path === path))
    .filter((file): file is ExportSource => !!file)
  const pieceKey = ordered.map((file) => `${file.path}:${file.code.length}`).join('|')
  const paint = THEME_CARDS.find((card) => card.id === previewTheme) ?? THEME_CARDS[0]

  useEffect(() => {
    if (!open || !monaco || ordered.length === 0) return
    let cancel = false
    const timer = window.setTimeout(() => {
      if (cancel) return
      const pieces = ordered.map((file) => ({
        fileName: file.name,
        className: publicClassInfo(file.code)?.name || file.name.replace(/\.java$/i, ''),
        code: file.code,
        compileOk: file.path === active?.path ? compileOk : null,
        runExcerpt: includeRun && file.path === active?.path ? runExcerpt : ''
      }))
      void (async () => {
        setBusy(true)
        try {
          const url = await renderExportPng(monaco, pieces, {
            hideLines,
            paper: paint.swatches[0],
            ink: paint.swatches[1],
            accent: paint.swatches[2],
            muted: paint.swatches[3],
            themeName: paint.name,
            themeId: paint.id,
            cardLabel,
            compileLabel,
            runLabel,
            direction
          })
          if (!cancel) setPreview(url)
        } catch {
          if (!cancel) setPreview('')
        } finally {
          if (!cancel) setBusy(false)
        }
      })()
    }, 160)
    return () => {
      cancel = true
      window.clearTimeout(timer)
    }
    // pieceKey captures the ordered sources. `ordered` is a fresh array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active?.path,
    cardLabel,
    compileLabel,
    compileOk,
    direction,
    hideLines,
    includeRun,
    monaco,
    open,
    pieceKey,
    previewTheme,
    runExcerpt,
    runLabel
  ])

  const boxes = (): { frame: Box; image: Box } | null => {
    const frame = frameRef.current
    const img = imgRef.current
    if (!frame || !img || !img.naturalWidth || !img.naturalHeight) return null
    return {
      frame: { w: frame.clientWidth, h: frame.clientHeight },
      image: { w: img.naturalWidth, h: img.naturalHeight }
    }
  }

  const paintView = (): void => {
    const img = imgRef.current
    if (!img) return
    const v = view.current
    img.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.scale})`
  }

  const syncShifted = (): void => {
    const v = view.current
    const next =
      Math.abs(v.x - v.baseX) > 0.6 ||
      Math.abs(v.y - v.baseY) > 0.6 ||
      Math.abs(v.scale / v.baseScale - 1) > 0.01
    setShifted(next)
  }

  const resetView = (): void => {
    const box = boxes()
    if (!box) return
    const scale = coverScale(box.frame, box.image)
    const pos = clampPan(0, 0, scale, box.frame, box.image)
    view.current = { x: pos.x, y: pos.y, scale, baseX: pos.x, baseY: pos.y, baseScale: scale }
    paintView()
    setShifted(false)
  }

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !preview) return
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      const box = boxes()
      if (!box) return
      const bounds = scaleBounds(box.frame, box.image)
      const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
      const v = view.current
      const next = clampNum(v.scale * Math.exp(-dy * 0.0016), bounds.min, bounds.max)
      if (next === v.scale) return
      const rect = frame.getBoundingClientRect()
      const px = event.clientX - rect.left
      const py = event.clientY - rect.top
      const ratio = next / v.scale
      const moved = clampPan(
        px - (px - v.x) * ratio,
        py - (py - v.y) * ratio,
        next,
        box.frame,
        box.image
      )
      view.current = { ...v, x: moved.x, y: moved.y, scale: next }
      paintView()
      syncShifted()
    }
    frame.addEventListener('wheel', onWheel, { passive: false })
    const observer = new ResizeObserver(() => {
      const v = view.current
      const home =
        Math.abs(v.x - v.baseX) < 0.6 &&
        Math.abs(v.y - v.baseY) < 0.6 &&
        Math.abs(v.scale / v.baseScale - 1) < 0.01
      if (home) resetView()
    })
    observer.observe(frame)
    return () => {
      frame.removeEventListener('wheel', onWheel)
      observer.disconnect()
    }
    // The listeners only read refs and the latest DOM boxes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview])

  const onPreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest('button')) return
    event.preventDefault()
    const v = view.current
    pan.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: v.x, oy: v.y }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.classList.add('is-panning')
  }

  const onPreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = pan.current
    if (!drag || drag.id !== event.pointerId) return
    const box = boxes()
    if (!box) return
    const moved = clampPan(
      drag.ox + event.clientX - drag.x,
      drag.oy + event.clientY - drag.y,
      view.current.scale,
      box.frame,
      box.image
    )
    view.current.x = moved.x
    view.current.y = moved.y
    paintView()
    syncShifted()
  }

  const onPreviewPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (pan.current?.id !== event.pointerId) return
    pan.current = null
    event.currentTarget.classList.remove('is-panning')
  }

  const rowAt = (clientY: number): number => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-row]')
    if (!rows || rows.length === 0) return 0
    for (let i = 0; i < rows.length; i += 1) {
      const rect = rows[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return i
    }
    return rows.length - 1
  }

  const onRowPointerDown = (index: number, event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (event.button !== 0 || order.length < 2) return
    dragFrom.current = index
    setDragging(index)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onRowPointerMove = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    const from = dragFrom.current
    if (from === null) return
    const to = rowAt(event.clientY)
    if (to === from) return
    setOrder((current) => moveExportOrder(current, from, to))
    dragFrom.current = to
    setDragging(to)
  }

  const onRowPointerUp = (): void => {
    dragFrom.current = null
    setDragging(null)
  }

  const save = (): void => {
    if (!preview) return
    const name = ordered[0]?.name.replace(/\.java$/i, '') || 'jcat'
    void onSave(preview, `${name}.png`).then((saved) => {
      if (saved) onClose()
    })
  }

  return (
    <ModalShell open={open} onClose={onClose} className="export-sheet">
      <div className="export-sheet-head">
        <h3>{labels.title}</h3>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            {labels.cancel}
          </button>
          <button type="button" className="primary" disabled={!preview || busy} onClick={save}>
            {labels.save}
          </button>
        </div>
      </div>
      <div className="export-sheet-body">
        <div className="export-preview">
          {preview ? (
            <div
              className="export-preview-frame"
              ref={frameRef}
              onPointerDown={onPreviewPointerDown}
              onPointerMove={onPreviewPointerMove}
              onPointerUp={onPreviewPointerUp}
              onPointerCancel={onPreviewPointerUp}
              onDragStart={(event) => event.preventDefault()}
            >
              <img
                ref={imgRef}
                src={preview}
                alt={labels.title}
                draggable={false}
                onLoad={resetView}
                onDragStart={(event) => event.preventDefault()}
              />
              <button
                type="button"
                className={shifted ? 'export-preview-reset is-on' : 'export-preview-reset'}
                onClick={resetView}
              >
                {labels.reset}
              </button>
            </div>
          ) : (
            <p>{busy ? labels.rendering : labels.empty}</p>
          )}
        </div>
        <div className="export-options">
          <label className="check-label">
            <input
              type="checkbox"
              checked={hideLines}
              onChange={(e) => onHideLines(e.target.checked)}
            />
            {labels.hideLines}
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={includeRun}
              onChange={(e) => setIncludeRun(e.target.checked)}
            />
            {labels.run}
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={merge}
              onChange={(e) => {
                const next = e.target.checked
                setMerge(next)
                if (!next && active) {
                  setSources([active])
                  setOrder([active.path])
                }
              }}
            />
            {labels.merge}
          </label>
          <p className="export-order-label">{labels.theme}</p>
          <div className="export-themes">
            {THEME_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                className={previewTheme === card.id ? 'is-on' : ''}
                onClick={() => setPreviewTheme(card.id)}
              >
                <i style={{ background: card.swatches[2] }} />
                <span>{themeNames[card.id]}</span>
              </button>
            ))}
          </div>
          <div className="export-dir">
            <button
              type="button"
              className={direction === 'vertical' ? 'is-on' : ''}
              disabled={ordered.length < 2}
              onClick={() => setDirection('vertical')}
            >
              {labels.vertical}
            </button>
            <button
              type="button"
              className={direction === 'horizontal' ? 'is-on' : ''}
              disabled={ordered.length < 2}
              onClick={() => setDirection('horizontal')}
            >
              {labels.horizontal}
            </button>
          </div>
          <p className="export-order-label">{labels.order}</p>
          <div className="export-order" ref={listRef}>
            {ordered.map((file, index) => (
              <button
                key={file.path}
                type="button"
                data-row=""
                className={dragging === index ? 'is-drag' : ''}
                onPointerDown={(event) => onRowPointerDown(index, event)}
                onPointerMove={onRowPointerMove}
                onPointerUp={onRowPointerUp}
              >
                {file.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
