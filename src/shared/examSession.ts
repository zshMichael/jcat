export const EXAM_SEG_MS = 90 * 60 * 1000
export const EXAM_SCHEMA = 1

export type ExamSeg = 'mcq' | 'frq'

export type ExamSession = {
  schemaVersion: typeof EXAM_SCHEMA
  active: boolean
  paused: boolean
  seg: ExamSeg
  mcqRemainingMs: number
  frqRemainingMs: number
  deadlineAt: number | null
  mcqZeroNotified: boolean
  frqZeroNotified: boolean
  startedAt: number
  projectRoot: string
  baseline: Record<string, string[]>
}

export type ExamEvent =
  | { type: 'start'; now: number; projectRoot: string; baseline: Record<string, string[]> }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'switch'; now: number; seg: ExamSeg }
  | { type: 'tick'; now: number }
  | { type: 'restart'; now: number; projectRoot: string; baseline: Record<string, string[]> }
  | { type: 'abandon' }
  | { type: 'finish' }

export type ExamTick = {
  session: ExamSession
  justZeroed: ExamSeg | null
}

export function idleSession(): ExamSession {
  return {
    schemaVersion: EXAM_SCHEMA,
    active: false,
    paused: false,
    seg: 'mcq',
    mcqRemainingMs: EXAM_SEG_MS,
    frqRemainingMs: EXAM_SEG_MS,
    deadlineAt: null,
    mcqZeroNotified: false,
    frqZeroNotified: false,
    startedAt: 0,
    projectRoot: '',
    baseline: {}
  }
}

function clampMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0
  return Math.max(0, Math.min(EXAM_SEG_MS, Math.floor(ms)))
}

export function remainingOf(session: ExamSession, seg: ExamSeg): number {
  return seg === 'mcq' ? session.mcqRemainingMs : session.frqRemainingMs
}

export function settle(session: ExamSession, now: number): ExamTick {
  if (!session.active || session.paused || session.deadlineAt == null) {
    return { session, justZeroed: null }
  }
  const left = clampMs(session.deadlineAt - now)
  const next: ExamSession = { ...session }
  let justZeroed: ExamSeg | null = null
  if (session.seg === 'mcq') {
    const was = session.mcqRemainingMs
    next.mcqRemainingMs = left
    if (left === 0) {
      next.deadlineAt = null
      if (!session.mcqZeroNotified && was > 0) {
        next.mcqZeroNotified = true
        justZeroed = 'mcq'
      }
    }
  } else {
    const was = session.frqRemainingMs
    next.frqRemainingMs = left
    if (left === 0) {
      next.deadlineAt = null
      if (!session.frqZeroNotified && was > 0) {
        next.frqZeroNotified = true
        justZeroed = 'frq'
      }
    }
  }
  return { session: next, justZeroed }
}

function runningDeadline(session: ExamSession, now: number): number | null {
  const rem = remainingOf(session, session.seg)
  if (session.paused || rem <= 0) return null
  return now + rem
}

function fresh(now: number, projectRoot: string, baseline: Record<string, string[]>): ExamSession {
  return {
    schemaVersion: EXAM_SCHEMA,
    active: true,
    paused: false,
    seg: 'mcq',
    mcqRemainingMs: EXAM_SEG_MS,
    frqRemainingMs: EXAM_SEG_MS,
    deadlineAt: now + EXAM_SEG_MS,
    mcqZeroNotified: false,
    frqZeroNotified: false,
    startedAt: now,
    projectRoot,
    baseline
  }
}

export function reduce(session: ExamSession, event: ExamEvent): ExamTick {
  switch (event.type) {
    case 'start':
    case 'restart':
      return { session: fresh(event.now, event.projectRoot, event.baseline), justZeroed: null }
    case 'pause': {
      const t = settle(session, event.now)
      return { session: { ...t.session, paused: true, deadlineAt: null }, justZeroed: t.justZeroed }
    }
    case 'resume': {
      const t = settle(session, event.now)
      if (!t.session.active) return t
      return {
        session: {
          ...t.session,
          paused: false,
          deadlineAt: runningDeadline({ ...t.session, paused: false }, event.now)
        },
        justZeroed: t.justZeroed
      }
    }
    case 'switch': {
      const t = settle(session, event.now)
      if (!t.session.active || t.session.seg === event.seg) return t
      const switched: ExamSession = { ...t.session, seg: event.seg }
      return {
        session: { ...switched, deadlineAt: runningDeadline(switched, event.now) },
        justZeroed: t.justZeroed
      }
    }
    case 'tick':
      return settle(session, event.now)
    case 'abandon':
    case 'finish':
      return { session: idleSession(), justZeroed: null }
  }
}

export function parseSession(raw: unknown): ExamSession | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.schemaVersion !== EXAM_SCHEMA) return null
  if (typeof o.active !== 'boolean') return null
  const seg = o.seg === 'frq' ? 'frq' : o.seg === 'mcq' ? 'mcq' : null
  if (!seg) return null
  const baseline =
    o.baseline && typeof o.baseline === 'object' && !Array.isArray(o.baseline)
      ? (o.baseline as Record<string, string[]>)
      : {}
  const session: ExamSession = {
    schemaVersion: EXAM_SCHEMA,
    active: o.active,
    paused: !!o.paused,
    seg,
    mcqRemainingMs: clampMs(Number(o.mcqRemainingMs)),
    frqRemainingMs: clampMs(Number(o.frqRemainingMs)),
    deadlineAt: typeof o.deadlineAt === 'number' && Number.isFinite(o.deadlineAt) ? o.deadlineAt : null,
    mcqZeroNotified: !!o.mcqZeroNotified,
    frqZeroNotified: !!o.frqZeroNotified,
    startedAt: typeof o.startedAt === 'number' ? o.startedAt : 0,
    projectRoot: typeof o.projectRoot === 'string' ? o.projectRoot : '',
    baseline
  }
  return session
}
