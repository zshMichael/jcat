import { toPng } from 'html-to-image'
import type * as Monaco from 'monaco-editor'
import { cardWidthForCode, expandExportTabs, pngScaleToMaxWidth } from '@shared/exportLayout'
import type { ThemeId } from '@shared/types'
import { editorGutterColor, exportTokenStyle } from './theme'
import { catMarkSrc } from '../theme/catMark'

const CHUNK = 90
const RUN_CHUNK = 80
const CODE_FONT =
  '13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'

export type ExportPiece = {
  fileName: string
  className: string
  code: string
  compileOk: boolean | null
  runExcerpt: string
}

export type ExportDirection = 'vertical' | 'horizontal'

export type HomeworkMeta = {
  className: string
  fileName: string
  compileOk: boolean | null
  runExcerpt: string
  hideLines: boolean
  paper: string
  ink: string
  accent: string
  muted: string
  themeName: string
  cardLabel: string
  compileLabel: string
  runLabel: string
  themeId: ThemeId
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function stitch(
  dataUrls: string[],
  paper: string,
  direction: ExportDirection = 'vertical',
  gap = 0
): Promise<string> {
  if (dataUrls.length === 1) return dataUrls[0]
  const imgs = await Promise.all(dataUrls.map(loadImage))
  const width =
    direction === 'vertical'
      ? Math.max(...imgs.map((i) => i.width))
      : imgs.reduce((sum, i) => sum + i.width, 0) + gap * (imgs.length - 1)
  const height =
    direction === 'vertical'
      ? imgs.reduce((sum, i) => sum + i.height, 0) + gap * (imgs.length - 1)
      : Math.max(...imgs.map((i) => i.height))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrls[0]
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, width, height)
  let cursor = 0
  for (const img of imgs) {
    if (direction === 'vertical') {
      ctx.drawImage(img, 0, cursor)
      cursor += img.height + gap
    } else {
      ctx.drawImage(img, cursor, 0)
      cursor += img.width + gap
    }
  }
  return canvas.toDataURL('image/png')
}

function measureLongestLinePx(lines: string[]): number {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Math.max(1, ...lines.map((line) => expandExportTabs(line).length)) * 8
  }
  ctx.font = CODE_FONT
  let max = 0
  for (const line of lines) {
    const w = ctx.measureText(expandExportTabs(line)).width
    if (w > max) max = w
  }
  return max
}

async function fitPng(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl)
  const scale = pngScaleToMaxWidth(img.width)
  if (scale >= 0.999) return dataUrl
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

function colorizeJava(monaco: typeof Monaco, code: string, themeId: ThemeId): string {
  const lines = code.split('\n')
  const tokenLines = monaco.editor.tokenize(code, 'java')
  return lines
    .map((line, index) => {
      const tokens = tokenLines[index] ?? []
      if (!line) return '&nbsp;'
      if (tokens.length === 0) return escapeHtml(line)
      let html = ''
      for (let i = 0; i < tokens.length; i += 1) {
        const start = tokens[i].offset
        const end = i + 1 < tokens.length ? tokens[i + 1].offset : line.length
        const text = line.slice(start, end)
        if (!text) continue
        const style = exportTokenStyle(themeId, tokens[i].type)
        html += `<span style="color:${style.color}${style.italic ? ';font-style:italic' : ''}">${escapeHtml(text)}</span>`
      }
      return html || '&nbsp;'
    })
    .join('<br/>')
}

async function inkMark(color: string): Promise<string> {
  const img = await loadImage(catMarkSrc)
  const canvas = document.createElement('canvas')
  canvas.width = 44
  canvas.height = 44
  const ctx = canvas.getContext('2d')
  if (!ctx) return catMarkSrc
  ctx.drawImage(img, 0, 0, 44, 44)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 44, 44)
  return canvas.toDataURL('image/png')
}

function numbered(html: string, start: number, hideLines: boolean, gutter: string): string {
  const parts = html.split(/<br\s*\/?>/i)
  return parts
    .map((line, i) => {
      const n = start + i
      const num = hideLines ? '' : `<span class="n" style="color:${gutter}">${n}</span>`
      return `<div class="export-line">${num}<span class="c">${line || '&nbsp;'}</span></div>`
    })
    .join('')
}

export async function renderCodePng(
  monaco: typeof Monaco,
  code: string,
  meta: HomeworkMeta
): Promise<string> {
  const host = document.getElementById('jcat-export-host')
  if (!host) throw new Error('导出画布不存在')
  const lines = code.split('\n')
  const urls: string[] = []
  const cardWidth = cardWidthForCode(measureLongestLinePx(lines), meta.hideLines)
  const compile =
    meta.compileOk === null ? '' : meta.compileOk ? meta.compileLabel : meta.compileLabel
  const runParts = chunkLines(meta.runExcerpt, RUN_CHUNK)
  const runBlock = (text: string, titled: boolean): string =>
    `<div class="export-run" style="border-color:${meta.muted}">${
      titled ? `<span>${escapeHtml(meta.runLabel)}</span>` : ''
    }<pre>${escapeHtml(text)}</pre></div>`

  const capture = async (card: HTMLDivElement): Promise<void> => {
    host.innerHTML = ''
    host.appendChild(card)
    urls.push(
      await toPng(card, {
        width: cardWidth,
        pixelRatio: 2,
        backgroundColor: meta.paper,
        cacheBust: true
      })
    )
  }

  const mark = await inkMark(meta.ink)
  for (let i = 0; i < lines.length; i += CHUNK) {
    const slice = lines.slice(i, i + CHUNK).join('\n')
    const colorized = colorizeJava(monaco, slice, meta.themeId)
    const card = document.createElement('div')
    card.className = 'export-card'
    card.style.width = `${cardWidth}px`
    card.style.background = meta.paper
    card.style.color = meta.ink
    const head =
      i === 0
        ? `<div class="export-head" style="border-color:${meta.muted}">
            <img src="${mark}" width="22" height="22" alt="" style="width:22px;height:22px;min-width:22px;flex:none;display:block"/>
            <div class="export-head-copy">
              <strong>${escapeHtml(meta.cardLabel)}</strong>
              <span>${escapeHtml(meta.className || meta.fileName)} · ${escapeHtml(meta.themeName)}</span>
            </div>
            ${compile ? `<em class="export-chip" style="background:${meta.accent}22;color:${meta.ink}">${escapeHtml(compile)}</em>` : ''}
          </div>`
        : ''
    const foot = i + CHUNK >= lines.length && runParts[0] ? runBlock(runParts[0], true) : ''
    card.innerHTML = `${head}<div class="export-code" style="color:${meta.ink}">${numbered(colorized, i + 1, meta.hideLines, editorGutterColor(meta.themeId))}</div>${foot}`
    await capture(card)
  }

  for (let i = 1; i < runParts.length; i += 1) {
    const card = document.createElement('div')
    card.className = 'export-card'
    card.style.width = `${cardWidth}px`
    card.style.background = meta.paper
    card.style.color = meta.ink
    card.innerHTML = runBlock(runParts[i], false)
    await capture(card)
  }

  host.innerHTML = ''
  return fitPng(await stitch(urls, meta.paper))
}

export async function renderExportPng(
  monaco: typeof Monaco,
  pieces: ExportPiece[],
  meta: Omit<HomeworkMeta, 'className' | 'fileName' | 'compileOk' | 'runExcerpt'> & {
    direction: ExportDirection
    themeId: ThemeId
  }
): Promise<string> {
  const urls: string[] = []
  for (const piece of pieces) {
    if (!piece.code.trim()) continue
    urls.push(
      await renderCodePng(monaco, piece.code, {
        ...meta,
        className: piece.className,
        fileName: piece.fileName,
        compileOk: piece.compileOk,
        runExcerpt: piece.runExcerpt
      })
    )
  }
  if (urls.length === 0) throw new Error('没有可导出的代码')
  return fitPng(await stitch(urls, meta.paper, meta.direction, urls.length > 1 ? 28 : 0))
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return map[ch]
  })
}

function chunkLines(text: string, size: number): string[] {
  if (!text) return []
  const lines = text.split('\n')
  const parts: string[] = []
  for (let i = 0; i < lines.length; i += size) parts.push(lines.slice(i, i + size).join('\n'))
  return parts
}
