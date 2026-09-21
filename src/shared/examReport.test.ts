import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addedTokens, snapshotFromFiles } from './examReport'

describe('examReport', () => {
  it('reports only tokens added during the exam', () => {
    const before = snapshotFromFiles([
      { path: '/p/A.java', text: 'import java.util.HashMap;\nclass A { HashMap m; }' }
    ])
    const after = snapshotFromFiles([
      { path: '/p/A.java', text: 'import java.util.HashMap;\nimport java.util.HashSet;\nclass A { HashMap m; HashSet s; }' },
      { path: '/p/B.java', text: 'class B { java.util.LinkedList x; }' }
    ])
    const added = addedTokens(before, after)
    assert.ok(added.includes('HashSet'))
    assert.ok(!added.includes('HashMap'))
    assert.ok(added.includes('LinkedList'))
  })

  it('does not crash on empty scans', () => {
    assert.deepEqual(addedTokens({}, {}), [])
    assert.deepEqual(snapshotFromFiles([]), {})
  })
})
