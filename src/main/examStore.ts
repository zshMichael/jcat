import { app } from 'electron'
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { idleSession, parseSession, type ExamSession } from '../shared/examSession'

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
  const file = examPath()
  if (!session.active) {
    clearExamSession()
    return
  }
  const dir = dirname(file)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(file, JSON.stringify(session), 'utf8')
  if (process.platform !== 'win32') {
    try {
      chmodSync(file, 0o600)
    } catch {
      /* ignore */
    }
  }
}

export function clearExamSession(): void {
  try {
    if (existsSync(examPath())) unlinkSync(examPath())
  } catch {
    /* ignore */
  }
}
