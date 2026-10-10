import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { appleLanguages } from './dialogLocale'

describe('appleLanguages', () => {
  it('maps the in-app locale onto the macOS dialog language', () => {
    assert.deepEqual(appleLanguages('zh'), ['zh-Hans', 'zh-CN'])
    assert.deepEqual(appleLanguages('en'), ['en'])
    assert.deepEqual(appleLanguages('ko'), ['ko'])
  })
})
