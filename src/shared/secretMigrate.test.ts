import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clearKey,
  inspectSecrets,
  migratePlainKey,
  readKey,
  saveKey,
  type SecretBackend,
  type SecretFiles
} from './secretMigrate'

function xorBody(input: Buffer): Buffer {
  const out = Buffer.alloc(input.length)
  for (let i = 0; i < input.length; i++) out[i] = input[i] ^ 0x5a
  return out
}

function mem(init: Record<string, unknown> = {}): {
  files: SecretFiles
  settings: Record<string, unknown>
  blob: Buffer | null
} {
  const box = { settings: { ...init }, blob: null as Buffer | null }
  const files: SecretFiles = {
    readSettings: () => ({ ...box.settings }),
    writeSettings: (data) => {
      box.settings = { ...data }
    },
    readBlob: () => box.blob,
    writeBlob: (buf) => {
      box.blob = Buffer.from(buf)
    },
    clearBlob: () => {
      box.blob = null
    }
  }
  return {
    files,
    get settings() {
      return box.settings
    },
    get blob() {
      return box.blob
    }
  } as never
}

const mask: SecretBackend = {
  available: true,
  encrypt: (plain) => Buffer.concat([Buffer.from('ENC1'), xorBody(Buffer.from(plain, 'utf8'))]),
  decrypt: (buf) => {
    if (buf.subarray(0, 4).toString() !== 'ENC1') throw new Error('bad header')
    return xorBody(buf.subarray(4)).toString('utf8')
  }
}

const down: SecretBackend = {
  available: false,
  encrypt: () => {
    throw new Error('nope')
  },
  decrypt: () => {
    throw new Error('nope')
  }
}

describe('secretMigrate', () => {
  it('new user has no key', () => {
    const { files } = mem({ theme: 'paper' })
    const st = inspectSecrets(files, mask)
    assert.equal(st.hasKey, false)
    assert.equal(st.storage, 'available')
  })

  it('saves ciphertext that is not plaintext or base64(plaintext)', () => {
    const store = mem({ theme: 'paper', lastRoot: '/p' })
    saveKey(store.files, mask, 'sk-one')
    const blob = store.files.readBlob()
    assert.ok(blob)
    assert.notEqual(blob.toString('utf8'), 'sk-one')
    assert.notEqual(blob.toString('utf8'), Buffer.from('sk-one', 'utf8').toString('base64'))
    assert.equal(readKey(store.files, mask), 'sk-one')
    assert.equal('apiKey' in store.files.readSettings(), false)
    saveKey(store.files, mask, 'sk-two')
    assert.equal(readKey(store.files, mask), 'sk-two')
    assert.equal(store.files.readSettings().lastRoot, '/p')
  })

  it('clears a key', () => {
    const { files } = mem()
    saveKey(files, mask, 'sk-one')
    const st = clearKey(files, mask)
    assert.equal(st.hasKey, false)
    assert.equal(readKey(files, mask), '')
  })

  it('migrates a v1.1.0 plaintext key then deletes it from settings', () => {
    const { files } = mem({ apiKey: 'sk-old', theme: 'ink', locale: 'zh' })
    const st = migratePlainKey(files, mask)
    assert.equal(st.hasKey, true)
    assert.equal(st.storage, 'available')
    assert.equal(readKey(files, mask), 'sk-old')
    const settings = files.readSettings()
    assert.equal('apiKey' in settings, false)
    assert.equal(settings.theme, 'ink')
  })

  it('keeps plaintext if encryption is unavailable', () => {
    const { files } = mem({ apiKey: 'sk-old' })
    const st = migratePlainKey(files, down)
    assert.equal(st.hasKey, true)
    assert.equal(st.storage, 'legacy')
    assert.equal(st.error, 'SECRET_UNAVAILABLE')
    assert.equal(files.readSettings().apiKey, 'sk-old')
  })

  it('does not delete plaintext when stored blob is corrupt', () => {
    const { files } = mem({ apiKey: 'sk-old' })
    files.writeBlob(Buffer.from('not-a-key'))
    const broken: SecretBackend = {
      available: true,
      encrypt: mask.encrypt,
      decrypt: () => {
        throw new Error('bad')
      }
    }
    const st = inspectSecrets(files, broken)
    assert.equal(st.error, 'SECRET_CORRUPT')
    assert.equal(files.readSettings().apiKey, 'sk-old')
  })

  it('does not delete plaintext when ciphertext cannot be read back', () => {
    const box = {
      settings: { apiKey: 'sk-old' } as Record<string, unknown>,
      blob: null as Buffer | null
    }
    const files: SecretFiles = {
      readSettings: () => ({ ...box.settings }),
      writeSettings: (data) => {
        box.settings = { ...data }
      },
      readBlob: () => Buffer.from('garbage-not-ciphertext'),
      writeBlob: (buf) => {
        box.blob = Buffer.from(buf)
      },
      clearBlob: () => {
        box.blob = null
      }
    }
    const st = migratePlainKey(files, mask)
    assert.equal(st.error, 'SECRET_VERIFY')
    assert.equal(files.readSettings().apiKey, 'sk-old')
  })

  it('keeps plaintext if writing the blob throws', () => {
    const files: SecretFiles = {
      readSettings: () => ({ apiKey: 'sk-old', theme: 'paper' }),
      writeSettings: () => {
        throw new Error('should not strip')
      },
      readBlob: () => null,
      writeBlob: () => {
        throw new Error('disk full')
      },
      clearBlob: () => undefined
    }
    assert.throws(() => migratePlainKey(files, mask))
    assert.equal(files.readSettings().apiKey, 'sk-old')
  })

  it('refuses to persist a new key when storage is unavailable', () => {
    const { files } = mem({ theme: 'paper' })
    const st = saveKey(files, down, 'sk-new')
    assert.equal(st.hasKey, false)
    assert.equal(st.storage, 'unavailable')
    assert.equal(readKey(files, down), '')
  })

  it('does not delete plaintext when a new save cannot be read back', () => {
    const box = {
      settings: { apiKey: 'sk-old', theme: 'paper' } as Record<string, unknown>,
      blob: null as Buffer | null
    }
    const files: SecretFiles = {
      readSettings: () => ({ ...box.settings }),
      writeSettings: (data) => {
        box.settings = { ...data }
      },
      readBlob: () => Buffer.from('garbage-not-ciphertext'),
      writeBlob: (buf) => {
        box.blob = Buffer.from(buf)
      },
      clearBlob: () => {
        box.blob = null
      }
    }
    const st = saveKey(files, mask, 'sk-new')
    assert.equal(st.error, 'SECRET_VERIFY')
    assert.equal(files.readSettings().apiKey, 'sk-old')
  })
})
