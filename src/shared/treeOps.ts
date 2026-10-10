import type { FileNode } from './types'

export function filterJavaTree(nodes: FileNode[]): FileNode[] {
  const out: FileNode[] = []
  for (const node of nodes) {
    if (node.isDir) {
      const children = filterJavaTree(node.children ?? [])
      if (children.length) out.push({ ...node, children })
      continue
    }
    if (node.name.toLowerCase().endsWith('.java')) out.push(node)
  }
  return out
}

function parentOf(path: string): string {
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return i <= 0 ? '' : path.slice(0, i)
}

function sepOf(path: string): string {
  return path.includes('\\') && !path.includes('/') ? '\\' : '/'
}

export function dropDirectory(
  from: string,
  targetPath: string,
  targetIsDir: boolean
): string | null {
  if (!from || !targetPath || from === targetPath) return null
  const dest = targetIsDir ? targetPath : parentOf(targetPath)
  if (!dest || dest === from || dest === parentOf(from)) return null
  const sep = sepOf(from)
  const prefix = from.endsWith(sep) ? from : from + sep
  if (dest.startsWith(prefix)) return null
  return dest
}
