import { contextBridge, ipcRenderer } from 'electron'
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

const api = {
  platform: process.platform,
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize') as Promise<boolean>,
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized') as Promise<boolean>,
    setBackground: (color: string) => ipcRenderer.invoke('window:setBackground', color),
    onMaximized: (cb: (maximized: boolean) => void) => {
      const listener = (_e: unknown, maximized: boolean): void => cb(maximized)
      ipcRenderer.on('window:maximized', listener)
      return () => ipcRenderer.removeListener('window:maximized', listener)
    }
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get') as Promise<AppSettings>,
    save: (partial: Partial<AppSettings>) =>
      ipcRenderer.invoke('settings:save', partial) as Promise<AppSettings>
  },
  toolchain: {
    detect: () => ipcRenderer.invoke('toolchain:detect') as Promise<Toolchain>
  },
  workspace: {
    open: () => ipcRenderer.invoke('workspace:open') as Promise<string | null>,
    restore: (root: string) =>
      ipcRenderer.invoke('workspace:restore', root) as Promise<string | null>,
    root: () => ipcRenderer.invoke('workspace:root') as Promise<string | null>,
    tree: () => ipcRenderer.invoke('workspace:tree') as Promise<FileNode[]>,
    read: (file: string) => ipcRenderer.invoke('workspace:read', file) as Promise<string>,
    write: (file: string, content: string) => ipcRenderer.invoke('workspace:write', file, content),
    createFile: (file: string, content?: string) =>
      ipcRenderer.invoke('workspace:createFile', file, content),
    createFolder: (dir: string) => ipcRenderer.invoke('workspace:createFolder', dir),
    createEmpty: (name: string) =>
      ipcRenderer.invoke('workspace:createEmpty', name) as Promise<{ root: string }>,
    createPractice: (kind: 'hello' | 'scanner') =>
      ipcRenderer.invoke('workspace:createPractice', kind) as Promise<{
        root: string
        file: string
      }>,
    createFrq: (kind: 'methods' | 'class' | 'arraylist' | 'grid') =>
      ipcRenderer.invoke('workspace:createFrq', kind) as Promise<{
        root: string
        file: string
      }>,
    newFileDialog: () =>
      ipcRenderer.invoke('workspace:newFileDialog') as Promise<{
        root: string | null
        file: string
      } | null>,
    newFolderDialog: () =>
      ipcRenderer.invoke('workspace:newFolderDialog') as Promise<{
        root: string | null
        dir: string
      } | null>,
    rename: (from: string, name: string) =>
      ipcRenderer.invoke('workspace:rename', from, name) as Promise<string>,
    delete: (target: string) => ipcRenderer.invoke('workspace:delete', target) as Promise<void>,
    transfer: (from: string, destDir: string, cut: boolean) =>
      ipcRenderer.invoke('workspace:transfer', from, destDir, cut) as Promise<string>
  },
  java: {
    mains: () => ipcRenderer.invoke('java:mains') as Promise<string[]>,
    compile: () => ipcRenderer.invoke('java:compile') as Promise<CompileResult>,
    run: (mainClass?: string, replay?: string) =>
      ipcRenderer.invoke('java:run', mainClass, replay),
    stop: () => ipcRenderer.invoke('java:stop'),
    writeStdin: (text: string) =>
      ipcRenderer.invoke('java:writeStdin', text) as Promise<boolean>,
    onData: (cb: (payload: { stream: 'stdout' | 'stderr'; text: string }) => void) => {
      const listener = (
        _e: unknown,
        payload: { stream: 'stdout' | 'stderr'; text: string }
      ): void => cb(payload)
      ipcRenderer.on('java:data', listener)
      return () => ipcRenderer.removeListener('java:data', listener)
    },
    onExit: (cb: (code: number | null) => void) => {
      const listener = (_e: unknown, code: number | null): void => cb(code)
      ipcRenderer.on('java:exit', listener)
      return () => ipcRenderer.removeListener('java:exit', listener)
    },
    onCompiled: (cb: (result: CompileResult) => void) => {
      const listener = (_e: unknown, result: CompileResult): void => cb(result)
      ipcRenderer.on('java:compiled', listener)
      return () => ipcRenderer.removeListener('java:compiled', listener)
    },
    onTrace: (cb: (event: TraceEvent) => void) => {
      const listener = (_e: unknown, event: TraceEvent): void => cb(event)
      ipcRenderer.on('java:trace', listener)
      return () => ipcRenderer.removeListener('java:trace', listener)
    }
  },
  ai: {
    complete: (req: CompleteRequest) =>
      ipcRenderer.invoke('ai:complete', req) as Promise<{
        text: string
        why?: string
        error?: string
      }>,
    completeAbort: () => ipcRenderer.invoke('ai:completeAbort'),
    debug: (req: DebugRequest) => ipcRenderer.invoke('ai:debug', req),
    debugAbort: () => ipcRenderer.invoke('ai:debugAbort'),
    onDebugChunk: (cb: (chunk: DebugChunk) => void) => {
      const listener = (_e: unknown, chunk: DebugChunk): void => cb(chunk)
      ipcRenderer.on('ai:debugChunk', listener)
      return () => ipcRenderer.removeListener('ai:debugChunk', listener)
    }
  },
  exportImage: {
    savePng: (dataUrl: string, defaultName: string) =>
      ipcRenderer.invoke('export:savePng', dataUrl, defaultName) as Promise<string | null>
  }
}

export type JcatAPI = typeof api

contextBridge.exposeInMainWorld('jcat', api)
