import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { atomicWrite } from './atomicWrite'
import {
  clearKey,
  inspectSecrets,
  migratePlainKey,
  readKey as readStoredKey,
  saveKey as writeStoredKey,
  type SecretBackend,
  type SecretFiles,
  type SecretState
} from '../shared/secretMigrate'

function userDataFile(name: string): string {
  return join(app.getPath('userData'), name)
}

function files(): SecretFiles {
  const settingsPath = userDataFile('settings.json')
  const blobPath = userDataFile('secrets.bin')
  return {
    readSettings: () => {
      try {
        return JSON.parse(readFileSync(settingsPath, 'utf8')) as Record<string, unknown>
      } catch {
        return {}
      }
    },
    writeSettings: (data) => atomicWrite(settingsPath, JSON.stringify(data, null, 2)),
    readBlob: () => {
      try {
        return existsSync(blobPath) ? readFileSync(blobPath) : null
      } catch {
        return null
      }
    },
    writeBlob: (buf) => atomicWrite(blobPath, buf),
    clearBlob: () => {
      try {
        if (existsSync(blobPath)) unlinkSync(blobPath)
      } catch {
        /* ignore */
      }
    }
  }
}

function backend(): SecretBackend {
  return {
    available: safeStorage.isEncryptionAvailable(),
    encrypt: (plain) => safeStorage.encryptString(plain),
    decrypt: (buf) => safeStorage.decryptString(buf)
  }
}

export function secretStatus(): SecretState {
  return inspectSecrets(files(), backend())
}

export function migrateSecrets(): SecretState {
  return migratePlainKey(files(), backend())
}

export function setSecretKey(key: string): SecretState {
  return writeStoredKey(files(), backend(), key)
}

export function clearSecretKey(): SecretState {
  return clearKey(files(), backend())
}

/** Main-process only. Never send this string to the renderer. */
export function readSecretKey(): string {
  return readStoredKey(files(), backend())
}
