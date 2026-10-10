import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { initialWindowBounds } from './windowBounds'

describe('initialWindowBounds', () => {
  it('opens larger than the old fixed size on a 2K work area', () => {
    const bounds = initialWindowBounds({ x: 0, y: 0, width: 2560, height: 1400 })
    assert.equal(bounds.width > 1320, true)
    assert.equal(bounds.height > 860, true)
    assert.equal(bounds.width < 2560, true)
    assert.equal(bounds.height < 1400, true)
    assert.equal(bounds.x, Math.round((2560 - bounds.width) / 2))
    assert.equal(bounds.y, Math.round((1400 - bounds.height) / 2))
  })

  it('stays inside a small laptop work area', () => {
    const bounds = initialWindowBounds({ x: 0, y: 0, width: 1280, height: 720 })
    assert.equal(bounds.width <= 1280 - 32, true)
    assert.equal(bounds.height <= 720 - 32, true)
    assert.equal(bounds.x >= 0, true)
    assert.equal(bounds.y >= 0, true)
  })

  it('keeps a secondary display offset', () => {
    const bounds = initialWindowBounds({ x: 1920, y: 40, width: 1920, height: 1040 })
    assert.equal(bounds.x >= 1920, true)
    assert.equal(bounds.y >= 40, true)
  })
})