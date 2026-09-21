import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isInsideDir } from './fsGuard'
import { join } from 'node:path'

describe('fsGuard', () => {
  it('accepts files under the root and rejects parent escapes', () => {
    const root = '/tmp/jcat-project'
    assert.equal(isInsideDir(root, join(root, 'Main.java')), true)
    assert.equal(isInsideDir(root, join(root, 'src', 'A.java')), true)
    assert.equal(isInsideDir(root, join(root, '..', 'outside.java')), false)
    assert.equal(isInsideDir(root, '/etc/passwd'), false)
  })
})
