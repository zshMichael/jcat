import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EXPORT_MIN_CARD_WIDTH,
  cardWidthForCode,
  expandExportTabs,
  moveExportOrder,
  pngScaleToMaxWidth
} from './exportLayout'

describe('exportLayout', () => {
  it('widens the card when a line is longer than the floor', () => {
    assert.equal(cardWidthForCode(1600, false) > EXPORT_MIN_CARD_WIDTH, true)
  })

  it('keeps the old card wide enough for the header', () => {
    assert.equal(cardWidthForCode(100, false), EXPORT_MIN_CARD_WIDTH)
    assert.equal(EXPORT_MIN_CARD_WIDTH, 880)
  })

  it('omits the line-number gutter when lines are hidden', () => {
    assert.equal(cardWidthForCode(900, true) < cardWidthForCode(900, false), true)
  })

  it('scales a too-wide png down without stretching', () => {
    assert.equal(pngScaleToMaxWidth(2000), 1)
    assert.equal(pngScaleToMaxWidth(5760), 0.5)
  })

  it('moves a card without dropping the others', () => {
    assert.deepEqual(moveExportOrder(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a'])
    assert.deepEqual(moveExportOrder(['a', 'b'], 1, 1), ['a', 'b'])
  })

  it('expands tabs before measuring', () => {
    assert.equal(expandExportTabs('\tfoo'), '    foo')
  })
})
