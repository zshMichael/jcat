import type * as Monaco from 'monaco-editor'
import type { Diagnostic } from '@shared/types'

export function applyMarkers(
  monaco: typeof Monaco,
  diagnostics: Diagnostic[],
  currentPath: string | null,
  extras: Diagnostic[] = []
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
      related.map((d) => toMarker(monaco, d))
    )
    const extra = extras.filter(
      (d) =>
        pathsMatch(d.file, uriPath) ||
        (currentPath && pathsMatch(d.file, currentPath) && pathsMatch(uriPath, currentPath))
    )
    monaco.editor.setModelMarkers(model, 'jcat-class', extra.map((d) => toMarker(monaco, d)))
  }
}

function toMarker(monaco: typeof Monaco, d: Diagnostic): Monaco.editor.IMarkerData {
  const start = d.column || 1
  return {
    startLineNumber: d.line,
    startColumn: start,
    endLineNumber: d.line,
    endColumn: d.endColumn && d.endColumn > start ? d.endColumn : start + 80,
    message: d.message,
    severity: d.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error
  }
}

function pathsMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false
  const na = a.replace(/\\/g, '/').toLowerCase()
  const nb = b.replace(/\\/g, '/').toLowerCase()
  return na === nb || na.endsWith(nb) || nb.endsWith(na)
}
