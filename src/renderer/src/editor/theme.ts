import type * as Monaco from 'monaco-editor'
import type { ThemeId } from '@shared/types'

type EditorTheme = {
  base: 'vs' | 'vs-dark'
  background: string
  foreground: string
  line: string
  lineActive: string
  selection: string
  inactive: string
  highlight: string
  cursor: string
  indent: string
  widget: string
  ghost: string
  comment: string
  keyword: string
  string: string
  number: string
  type: string
  delimiter: string
}

const EDITOR: Record<ThemeId, EditorTheme> = {
  paper: {
    base: 'vs',
    background: '#F6F1EA',
    foreground: '#2C241B',
    line: '#B5A89A',
    lineActive: '#6B5E52',
    selection: '#E6D5C4',
    inactive: '#EFE7DC',
    highlight: '#EFE7DC88',
    cursor: '#C46B4A',
    indent: '#E6DCD0',
    widget: '#F3ECE3',
    ghost: '#9A8B7A',
    comment: '8A7B6C',
    keyword: '8C4A32',
    string: '4F6F56',
    number: '6B5B95',
    type: '3D5A80',
    delimiter: '6B5E52'
  },
  ink: {
    base: 'vs-dark',
    background: '#1A1714',
    foreground: '#EDE6DC',
    line: '#6B6056',
    lineActive: '#C4B6A6',
    selection: '#3A3129',
    inactive: '#2A241F',
    highlight: '#2A241F88',
    cursor: '#D08468',
    indent: '#3A322B',
    widget: '#221E1A',
    ghost: '#8A7C6E',
    comment: '8A7B6C',
    keyword: 'E09A7A',
    string: '9BBB9A',
    number: 'B5A3D4',
    type: '8FB3C9',
    delimiter: 'A89888'
  },
  macaron: {
    base: 'vs',
    background: '#F6F0F3',
    foreground: '#4A3F52',
    line: '#C5B4C0',
    lineActive: '#7A6A82',
    selection: '#E9D5E3',
    inactive: '#EFE6EC',
    highlight: '#E8F3EE88',
    cursor: '#D489A8',
    indent: '#E4D8E0',
    widget: '#F3EAF0',
    ghost: '#B09AAB',
    comment: 'A08C9C',
    keyword: 'C56B8A',
    string: '5E9B84',
    number: '7B6BA8',
    type: '6A8EAE',
    delimiter: '8A7A8C'
  },
  celadon: {
    base: 'vs-dark',
    background: '#14201C',
    foreground: '#D4E6DC',
    line: '#4E6A60',
    lineActive: '#A8C8BA',
    selection: '#1F332C',
    inactive: '#1C2D27',
    highlight: '#1C2D2788',
    cursor: '#7FB3A4',
    indent: '#243830',
    widget: '#182822',
    ghost: '#6E8B80',
    comment: '6E8B80',
    keyword: '8FC4B0',
    string: 'C5B48A',
    number: '9BB7D4',
    type: 'A3C9B8',
    delimiter: '8AA89C'
  },
  pistachio: {
    base: 'vs',
    background: '#EEF6EF',
    foreground: '#3C4A3E',
    line: '#9BB5A0',
    lineActive: '#5B735F',
    selection: '#D3E6D6',
    inactive: '#E4EFE5',
    highlight: '#E4EFE588',
    cursor: '#7EB38A',
    indent: '#D7E6D9',
    widget: '#E8F2E9',
    ghost: '#8AA090',
    comment: '7A8F7C',
    keyword: '4F8A62',
    string: '7A6A3A',
    number: '6B5B95',
    type: '3D6E80',
    delimiter: '5B735F'
  },
  peach: {
    base: 'vs',
    background: '#FBF0EA',
    foreground: '#5A3F38',
    line: '#C4A79C',
    lineActive: '#8A6A62',
    selection: '#F0D5C8',
    inactive: '#F5E4DB',
    highlight: '#F5E4DB88',
    cursor: '#E0896C',
    indent: '#EED6CA',
    widget: '#F8EBE4',
    ghost: '#B08A80',
    comment: 'A08076',
    keyword: 'C45D4A',
    string: '5E8A62',
    number: '8A5B8C',
    type: '5A6E9A',
    delimiter: '8A6A62'
  },
  lemon: {
    base: 'vs',
    background: '#FBF6E8',
    foreground: '#4A4228',
    line: '#C4B88A',
    lineActive: '#85784A',
    selection: '#F0E2B8',
    inactive: '#F4ECD6',
    highlight: '#F4ECD688',
    cursor: '#E0B04A',
    indent: '#ECE1C4',
    widget: '#F7F0DC',
    ghost: '#B0A478',
    comment: '9A8C5A',
    keyword: 'B07A20',
    string: '5A8A4A',
    number: '6B5B95',
    type: '3D6A80',
    delimiter: '85784A'
  },
  blueberry: {
    base: 'vs',
    background: '#EEF1F8',
    foreground: '#3A4158',
    line: '#A0A8C0',
    lineActive: '#6E7690',
    selection: '#D7DEF0',
    inactive: '#E4E8F3',
    highlight: '#E4E8F388',
    cursor: '#7B8FD4',
    indent: '#D6DCED',
    widget: '#E9EDF6',
    ghost: '#9098B0',
    comment: '7A8298',
    keyword: '5A6AB0',
    string: '4A8A78',
    number: '8A5BA8',
    type: '3D6E9A',
    delimiter: '6E7690'
  }
}

export function monacoThemeName(id: ThemeId): string {
  return `jcat-${id}`
}

export function defineJcatThemes(monaco: typeof Monaco): void {
  for (const [id, t] of Object.entries(EDITOR) as Array<[ThemeId, EditorTheme]>) {
    monaco.editor.defineTheme(monacoThemeName(id), {
      base: t.base,
      inherit: true,
      rules: [
        { token: 'comment', foreground: t.comment, fontStyle: 'italic' },
        { token: 'keyword', foreground: t.keyword },
        { token: 'string', foreground: t.string },
        { token: 'number', foreground: t.number },
        { token: 'type', foreground: t.type },
        { token: 'delimiter', foreground: t.delimiter }
      ],
      colors: {
        'editor.background': t.background,
        'editor.foreground': t.foreground,
        'editorLineNumber.foreground': t.line,
        'editorLineNumber.activeForeground': t.lineActive,
        'editor.selectionBackground': t.selection,
        'editor.inactiveSelectionBackground': t.inactive,
        'editor.lineHighlightBackground': t.highlight,
        'editorCursor.foreground': t.cursor,
        'editorIndentGuide.background': t.indent,
        'editorGutter.background': t.background,
        'editorWidget.background': t.widget,
        'editorGhostText.foreground': t.ghost,
        'editorGhostText.border': '#00000000'
      }
    })
  }
}

export function defineJcatTheme(monaco: typeof Monaco): void {
  defineJcatThemes(monaco)
}
