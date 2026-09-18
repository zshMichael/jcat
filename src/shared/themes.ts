export const THEME_IDS = ['paper', 'ink', 'macaron', 'celadon'] as const

export type ThemeId = (typeof THEME_IDS)[number]

export type ThemeCard = {
  id: ThemeId
  name: string
  blurb: string
  windowBg: string
  swatches: [string, string, string, string]
}

export const THEME_CARDS: ThemeCard[] = [
  {
    id: 'paper',
    name: '宣纸',
    blurb: '浅色 · 暖',
    windowBg: '#F6F1EA',
    swatches: ['#F6F1EA', '#2C241B', '#C46B4A', '#E6DCD0']
  },
  {
    id: 'ink',
    name: '墨夜',
    blurb: '深色 · 暖',
    windowBg: '#1A1714',
    swatches: ['#1A1714', '#EDE6DC', '#C46B4A', '#2C261F']
  },
  {
    id: 'macaron',
    name: '马卡龙',
    blurb: '浅色 · 柔',
    windowBg: '#F6F0F3',
    swatches: ['#F6F0F3', '#5A4C62', '#E7A7C3', '#A9D4C2']
  },
  {
    id: 'celadon',
    name: '青釉',
    blurb: '深色 · 冷',
    windowBg: '#14201C',
    swatches: ['#14201C', '#D4E6DC', '#7FB3A4', '#1C2D27']
  }
]

export function isThemeId(value: string | undefined): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId)
}
