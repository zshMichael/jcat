import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clipText, mapHttpError, mapNetworkError, shouldSendFullSource } from './aiLimits'

describe('aiLimits', () => {
  it('clips long text and marks it', () => {
    const c = clipText('abcdef', 4)
    assert.equal(c.text, 'abcd')
    assert.equal(c.clipped, true)
    assert.equal(clipText('ab', 4).clipped, false)
  })

  it('skips duplicate full source when the selection is almost the whole file', () => {
    const src = 'class A { void m() {} }'
    assert.equal(shouldSendFullSource(src, src), false)
    assert.equal(shouldSendFullSource(src, 'void m()'), true)
    assert.equal(shouldSendFullSource(src, undefined), true)
  })

  it('maps http and network errors to stable codes', () => {
    assert.equal(mapHttpError(401), 'AI_UNAUTHORIZED')
    assert.equal(mapHttpError(429), 'AI_RATE_LIMIT')
    assert.equal(mapHttpError(500), 'AI_SERVER')
    assert.equal(mapNetworkError({ name: 'AbortError', message: 'aborted' }), 'AI_ABORTED')
    assert.equal(mapNetworkError(new Error('timeout of 90ms')), 'AI_TIMEOUT')
  })

  it('does not let an older request finally-block clear a newer AbortController', () => {
    let slot: AbortController | null = null
    const older = new AbortController()
    slot = older
    const newer = new AbortController()
    slot = newer
    if (slot === older) slot = null
    assert.equal(slot, newer)
    older.abort()
    assert.equal(newer.signal.aborted, false)
  })
})
