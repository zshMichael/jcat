import { app } from 'electron'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { atomicWrite } from './atomicWrite'
import {
  idleSession,
  parseSession,
  serializeSession,
  type ExamSession
} from '../shared/examSession'

function examPath(): string {
  return join(app.getPath('userData'), 'exam-session.json')
}

export function loadExamSession(): ExamSession {
  try {
    const parsed = parseSession(JSON.parse(readFileSync(examPath(), 'utf8')))
    return parsed ?? idleSession()
  } catch {
    return idleSession()
  }
}

export function saveExamSession(session: ExamSession): void {
  if (!session.active) {
    clearExamSession()
    return
  }
  atomicWrite(examPath(), JSON.stringify(serializeSession(session)))
}

export function clearExamSession(): void {
  try {
    if (existsSync(examPath())) unlinkSync(examPath())
  } catch {
    /* ignore */
  }
}
