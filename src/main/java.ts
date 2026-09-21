import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'fs'
import { tmpdir } from 'os'
import { basename, delimiter, dirname, join, relative, sep } from 'path'
import { detectToolchain } from './jdk'
import { getRoot } from './workspace'
import type { AppNoticeCode, CompileResult, Diagnostic, ProjectKind } from '../shared/types'
import {
  instrumentJava,
  JCAT_SNAP_JAVA,
  parseTraceLine,
  type TraceEvent
} from '../shared/instrumentJava'

let running: ChildProcessWithoutNullStreams | null = null

function walkJava(dir: string, acc: string[] = []): string[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return acc
  }
  for (const name of names) {
    if (name === '.' || name === '..') continue
    if (
      name === 'out' ||
      name === 'target' ||
      name === '.git' ||
      name === 'node_modules' ||
      name === '.jcat'
    ) {
      continue
    }
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) walkJava(full, acc)
    else if (name.endsWith('.java')) acc.push(full)
  }
  return acc
}

export function scanMainClasses(root: string): string[] {
  const found: string[] = []
  for (const file of walkJava(root)) {
    const text = readFileSync(file, 'utf8')
    if (!/public\s+static\s+void\s+main\s*\(/.test(text)) continue
    const pkg = text.match(/^\s*package\s+([\w.]+)\s*;/m)?.[1]
    const cls = text.match(/public\s+class\s+(\w+)/)?.[1] || text.match(/class\s+(\w+)/)?.[1]
    if (!cls) continue
    found.push(pkg ? `${pkg}.${cls}` : cls)
  }
  return [...new Set(found)].sort()
}

function parseJavac(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const javac = /^(.+\.java):(\d+):\s*(error|warning|错误|警告):\s*(.*)$/gm
  let m: RegExpExecArray | null
  while ((m = javac.exec(output))) {
    const rest = output.slice(m.index)
    const caret = rest.match(/\n[^\n]*\n(\s*)\^/)
    diagnostics.push({
      file: m[1],
      line: Number(m[2]),
      column: caret ? caret[1].length + 1 : 1,
      severity: m[3] === 'warning' || m[3] === '警告' ? 'warning' : 'error',
      message: m[4]
    })
  }
  const maven = /\[ERROR]\s+(.+\.java):\[(\d+),(\d+)]\s+(.*)$/gm
  while ((m = maven.exec(output))) {
    diagnostics.push({
      file: m[1],
      line: Number(m[2]),
      column: Number(m[3]),
      severity: 'error',
      message: m[4]
    })
  }
  const mavenWarn = /\[WARNING]\s+(.+\.java):\[(\d+),(\d+)]\s+(.*)$/gm
  while ((m = mavenWarn.exec(output))) {
    diagnostics.push({
      file: m[1],
      line: Number(m[2]),
      column: Number(m[3]),
      severity: 'warning',
      message: m[4]
    })
  }
  return diagnostics
}

function spawnEnv(javaHome: string | null): NodeJS.ProcessEnv {
  const env = { ...process.env }
  if (javaHome) {
    env.JAVA_HOME = javaHome
    env.PATH = `${join(javaHome, 'bin')}${delimiter}${env.PATH ?? ''}`
  }
  if (process.platform === 'win32') {
    const extra =
      '-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8 -Dstdin.encoding=UTF-8'
    const prev = env.JAVA_TOOL_OPTIONS?.trim()
    env.JAVA_TOOL_OPTIONS = prev ? `${prev} ${extra}` : extra
  }
  return env
}

function decodeChunk(data: Buffer): string {
  return data.toString('utf8').replace(/^Picked up JAVA_TOOL_OPTIONS:.*\r?\n/gm, '')
}

function spawnOpts(
  command: string,
  cwd: string,
  env: NodeJS.ProcessEnv
): {
  cwd: string
  windowsHide: true
  env: NodeJS.ProcessEnv
  shell: boolean
  stdio: ['pipe', 'pipe', 'pipe']
} {
  return {
    cwd,
    windowsHide: true,
    env,
    shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(command),
    stdio: ['pipe', 'pipe', 'pipe']
  }
}

function runProcess(
  command: string,
  args: string[],
  cwd: string,
  javaHome: string | null
): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, spawnOpts(command, cwd, spawnEnv(javaHome)))
    child.stdin.end()
    let output = ''
    child.stdout.on('data', (d: Buffer) => {
      output += decodeChunk(d)
    })
    child.stderr.on('data', (d: Buffer) => {
      output += decodeChunk(d)
    })
    child.on('error', (err) => {
      output += `\n${err.message}`
      resolve({ code: 1, output })
    })
    child.on('close', (code) => resolve({ code, output }))
  })
}

function mavenMainClass(root: string): string | null {
  const pom = join(root, 'pom.xml')
  if (!existsSync(pom)) return null
  const xml = readFileSync(pom, 'utf8')
  const exec =
    xml.match(
      /<artifactId>\s*exec-maven-plugin\s*<\/artifactId>[\s\S]*?<mainClass>\s*([^<]+)\s*<\/mainClass>/
    ) || xml.match(/<exec.mainClass>\s*([^<]+)\s*<\/exec.mainClass>/)
  return exec?.[1]?.trim() || null
}

function sourceRootHint(root: string): string {
  const mavenSrc = join(root, 'src', 'main', 'java')
  if (existsSync(mavenSrc)) return mavenSrc
  const src = join(root, 'src')
  if (existsSync(src)) return src
  return root
}

export async function compileProject(): Promise<CompileResult> {
  const root = getRoot()
  if (!root) {
    return {
      ok: false,
      output: '',
      diagnostics: [],
      mainClasses: [],
      projectKind: 'folder',
      classpath: null,
      notice: 'NO_PROJECT'
    }
  }

  const tool = await detectToolchain()
  const isMaven = existsSync(join(root, 'pom.xml'))
  const kind: ProjectKind = isMaven ? 'maven' : 'folder'
  const mainClasses = scanMainClasses(root)

  if (isMaven) {
    if (!tool.maven) {
      return {
        ok: false,
        output: '',
        diagnostics: [],
        mainClasses,
        projectKind: kind,
        classpath: null,
        notice: 'MAVEN_NOT_FOUND'
      }
    }
    const result = await runProcess(tool.maven, ['-q', 'compile'], root, tool.javaHome)
    return {
      ok: result.code === 0,
      output: result.output,
      diagnostics: parseJavac(result.output),
      mainClasses,
      projectKind: kind,
      classpath: join(root, 'target', 'classes'),
      notice: result.output.trim() ? undefined : result.code === 0 ? 'MAVEN_OK' : 'MAVEN_FAIL'
    }
  }

  if (!tool.javac) {
    return {
      ok: false,
      output: '',
      diagnostics: [],
      mainClasses,
      projectKind: kind,
      classpath: null,
      notice: 'JDK_NOT_FOUND'
    }
  }

  const files = walkJava(sourceRootHint(root))
  if (files.length === 0) {
    return {
      ok: false,
      output: '',
      diagnostics: [],
      mainClasses,
      projectKind: kind,
      classpath: null,
      notice: 'NO_JAVA_FILES'
    }
  }

  const outDir = join(root, 'out')
  mkdirSync(outDir, { recursive: true })
  const listFile = join(tmpdir(), `jcat-sources-${process.pid}.txt`)
  writeFileSync(listFile, files.map((file) => file.replace(/\\/g, '/')).join('\n'), 'utf8')

  const result = await runProcess(
    tool.javac,
    ['-encoding', 'UTF-8', '-d', outDir, `@${listFile}`],
    root,
    tool.javaHome
  )
  const output = result.output
  return {
    ok: result.code === 0,
    output,
    diagnostics: parseJavac(output),
    mainClasses,
    projectKind: kind,
    classpath: outDir,
    notice: output.trim() ? undefined : result.code === 0 ? 'JAVAC_OK' : 'JAVAC_FAIL',
    noticeParam: result.code === 0 ? String(files.length) : undefined
  }
}

let traceDir: string | null = null

function wipeTraceDir(): void {
  if (!traceDir) return
  try {
    rmSync(traceDir, { recursive: true, force: true })
  } catch {
    /* leftover temp is harmless */
  }
  traceDir = null
}

async function compileInstrumented(
  root: string,
  javac: string,
  javaHome: string | null
): Promise<string | null> {
  wipeTraceDir()
  const srcRoot = sourceRootHint(root)
  const files = walkJava(srcRoot)
  if (files.length === 0) return null

  traceDir = mkdtempSync(join(tmpdir(), 'jcat-trace-'))
  const srcDir = join(traceDir, 'src')
  const outDir = join(traceDir, 'classes')
  mkdirSync(srcDir, { recursive: true })
  mkdirSync(outDir, { recursive: true })

  const copies: string[] = []
  let changed = false
  for (const file of files) {
    const rel = relative(srcRoot, file)
    const dest = join(srcDir, rel)
    mkdirSync(dirname(dest), { recursive: true })
    const original = readFileSync(file, 'utf8')
    const { source } = instrumentJava(original)
    if (source !== original) changed = true
    writeFileSync(dest, source, 'utf8')
    copies.push(dest)
  }
  if (!changed) {
    wipeTraceDir()
    return null
  }

  const snapFile = join(srcDir, 'jcat', 'JcatSnap.java')
  mkdirSync(dirname(snapFile), { recursive: true })
  writeFileSync(snapFile, JCAT_SNAP_JAVA, 'utf8')
  copies.push(snapFile)

  const listFile = join(traceDir, 'sources.txt')
  writeFileSync(listFile, copies.map((file) => file.replace(/\\/g, '/')).join('\n'), 'utf8')
  const result = await runProcess(
    javac,
    ['-encoding', 'UTF-8', '-d', outDir, `@${listFile}`],
    srcDir,
    javaHome
  )
  if (result.code !== 0) {
    wipeTraceDir()
    return null
  }
  return outDir
}

function attachRunIO(
  child: ChildProcessWithoutNullStreams,
  onData: (stream: 'stdout' | 'stderr', text: string) => void,
  onExit: (code: number | null) => void,
  onTrace?: (event: TraceEvent) => void
): void {
  let errBuf = ''
  const flushErr = (final: boolean): void => {
    const parts = errBuf.split(/\r?\n/)
    if (!final) errBuf = parts.pop() ?? ''
    else {
      errBuf = ''
      if (parts.length && parts[parts.length - 1] === '') parts.pop()
    }
    let user = ''
    for (const line of parts) {
      const ev = parseTraceLine(line)
      if (ev) onTrace?.(ev)
      else user += `${line}\n`
    }
    if (user) onData('stderr', user)
  }

  child.stdout.on('data', (d: Buffer) => onData('stdout', decodeChunk(d)))
  child.stderr.on('data', (d: Buffer) => {
    errBuf += decodeChunk(d)
    flushErr(false)
  })
  child.on('error', (err) => {
    onData('stderr', err.message + '\n')
    onExit(1)
    running = null
  })
  child.on('close', (code) => {
    flushErr(true)
    running = null
    onExit(code)
  })
}

export function writeStdin(text: string): boolean {
  if (!running?.stdin || running.stdin.destroyed) return false
  let line = text.endsWith('\n') ? text : `${text}\n`
  if (process.platform === 'win32') line = line.replace(/(?<!\r)\n/g, '\r\n')
  return running.stdin.write(line, 'utf8')
}

export function stopRun(): void {
  if (!running) return
  const proc = running
  running = null
  try {
    proc.stdin.end()
  } catch {
    /* already closed */
  }
  if (process.platform === 'win32' && proc.pid) {
    spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true })
  } else {
    proc.kill('SIGTERM')
  }
}

export async function runMain(
  mainClass: string | undefined,
  onData: (stream: 'stdout' | 'stderr', text: string) => void,
  onExit: (code: number | null) => void,
  onCompiled?: (result: CompileResult) => void,
  replay?: string,
  onTrace?: (event: TraceEvent) => void,
  onNotice?: (code: AppNoticeCode) => void
): Promise<void> {
  stopRun()
  const root = getRoot()
  if (!root) {
    onNotice?.('NO_PROJECT')
    onExit(1)
    return
  }

  const compiled = await compileProject()
  onCompiled?.(compiled)
  if (!compiled.ok) {
    if (compiled.notice) onNotice?.(compiled.notice)
    if (compiled.output) onData('stderr', compiled.output + (compiled.output.endsWith('\n') ? '' : '\n'))
    onExit(1)
    return
  }

  const tool = await detectToolchain()
  const cls = mainClass || compiled.mainClasses[0]
  if (!cls) {
    onNotice?.('NO_MAIN')
    onExit(1)
    return
  }

  const env = spawnEnv(tool.javaHome)
  if (compiled.projectKind === 'maven' && tool.maven && mavenMainClass(root)) {
    running = spawn(
      tool.maven,
      ['-q', 'exec:java', `-Dexec.mainClass=${cls}`],
      spawnOpts(tool.maven, root, env)
    )
  } else {
    if (!tool.java) {
      onNotice?.('JAVA_NOT_FOUND')
      onExit(1)
      return
    }
    let cp = compiled.classpath || join(root, 'out')
    if (compiled.projectKind === 'folder' && tool.javac) {
      const traced = await compileInstrumented(root, tool.javac, tool.javaHome)
      if (traced) cp = traced
    }
    running = spawn(tool.java, ['-cp', cp, cls], spawnOpts(tool.java, root, env))
  }

  attachRunIO(running, onData, onExit, onTrace)
  if (replay?.trim()) writeStdin(replay)
}

export function relativeToRoot(file: string): string {
  const root = getRoot()
  if (!root) return basename(file)
  return relative(root, file).split(sep).join('/')
}
