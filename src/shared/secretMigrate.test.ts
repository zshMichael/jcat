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
  return { files, get settings() { return box.settings }, get blob() { return box.blob } } as never
}

const xor: SecretBackend = {
  available: true,
  encrypt: (plain) => Buffer.from(plain, 'utf8'),
  decrypt: (buf) => buf.toString('utf8')
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
    const st = inspectSecrets(files, xor)
    assert.equal(st.hasKey, false)
    assert.equal(st.storage, 'available')
  })

  it('saves and replaces a key without writing plaintext', () => {
    const store = mem({ theme: 'paper', lastRoot: '/p' })
    saveKey(store.files, xor, 'sk-one')
    assert.equal(readKey(store.files, xor), 'sk-one')
    assert.equal('apiKey' in store.files.readSettings(), false)
    saveKey(store.files, xor, 'sk-two')
    assert.equal(readKey(store.files, xor), 'sk-two')
    assert.equal(store.files.readSettings().lastRoot, '/p')
  })

  it('clears a key', () => {
    const { files } = mem()
    saveKey(files, xor, 'sk-one')
    const st = clearKey(files, xor)
    assert.equal(st.hasKey, false)
    assert.equal(readKey(files, xor), '')
  })

  it('migrates a v1.1.0 plaintext key then deletes it from settings', () => {
    const { files } = mem({ apiKey: 'sk-old', theme: 'ink', locale: 'zh' })
    const st = migratePlainKey(files, xor)
    assert.equal(st.hasKey, true)
    assert.equal(st.storage, 'available')
    assert.equal(readKey(files, xor), 'sk-old')
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
      encrypt: xor.encrypt,
      decrypt: () => {
        throw new Error('bad')
      }
    }
    const st = inspectSecrets(files, broken)
    assert.equal(st.error, 'SECRET_CORRUPT')
    assert.equal(files.readSettings().apiKey, 'sk-old')
  })

  it('refuses to persist a new key when storage is unavailable', () => {
    const { files } = mem({ theme: 'paper' })
    const st = saveKey(files, down, 'sk-new')
    assert.equal(st.hasKey, false)
    assert.equal(st.storage, 'unavailable')
    assert.equal(readKey(files, down), '')
  })
})
