import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { atomicWrite } from './atomicWrite'

describe('atomicWrite', () => {
  it('replaces the destination and does not leave the previous contents mixed in', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jcat-atomic-'))
    const dest = join(dir, 'secrets.bin')
    writeFileSync(dest, 'old-plaintext-key')
    atomicWrite(dest, Buffer.from('new-ciphertext'))
    assert.equal(readFileSync(dest, 'utf8'), 'new-ciphertext')
    const leftover = readdirSync(dir).filter(
      (name) => name.endsWith('.tmp') || name.endsWith('.bak')
    )
    assert.deepEqual(leftover, [])
  })

  it('keeps the previous file when a same-directory temp write is interrupted before replace', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jcat-atomic-'))
    const dest = join(dir, 'secrets.bin')
    writeFileSync(dest, 'old-plaintext-key')
    writeFileSync(join(dir, `.secrets.bin.${process.pid}.interrupted.tmp`), 'partial-new')
    assert.equal(readFileSync(dest, 'utf8'), 'old-plaintext-key')
    atomicWrite(dest, 'new-ciphertext')
    assert.equal(readFileSync(dest, 'utf8'), 'new-ciphertext')
  })
})
