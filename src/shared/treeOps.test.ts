import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { FileNode } from './types'
import { dropDirectory, filterJavaTree } from './treeOps'

const file = (path: string, name: string): FileNode => ({
  path,
  name,
  isDir: false,
  mtime: 0
})
const dir = (path: string, name: string, children: FileNode[]): FileNode => ({
  path,
  name,
  isDir: true,
  mtime: 0,
  children
})

describe('filterJavaTree', () => {
  it('keeps java files and folders that still contain them', () => {
    const tree = [
      dir('/p/src', 'src', [
        file('/p/src/A.java', 'A.java'),
        file('/p/src/notes.txt', 'notes.txt')
      ]),
      dir('/p/empty', 'empty', [file('/p/empty/readme.md', 'readme.md')]),
      file('/p/Main.java', 'Main.java')
    ]
    const next = filterJavaTree(tree)
    assert.deepEqual(
      next.map((node) => node.name),
      ['src', 'Main.java']
    )
    assert.equal(next[0].children?.length, 1)
    assert.equal(next[0].children?.[0].name, 'A.java')
  })
})

describe('dropDirectory', () => {
  it('moves a file into a folder and out to its parent', () => {
    assert.equal(dropDirectory('/p/src/A.java', '/p/lab', true), '/p/lab')
    assert.equal(dropDirectory('/p/src/A.java', '/p', true), '/p')
  })

  it('refuses a no-op and a drop into itself', () => {
    assert.equal(dropDirectory('/p/src/A.java', '/p/src/B.java', false), null)
    assert.equal(dropDirectory('/p/src', '/p/src/lab', true), null)
    assert.equal(dropDirectory('/p/src', '/p/src', true), null)
  })
})
