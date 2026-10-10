import type { Locale } from './types'

export function appleLanguages(locale: Locale): string[] {
  if (locale === 'en') return ['en']
  if (locale === 'ko') return ['ko']
  return ['zh-Hans', 'zh-CN']
}
