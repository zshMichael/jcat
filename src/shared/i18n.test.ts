import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { i18nKeys, localeTables } from '../renderer/src/i18n'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

describe('i18n', () => {
  it('zh, en, and ko expose the same keys', () => {
    const keys = i18nKeys()
    const tables = localeTables()
    assert.deepEqual(Object.keys(tables.zh).sort(), Object.keys(tables.en).sort())
    assert.deepEqual(Object.keys(tables.zh).sort(), Object.keys(tables.ko).sort())
    assert.ok(keys.includes('examOutAdded'))
    assert.ok(keys.includes('apiPrivacy'))
    assert.equal(new Set(keys).size, keys.length)
  })
})

describe('release version', () => {
  it('package.json version matches the 1.1.1 release target', () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }
    assert.equal(pkg.version, '1.1.1')
  })
})
