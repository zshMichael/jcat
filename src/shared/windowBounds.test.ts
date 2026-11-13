import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { initialWindowBounds } from './windowBounds'

describe('initialWindowBounds', () => {
  it('opens across most of a 27-inch 2K work area', () => {
    const work = { x: 0, y: 0, width: 2560, height: 1392 }
    const bounds = initialWindowBounds(work)
    assert.equal(bounds.width / work.width >= 0.9, true)
    assert.equal(bounds.height / work.height >= 0.9, true)
    assert.equal(bounds.width <= work.width - 48, true)
    assert.equal(bounds.height <= work.height - 48, true)
    assert.equal(bounds.x, Math.round((work.width - bounds.width) / 2))
    assert.equal(bounds.y, Math.round((work.height - bounds.height) / 2))
  })

  it('stays inside a small laptop work area', () => {
    const bounds = initialWindowBounds({ x: 0, y: 0, width: 1280, height: 720 })
    assert.equal(bounds.width <= 1280 - 48, true)
    assert.equal(bounds.height <= 720 - 48, true)
    assert.equal(bounds.x >= 0, true)
    assert.equal(bounds.y >= 0, true)
  })

  it('keeps a secondary display offset', () => {
    const bounds = initialWindowBounds({ x: 1920, y: 40, width: 1920, height: 1040 })
    assert.equal(bounds.x >= 1920, true)
    assert.equal(bounds.y >= 40, true)
  })
})
