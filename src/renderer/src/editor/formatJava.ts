function braceDelta(line: string): number {
  let delta = 0
  let quote: '"' | "'" | null = null
  let escape = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '/' && line[i + 1] === '/') break
    if (ch === '{') delta += 1
    else if (ch === '}') delta -= 1
  }
  return delta
}

function startsWithClose(line: string): boolean {
  const trimmed = line.trimStart()
  if (!trimmed.startsWith('}')) return false
  if (trimmed.startsWith('}"') || trimmed.startsWith("}'")) return false
  return true
}

/** Indent Java by braces. Good enough for AP CSA labs; does not reflow statements. */
export function formatJava(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').replace(/\t/g, '    ').split('\n')
  let depth = 0
  let block = false
  const out: string[] = []

  for (const raw of lines) {
    let line = raw
    if (block) {
      const end = line.indexOf('*/')
      if (end >= 0) {
        block = false
        line = line.slice(end + 2)
      } else {
        out.push(raw.trimEnd())
        continue
      }
    }

    const trimmed = line.trim()
    if (!trimmed) {
      out.push('')
      continue
    }

    const startComment = trimmed.startsWith('/*') && !trimmed.startsWith('/**')
    const javadoc = trimmed.startsWith('/**')
    if ((startComment || javadoc) && !trimmed.includes('*/')) {
      block = true
    }

    const close = startsWithClose(trimmed)
    if (close) depth = Math.max(0, depth - 1)
    out.push(`${'    '.repeat(depth)}${trimmed}`)
    const delta = braceDelta(trimmed)
    depth = Math.max(0, depth + delta + (close ? 1 : 0))
  }

  return out.join('\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n')
}
