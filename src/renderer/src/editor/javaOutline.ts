export type OutlineItem = {
  id: string
  name: string
  line: number
  kind: 'class' | 'ctor' | 'method'
}

const SKIP_TYPES = new Set(['if', 'for', 'while', 'switch', 'catch', 'synchronized', 'return'])

const HEADER =
  /^[ \t]*((?:public|private|protected|static|final|abstract|synchronized|native|default|strictfp)\s+)*([A-Za-z_]\w*(?:\s*<[^>]*>)?(?:\s*\[\s*\])*)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/

const CTOR = /^[ \t]*((?:public|private|protected)\s+)?([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:throws\b|{)/

const CLASS = /^[ \t]*((?:public|private|protected|abstract|final|strictfp)\s+)*class\s+([A-Za-z_]\w*)/

const PUBLIC_CLASS =
  /\bpublic\s+(?:(?:abstract|final|strictfp)\s+)*class\s+([A-Za-z_]\w*)/

const JAVA_KEYWORDS = new Set([
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while',
  'true',
  'false',
  'null'
])

export function publicClassInfo(
  source: string
): { name: string; line: number; column: number; endColumn: number } | null {
  const match = PUBLIC_CLASS.exec(source)
  if (!match || match.index === undefined) return null
  const before = source.slice(0, match.index + match[0].length - match[1].length)
  const line = before.split(/\n/).length
  const lineStart = before.lastIndexOf('\n') + 1
  const column = before.length - lineStart + 1
  return {
    name: match[1],
    line,
    column,
    endColumn: column + match[1].length
  }
}

export function isJavaClassName(name: string): boolean {
  return /^[A-Za-z_]\w*$/.test(name) && !JAVA_KEYWORDS.has(name)
}
export function parseJavaOutline(source: string): OutlineItem[] {
  const items: OutlineItem[] = []
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  let className = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const classMatch = line.match(CLASS)
    if (classMatch) {
      className = classMatch[2]
      items.push({
        id: `c-${i + 1}`,
        name: classMatch[2],
        line: i + 1,
        kind: 'class'
      })
      continue
    }

    const ctor = line.match(CTOR)
    if (ctor && className && ctor[2] === className && !SKIP_TYPES.has(ctor[2])) {
      items.push({
        id: `k-${i + 1}`,
        name: `${ctor[2]}(${trimParams(ctor[3])})`,
        line: i + 1,
        kind: 'ctor'
      })
      continue
    }

    const header = line.match(HEADER)
    if (!header) continue
    const ret = header[2].trim()
    const name = header[3]
    if (SKIP_TYPES.has(ret) || SKIP_TYPES.has(name)) continue
    if (ret === 'class' || ret === 'interface' || ret === 'enum') continue
    items.push({
      id: `m-${i + 1}`,
      name: `${name}(${trimParams(header[4])})`,
      line: i + 1,
      kind: 'method'
    })
  }

  return items
}

function trimParams(raw: string): string {
  const inner = raw.replace(/\s+/g, ' ').trim()
  if (!inner) return ''
  if (inner.length <= 28) return inner
  return `${inner.slice(0, 26)}…`
}
