import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { AppSettings, Locale } from '../shared/types'
import { isThemeId } from '../shared/themes'

const defaults: AppSettings = {
  apiKey: '',
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

export function loadSettings(): AppSettings {
  try {
    const raw = readFileSync(settingsPath(), 'utf8')
    const parsed = { ...defaults, ...JSON.parse(raw) } as AppSettings & {
      completionMode?: unknown
    }
    delete parsed.completionMode
    if (!isThemeId(parsed.theme)) parsed.theme = 'paper'
    if (parsed.locale !== 'zh' && parsed.locale !== 'en' && parsed.locale !== 'ko') {
      parsed.locale = 'zh'
    }
    parsed.homeworkHideLines = !!parsed.homeworkHideLines
    parsed.apHintsEnabled = parsed.apHintsEnabled !== false
    return parsed
  } catch {
    return { ...defaults }
  }
}

export function saveSettings(partial: Partial<AppSettings>): AppSettings {
  const next = { ...loadSettings(), ...partial } as AppSettings & { completionMode?: unknown }
  delete next.completionMode
  const file = settingsPath()
  if (!existsSync(dirname(file))) mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(next, null, 2), 'utf8')
  return next as AppSettings
}
