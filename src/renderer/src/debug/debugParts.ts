export type DebugPart = { kind: 'prose'; text: string } | { kind: 'java'; code: string }

function looksLikeJavaLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  if (/^(行|给分|最小改动|最小修复|Line|Score|Fix)\s*[:：]/i.test(t)) return false
  if (/[\u4e00-\u9fff]/.test(t) && !/[;{}]/.test(t)) return false
  if (
    /^(public|private|protected|static|final|void|int|double|boolean|char|byte|short|long|float|String|if|else|for|while|do|switch|case|return|new|this|class|import|package|try|catch|throws)\b/.test(
      t
    )
  ) {
    return true
  }
  if (/^[\]})]+\s*;?$/.test(t) || /^[{(]+$/.test(t)) return true
  if (/;\s*$/.test(t) && /[a-zA-Z_]/.test(t)) return true
  if (/[{}]\s*$/.test(t) && /[a-zA-Z_]/.test(t)) return true
  return false
}

function splitProse(text: string): DebugPart[] {
  const lines = text.split('\n')
  const out: DebugPart[] = []
  let buf: string[] = []
  let kind: 'prose' | 'java' = 'prose'
  const flush = (): void => {
    if (!buf.length) return
    const value = buf.join('\n')
    buf = []
    if (kind === 'java') {
      const code = value.replace(/^\n+/, '').replace(/\n+$/, '')
      if (code) out.push({ kind: 'java', code })
      return
    }
    if (value.trim()) out.push({ kind: 'prose', text: value })
  }
  for (const line of lines) {
    const next: 'prose' | 'java' = looksLikeJavaLine(line) ? 'java' : 'prose'
    if (next !== kind && buf.length) flush()
    kind = next
    buf.push(line)
  }
  flush()
  return out
}

export function splitDebugParts(text: string): DebugPart[] {
  const parts: DebugPart[] = []
  const re = /```(?:java)?[ \t]*\r?\n?([\s\S]*?)(?:```|$)/gi
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ kind: 'prose', text: text.slice(last, m.index) })
    const code = m[1].replace(/\n$/, '')
    if (code.trim()) parts.push({ kind: 'java', code })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ kind: 'prose', text: text.slice(last) })
  const expanded: DebugPart[] = []
  for (const part of parts.length ? parts : [{ kind: 'prose' as const, text }]) {
    if (part.kind === 'java') {
      expanded.push(part)
      continue
    }
    expanded.push(...splitProse(part.text))
  }
  return expanded
}

export function extractJavaFix(text: string): string {
  const codes = splitDebugParts(text)
    .filter((part): part is { kind: 'java'; code: string } => part.kind === 'java')
    .map((part) => part.code)
  if (codes.length) return codes.join('\n\n')
  return text
}
