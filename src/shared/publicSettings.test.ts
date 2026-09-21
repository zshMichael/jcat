import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { hasNoSecretFields, toPublicSettings } from './publicSettings'
import type { AppSettings } from './types'

const settings: AppSettings = {
  completionModel: 'deepseek-flash',
  debugModel: 'deepseek-flash',
  debugThinking: false,
  jdkHome: '',
  mavenPath: '',
  completionEnabled: false,
  completionDelayMs: 400,
  homeworkHideLines: false,
  apHintsEnabled: true,
  lastRoot: '/p',
  theme: 'paper',
  locale: 'zh'
}

describe('publicSettings', () => {
  it('never exposes apiKey or a sk- token', () => {
    const pub = toPublicSettings(settings, { hasKey: true, storage: 'available' })
    assert.equal(hasNoSecretFields(pub), true)
    assert.equal('apiKey' in pub, false)
    assert.equal(pub.hasApiKey, true)
  })

  it('rejects objects that still carry a plaintext key', () => {
    assert.equal(hasNoSecretFields({ ...settings, apiKey: 'sk-notrealxx' }), false)
  })
})
