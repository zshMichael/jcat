import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EXAM_SEG_MS,
  idleSession,
  parseSession,
  reduce,
  serializeSession,
  settle
} from './examSession'

const T0 = 1_000_000

describe('examSession', () => {
  it('starts both segments at 90 minutes with an absolute deadline', () => {
    const t = reduce(idleSession(), { type: 'start', now: T0, projectRoot: '/p', baseline: {} })
    assert.equal(t.session.active, true)
    assert.equal(t.session.paused, false)
    assert.equal(t.session.seg, 'mcq')
    assert.equal(t.session.mcqRemainingMs, EXAM_SEG_MS)
    assert.equal(t.session.frqRemainingMs, EXAM_SEG_MS)
    assert.equal(t.session.deadlineAt, T0 + EXAM_SEG_MS)
  })

  it('subtracts real elapsed time on tick, not 1000ms steps', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = settle(session, T0 + 3500).session
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 3500)
    assert.equal(session.frqRemainingMs, EXAM_SEG_MS)
  })

  it('pause freezes remaining even if wall clock jumps', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = reduce(session, { type: 'pause', now: T0 + 5000 }).session
    assert.equal(session.paused, true)
    assert.equal(session.deadlineAt, null)
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 5000)
    session = settle(session, T0 + 60_000).session
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 5000)
  })

  it('resume continues from remaining with a new deadline', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = reduce(session, { type: 'pause', now: T0 + 8000 }).session
    session = reduce(session, { type: 'resume', now: T0 + 50_000 }).session
    assert.equal(session.paused, false)
    assert.equal(session.deadlineAt, T0 + 50_000 + (EXAM_SEG_MS - 8000))
    session = settle(session, T0 + 51_000).session
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 9000)
  })

  it('switch settles the old segment and keeps the other clock', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = reduce(session, { type: 'switch', now: T0 + 10_000, seg: 'frq' }).session
    assert.equal(session.seg, 'frq')
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 10_000)
    assert.equal(session.frqRemainingMs, EXAM_SEG_MS)
    session = settle(session, T0 + 12_000).session
    assert.equal(session.frqRemainingMs, EXAM_SEG_MS - 2000)
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 10_000)
  })

  it('never goes negative and notifies zero only once', () => {
    const started = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    const first = settle(started.session, T0 + EXAM_SEG_MS + 5000)
    assert.equal(first.session.mcqRemainingMs, 0)
    assert.equal(first.justZeroed, 'mcq')
    const second = settle(first.session, T0 + EXAM_SEG_MS + 8000)
    assert.equal(second.session.mcqRemainingMs, 0)
    assert.equal(second.justZeroed, null)
  })

  it('restart resets clocks, pause, segment and report baseline', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: { a: ['HashMap'] }
    })
    session = reduce(session, { type: 'pause', now: T0 + 1000 }).session
    session = reduce(session, { type: 'switch', now: T0 + 1000, seg: 'frq' }).session
    session = reduce(session, {
      type: 'restart',
      now: T0 + 2000,
      projectRoot: '/p',
      baseline: { a: [] }
    }).session
    assert.equal(session.paused, false)
    assert.equal(session.seg, 'mcq')
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS)
    assert.deepEqual(session.baseline, { a: [] })
  })

  it('sleep while running deducts real time on restore tick', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = reduce(session, { type: 'tick', now: T0 + 120_000 }).session
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 120_000)
  })

  it('sleep while paused does not deduct', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = reduce(session, { type: 'pause', now: T0 + 1000 }).session
    session = reduce(session, { type: 'tick', now: T0 + 120_000 }).session
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 1000)
  })

  it('round-trips JSON with schemaVersion', () => {
    const { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: { x: ['Foo'] }
    })
    const parsed = parseSession(JSON.parse(JSON.stringify(session)))
    assert.ok(parsed)
    assert.equal(parsed.schemaVersion, 1)
    assert.deepEqual(parsed.baseline, { x: ['Foo'] })
    assert.equal(parseSession({ schemaVersion: 99, active: true, seg: 'mcq' }), null)
  })

  it('drops extra fields such as apiKey when parsing', () => {
    const { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    const parsed = parseSession({
      ...session,
      apiKey: 'sk-should-not-persist',
      source: 'class X {}'
    })
    assert.ok(parsed)
    assert.equal('apiKey' in parsed, false)
    assert.equal('source' in parsed, false)
    const json = JSON.stringify(parsed)
    assert.equal(json.includes('sk-should-not-persist'), false)
  })

  it('treats corrupt payloads as unparsable', () => {
    assert.equal(parseSession('not-json'), null)
    assert.equal(parseSession(null), null)
    assert.equal(parseSession({ active: true }), null)
  })

  it('does not increase remaining when the clock jumps backward', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = settle(session, T0 + 10_000).session
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 10_000)
    session = settle(session, T0 - 3_600_000).session
    assert.equal(session.mcqRemainingMs, EXAM_SEG_MS - 10_000)
    assert.ok(session.mcqRemainingMs <= EXAM_SEG_MS)
    assert.ok(session.mcqRemainingMs >= 0)
  })

  it('finish and abandon clear persistence payload', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = reduce(session, { type: 'finish' }).session
    assert.equal(session.active, false)
    assert.equal(session.projectRoot, '')
  })

  it('does not go negative or above 90 minutes when the clock jumps forward', () => {
    let { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: {}
    })
    session = settle(session, T0 + EXAM_SEG_MS * 3).session
    assert.equal(session.mcqRemainingMs, 0)
    assert.equal(session.frqRemainingMs, EXAM_SEG_MS)
    assert.ok(session.mcqRemainingMs >= 0)
    assert.ok(session.frqRemainingMs <= EXAM_SEG_MS)
  })

  it('serializeSession keeps only exam fields', () => {
    const { session } = reduce(idleSession(), {
      type: 'start',
      now: T0,
      projectRoot: '/p',
      baseline: { '/p/Main.java': ['ArrayList'] }
    })
    const extra = { ...session, apiKey: 'sk-nope', source: 'class X {}' } as typeof session & {
      apiKey: string
      source: string
    }
    const packed = serializeSession(extra)
    assert.equal('apiKey' in packed, false)
    assert.equal('source' in packed, false)
    assert.equal(JSON.stringify(packed).includes('sk-nope'), false)
    assert.deepEqual(packed.baseline, { '/p/Main.java': ['ArrayList'] })
  })
})
