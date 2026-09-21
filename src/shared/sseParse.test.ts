import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { consumeSse, flushSse } from './sseParse'

describe('sseParse', () => {
  it('joins chunks that split a data line', () => {
    const a = consumeSse('', 'data: {"choices":[{"delta":{"content":"Hel')
    assert.equal(a.events.length, 0)
    const b = consumeSse(a.rest, 'lo"}}]}\n')
    assert.equal(b.events[0]?.content, 'Hello')
  })

  it('ignores keep-alive comments and blank lines', () => {
    const { events } = consumeSse(
      '',
      ': keep-alive\n\ndata: {"choices":[{"delta":{"content":"x"}}]}\n'
    )
    assert.equal(events.length, 1)
    assert.equal(events[0]?.content, 'x')
  })

  it('handles [DONE]', () => {
    const { events } = consumeSse('', 'data: [DONE]\n')
    assert.equal(events[0]?.done, true)
  })

  it('flushes a last buffer without a trailing newline', () => {
    const { rest } = consumeSse('', 'data: {"choices":[{"delta":{"content":"z"}}]}')
    const flushed = flushSse(rest)
    assert.equal(flushed[0]?.content, 'z')
  })
})
