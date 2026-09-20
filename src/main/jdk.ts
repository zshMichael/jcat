import { execFile } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
import { loadSettings } from './settings'
import type { Toolchain } from '../shared/types'

const execFileAsync = promisify(execFile)

function usesShell(cmd: string): boolean {
  return process.platform === 'win32' && /\.(cmd|bat)$/i.test(cmd)
}

async function run(cmd: string, args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync(cmd, args, {
    timeout: 8000,
    windowsHide: true,
    shell: usesShell(cmd)
  })
  return `${stdout}${stderr}`.trim()
}

function whichName(name: string): string {
  return process.platform === 'win32' ? `${name}.exe` : name
}

async function resolveOnPath(bin: string): Promise<string | null> {
  const finder = process.platform === 'win32' ? 'where' : 'which'
  try {
    const out = await run(finder, [bin])
    const first = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean)
    return first || null
  } catch {
    return null
  }
}

function binInHome(home: string, name: string): string | null {
  const file = join(home, 'bin', whichName(name))
  return existsSync(file) ? file : null
}

function lookInDir(root: string): string | null {
  if (!existsSync(root)) return null
  if (binInHome(root, 'javac')) return root
  let names: string[]
  try {
    names = readdirSync(root)
  } catch {
    return null
  }
  names.sort().reverse()
  for (const name of names) {
    const home = join(root, name)
    if (binInHome(home, 'javac')) return home
  }
  return null
}

function findWindowsJavaHome(): string {
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  const localApp = process.env['LOCALAPPDATA'] || join(homedir(), 'AppData', 'Local')
  const roots = [
    join(programFiles, 'Java'),
    join(programFiles, 'Eclipse Adoptium'),
    join(programFiles, 'AdoptOpenJDK'),
    join(programFiles, 'Microsoft'),
    join(programFiles, 'Amazon Corretto'),
    join(programFiles, 'Zulu'),
    join(programFiles, 'BellSoft'),
    join(programFiles, 'OpenJDK'),
    join(programFilesX86, 'Java'),
    join(localApp, 'Programs', 'Eclipse Adoptium'),
    join(localApp, 'Programs', 'Microsoft'),
    join(homedir(), '.jdks')
  ]
  for (const root of roots) {
    const hit = lookInDir(root)
    if (hit) return hit
  }
  return ''
}

export async function detectToolchain(): Promise<Toolchain> {
  const settings = loadSettings()
  let javaHome = settings.jdkHome.trim() || process.env.JAVA_HOME || ''

  if (!javaHome && process.platform === 'darwin') {
    try {
      javaHome = (await run('/usr/libexec/java_home', [])).split('\n')[0].trim()
    } catch {
      javaHome = ''
    }
  }
  if (!javaHome && process.platform === 'win32') {
    javaHome = findWindowsJavaHome()
  }

  let javac = javaHome ? binInHome(javaHome, 'javac') : null
  let java = javaHome ? binInHome(javaHome, 'java') : null
  if (!javac) javac = await resolveOnPath(whichName('javac'))
  if (!java) java = await resolveOnPath(whichName('java'))

  if (!javaHome && java) {
    javaHome = join(java, '..', '..')
  }

  let javaVersion: string | null = null
  if (java) {
    try {
      const ver = await run(java, ['-version'])
      javaVersion = ver.split('\n')[0] || ver
    } catch {
      javaVersion = null
    }
  }

  const mavenSetting = settings.mavenPath.trim()
  let maven: string | null = mavenSetting || null
  if (maven && !existsSync(maven)) maven = null
  if (!maven) {
    maven =
      (await resolveOnPath(process.platform === 'win32' ? 'mvn.cmd' : 'mvn')) ||
      (await resolveOnPath('mvn'))
  }

  let mavenVersion: string | null = null
  if (maven) {
    try {
      const ver = await run(maven, ['-v'])
      mavenVersion = ver.split('\n')[0] || ver
    } catch {
      mavenVersion = null
    }
  }

  return {
    javaHome: javaHome || null,
    javaVersion,
    javac,
    java,
    maven,
    mavenVersion
  }
}
