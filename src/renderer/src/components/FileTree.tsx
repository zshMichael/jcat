import type { FileNode } from '@shared/types'
import { useMemo, useState, type JSX } from 'react'

export type TreeSort = 'name' | 'type' | 'mtime'

type Props = {
  nodes: FileNode[]
  active: string | null
  onOpen: (path: string) => void
  onNewFile: () => void
  onNewFolder: () => void
}

function extOf(node: FileNode): string {
  if (node.isDir) return ''
  const i = node.name.lastIndexOf('.')
  return i >= 0 ? node.name.slice(i + 1).toLowerCase() : ''
}

function isJava(node: FileNode): boolean {
  return !node.isDir && node.name.toLowerCase().endsWith('.java')
}

function sortNodes(nodes: FileNode[], sort: TreeSort, javaFirst: boolean): FileNode[] {
  const copy = nodes.map((node) => ({
    ...node,
    children: node.children ? sortNodes(node.children, sort, javaFirst) : undefined
  }))
  copy.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    if (javaFirst && !a.isDir && !b.isDir) {
      const aj = isJava(a)
      const bj = isJava(b)
      if (aj !== bj) return aj ? -1 : 1
    }
    if (sort === 'type') {
      const d = extOf(a).localeCompare(extOf(b), 'zh')
      if (d) return d
    }
    if (sort === 'mtime') return (b.mtime || 0) - (a.mtime || 0)
    return a.name.localeCompare(b.name, 'zh')
  })
  return copy
}

export function FileTree({ nodes, active, onOpen, onNewFile, onNewFolder }: Props): JSX.Element {
  const [sort, setSort] = useState<TreeSort>('name')
  const [javaFirst, setJavaFirst] = useState(false)
  const ordered = useMemo(() => sortNodes(nodes, sort, javaFirst), [javaFirst, nodes, sort])

  return (
    <aside className="filetree">
      <div className="filetree-head">
        <h2>工程</h2>
        <select
          className="tree-sort"
          value={sort}
          title="排序方式"
          aria-label="工程排序"
          onChange={(e) => setSort(e.target.value as TreeSort)}
        >
          <option value="name">名称</option>
          <option value="type">类型</option>
          <option value="mtime">时间</option>
        </select>
      </div>
      <div className="filetree-tools">
        <button type="button" title="新建文件" onClick={onNewFile}>
          新建文件
        </button>
        <button type="button" title="新建文件夹" onClick={onNewFolder}>
          新建文件夹
        </button>
      </div>
      <label className="java-filter">
        <input
          type="checkbox"
          checked={javaFirst}
          onChange={(e) => setJavaFirst(e.target.checked)}
        />
        筛选 Java 文件
      </label>
      {ordered.length === 0 ? (
        <div className="tree-item muted">打开或新建一个 Java 文件</div>
      ) : null}
      {ordered.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          active={active}
          onOpen={onOpen}
          depth={0}
          javaFirst={javaFirst}
        />
      ))}
    </aside>
  )
}

function TreeNode({
  node,
  active,
  onOpen,
  depth,
  javaFirst
}: {
  node: FileNode
  active: string | null
  onOpen: (path: string) => void
  depth: number
  javaFirst: boolean
}): JSX.Element {
  const [open, setOpen] = useState(depth < 2)
  if (node.isDir) {
    return (
      <div>
        <div className="tree-item" onClick={() => setOpen((v) => !v)}>
          <span className="chev">{open ? '▾' : '▸'}</span>
          {node.name}
        </div>
        {open ? (
          <div className="tree-children">
            {(node.children || []).map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                active={active}
                onOpen={onOpen}
                depth={depth + 1}
                javaFirst={javaFirst}
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }
  return (
    <div
      className={`tree-item ${active === node.path ? 'active' : ''} ${javaFirst && isJava(node) ? 'java-pin' : ''}`}
      onClick={() => onOpen(node.path)}
    >
      {node.name}
    </div>
  )
}
