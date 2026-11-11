export type ProjectLayout = {
  /** `single`: the opened folder is one project, including its subfolders. */
  mode: 'single' | 'workspace'
  /**
   * Compilation units. `''` means the opened folder itself.
   * In a workspace, each name is a child folder.
   */
  projects: string[]
}

/**
 * One opened folder is a project when the sources live in that folder
 * (or in a single child such as `src`). It is a workspace when the sources
 * are split across two or more child folders: each child is its own project,
 * compiled and run on its own, the way Eclipse and IntelliJ keep modules apart.
 * A loose `.java` file next to those projects does not pull the projects together.
 */
export function projectLayout(javaPaths: string[], hasPom = false): ProjectLayout {
  const children = new Set<string>()
  for (const raw of javaPaths) {
    const path = raw.replace(/\\/g, '/').replace(/^\.\//, '')
    if (!path || path.endsWith('/')) continue
    const slash = path.indexOf('/')
    if (slash >= 0) children.add(path.slice(0, slash))
  }
  const projects = [...children].sort((a, b) => a.localeCompare(b))
  if (hasPom || projects.length < 2) return { mode: 'single', projects: [''] }
  return { mode: 'workspace', projects }
}

/** Child project that owns `javaPath`, or `''` when the opened folder is the project. */
export function projectOf(layout: ProjectLayout, javaPath: string): string {
  if (layout.mode === 'single') return ''
  const path = javaPath.replace(/\\/g, '/').replace(/^\.\//, '')
  const slash = path.indexOf('/')
  if (slash < 0) return ''
  const top = path.slice(0, slash)
  return layout.projects.includes(top) ? top : ''
}
