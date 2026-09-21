import { detectOutOfSubset, uniqueTokens } from './apSubset'

export function tokensInSource(source: string): string[] {
  return uniqueTokens(detectOutOfSubset(source))
}

export function snapshotFromFiles(files: Array<{ path: string; text: string }>): Record<string, string[]> {
  const snap: Record<string, string[]> = {}
  for (const file of files) {
    if (!/\.java$/i.test(file.path)) continue
    snap[file.path] = tokensInSource(file.text)
  }
  return snap
}

/** Tokens that appear after the exam but were not in that file's baseline (or the file is new). */
export function addedTokens(
  baseline: Record<string, string[]>,
  current: Record<string, string[]>
): string[] {
  const out = new Set<string>()
  for (const [path, tokens] of Object.entries(current)) {
    const before = new Set(baseline[path] ?? [])
    for (const token of tokens) {
      if (!before.has(token)) out.add(token)
    }
  }
  return [...out].sort((a, b) => a.localeCompare(b))
}
