import { toPng } from 'html-to-image'
import type * as Monaco from 'monaco-editor'
import { CatIconSvg } from '../theme/catSvg'

const CHUNK = 90

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function stitch(dataUrls: string[]): Promise<string> {
  if (dataUrls.length === 1) return dataUrls[0]
  const imgs = await Promise.all(dataUrls.map(loadImage))
  const width = Math.max(...imgs.map((i) => i.width))
  const height = imgs.reduce((sum, i) => sum + i.height, 0)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrls[0]
  ctx.fillStyle = '#F6F1EA'
  ctx.fillRect(0, 0, width, height)
  let y = 0
  for (const img of imgs) {
    ctx.drawImage(img, 0, y)
    y += img.height
  }
  return canvas.toDataURL('image/png')
}

function numbered(html: string, start: number): string {
  const parts = html.split(/<br\s*\/?>/i)
  return parts
    .map((line, i) => {
      const n = start + i
      return `<div class="export-line"><span class="n">${n}</span><span class="c">${line || '&nbsp;'}</span></div>`
    })
    .join('')
}

export async function renderCodePng(
  monaco: typeof Monaco,
  code: string,
  fileName: string
): Promise<string> {
  const host = document.getElementById('jcat-export-host')
  if (!host) throw new Error('导出画布不存在')
  const lines = code.split('\n')
  const urls: string[] = []

  for (let i = 0; i < lines.length; i += CHUNK) {
    const slice = lines.slice(i, i + CHUNK).join('\n')
    const colorized = await monaco.editor.colorize(slice, 'java', {})
    const card = document.createElement('div')
    card.className = 'export-card'
    const head =
      i === 0
        ? `<div class="export-head">${CatIconSvg}<span>${escapeHtml(fileName)} · Jcat</span></div>`
        : ''
    card.innerHTML = `${head}<div class="export-code">${numbered(colorized, i + 1)}</div>`
    host.innerHTML = ''
    host.appendChild(card)
    urls.push(
      await toPng(card, {
        pixelRatio: 2,
        backgroundColor: '#F6F1EA',
        cacheBust: true
      })
    )
  }

  host.innerHTML = ''
  return stitch(urls)
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
