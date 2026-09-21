import type { AppSettings, PublicSettings } from './types'
import type { SecretState } from './secretMigrate'

export function toPublicSettings(settings: AppSettings, secret: SecretState): PublicSettings {
  const next: PublicSettings = {
    ...settings,
    hasApiKey: secret.hasKey,
    secretStorage: secret.storage
  }
  if (secret.error) next.secretError = secret.error
  return next
}

export function hasNoSecretFields(obj: object): boolean {
  const rec = obj as Record<string, unknown>
  if (Object.prototype.hasOwnProperty.call(rec, 'apiKey')) return false
  for (const [key, value] of Object.entries(rec)) {
    if (key === 'apiKey' || key === 'api_key') return false
    if (typeof value !== 'string') continue
    if (/^sk-[A-Za-z0-9]{8,}$/.test(value.trim())) return false
  }
  return true
}
