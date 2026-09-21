import { chmodSync, existsSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { basename, dirname, join } from 'path'

function lockUnix(path: string): void {
  if (process.platform === 'win32') return
  try {
    chmodSync(path, 0o600)
  } catch {
    /* ignore */
  }
}

function restoreBackup(path: string, bak: string): void {
  if (existsSync(path) || !existsSync(bak)) return
  try {
    renameSync(bak, path)
  } catch {
    /* keep bak so the previous file is not deleted */
  }
}

/** Write via a same-directory temp file, then replace. Keeps the previous file until replace succeeds. */
export function atomicWrite(path: string, data: string | Buffer): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const tmp = join(dir, `.${basename(path)}.${process.pid}.${Date.now()}.tmp`)
  writeFileSync(tmp, data)
  lockUnix(tmp)
  try {
    renameSync(tmp, path)
    lockUnix(path)
    return
  } catch {
    /* Windows cannot rename over an existing file */
  }
  const bak = join(dir, `.${basename(path)}.${process.pid}.bak`)
  try {
    if (existsSync(path)) renameSync(path, bak)
    try {
      renameSync(tmp, path)
    } catch (err) {
      restoreBackup(path, bak)
      throw err
    }
    lockUnix(path)
    try {
      unlinkSync(bak)
    } catch {
      /* ignore */
    }
  } catch (err) {
    restoreBackup(path, bak)
    try {
      unlinkSync(tmp)
    } catch {
      /* ignore */
    }
    throw err
  }
}
