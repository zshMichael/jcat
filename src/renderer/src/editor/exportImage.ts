import { toPng } from 'html-to-image'
import type * as Monaco from 'monaco-editor'
import { cardWidthForCode, expandExportTabs, pngScaleToMaxWidth } from '@shared/exportLayout'
import { catMarkSrc } from '../theme/catMark'

const CHUNK = 90
const CODE_FONT =
  '13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'

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
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function stitch(dataUrls: string[], paper: string): Promise<string> {
  if (dataUrls.length === 1) return dataUrls[0]
  const imgs = await Promise.all(dataUrls.map(loadImage))
  const width = Math.max(...imgs.map((i) => i.width))
  const height = imgs.reduce((sum, i) => sum + i.height, 0)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrls[0]
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, width, height)
  let y = 0
  for (const img of imgs) {
    ctx.drawImage(img, 0, y)
    y += img.height
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

function numbered(html: string, start: number, hideLines: boolean): string {
  const parts = html.split(/<br\s*\/?>/i)
  return parts
    .map((line, i) => {
      const n = start + i
      const num = hideLines ? '' : `<span class="n">${n}</span>`
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

  for (let i = 0; i < lines.length; i += CHUNK) {
    const slice = lines.slice(i, i + CHUNK).join('\n')
    const colorized = await monaco.editor.colorize(slice, 'java', {})
    const card = document.createElement('div')
    card.className = 'export-card'
    card.style.width = `${cardWidth}px`
    card.style.background = meta.paper
    card.style.color = meta.ink
    const head =
      i === 0
        ? `<div class="export-head" style="border-color:${meta.muted}">
            <img src="${catMarkSrc}" width="22" height="22" alt=""/>
            <div class="export-head-copy">
              <strong>${escapeHtml(meta.cardLabel)}</strong>
              <span>${escapeHtml(meta.className || meta.fileName)} · ${escapeHtml(meta.themeName)}</span>
            </div>
            ${compile ? `<em class="export-chip" style="background:${meta.accent}22;color:${meta.ink}">${escapeHtml(compile)}</em>` : ''}
          </div>`
        : ''
    const foot =
      i + CHUNK >= lines.length && meta.runExcerpt
        ? `<div class="export-run" style="border-color:${meta.muted}"><span>${escapeHtml(meta.runLabel)}</span><pre>${escapeHtml(meta.runExcerpt)}</pre></div>`
        : ''
    card.innerHTML = `${head}<div class="export-code" style="color:${meta.ink}">${numbered(colorized, i + 1, meta.hideLines)}</div>${foot}`
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

  host.innerHTML = ''
  return fitPng(await stitch(urls, meta.paper))
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
