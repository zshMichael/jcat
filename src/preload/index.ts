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

const api = {
  platform: process.platform,
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize') as Promise<boolean>,
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized') as Promise<boolean>,
    setBackground: (color: string) => ipcRenderer.invoke('window:setBackground', color)
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
    newFileDialog: () =>
      ipcRenderer.invoke('workspace:newFileDialog') as Promise<{
        root: string | null
        file: string
      } | null>,
    newFolderDialog: () =>
      ipcRenderer.invoke('workspace:newFolderDialog') as Promise<{
        root: string | null
        dir: string
      } | null>
  },
  java: {
    mains: () => ipcRenderer.invoke('java:mains') as Promise<string[]>,
    compile: () => ipcRenderer.invoke('java:compile') as Promise<CompileResult>,
    run: (mainClass?: string) => ipcRenderer.invoke('java:run', mainClass),
    stop: () => ipcRenderer.invoke('java:stop'),
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
    }
  },
  ai: {
    complete: (req: CompleteRequest) =>
      ipcRenderer.invoke('ai:complete', req) as Promise<{ text: string; error?: string }>,
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
