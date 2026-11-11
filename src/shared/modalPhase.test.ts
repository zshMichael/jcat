import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nextModalPhase } from './modalPhase'

describe('nextModalPhase', () => {
  it('shows a dialog that is asked to open while it is unmounted', () => {
    assert.equal(nextModalPhase('closed', true), 'in')
  })

  it('reopens a dialog that is still fading out', () => {
    assert.equal(nextModalPhase('out', true), 'in')
  })

  it('starts leaving only from the visible phase', () => {
    assert.equal(nextModalPhase('in', false), 'out')
    assert.equal(nextModalPhase('out', false), 'out')
    assert.equal(nextModalPhase('closed', false), 'closed')
  })
})
