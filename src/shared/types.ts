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

export type AppSettings = {
  apiKey: string
  completionModel: string
  debugModel: string
  debugThinking: boolean
  jdkHome: string
  mavenPath: string
  completionEnabled: boolean
  completionDelayMs: number
  lastRoot: string
  theme: ThemeId
}

export type CompileResult = {
  ok: boolean
  output: string
  diagnostics: Diagnostic[]
  mainClasses: string[]
  projectKind: ProjectKind
  classpath: string | null
}

export type RunEvent =
  | { type: 'data'; stream: 'stdout' | 'stderr'; text: string }
  | { type: 'exit'; code: number | null }

export type CompleteRequest = {
  prefix: string
  suffix: string
}

export type CompleteResponse = {
  text: string
  error?: string
}

export type DebugRequest = {
  filePath: string
  source: string
  errorOutput: string
  note: string
}

export type DebugChunk = {
  kind: 'content' | 'reasoning'
  text: string
}
