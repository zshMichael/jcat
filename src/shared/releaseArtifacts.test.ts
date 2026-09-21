import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assertMultiArchWindows, expectedWindowsNames } from './releaseArtifacts'

describe('releaseArtifacts', () => {
  it('rejects an auto installer that is a copy of x64', () => {
    const v = '1.1.1'
    const n = expectedWindowsNames(v)
    assert.throws(() =>
      assertMultiArchWindows(v, [
        { name: n.x64, size: 100, sha256: 'aaa' },
        { name: n.arm64, size: 90, sha256: 'bbb' },
        { name: n.auto, size: 200, sha256: 'aaa' }
      ])
    )
  })

  it('accepts a larger distinct multi-arch installer', () => {
    const v = '1.1.1'
    const n = expectedWindowsNames(v)
    assertMultiArchWindows(v, [
      { name: n.x64, size: 1000, sha256: 'aaa' },
      { name: n.arm64, size: 900, sha256: 'bbb' },
      { name: n.auto, size: 2000, sha256: 'ccc' }
    ])
  })
})
