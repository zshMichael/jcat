import type { ThemeId } from './themes'

export type { ThemeId } from './themes'

export type ProjectKind = 'maven' | 'folder'

export type FileNode = {
  name: string
  path: string
  isDir: boolean
  mtime: number
  children?: FileNode[]
}

export type Diagnostic = {
  file: string
  line: number
  column: number
  endColumn?: number
  severity: 'error' | 'warning'
  message: string
}

export type Toolchain = {
  javaHome: string | null
  javaVersion: string | null
  javac: string | null
  java: string | null
  maven: string | null
  mavenVersion: string | null
}

export type Locale = 'zh' | 'en' | 'ko'

export type AppNoticeCode =
  | 'NO_PROJECT'
  | 'MAVEN_NOT_FOUND'
  | 'JDK_NOT_FOUND'
  | 'NO_JAVA_FILES'
  | 'NO_MAIN'
  | 'JAVA_NOT_FOUND'
  | 'MAVEN_OK'
  | 'MAVEN_FAIL'
  | 'JAVAC_OK'
  | 'JAVAC_FAIL'
  | 'EXAM_LOCKED'

export type AppSettings = {
  completionModel: string
  debugModel: string
  debugThinking: boolean
  jdkHome: string
  mavenPath: string
  completionEnabled: boolean
  completionDelayMs: number
  homeworkHideLines: boolean
  apHintsEnabled: boolean
  lastRoot: string
  theme: ThemeId
  locale: Locale
}

export type PublicSettings = AppSettings & {
  hasApiKey: boolean
  secretStorage: 'available' | 'unavailable' | 'legacy'
  secretError?: string
}

export type CompileResult = {
  ok: boolean
  output: string
  diagnostics: Diagnostic[]
  mainClasses: string[]
  projectKind: ProjectKind
  classpath: string | null
  notice?: AppNoticeCode
  noticeParam?: string
}

export type RunEvent =
  | { type: 'data'; stream: 'stdout' | 'stderr'; text: string }
  | { type: 'exit'; code: number | null }

export type CompleteRequest = {
  prefix: string
  suffix: string
  locale: Locale
}

export type CompleteResponse = {
  text: string
  why?: string
  error?: string
}

export type DebugRequest = {
  filePath: string
  source: string
  errorOutput: string
  note: string
  locale: Locale
  errorLine?: number
  errorMessage?: string
  selectedSource?: string
  selectedRange?: { startLine: number; endLine: number }
}

export type DebugChunk = {
  kind: 'content' | 'reasoning'
  text: string
}
