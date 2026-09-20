import type { Locale } from './types'

export type OutHit = {
  token: string
  line: number
  column: number
}

export type HoverDoc = Record<Locale, string>

const HOVER: Record<string, HoverDoc> = {
  String: {
    zh: '考试允许。常用：length、substring、indexOf、equals、compareTo、split。',
    en: 'Allowed on the exam. length, substring, indexOf, equals, compareTo, split.',
    ko: '시험 허용. length, substring, indexOf, equals, compareTo, split.'
  },
  length: {
    zh: 'String.length()：字符个数。考试允许。',
    en: 'String.length(): number of characters. Allowed.',
    ko: 'String.length(): 문자 수. 허용.'
  },
  substring: {
    zh: 'String.substring(from, to)：含 from、不含 to。substring(from) 取到末尾。考试允许。',
    en: 'String.substring(from, to) is inclusive-exclusive. substring(from) to the end. Allowed.',
    ko: 'String.substring(from, to)는 from 포함, to 미포함. 허용.'
  },
  indexOf: {
    zh: 'String.indexOf(str)：第一次出现的下标，没有则 -1。考试允许。',
    en: 'String.indexOf(str): first index, or -1. Allowed.',
    ko: 'String.indexOf(str): 첫 위치, 없으면 -1. 허용.'
  },
  equals: {
    zh: 'equals(other)：内容是否相同。比较 String 请用 equals，不要用 ==。考试允许。',
    en: 'equals(other): same contents. Use equals for String, not ==. Allowed.',
    ko: 'equals(other): 내용 비교. String은 == 대신 equals. 허용.'
  },
  compareTo: {
    zh: 'String.compareTo(other)：字典序，负数 / 0 / 正数。考试允许。',
    en: 'String.compareTo(other): lexicographic, negative / 0 / positive. Allowed.',
    ko: 'String.compareTo(other): 사전순. 허용.'
  },
  split: {
    zh: 'String.split(del)：按分隔符切成字符串数组。考试允许。',
    en: 'String.split(del): split into a String array. Allowed.',
    ko: 'String.split(del): 문자열 배열로 분할. 허용.'
  },
  ArrayList: {
    zh: '考试允许的列表。size、add、get、set、remove(index)。下标从 0 开始。',
    en: 'Exam ArrayList: size, add, get, set, remove(index). Indexes from 0.',
    ko: '시험 ArrayList: size, add, get, set, remove(index). 인덱스는 0부터.'
  },
  size: {
    zh: 'ArrayList.size()：元素个数。考试允许。',
    en: 'ArrayList.size(): number of elements. Allowed.',
    ko: 'ArrayList.size(): 원소 수. 허용.'
  },
  add: {
    zh: 'ArrayList.add(obj) 追加；add(index, obj) 插入。考试允许。',
    en: 'ArrayList.add(obj) appends; add(index, obj) inserts. Allowed.',
    ko: 'ArrayList.add(obj) 추가, add(index, obj) 삽입. 허용.'
  },
  get: {
    zh: 'ArrayList.get(index)：取元素。考试允许。',
    en: 'ArrayList.get(index): get element. Allowed.',
    ko: 'ArrayList.get(index): 원소 가져오기. 허용.'
  },
  set: {
    zh: 'ArrayList.set(index, obj)：替换并返回旧值。考试允许。',
    en: 'ArrayList.set(index, obj): replace, returns old value. Allowed.',
    ko: 'ArrayList.set(index, obj): 교체. 허용.'
  },
  remove: {
    zh: 'ArrayList.remove(index)：按下标删除。考试允许。',
    en: 'ArrayList.remove(index): remove by index. Allowed.',
    ko: 'ArrayList.remove(index): 인덱스로 삭제. 허용.'
  },
  Math: {
    zh: '考试允许：abs、pow、sqrt、random() → [0.0, 1.0)。',
    en: 'Allowed: abs, pow, sqrt, random() → [0.0, 1.0).',
    ko: '허용: abs, pow, sqrt, random() → [0.0, 1.0).'
  },
  abs: {
    zh: 'Math.abs(x)：绝对值。考试允许。',
    en: 'Math.abs(x): absolute value. Allowed.',
    ko: 'Math.abs(x): 절댓값. 허용.'
  },
  pow: {
    zh: 'Math.pow(a, b)：a 的 b 次方，返回 double。考试允许。',
    en: 'Math.pow(a, b): a to the power b, returns double. Allowed.',
    ko: 'Math.pow(a, b): 거듭제곱, double. 허용.'
  },
  sqrt: {
    zh: 'Math.sqrt(x)：平方根。考试允许。',
    en: 'Math.sqrt(x): square root. Allowed.',
    ko: 'Math.sqrt(x): 제곱근. 허용.'
  },
  random: {
    zh: 'Math.random()：[0.0, 1.0) 的 double。考试允许。',
    en: 'Math.random(): double in [0.0, 1.0). Allowed.',
    ko: 'Math.random(): [0.0, 1.0)의 double. 허용.'
  },
  Integer: {
    zh: '考试允许：MIN_VALUE、MAX_VALUE、parseInt(s)。',
    en: 'Allowed: MIN_VALUE, MAX_VALUE, parseInt(s).',
    ko: '허용: MIN_VALUE, MAX_VALUE, parseInt(s).'
  },
  parseInt: {
    zh: 'Integer.parseInt(s)：字符串转 int。考试允许。',
    en: 'Integer.parseInt(s): String to int. Allowed.',
    ko: 'Integer.parseInt(s): 문자열 → int. 허용.'
  },
  Double: {
    zh: '考试允许：parseDouble(s)。',
    en: 'Allowed: parseDouble(s).',
    ko: '허용: parseDouble(s).'
  },
  parseDouble: {
    zh: 'Double.parseDouble(s)：字符串转 double。考试允许。',
    en: 'Double.parseDouble(s): String to double. Allowed.',
    ko: 'Double.parseDouble(s): 문자열 → double. 허용.'
  },
  Scanner: {
    zh: '考试允许：nextInt / nextDouble / nextBoolean / nextLine / next / hasNext / close。读错类型会 InputMismatchException。',
    en: 'Allowed: nextInt, nextDouble, nextBoolean, nextLine, next, hasNext, close. Wrong type → InputMismatchException.',
    ko: '허용: nextInt, nextDouble, nextBoolean, nextLine, next, hasNext, close.'
  },
  nextInt: {
    zh: 'Scanner.nextInt()：读下一个 int。考试允许。',
    en: 'Scanner.nextInt(): next int. Allowed.',
    ko: 'Scanner.nextInt(): 다음 int. 허용.'
  },
  nextLine: {
    zh: 'Scanner.nextLine()：读到行末。考试允许。',
    en: 'Scanner.nextLine(): rest of the line. Allowed.',
    ko: 'Scanner.nextLine(): 줄 끝까지. 허용.'
  },
  next: {
    zh: 'Scanner.next()：读下一个单词。考试允许。',
    en: 'Scanner.next(): next token. Allowed.',
    ko: 'Scanner.next(): 다음 토큰. 허용.'
  },
  hasNext: {
    zh: 'Scanner.hasNext()：还有没有输入。考试允许。',
    en: 'Scanner.hasNext(): more input? Allowed.',
    ko: 'Scanner.hasNext(): 입력이 더 있는지. 허용.'
  },
  nextDouble: {
    zh: 'Scanner.nextDouble()：读下一个 double。考试允许。',
    en: 'Scanner.nextDouble(): next double. Allowed.',
    ko: 'Scanner.nextDouble(): 다음 double. 허용.'
  },
  nextBoolean: {
    zh: 'Scanner.nextBoolean()：读下一个 boolean。考试允许。',
    en: 'Scanner.nextBoolean(): next boolean. Allowed.',
    ko: 'Scanner.nextBoolean(): 다음 boolean. 허용.'
  },
  close: {
    zh: 'Scanner.close()：关掉扫描器。考试允许。',
    en: 'Scanner.close(): close the scanner. Allowed.',
    ko: 'Scanner.close(): 스캐너 닫기. 허용.'
  },
  MIN_VALUE: {
    zh: 'Integer.MIN_VALUE：int 最小值。考试允许。',
    en: 'Integer.MIN_VALUE: smallest int. Allowed.',
    ko: 'Integer.MIN_VALUE: int 최솟값. 허용.'
  },
  MAX_VALUE: {
    zh: 'Integer.MAX_VALUE：int 最大值。考试允许。',
    en: 'Integer.MAX_VALUE: largest int. Allowed.',
    ko: 'Integer.MAX_VALUE: int 최댓값. 허용.'
  },
  File: {
    zh: 'File(pathname)：考试允许，配合 Scanner(File) 读文本。',
    en: 'File(pathname): allowed, often with Scanner(File).',
    ko: 'File(pathname): 허용. Scanner(File)과 함께 텍스트 읽기.'
  },
  toString: {
    zh: 'Object.toString()：对象的字符串形式。考试允许。',
    en: 'Object.toString(): string form. Allowed.',
    ko: 'Object.toString(): 문자열 형태. 허용.'
  }
}

const BANNED = [
  'HashMap',
  'HashSet',
  'TreeMap',
  'TreeSet',
  'LinkedList',
  'LinkedHashMap',
  'Hashtable',
  'Vector',
  'Stack',
  'Deque',
  'ArrayDeque',
  'PriorityQueue',
  'Optional',
  'StringBuilder',
  'StringBuffer',
  'Pattern',
  'Matcher',
  'Stream',
  'Collectors',
  'Files',
  'Path',
  'Map',
  'Set',
  'Queue'
]

const BANNED_SET = new Set(BANNED)

export function hoverDoc(word: string, locale: Locale): string | null {
  const doc = HOVER[word]
  return doc ? doc[locale] : null
}

function skipNoise(source: string): boolean[] {
  const skip = new Array(source.length).fill(false)
  let i = 0
  let block = false
  let line = false
  let quote: '"' | "'" | null = null
  while (i < source.length) {
    const ch = source[i]
    const next = source[i + 1]
    if (line) {
      skip[i] = true
      if (ch === '\n') line = false
      i += 1
      continue
    }
    if (block) {
      skip[i] = true
      if (ch === '*' && next === '/') {
        skip[i + 1] = true
        block = false
        i += 2
        continue
      }
      i += 1
      continue
    }
    if (quote) {
      skip[i] = true
      if (ch === '\\') {
        if (i + 1 < source.length) skip[i + 1] = true
        i += 2
        continue
      }
      if (ch === quote) quote = null
      i += 1
      continue
    }
    if (ch === '/' && next === '/') {
      line = true
      skip[i] = skip[i + 1] = true
      i += 2
      continue
    }
    if (ch === '/' && next === '*') {
      block = true
      skip[i] = skip[i + 1] = true
      i += 2
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      skip[i] = true
      i += 1
      continue
    }
    i += 1
  }
  return skip
}

function pushHit(hits: OutHit[], token: string, source: string, index: number): void {
  const before = source.slice(0, index)
  const line = before.split('\n').length
  const column = index - (before.lastIndexOf('\n') + 1) + 1
  hits.push({ token, line, column })
}

/** Tokens and constructs outside the AP CSA 2026 subset. Not syntax errors. */
export function detectOutOfSubset(source: string): OutHit[] {
  const skip = skipNoise(source)
  const hits: OutHit[] = []
  const seenLine = new Set<string>()

  const consider = (token: string, index: number): void => {
    const key = `${token}:${source.slice(0, index).split('\n').length}`
    if (seenLine.has(key)) return
    seenLine.add(key)
    pushHit(hits, token, source, index)
  }

  const ident = /\b[A-Za-z_]\w*\b/g
  let m: RegExpExecArray | null
  while ((m = ident.exec(source))) {
    if (skip[m.index]) continue
    const word = m[0]
    if (word === 'var') consider('var', m.index)
    else if (BANNED_SET.has(word)) consider(word, m.index)
    else if (word === 'interface' || word === 'enum' || word === 'record') consider(word, m.index)
    else if (word === 'implements' || word === 'extends') consider(word, m.index)
  }

  const extras: [RegExp, string][] = [
    [/->/g, '->'],
    [/\.stream\s*\(/g, 'stream()'],
    [/\.parallelStream\s*\(/g, 'stream()'],
    [/\.forEach\s*\(/g, 'forEach'],
    [/\.printf\s*\(/g, 'printf']
  ]
  for (const [re, token] of extras) {
    re.lastIndex = 0
    while ((m = re.exec(source))) {
      if (skip[m.index]) continue
      consider(token, m.index)
    }
  }
  return hits
}

export function uniqueTokens(hits: OutHit[]): string[] {
  return [...new Set(hits.map((h) => h.token))]
}
