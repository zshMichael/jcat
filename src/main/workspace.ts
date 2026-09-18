import { BrowserWindow, dialog } from 'electron'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  type Stats
} from 'fs'
import { basename, dirname, join } from 'path'
import type { FileNode } from '../shared/types'

const SKIP = new Set([
  '.git',
  'node_modules',
  'out',
  'target',
  'dist',
  '.idea',
  '.jcat',
  '__pycache__'
])

let currentRoot: string | null = null

export function getRoot(): string | null {
  return currentRoot
}

export function setRoot(root: string | null): void {
  currentRoot = root
}

export async function pickFolder(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    title: '打开 Java 工程',
    properties: ['openDirectory']
  })
  if (result.canceled || !result.filePaths[0]) return null
  currentRoot = result.filePaths[0]
  return currentRoot
}

export function readTree(dir = currentRoot, depth = 0): FileNode[] {
  if (!dir || !existsSync(dir) || depth > 12) return []
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  const nodes: FileNode[] = []
  for (const name of names.sort((a, b) => a.localeCompare(b))) {
    if (name.startsWith('.') && name !== '.gitignore') continue
    if (SKIP.has(name)) continue
    if (name.endsWith('.class')) continue
    const path = join(dir, name)
    let st: Stats
    try {
      st = statSync(path)
    } catch {
      continue
    }
    const isDir = st.isDirectory()
    const node: FileNode = { name, path, isDir, mtime: st.mtimeMs }
    if (isDir) node.children = readTree(path, depth + 1)
    nodes.push(node)
  }
  return nodes
}

export function readText(file: string): string {
  return readFileSync(file, 'utf8')
}

export function writeText(file: string, content: string): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content, 'utf8')
}

export function createFile(file: string, content = ''): void {
  mkdirSync(dirname(file), { recursive: true })
  if (!existsSync(file)) writeFileSync(file, content, 'utf8')
}

export function createFolder(dir: string): void {
  mkdirSync(dir, { recursive: true })
}

export function fileName(file: string): string {
  return basename(file)
}
