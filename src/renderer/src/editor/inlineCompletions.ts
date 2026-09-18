import type * as Monaco from 'monaco-editor'

let registered = false
let enabled = false
let delayMs = 400

export function setInlineCompletionEnabled(value: boolean): void {
  enabled = value
}

export function setInlineCompletionDelay(ms: number): void {
  delayMs = Number.isFinite(ms) ? Math.max(200, Math.min(2000, ms)) : 400
}

export function registerInlineCompletions(monaco: typeof Monaco): void {
  if (registered) return
  registered = true

  monaco.languages.registerInlineCompletionsProvider('java', {
    provideInlineCompletions: async (model, position, _ctx, token) => {
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

      const request = window.jcat.ai.complete({ prefix, suffix })
      token.onCancellationRequested(() => {
        void window.jcat.ai.completeAbort()
      })
      const result = await request
      if (token.isCancellationRequested || !enabled || !result.text) return { items: [] }

      return {
        items: [
          {
            insertText: result.text.replace(/^\n/, ''),
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
