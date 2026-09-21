import { app } from 'electron'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { AppSettings, Locale, PublicSettings } from '../shared/types'
import { isThemeId } from '../shared/themes'
import { migrateSecrets, secretStatus } from './secretStore'

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
    completionModel: typeof raw.completionModel === 'string' ? raw.completionModel : defaults.completionModel,
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
  if (!existsSync(dirname(file))) mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(next, null, 2), 'utf8')
  if (process.platform !== 'win32') {
    try {
      chmodSync(file, 0o600)
    } catch {
      /* ignore */
    }
  }
  return next
}

export function publicSettings(): PublicSettings {
  migrateSecrets()
  const secret = secretStatus()
  return {
    ...loadSettings(),
    hasApiKey: secret.hasKey,
    secretStorage: secret.storage,
    secretError: secret.error
  }
}
