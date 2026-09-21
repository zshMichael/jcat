import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { startNextDebugTurn, splitDebugTurns } from './debugParts'

describe('debugTurns', () => {
  it('does not insert a divider before the first reply', () => {
    assert.equal(startNextDebugTurn(''), '')
    assert.equal(startNextDebugTurn('   '), '')
  })

  it('separates a later analyze click from the previous reply', () => {
    const next = startNextDebugTurn('first reply')
    assert.equal(splitDebugTurns(next).length, 2)
    assert.equal(splitDebugTurns(next)[0], 'first reply')
    assert.equal(splitDebugTurns(next)[1], '')
  })
})
