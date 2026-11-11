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

const TYPE_DECL =
  /(?:^|[^\w$])((?:(?:public|private|protected|abstract|final|sealed|static|strictfp)\s+|non-sealed\s+|@(?!interface\b)[\w$.]+(?:\s*\([^()]*\))?\s+)*)(class|interface|enum|record|@interface)\s+([A-Za-z_]\w*)/g

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

export type TopLevelType = {
  name: string
  kind: 'class' | 'interface' | 'enum' | 'record'
  isPublic: boolean
  line: number
  column: number
  endColumn: number
}

export type ClassFileAction =
  | { kind: 'rename'; name: string; line: number; column: number; endColumn: number }
  | {
      kind: 'error'
      reason: 'bad' | 'many' | 'mismatch'
      name: string
      line: number
      column: number
      endColumn: number
    }
  | { kind: 'keep' }

export function publicClassInfo(
  source: string
): { name: string; line: number; column: number; endColumn: number } | null {
  const pubs = topLevelTypes(source).filter((type) => type.isPublic)
  if (pubs.length !== 1) return null
  const type = pubs[0]
  return {
    name: type.name,
    line: type.line,
    column: type.column,
    endColumn: type.endColumn
  }
}

/** Top-level types only. Nested classes stay with the file and never own its name. */
export function topLevelTypes(source: string): TopLevelType[] {
  const flat = blankNested(maskJava(source))
  const found: TopLevelType[] = []
  TYPE_DECL.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TYPE_DECL.exec(flat))) {
    const name = match[3]
    const nameAt = match.index + match[0].length - name.length
    const before = source.slice(0, nameAt)
    const lineStart = before.lastIndexOf('\n') + 1
    const kind = match[2] === '@interface' ? 'interface' : (match[2] as TopLevelType['kind'])
    found.push({
      name,
      kind,
      isPublic: /\bpublic\b/.test(match[1]),
      line: before.split('\n').length,
      column: nameAt - lineStart + 1,
      endColumn: nameAt - lineStart + 1 + name.length
    })
  }
  return found
}

/**
 * A .java file may hold many types. The file name follows a class only when
 * that file has exactly one top-level type and it is public. Helpers and
 * nested classes leave the file name where the user put it.
 */
export function classFileAction(source: string, fileBase: string): ClassFileAction {
  const types = topLevelTypes(source)
  const pubs = types.filter((type) => type.isPublic)
  if (pubs.length > 1) return { kind: 'error', reason: 'many', ...spot(pubs[1]) }
  if (pubs.length === 0) return { kind: 'keep' }
  const only = pubs[0]
  if (!isJavaClassName(only.name)) return { kind: 'error', reason: 'bad', ...spot(only) }
  if (types.length > 1) {
    return only.name === fileBase
      ? { kind: 'keep' }
      : { kind: 'error', reason: 'mismatch', ...spot(only) }
  }
  if (only.name === fileBase) return { kind: 'keep' }
  return { kind: 'rename', ...spot(only) }
}

function spot(type: TopLevelType): {
  name: string
  line: number
  column: number
  endColumn: number
} {
  return {
    name: type.name,
    line: type.line,
    column: type.column,
    endColumn: type.endColumn
  }
}

function maskJava(source: string): string {
  const out: string[] = []
  let i = 0
  while (i < source.length) {
    const c = source[i]
    const next = source[i + 1]
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        out.push(' ')
        i += 1
      }
      continue
    }
    if (c === '/' && next === '*') {
      out.push(' ', ' ')
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        out.push(source[i] === '\n' ? '\n' : ' ')
        i += 1
      }
      if (i < source.length) {
        out.push(' ', ' ')
        i += 2
      }
      continue
    }
    if (c === '"' && source.startsWith('"""', i)) {
      out.push(' ', ' ', ' ')
      i += 3
      while (i < source.length && !source.startsWith('"""', i)) {
        out.push(source[i] === '\n' ? '\n' : ' ')
        i += 1
      }
      if (i < source.length) {
        out.push(' ', ' ', ' ')
        i += 3
      }
      continue
    }
    if (c === '"') {
      out.push(' ')
      i += 1
      while (i < source.length && source[i] !== '"' && source[i] !== '\n') {
        if (source[i] === '\\' && i + 1 < source.length) {
          out.push(' ', ' ')
          i += 2
          continue
        }
        out.push(' ')
        i += 1
      }
      if (i < source.length && source[i] === '"') {
        out.push(' ')
        i += 1
      }
      continue
    }
    if (c === "'") {
      out.push(' ')
      i += 1
      while (i < source.length && source[i] !== "'" && source[i] !== '\n') {
        if (source[i] === '\\' && i + 1 < source.length) {
          out.push(' ', ' ')
          i += 2
          continue
        }
        out.push(' ')
        i += 1
      }
      if (i < source.length && source[i] === "'") {
        out.push(' ')
        i += 1
      }
      continue
    }
    out.push(c)
    i += 1
  }
  return out.join('')
}

function blankNested(masked: string): string {
  let depth = 0
  let out = ''
  for (const c of masked) {
    if (c === '{') {
      depth += 1
      out += ' '
      continue
    }
    if (c === '}') {
      depth = Math.max(0, depth - 1)
      out += ' '
      continue
    }
    out += depth === 0 || c === '\n' ? c : ' '
  }
  return out
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
