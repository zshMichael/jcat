import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { basename, delimiter, join, relative, sep } from 'path'
import { detectToolchain } from './jdk'
import { getRoot } from './workspace'
import type { CompileResult, Diagnostic, ProjectKind } from '../shared/types'

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
    if (name === 'out' || name === 'target' || name === '.git' || name === 'node_modules') continue
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
  return env
}

function runProcess(
  command: string,
  args: string[],
  cwd: string,
  javaHome: string | null
): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      env: spawnEnv(javaHome)
    })
    let output = ''
    child.stdout.on('data', (d) => {
      output += d.toString()
    })
    child.stderr.on('data', (d) => {
      output += d.toString()
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
      output: '还没有打开工程。',
      diagnostics: [],
      mainClasses: [],
      projectKind: 'folder',
      classpath: null
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
        output: '没有找到 Maven。请在设置里填写 mvn 路径，或安装 Maven。',
        diagnostics: [],
        mainClasses,
        projectKind: kind,
        classpath: null
      }
    }
    const result = await runProcess(tool.maven, ['-q', 'compile'], root, tool.javaHome)
    const output =
      result.output || (result.code === 0 ? 'Maven compile 成功。' : 'Maven compile 失败。')
    return {
      ok: result.code === 0,
      output,
      diagnostics: parseJavac(output),
      mainClasses,
      projectKind: kind,
      classpath: join(root, 'target', 'classes')
    }
  }

  if (!tool.javac) {
    return {
      ok: false,
      output: '没有找到 JDK / javac。请安装 JDK，或在设置里填写 JAVA_HOME。',
      diagnostics: [],
      mainClasses,
      projectKind: kind,
      classpath: null
    }
  }

  const files = walkJava(sourceRootHint(root))
  if (files.length === 0) {
    return {
      ok: false,
      output: '这个文件夹里没有 .java 文件。',
      diagnostics: [],
      mainClasses,
      projectKind: kind,
      classpath: null
    }
  }

  const outDir = join(root, 'out')
  mkdirSync(outDir, { recursive: true })
  const listFile = join(tmpdir(), `jcat-sources-${process.pid}.txt`)
  writeFileSync(listFile, files.join('\n'), 'utf8')

  const result = await runProcess(
    tool.javac,
    ['-encoding', 'UTF-8', '-d', outDir, `@${listFile}`],
    root,
    tool.javaHome
  )
  const output =
    result.output || (result.code === 0 ? `javac 成功，${files.length} 个源文件。` : 'javac 失败。')
  return {
    ok: result.code === 0,
    output,
    diagnostics: parseJavac(output),
    mainClasses,
    projectKind: kind,
    classpath: outDir
  }
}

export function stopRun(): void {
  if (!running) return
  const proc = running
  running = null
  if (process.platform === 'win32' && proc.pid) {
    spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true })
  } else {
    proc.kill('SIGTERM')
  }
}

export async function runMain(
  mainClass: string | undefined,
  onData: (stream: 'stdout' | 'stderr', text: string) => void,
  onExit: (code: number | null) => void
): Promise<void> {
  stopRun()
  const root = getRoot()
  if (!root) {
    onData('stderr', '还没有打开工程。\n')
    onExit(1)
    return
  }

  const compiled = await compileProject()
  if (!compiled.ok) {
    onData('stderr', compiled.output + '\n')
    onExit(1)
    return
  }

  const tool = await detectToolchain()
  const cls = mainClass || compiled.mainClasses[0]
  if (!cls) {
    onData('stderr', '没有找到 public static void main。\n')
    onExit(1)
    return
  }

  const env = spawnEnv(tool.javaHome)
  if (compiled.projectKind === 'maven' && tool.maven && mavenMainClass(root)) {
    running = spawn(tool.maven, ['-q', 'exec:java', `-Dexec.mainClass=${cls}`], {
      cwd: root,
      windowsHide: true,
      env
    })
  } else {
    if (!tool.java) {
      onData('stderr', '没有找到 java 命令。\n')
      onExit(1)
      return
    }
    const cp = compiled.classpath || join(root, 'out')
    running = spawn(tool.java, ['-cp', cp, cls], {
      cwd: root,
      windowsHide: true,
      env
    })
  }

  running.stdout.on('data', (d) => onData('stdout', d.toString()))
  running.stderr.on('data', (d) => onData('stderr', d.toString()))
  running.on('error', (err) => {
    onData('stderr', err.message + '\n')
    onExit(1)
    running = null
  })
  running.on('close', (code) => {
    running = null
    onExit(code)
  })
}

export function relativeToRoot(file: string): string {
  const root = getRoot()
  if (!root) return basename(file)
  return relative(root, file).split(sep).join('/')
}
