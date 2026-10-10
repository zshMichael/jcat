import type { FileNode } from '@shared/types'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent
} from 'react'
import { dropDirectory, filterJavaTree } from '@shared/treeOps'
import type { Msg } from '../i18n'
import { AnimSelect } from './AnimSelect'

export type TreeSort = 'name' | 'type' | 'mtime'

type MenuState = { x: number; y: number; path: string; isDir: boolean }

type Props = {
  nodes: FileNode[]
  active: string | null
  projectRoot: string | null
  hasClipboard: boolean
  onOpen: (path: string) => void
  onNewFile: () => void
  onNewFolder: () => void
  onRename: (path: string, name: string) => void
  onDelete: (path: string) => void
  onCopy: (path: string) => void
  onCut: (path: string) => void
  onPaste: (target: string) => void
  onMove: (from: string, destDir: string) => void
  onCollapse: () => void
  onResizeStart: (clientX: number) => void
  t: (key: Msg) => string
}

function extOf(node: FileNode): string {
  if (node.isDir) return ''
  const i = node.name.lastIndexOf('.')
  return i >= 0 ? node.name.slice(i + 1).toLowerCase() : ''
}

function sortNodes(nodes: FileNode[], sort: TreeSort): FileNode[] {
  const copy = nodes.map((node) => ({
    ...node,
    children: node.children ? sortNodes(node.children, sort) : undefined
  }))
  copy.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    if (sort === 'type') {
      const d = extOf(a).localeCompare(extOf(b), 'zh')
      if (d) return d
    }
    if (sort === 'mtime') return (b.mtime || 0) - (a.mtime || 0)
    return a.name.localeCompare(b.name, 'zh')
  })
  return copy
}

export function FileTree({
  nodes,
  active,
  projectRoot,
  hasClipboard,
  onOpen,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onMove,
  onCollapse,
  onResizeStart,
  t
}: Props): JSX.Element {
  const [sort, setSort] = useState<TreeSort>('name')
  const [javaOnly, setJavaOnly] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [drag, setDrag] = useState<{
    path: string
    name: string
    x: number
    y: number
    dest: string | null
  } | null>(null)
  const pressRef = useRef<{
    timer: number
    x: number
    y: number
    path: string
    name: string
  } | null>(null)
  const dragRef = useRef(false)
  const dragLiveRef = useRef<{
    path: string
    name: string
    x: number
    y: number
    dest: string | null
  } | null>(null)
  const skipClickRef = useRef(false)
  const ordered = useMemo(() => {
    const visible = javaOnly ? filterJavaTree(nodes) : nodes
    return sortNodes(visible, sort)
  }, [javaOnly, nodes, sort])

  useEffect(() => {
    if (!menu) return
    const close = (): void => setMenu(null)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [menu])

  const openMenu = (e: MouseEvent, path: string, isDir: boolean): void => {
    e.preventDefault()
    e.stopPropagation()
    setSelected(path)
    const pad = 8
    const w = 148
    const h = 176
    setMenu({
      x: Math.min(e.clientX, window.innerWidth - w - pad),
      y: Math.min(e.clientY, window.innerHeight - h - pad),
      path,
      isDir
    })
  }

  const clearPress = (): void => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer)
    pressRef.current = null
  }

  const destAt = (x: number, y: number, from: string): string | null => {
    const hit = document.elementFromPoint(x, y)
    const row = hit?.closest('.tree-item') as HTMLElement | null
    if (row?.dataset.path) return dropDirectory(from, row.dataset.path, row.dataset.isdir === '1')
    if (hit?.closest('.filetree-body') && projectRoot) return dropDirectory(from, projectRoot, true)
    return null
  }

  const onTreePointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return
    const row = (e.target as HTMLElement).closest('.tree-item') as HTMLElement | null
    if (!row?.dataset.path || (e.target as HTMLElement).closest('input')) return
    const path = row.dataset.path
    const name = row.dataset.name || ''
    const timer = window.setTimeout(() => {
      const next = {
        path,
        name,
        x: e.clientX,
        y: e.clientY,
        dest: destAt(e.clientX, e.clientY, path)
      }
      dragRef.current = true
      dragLiveRef.current = next
      skipClickRef.current = true
      setDrag(next)
    }, 420)
    pressRef.current = { timer, x: e.clientX, y: e.clientY, path, name }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onTreePointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const press = pressRef.current
    if (press && !dragRef.current) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) clearPress()
      return
    }
    if (!dragRef.current) return
    setDrag((cur) => {
      if (!cur) return cur
      const next = {
        ...cur,
        x: e.clientX,
        y: e.clientY,
        dest: destAt(e.clientX, e.clientY, cur.path)
      }
      dragLiveRef.current = next
      return next
    })
  }

  const onTreePointerUp = (): void => {
    const current = dragRef.current ? dragLiveRef.current : null
    if (current?.dest) onMove(current.path, current.dest)
    if (dragRef.current) skipClickRef.current = true
    dragRef.current = false
    dragLiveRef.current = null
    setDrag(null)
    clearPress()
  }

  return (
    <aside className="filetree">
      <div className="filetree-head">
        <h2>{t('project')}</h2>
        <button type="button" className="tree-mini" title={t('collapseTree')} onClick={onCollapse}>
          {t('collapseTree')}
        </button>
        <AnimSelect
          value={sort}
          title={t('sort')}
          onChange={(id) => setSort(id as TreeSort)}
          options={[
            { id: 'name', label: t('sortName') },
            { id: 'type', label: t('sortType') },
            { id: 'mtime', label: t('sortMtime') }
          ]}
        />
      </div>
      <div className="filetree-tools">
        <button type="button" title={t('newFile')} onClick={onNewFile}>
          {t('newFile')}
        </button>
        <button type="button" title={t('newFolder')} onClick={onNewFolder}>
          {t('newFolder')}
        </button>
      </div>
      <label className="java-filter">
        <input type="checkbox" checked={javaOnly} onChange={(e) => setJavaOnly(e.target.checked)} />
        {t('filterJava')}
      </label>
      {ordered.length === 0 ? <div className="tree-item muted">{t('emptyTree')}</div> : null}
      <div
        className={`filetree-body ${drag?.dest === projectRoot ? 'is-drop' : ''}`}
        onPointerDown={onTreePointerDown}
        onPointerMove={onTreePointerMove}
        onPointerUp={onTreePointerUp}
        onPointerCancel={onTreePointerUp}
        onClickCapture={(e) => {
          if (!skipClickRef.current) return
          skipClickRef.current = false
          e.preventDefault()
          e.stopPropagation()
        }}
        onContextMenu={(e) => {
          if (e.target !== e.currentTarget || !projectRoot) return
          openMenu(e, projectRoot, true)
        }}
      >
        {ordered.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            active={active}
            selected={selected}
            editing={editing}
            dropPath={drag?.dest ?? null}
            depth={0}
            onSelect={setSelected}
            onOpen={onOpen}
            onStartRename={setEditing}
            onCommitRename={(path, name) => {
              setEditing(null)
              if (name && name !== nodeName(path)) onRename(path, name)
            }}
            onMenu={openMenu}
          />
        ))}
      </div>
      {menu ? (
        <div
          className="ctx-menu"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setEditing(menu.path)
              setMenu(null)
            }}
          >
            {t('rename')}
          </button>
          <button
            type="button"
            onClick={() => {
              onCut(menu.path)
              setMenu(null)
            }}
          >
            {t('cut')}
          </button>
          <button
            type="button"
            onClick={() => {
              onCopy(menu.path)
              setMenu(null)
            }}
          >
            {t('copy')}
          </button>
          <button
            type="button"
            disabled={!hasClipboard}
            onClick={() => {
              onPaste(menu.path)
              setMenu(null)
            }}
          >
            {t('paste')}
          </button>
          <button
            type="button"
            className="danger"
            disabled={!!projectRoot && menu.path === projectRoot}
            onClick={() => {
              onDelete(menu.path)
              setMenu(null)
            }}
          >
            {t('deleteFile')}
          </button>
        </div>
      ) : null}
      {drag ? (
        <div className="tree-item tree-drag-ghost" style={{ left: drag.x + 12, top: drag.y + 12 }}>
          {drag.name}
        </div>
      ) : null}
      <div
        className="tree-resizer"
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onResizeStart(e.clientX)
        }}
      />
    </aside>
  )
}

function nodeName(path: string): string {
  return path.split(/[/\\]/).pop() || path
}

function TreeNode({
  node,
  active,
  selected,
  editing,
  dropPath,
  depth,
  onSelect,
  onOpen,
  onStartRename,
  onCommitRename,
  onMenu
}: {
  node: FileNode
  active: string | null
  selected: string | null
  editing: string | null
  dropPath: string | null
  depth: number
  onSelect: (path: string) => void
  onOpen: (path: string) => void
  onStartRename: (path: string) => void
  onCommitRename: (path: string, name: string) => void
  onMenu: (e: MouseEvent, path: string, isDir: boolean) => void
}): JSX.Element {
  const [open, setOpen] = useState(depth < 2)
  const wasSelected = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isEditing = editing === node.path
  const isOn = selected === node.path || active === node.path

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const rowClass = `tree-item ${isOn ? 'active' : ''} ${dropPath === node.path ? 'is-drop' : ''}`

  const body = isEditing ? (
    <input
      ref={inputRef}
      className="tree-rename"
      defaultValue={node.name}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => onCommitRename(node.path, e.target.value.trim())}
      onKeyDown={(e) => {
        if (e.key === 'Enter')
          onCommitRename(node.path, (e.target as HTMLInputElement).value.trim())
        if (e.key === 'Escape') onCommitRename(node.path, node.name)
      }}
    />
  ) : (
    node.name
  )

  if (node.isDir) {
    return (
      <div>
        <div
          className={rowClass}
          data-path={node.path}
          data-isdir="1"
          data-name={node.name}
          onPointerDown={(e) => {
            if (e.detail === 1) wasSelected.current = selected === node.path
          }}
          onClick={() => {
            if (isEditing) return
            onSelect(node.path)
            setOpen((v) => !v)
          }}
          onDoubleClick={(e) => {
            e.preventDefault()
            if (wasSelected.current) onStartRename(node.path)
          }}
          onContextMenu={(e) => onMenu(e, node.path, true)}
        >
          <span className="chev">{open ? '▾' : '▸'}</span>
          {body}
        </div>
        <div className={`tree-children ${open ? 'is-open' : ''}`}>
          <div className="tree-children-inner">
            {(node.children || []).map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                active={active}
                selected={selected}
                editing={editing}
                dropPath={dropPath}
                depth={depth + 1}
                onSelect={onSelect}
                onOpen={onOpen}
                onStartRename={onStartRename}
                onCommitRename={onCommitRename}
                onMenu={onMenu}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={rowClass}
      data-path={node.path}
      data-isdir="0"
      data-name={node.name}
      onPointerDown={(e) => {
        if (e.detail === 1) wasSelected.current = selected === node.path || active === node.path
      }}
      onClick={() => {
        if (isEditing) return
        onSelect(node.path)
        onOpen(node.path)
      }}
      onDoubleClick={(e) => {
        e.preventDefault()
        if (wasSelected.current) onStartRename(node.path)
      }}
      onContextMenu={(e) => onMenu(e, node.path, false)}
    >
      {body}
    </div>
  )
}
