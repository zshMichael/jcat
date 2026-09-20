export const THEME_IDS = [
  'paper',
  'macaron',
  'pistachio',
  'peach',
  'lemon',
  'blueberry',
  'ink',
  'celadon'
] as const

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
    id: 'macaron',
    name: '马卡龙',
    blurb: '浅色 · 柔',
    windowBg: '#F6F0F3',
    swatches: ['#F6F0F3', '#5A4C62', '#E7A7C3', '#A9D4C2']
  },
  {
    id: 'pistachio',
    name: '开心果',
    blurb: '浅色 · 清',
    windowBg: '#EEF6EF',
    swatches: ['#EEF6EF', '#3C4A3E', '#7EB38A', '#F3D9A6']
  },
  {
    id: 'peach',
    name: '蜜桃',
    blurb: '浅色 · 甜',
    windowBg: '#FBF0EA',
    swatches: ['#FBF0EA', '#5A3F38', '#E0896C', '#F2C4B0']
  },
  {
    id: 'lemon',
    name: '柠檬糖',
    blurb: '浅色 · 亮',
    windowBg: '#FBF6E8',
    swatches: ['#FBF6E8', '#4A4228', '#E0B04A', '#E8C98A']
  },
  {
    id: 'blueberry',
    name: '蓝莓奶',
    blurb: '浅色 · 冷',
    windowBg: '#EEF1F8',
    swatches: ['#EEF1F8', '#3A4158', '#7B8FD4', '#C9B6E4']
  },
  {
    id: 'ink',
    name: '墨夜',
    blurb: '深色 · 暖',
    windowBg: '#1A1714',
    swatches: ['#1A1714', '#EDE6DC', '#C46B4A', '#2C261F']
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
