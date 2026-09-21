import { app } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { AppSettings, Locale, PublicSettings } from '../shared/types'
import { isThemeId } from '../shared/themes'
import { toPublicSettings } from '../shared/publicSettings'
import { migrateSecrets, secretStatus } from './secretStore'
import { atomicWrite } from './atomicWrite'

const defaults: AppSettings = {
  completionModel: 'deepseek-flash',
  debugModel: 'deepseek-flash',
  debugThinking: false,
  jdkHome: '',
  mavenPath: '',
  completionEnabled: false,
  completionDelayMs: 400,
  homeworkHideLines: false,
  apHintsEnabled: true,
  lastRoot: '',
  theme: 'paper',
  locale: 'zh' as Locale
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function sanitize(raw: Record<string, unknown>): AppSettings {
  const locale = raw.locale
  return {
    completionModel:
      typeof raw.completionModel === 'string' ? raw.completionModel : defaults.completionModel,
    debugModel: typeof raw.debugModel === 'string' ? raw.debugModel : defaults.debugModel,
    debugThinking: !!raw.debugThinking,
    jdkHome: typeof raw.jdkHome === 'string' ? raw.jdkHome : '',
    mavenPath: typeof raw.mavenPath === 'string' ? raw.mavenPath : '',
    completionEnabled: !!raw.completionEnabled,
    completionDelayMs:
      typeof raw.completionDelayMs === 'number' && Number.isFinite(raw.completionDelayMs)
        ? raw.completionDelayMs
        : defaults.completionDelayMs,
    homeworkHideLines: !!raw.homeworkHideLines,
    apHintsEnabled: raw.apHintsEnabled !== false,
    lastRoot: typeof raw.lastRoot === 'string' ? raw.lastRoot : '',
    theme: isThemeId(String(raw.theme)) ? (raw.theme as AppSettings['theme']) : 'paper',
    locale: locale === 'en' || locale === 'ko' || locale === 'zh' ? locale : 'zh'
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = JSON.parse(readFileSync(settingsPath(), 'utf8')) as Record<string, unknown>
    return sanitize(raw)
  } catch {
    return { ...defaults }
  }
}

export function saveSettings(partial: Partial<AppSettings>): AppSettings {
  const next = sanitize({ ...loadSettings(), ...partial })
  const file = settingsPath()
  atomicWrite(file, JSON.stringify(next, null, 2))
  return next
}

export function publicSettings(): PublicSettings {
  migrateSecrets()
  const secret = secretStatus()
  return toPublicSettings(loadSettings(), secret)
}
