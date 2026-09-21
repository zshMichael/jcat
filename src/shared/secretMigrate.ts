export type SecretBackend = {
  available: boolean
  encrypt: (plain: string) => Buffer
  decrypt: (buf: Buffer) => string
}

export type SecretFiles = {
  readSettings: () => Record<string, unknown>
  writeSettings: (data: Record<string, unknown>) => void
  readBlob: () => Buffer | null
  writeBlob: (buf: Buffer) => void
  clearBlob: () => void
}

export type SecretState = {
  hasKey: boolean
  storage: 'available' | 'unavailable' | 'legacy'
  error?: string
}

function stripKey(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data }
  delete next.apiKey
  return next
}

export function inspectSecrets(files: SecretFiles, backend: SecretBackend): SecretState {
  const settings = files.readSettings()
  const legacy = typeof settings.apiKey === 'string' && settings.apiKey.trim().length > 0
  const blob = files.readBlob()
  if (blob && blob.length > 0) {
    if (!backend.available) {
      return { hasKey: true, storage: 'unavailable', error: 'SECRET_UNAVAILABLE' }
    }
    try {
      const plain = backend.decrypt(blob).trim()
      return { hasKey: plain.length > 0, storage: 'available' }
    } catch {
      return { hasKey: legacy, storage: 'legacy', error: 'SECRET_CORRUPT' }
    }
  }
  if (legacy) return { hasKey: true, storage: 'legacy' }
  return { hasKey: false, storage: backend.available ? 'available' : 'unavailable' }
}

export function migratePlainKey(files: SecretFiles, backend: SecretBackend): SecretState {
  const settings = files.readSettings()
  const legacy = typeof settings.apiKey === 'string' ? settings.apiKey.trim() : ''
  if (!legacy) return inspectSecrets(files, backend)
  if (!backend.available) {
    return { hasKey: true, storage: 'legacy', error: 'SECRET_UNAVAILABLE' }
  }
  const blob = backend.encrypt(legacy)
  files.writeBlob(blob)
  try {
    if (backend.decrypt(blob).trim() !== legacy) {
      return { hasKey: true, storage: 'legacy', error: 'SECRET_VERIFY' }
    }
  } catch {
    return { hasKey: true, storage: 'legacy', error: 'SECRET_VERIFY' }
  }
  files.writeSettings(stripKey(settings))
  return { hasKey: true, storage: 'available' }
}

export function saveKey(files: SecretFiles, backend: SecretBackend, key: string): SecretState {
  const trimmed = key.trim()
  if (!trimmed) return clearKey(files, backend)
  if (!backend.available) {
    return { hasKey: false, storage: 'unavailable', error: 'SECRET_UNAVAILABLE' }
  }
  files.writeBlob(backend.encrypt(trimmed))
  const settings = files.readSettings()
  if ('apiKey' in settings) files.writeSettings(stripKey(settings))
  return { hasKey: true, storage: 'available' }
}

export function clearKey(files: SecretFiles, backend: SecretBackend): SecretState {
  files.clearBlob()
  const settings = files.readSettings()
  if ('apiKey' in settings) files.writeSettings(stripKey(settings))
  return { hasKey: false, storage: backend.available ? 'available' : 'unavailable' }
}

export function readKey(files: SecretFiles, backend: SecretBackend): string {
  const blob = files.readBlob()
  if (blob && blob.length > 0 && backend.available) {
    try {
      return backend.decrypt(blob).trim()
    } catch {
      /* fall through to leftover plaintext */
    }
  }
  const settings = files.readSettings()
  return typeof settings.apiKey === 'string' ? settings.apiKey.trim() : ''
}
