import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertMultiArchWindows,
  expectedWindowsNames,
  nsisListingHasArch,
  nsisPayloadPath
} from './releaseArtifacts'

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

  it('detects electron-builder NSIS app-64 and app-arm64 payloads', () => {
    const listing = ['Path = $PLUGINSDIR\\app-arm64.7z', 'Path = $PLUGINSDIR\\app-64.7z'].join('\n')
    assert.equal(nsisListingHasArch(listing, 'x64'), true)
    assert.equal(nsisListingHasArch(listing, 'arm64'), true)
    const x64Only = 'Path = $PLUGINSDIR\\app-64.7z\n'
    assert.equal(nsisListingHasArch(x64Only, 'x64'), true)
    assert.equal(nsisListingHasArch(x64Only, 'arm64'), false)
    assert.equal(nsisPayloadPath(listing, 'x64'), '$PLUGINSDIR\\app-64.7z')
    assert.equal(nsisPayloadPath(listing, 'arm64'), '$PLUGINSDIR\\app-arm64.7z')
  })
})
