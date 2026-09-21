import type { AppNoticeCode, CompileResult } from '@shared/types'
import type { Msg } from './i18n'

const NOTICE: Record<AppNoticeCode, Msg> = {
  NO_PROJECT: 'noProject',
  MAVEN_NOT_FOUND: 'mavenMissing',
  JDK_NOT_FOUND: 'jdkMissing',
  NO_JAVA_FILES: 'noJavaFiles',
  NO_MAIN: 'noMain',
  JAVA_NOT_FOUND: 'javaMissing',
  MAVEN_OK: 'mavenOk',
  MAVEN_FAIL: 'mavenFail',
  JAVAC_OK: 'javacOk',
  JAVAC_FAIL: 'javacFail',
  EXAM_LOCKED: 'examLocked'
}

export function formatNotice(
  tr: (key: Msg) => string,
  code: AppNoticeCode,
  param?: string
): string {
  const text = tr(NOTICE[code])
  return text.replace('{n}', param ?? '')
}

export function formatCompile(tr: (key: Msg) => string, result: CompileResult): string {
  if (result.notice) return formatNotice(tr, result.notice, result.noticeParam)
  return result.output
}

const AI_ERR: Record<string, Msg> = {
  AI_NEED_KEY: 'aiNeedKey',
  AI_UNAUTHORIZED: 'aiUnauthorized',
  AI_FORBIDDEN: 'aiForbidden',
  AI_RATE_LIMIT: 'aiRateLimit',
  AI_SERVER: 'aiServer',
  AI_HTTP: 'aiHttp',
  AI_ABORTED: 'aiAborted',
  AI_TIMEOUT: 'aiTimeout',
  AI_NETWORK: 'aiNetwork',
  AI_UNKNOWN: 'aiUnknown',
  EXAM_LOCKED: 'examLocked'
}

export function formatAiError(tr: (key: Msg) => string, code?: string): string {
  if (!code) return tr('aiUnknown')
  const key = AI_ERR[code]
  return key ? tr(key) : code
}
