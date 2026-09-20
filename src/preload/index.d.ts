import type {
  AppSettings,
  CompleteRequest,
  CompileResult,
  DebugChunk,
  DebugRequest,
  FileNode,
  Toolchain
} from '../shared/types'
import type { TraceEvent } from '../shared/instrumentJava'

export type JcatAPI = {
  platform: string
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<boolean>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    setBackground: (color: string) => Promise<void>
    onMaximized: (cb: (maximized: boolean) => void) => () => void
  }
  shell: {
    openExternal: (url: string) => Promise<void>
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
    createEmpty: (name: string) => Promise<{ root: string }>
    createPractice: (kind: 'hello' | 'scanner') => Promise<{ root: string; file: string }>
    createFrq: (
      kind: 'methods' | 'class' | 'arraylist' | 'grid'
    ) => Promise<{ root: string; file: string }>
    newFileDialog: () => Promise<{ root: string | null; file: string } | null>
    newFolderDialog: () => Promise<{ root: string | null; dir: string } | null>
    rename: (from: string, name: string) => Promise<string>
    delete: (target: string) => Promise<void>
    transfer: (from: string, destDir: string, cut: boolean) => Promise<string>
  }
  java: {
    mains: () => Promise<string[]>
    compile: () => Promise<CompileResult>
    run: (mainClass?: string, replay?: string) => Promise<void>
    stop: () => Promise<void>
    writeStdin: (text: string) => Promise<boolean>
    onData: (cb: (payload: { stream: 'stdout' | 'stderr'; text: string }) => void) => () => void
    onExit: (cb: (code: number | null) => void) => () => void
    onCompiled: (cb: (result: CompileResult) => void) => () => void
    onTrace: (cb: (event: TraceEvent) => void) => () => void
  }
  ai: {
    complete: (req: CompleteRequest) => Promise<{ text: string; why?: string; error?: string }>
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
