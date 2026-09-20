export type SnapKind = 'row' | 'grid' | 'list'

export type TraceSnap = {
  kind: SnapKind
  line: number
  name: string
  rows: string[][]
}

export type TraceStep = {
  kind: 'step'
  line: number
  locals: { name: string; value: string }[]
}

export type TraceEvent = TraceSnap | TraceStep

const MARK = 'JCAT|'

export const JCAT_SNAP_JAVA = `package jcat;

public final class JcatSnap {
  private JcatSnap() {}

  private static void emit(String kind, int line, String name, String payload) {
    System.err.println("${MARK}" + kind + "|" + line + "|" + name + "|" + payload);
  }

  private static String joinInts(int[] a) {
    if (a == null) return "null";
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < a.length; i++) {
      if (i > 0) sb.append(',');
      sb.append(a[i]);
    }
    return sb.toString();
  }

  public static void arr(String name, int[] a, int line) {
    emit("row", line, name, joinInts(a));
  }

  public static void arr(String name, double[] a, int line) {
    if (a == null) {
      emit("row", line, name, "null");
      return;
    }
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < a.length; i++) {
      if (i > 0) sb.append(',');
      sb.append(a[i]);
    }
    emit("row", line, name, sb.toString());
  }

  public static void arr(String name, boolean[] a, int line) {
    if (a == null) {
      emit("row", line, name, "null");
      return;
    }
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < a.length; i++) {
      if (i > 0) sb.append(',');
      sb.append(a[i]);
    }
    emit("row", line, name, sb.toString());
  }

  public static void arr(String name, String[] a, int line) {
    if (a == null) {
      emit("row", line, name, "null");
      return;
    }
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < a.length; i++) {
      if (i > 0) sb.append(',');
      sb.append(a[i] == null ? "null" : a[i].replace("|", "/").replace(",", " "));
    }
    emit("row", line, name, sb.toString());
  }

  public static void arr(String name, int[][] a, int line) {
    if (a == null) {
      emit("grid", line, name, "null");
      return;
    }
    StringBuilder sb = new StringBuilder();
    for (int r = 0; r < a.length; r++) {
      if (r > 0) sb.append(';');
      if (a[r] == null) sb.append("null");
      else sb.append(joinInts(a[r]));
    }
    emit("grid", line, name, sb.toString());
  }

  public static void list(String name, java.util.ArrayList<?> a, int line) {
    if (a == null) {
      emit("list", line, name, "null");
      return;
    }
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < a.size(); i++) {
      if (i > 0) sb.append(',');
      Object v = a.get(i);
      sb.append(v == null ? "null" : String.valueOf(v).replace("|", "/").replace(",", " "));
    }
    emit("list", line, name, sb.toString());
  }

  public static String kv(Object... xs) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i + 1 < xs.length; i += 2) {
      if (sb.length() > 0) sb.append(',');
      sb.append(xs[i]).append('=').append(xs[i + 1]);
    }
    return sb.toString();
  }

  public static void step(int line, String locals) {
    emit("step", line, "-", locals == null ? "" : locals);
  }
}
`

type ArrBind = { name: string; kind: SnapKind }

function ident(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripLineComment(line: string): string {
  let q: '"' | "'" | null = null
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '\\') {
        i += 1
        continue
      }
      if (ch === q) q = null
      continue
    }
    if (ch === '"' || ch === "'") {
      q = ch
      continue
    }
    if (ch === '/' && line[i + 1] === '/') return line.slice(0, i)
  }
  return line
}

function collectArrays(source: string): ArrBind[] {
  const binds: ArrBind[] = []
  const seen = new Set<string>()
  const add = (name: string, kind: SnapKind): void => {
    if (name === 'args' || seen.has(name)) return
    seen.add(name)
    binds.push({ name, kind })
  }
  const text = source.replace(/\/\*[\s\S]*?\*\//g, ' ')
  for (const line of text.split('\n')) {
    const s = stripLineComment(line)
    const grid = s.match(/\bint\s*\[\s*\]\s*\[\s*\]\s*(\w+)/)
    if (grid) {
      add(grid[1], 'grid')
      continue
    }
    const row = s.match(/\b(?:int|double|boolean|String)\s*\[\s*\]\s*(\w+)/)
    if (row) add(row[1], 'row')
    const list = s.match(/\bArrayList\s*<[^>]+>\s*(\w+)/)
    if (list) add(list[1], 'list')
  }
  return binds
}

function forVar(line: string): string | null {
  const m =
    line.match(/\bfor\s*\(\s*(?:final\s+)?(?:int|double|boolean|char|String)\s+(\w+)\s*=/) ||
    line.match(/\bfor\s*\(\s*(?:final\s+)?(?:int|double|boolean|char|String)\s+(\w+)\s*:/)
  return m?.[1] ?? null
}

function isMutate(line: string, name: string): boolean {
  if (line.includes('jcat.JcatSnap')) return false
  const id = ident(name)
  if (new RegExp(`\\b${id}(?:\\s*\\[[^\\]]+\\])+\\s*(?:\\+\\+|--|\\+=|-=|\\*=|/=|=)`).test(line)) {
    return true
  }
  if (new RegExp(`\\b${id}\\.(?:add|set|remove|clear)\\s*\\(`).test(line)) return true
  if (new RegExp(`\\b${id}\\s*=`).test(line)) return true
  if (
    new RegExp(`\\b(?:int|double|boolean|String)\\s*(?:\\[\\s*\\]\\s*)+${id}\\b`).test(line) &&
    /(?:^|[^=!<>])=(?!=)/.test(line)
  ) {
    return true
  }
  if (
    new RegExp(`\\bArrayList\\s*<[^>]+>\\s*${id}\\b`).test(line) &&
    /(?:^|[^=!<>])=(?!=)/.test(line)
  ) {
    return true
  }
  return false
}

function snapCall(bind: ArrBind, lineNo: number): string {
  if (bind.kind === 'list') return `jcat.JcatSnap.list("${bind.name}", ${bind.name}, ${lineNo});`
  return `jcat.JcatSnap.arr("${bind.name}", ${bind.name}, ${lineNo});`
}

function stepCall(lineNo: number, vars: string[]): string {
  if (vars.length === 0) return `jcat.JcatSnap.step(${lineNo}, "");`
  const args = vars.flatMap((v) => [`"${v}"`, v]).join(', ')
  return `jcat.JcatSnap.step(${lineNo}, jcat.JcatSnap.kv(${args}));`
}

/** Append trace calls on the same lines so javac line numbers stay put. */
export function instrumentJava(source: string): { source: string; names: string[] } {
  const binds = collectArrays(source)
  const lines = source.split('\n')
  const loop: { name: string; depth: number }[] = []
  let depth = 0
  let pendingFor: string | null = null
  let pendingBinds: ArrBind[] = []

  const out = lines.map((line, i) => {
    const n = i + 1
    const code = stripLineComment(line)
    const v = forVar(code)
    if (v) pendingFor = v

    let extra = ''
    if (pendingFor && code.includes('{')) {
      const names = [...new Set([...loop.map((l) => l.name), pendingFor])]
      extra += ' ' + stepCall(n, names)
      loop.push({ name: pendingFor, depth: depth + 1 })
      pendingFor = null
    }

    for (const bind of binds) {
      if (!isMutate(code, bind.name)) continue
      if (code.includes(';')) extra += ' ' + snapCall(bind, n)
      else if (!pendingBinds.some((p) => p.name === bind.name)) pendingBinds.push(bind)
    }
    if (pendingBinds.length && code.includes(';')) {
      for (const bind of pendingBinds) extra += ' ' + snapCall(bind, n)
      pendingBinds = []
    }

    const opens = (code.match(/\{/g) || []).length
    const closes = (code.match(/\}/g) || []).length
    depth += opens - closes
    while (loop.length && loop[loop.length - 1].depth > depth) loop.pop()

    if (!extra) return line
    const trimmed = line.trimEnd()
    return `${trimmed}${extra}${line.slice(trimmed.length)}`
  })

  return { source: out.join('\n'), names: binds.map((b) => b.name) }
}

export function parseTraceLine(line: string): TraceEvent | null {
  if (!line.startsWith(MARK)) return null
  const parts = line.trim().split('|')
  if (parts.length < 5) return null
  const kind = parts[1]
  const lineNo = Number(parts[2])
  const name = parts[3]
  const payload = parts.slice(4).join('|')
  if (kind === 'step') {
    const locals = payload
      ? payload.split(',').flatMap((pair) => {
          const eq = pair.indexOf('=')
          if (eq < 0) return []
          return [{ name: pair.slice(0, eq), value: pair.slice(eq + 1) }]
        })
      : []
    return { kind: 'step', line: lineNo, locals }
  }
  if (kind === 'row' || kind === 'list') {
    const row = payload === 'null' ? [['null']] : [payload === '' ? [] : payload.split(',')]
    return { kind, line: lineNo, name, rows: row }
  }
  if (kind === 'grid') {
    if (payload === 'null') return { kind: 'grid', line: lineNo, name, rows: [['null']] }
    const rows = payload.split(';').map((r) => (r === '' ? [] : r.split(',')))
    return { kind: 'grid', line: lineNo, name, rows }
  }
  return null
}

export function boardsAt(events: TraceEvent[], throughSteps: number | null): TraceSnap[] {
  const steps = events.filter((e): e is TraceStep => e.kind === 'step')
  const limit =
    throughSteps === null || steps.length === 0
      ? events.length
      : (() => {
          let seen = 0
          for (let i = 0; i < events.length; i++) {
            if (events[i].kind === 'step') {
              seen += 1
              if (seen > throughSteps + 1) return i
            }
          }
          return events.length
        })()
  const map = new Map<string, TraceSnap>()
  for (let i = 0; i < limit; i++) {
    const e = events[i]
    if (e.kind === 'step') continue
    map.set(e.name, e)
  }
  return [...map.values()]
}

export function isTraceLine(line: string): boolean {
  return line.startsWith(MARK)
}

export function traceSteps(events: TraceEvent[]): TraceStep[] {
  return events.filter((e): e is TraceStep => e.kind === 'step')
}
