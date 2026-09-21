import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  IMAGE_FILE_MACHINE_AMD64,
  IMAGE_FILE_MACHINE_ARM64,
  machineName,
  readPeMachine
} from './peMachine'

function fakePe(machine: number): Buffer {
  const buf = Buffer.alloc(0x80)
  buf.write('MZ', 0, 'ascii')
  buf.writeUInt32LE(0x40, 0x3c)
  buf.write('PE\0\0', 0x40, 'ascii')
  buf.writeUInt16LE(machine, 0x44)
  return buf
}

describe('peMachine', () => {
  it('reads AMD64 and ARM64 machine types', () => {
    assert.equal(readPeMachine(fakePe(IMAGE_FILE_MACHINE_AMD64)), IMAGE_FILE_MACHINE_AMD64)
    assert.equal(readPeMachine(fakePe(IMAGE_FILE_MACHINE_ARM64)), IMAGE_FILE_MACHINE_ARM64)
    assert.equal(machineName(IMAGE_FILE_MACHINE_AMD64), 'x64')
    assert.equal(machineName(IMAGE_FILE_MACHINE_ARM64), 'arm64')
  })

  it('rejects buffers that are not PE', () => {
    assert.throws(() => readPeMachine(Buffer.from('not-exe')))
  })
})
