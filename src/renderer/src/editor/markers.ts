import type * as Monaco from 'monaco-editor'
import type { Diagnostic } from '@shared/types'

export function applyMarkers(
  monaco: typeof Monaco,
  diagnostics: Diagnostic[],
  currentPath: string | null
): void {
  for (const model of monaco.editor.getModels()) {
    const uriPath = model.uri.path || model.uri.fsPath || ''
    const related = diagnostics.filter(
      (d) =>
        pathsMatch(d.file, uriPath) ||
        (currentPath && pathsMatch(d.file, currentPath) && pathsMatch(uriPath, currentPath))
    )
    monaco.editor.setModelMarkers(
      model,
      'jcat',
      related.map((d) => ({
        startLineNumber: d.line,
        startColumn: d.column || 1,
        endLineNumber: d.line,
        endColumn: 120,
        message: d.message,
        severity:
          d.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error
      }))
    )
  }
}

function pathsMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false
  const na = a.replace(/\\/g, '/').toLowerCase()
  const nb = b.replace(/\\/g, '/').toLowerCase()
  return na === nb || na.endsWith(nb) || nb.endsWith(na)
}
