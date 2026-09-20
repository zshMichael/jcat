import type * as Monaco from 'monaco-editor'
import type { Locale } from '@shared/types'
import { detectOutOfSubset, hoverDoc } from '@shared/apSubset'

let registered = false
let locale: Locale = 'zh'
let hintText = '超纲'
let hintsOn = true
const decoIds = new WeakMap<Monaco.editor.ITextModel, string[]>()

export function setApLocale(next: Locale, label: string): void {
  locale = next
  hintText = label
}

export function setApHintsEnabled(on: boolean): void {
  hintsOn = on
}

export function registerApLanguage(monaco: typeof Monaco): void {
  if (registered) return
  registered = true
  monaco.languages.registerHoverProvider('java', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word) return null
      const doc = hoverDoc(word.word, locale)
      if (!doc) return null
      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [
          { value: `**${word.word}**` },
          { value: doc.replace(/。/g, '。\n\n').replace(/\n+$/, '') }
        ]
      }
    }
  })
}

export function paintApHints(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco,
  source: string
): void {
  const model = editor.getModel()
  if (!model) return
  const path = model.uri.path || model.uri.fsPath || ''
  const prev = decoIds.get(model) ?? []
  if (!/\.java$/i.test(path)) {
    decoIds.set(model, model.deltaDecorations(prev, []))
    return
  }
  const seen = new Set<number>()
  const decos: Monaco.editor.IModelDeltaDecoration[] = []
  if (!hintsOn) {
    decoIds.set(model, model.deltaDecorations(prev, []))
    return
  }
  for (const hit of detectOutOfSubset(source)) {
    if (seen.has(hit.line)) continue
    seen.add(hit.line)
    const maxCol = model.getLineMaxColumn(hit.line)
    decos.push({
      range: new monaco.Range(hit.line, maxCol, hit.line, maxCol),
      options: {
        after: {
          content: `  ${hintText}`,
          inlineClassName: 'ap-out-hint',
          cursorStops: monaco.editor.InjectedTextCursorStops.None
        },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    })
  }
  decoIds.set(model, model.deltaDecorations(prev, decos))
}
