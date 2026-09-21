import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EXPORT_MIN_CARD_WIDTH,
  cardWidthForCode,
  expandExportTabs,
  pngScaleToMaxWidth
} from './exportLayout'

describe('exportLayout', () => {
  it('widens the card for a long unwrapped line', () => {
    const longPx = 1600
    assert.equal(cardWidthForCode(longPx, false) > EXPORT_MIN_CARD_WIDTH, true)
    assert.equal(cardWidthForCode(100, false), EXPORT_MIN_CARD_WIDTH)
  })

  it('omits the line-number gutter when lines are hidden', () => {
    assert.equal(cardWidthForCode(900, true) < cardWidthForCode(900, false), true)
  })

  it('scales a too-wide png down without stretching', () => {
    assert.equal(pngScaleToMaxWidth(2000), 1)
    assert.equal(pngScaleToMaxWidth(5760), 0.5)
  })

  it('expands tabs before measuring', () => {
    assert.equal(expandExportTabs('\tfoo'), '    foo')
  })
})
