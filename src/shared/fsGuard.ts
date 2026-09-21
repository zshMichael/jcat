import { isAbsolute, relative, resolve } from 'path'

/** True when `target` resolves inside `root` (no `..` escape, no other drive). */
export function isInsideDir(root: string, target: string): boolean {
  const resolvedRoot = resolve(root)
  const resolvedTarget = resolve(target)
  const rel = relative(resolvedRoot, resolvedTarget)
  if (rel === '') return true
  if (isAbsolute(rel)) return false
  return !rel.split(/[/\\]/).includes('..')
}
