import type { Locale } from '../shared/types'

const DIALOGS = {
  zh: {
    openFolder: '打开或新建文件夹',
    open: '打开',
    openFolderMsg: '选择一个文件夹，或在对话框里新建。',
    newFile: '新建文件',
    allFiles: '所有文件',
    newFolder: '新建文件夹',
    longImage: '导出代码长图'
  },
  en: {
    openFolder: 'Open or create folder',
    open: 'Open',
    openFolderMsg: 'Pick a folder, or create one in the dialog.',
    newFile: 'New file',
    allFiles: 'All files',
    newFolder: 'New folder',
    longImage: 'Export long image'
  },
  ko: {
    openFolder: '폴더 열기 또는 만들기',
    open: '열기',
    openFolderMsg: '폴더를 고르거나 대화상자에서 새로 만드세요.',
    newFile: '새 파일',
    allFiles: '모든 파일',
    newFolder: '새 폴더',
    longImage: '코드 긴 그림 내보내기'
  }
} as const

export function dialogCopy(locale: Locale): Record<keyof (typeof DIALOGS)['zh'], string> {
  return DIALOGS[locale] ?? DIALOGS.zh
}
