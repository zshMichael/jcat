import type * as Monaco from 'monaco-editor'
import type { Locale } from '@shared/types'

let registered = false
let enabled = false
let delayMs = 400
let locale: Locale = 'zh'
let whyHandler: (why: string | null) => void = () => undefined
let errorHandler: (message: string | null) => void = () => undefined

export function setInlineCompletionEnabled(value: boolean): void {
  enabled = value
  if (!value) {
    whyHandler(null)
    errorHandler(null)
  }
}

export function setInlineCompletionDelay(ms: number): void {
  delayMs = Number.isFinite(ms) ? Math.max(200, Math.min(2000, ms)) : 400
}

export function setInlineCompletionLocale(next: Locale): void {
  locale = next
}

export function onGhostWhy(cb: (why: string | null) => void): void {
  whyHandler = cb
}

export function onGhostError(cb: (message: string | null) => void): void {
  errorHandler = cb
}

function continueFromCursor(prefix: string, insert: string): string {
  let text = insert
  if (!text) return ''
  const max = Math.min(prefix.length, text.length)
  for (let n = max; n > 0; n--) {
    if (text.startsWith(prefix.slice(-n))) {
      text = text.slice(n)
      break
    }
  }
  const line = prefix.slice(prefix.lastIndexOf('\n') + 1)
  if (line.trim() === '') text = text.replace(/^\n+/, '')
  if (/;\s*$/.test(line) && !text.startsWith('\n')) return ''
  const trimmed = text.trim()
  if (!trimmed || /^[{};]+$/.test(trimmed)) return ''
  return text
}

export function registerInlineCompletions(monaco: typeof Monaco): void {
  if (registered) return
  registered = true

  monaco.languages.registerInlineCompletionsProvider('java', {
    provideInlineCompletions: async (model, position, _ctx, token) => {
      whyHandler(null)
      if (!enabled) return { items: [] }
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, delayMs)
        token.onCancellationRequested(() => {
          clearTimeout(timer)
          resolve()
        })
      })
      if (token.isCancellationRequested || !enabled) return { items: [] }
      const offset = model.getOffsetAt(position)
      const value = model.getValue()
      const prefix = value.slice(Math.max(0, offset - 4000), offset)
      const suffix = value.slice(offset, offset + 2000)

      if (prefix.trim().length < 4) return { items: [] }
      const request = window.jcat.ai.complete({ prefix, suffix, locale })
      token.onCancellationRequested(() => {
        void window.jcat.ai.completeAbort()
      })
      const result = await request
      if (token.isCancellationRequested || !enabled) return { items: [] }
      if (result.error) {
        errorHandler(result.error)
        return { items: [] }
      }
      const insertText = continueFromCursor(prefix, result.text)
      if (!insertText.trim()) return { items: [] }
      if (result.why) whyHandler(result.why)
      return {
        items: [
          {
            insertText,
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            )
          }
        ]
      }
    },
    freeInlineCompletions: () => undefined
  })
}
