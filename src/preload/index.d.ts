import type {
  AppSettings,
  CompleteRequest,
  CompileResult,
  DebugChunk,
  DebugRequest,
  FileNode,
  Toolchain
} from '../shared/types'

export type JcatAPI = {
  platform: string
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<boolean>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    setBackground: (color: string) => Promise<void>
  }
  settings: {
    get: () => Promise<AppSettings>
    save: (partial: Partial<AppSettings>) => Promise<AppSettings>
  }
  toolchain: {
    detect: () => Promise<Toolchain>
  }
  workspace: {
    open: () => Promise<string | null>
    restore: (root: string) => Promise<string | null>
    root: () => Promise<string | null>
    tree: () => Promise<FileNode[]>
    read: (file: string) => Promise<string>
    write: (file: string, content: string) => Promise<void>
    createFile: (file: string, content?: string) => Promise<void>
    createFolder: (dir: string) => Promise<void>
    newFileDialog: () => Promise<{ root: string | null; file: string } | null>
    newFolderDialog: () => Promise<{ root: string | null; dir: string } | null>
  }
  java: {
    mains: () => Promise<string[]>
    compile: () => Promise<CompileResult>
    run: (mainClass?: string) => Promise<void>
    stop: () => Promise<void>
    onData: (cb: (payload: { stream: 'stdout' | 'stderr'; text: string }) => void) => () => void
    onExit: (cb: (code: number | null) => void) => () => void
  }
  ai: {
    complete: (req: CompleteRequest) => Promise<{ text: string; error?: string }>
    completeAbort: () => Promise<void>
    debug: (req: DebugRequest) => Promise<void>
    debugAbort: () => Promise<void>
    onDebugChunk: (cb: (chunk: DebugChunk) => void) => () => void
  }
  exportImage: {
    savePng: (dataUrl: string, defaultName: string) => Promise<string | null>
  }
}

declare global {
  interface Window {
    jcat: JcatAPI
  }
}

export {}
