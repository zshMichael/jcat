import type { Locale } from './types'

export type ApStat = Record<Locale, string>

export type ApRow = {
  code?: string
  note?: Record<Locale, string>
}

export type ApItem = {
  name: Record<Locale, string>
  blurb?: Record<Locale, string>
  stats?: ApStat[]
  rows?: ApRow[]
}

export type ApSection = {
  id: string
  title: Record<Locale, string>
  blurb: Record<Locale, string>
  items: ApItem[]
}

const L = (zh: string, en: string, ko: string): Record<Locale, string> => ({ zh, en, ko })

export const APCSA_SECTIONS: ApSection[] = [
  {
    id: 'exam',
    title: L('考试结构', 'Exam format', '시험 구성'),
    blurb: L(
      '2026 年 AP CSA：全数字考试，3 小时。Java Quick Reference 在 Bluebook 中提供，也可打印纸质。',
      '2026 AP CSA is fully digital, 3 hours. The Java Quick Reference is in Bluebook and may be printed.',
      '2026 AP CSA는 디지털 시험, 3시간. Java Quick Reference는 Bluebook에 있으며 인쇄할 수 있습니다.'
    ),
    items: [
      {
        name: L('选择题', 'Multiple choice', '객관식'),
        stats: [
          L('42 题', '42 questions', '42문항'),
          L('90 分钟', '90 minutes', '90분'),
          L('占 55%', '55% of score', '점수 55%')
        ],
        blurb: L('覆盖全部 4 个单元。', 'Covers all four units.', '4개 단원 모두.')
      },
      {
        name: L('自由作答', 'Free response', '서술형'),
        stats: [
          L('4 题', '4 questions', '4문항'),
          L('90 分钟', '90 minutes', '90분'),
          L('占 45%', '45% of score', '점수 45%')
        ],
        rows: [
          { note: L('1  方法与控制结构', '1  Methods & control', '1  메서드와 제어') },
          { note: L('2  类设计', '2  Class design', '2  클래스 설계') },
          { note: L('3  ArrayList 数据分析', '3  ArrayList analysis', '3  ArrayList 분석') },
          { note: L('4  二维数组', '4  2D array', '4  2D 배열') }
        ]
      },
      {
        name: L('单元权重', 'Unit weights', '단원 비중'),
        rows: [
          { code: 'U1', note: L('对象与方法  15–25%', 'Objects & methods  15–25%', '객체와 메서드  15–25%') },
          { code: 'U2', note: L('选择与循环  25–35%', 'Selection & iteration  25–35%', '선택과 반복  25–35%') },
          { code: 'U3', note: L('类的创建  10–18%', 'Class creation  10–18%', '클래스 생성  10–18%') },
          { code: 'U4', note: L('数据集合  30–40%', 'Data collections  30–40%', '데이터 모음  30–40%') }
        ]
      }
    ]
  },
  {
    id: 'ref',
    title: { zh: 'Java Quick Reference', en: 'Java Quick Reference', ko: 'Java Quick Reference' },
    blurb: L(
      '考试允许使用的 Java 库方法（College Board 2026）。',
      'Library methods allowed on the exam (College Board 2026).',
      '시험에서 사용할 수 있는 Java 라이브러리 메서드 (College Board 2026).'
    ),
    items: [
      {
        name: { zh: 'String', en: 'String', ko: 'String' },
        rows: [
          { code: 'String(str)' },
          { code: 'length()' },
          { code: 'substring(from, to)', note: L('含 from，不含 to', 'inclusive–exclusive', 'from 포함, to 미포함') },
          { code: 'substring(from)', note: L('取到末尾', 'to the end', '끝까지') },
          { code: 'indexOf(str)', note: L('没有则 -1', 'or -1', '없으면 -1') },
          { code: 'equals(other)' },
          { code: 'compareTo(other)' },
          { code: 'split(del)' }
        ]
      },
      {
        name: { zh: 'Integer / Double / Math', en: 'Integer / Double / Math', ko: 'Integer / Double / Math' },
        rows: [
          { code: 'Integer.MIN_VALUE' },
          { code: 'Integer.MAX_VALUE' },
          { code: 'Integer.parseInt(s)' },
          { code: 'Double.parseDouble(s)' },
          { code: 'Math.abs(x)' },
          { code: 'Math.pow(a, b)' },
          { code: 'Math.sqrt(x)' },
          { code: 'Math.random()', note: L('[0.0, 1.0)', '[0.0, 1.0)', '[0.0, 1.0)') }
        ]
      },
      {
        name: { zh: 'ArrayList', en: 'ArrayList', ko: 'ArrayList' },
        blurb: L('下标从 0 开始。', 'Indexes start at 0.', '인덱스는 0부터.'),
        rows: [
          { code: 'size()' },
          { code: 'add(obj)', note: L('追加', 'append', '추가') },
          { code: 'add(index, obj)', note: L('插入', 'insert', '삽입') },
          { code: 'get(index)' },
          { code: 'set(index, obj)' },
          { code: 'remove(index)' }
        ]
      },
      {
        name: { zh: 'Object / File / Scanner', en: 'Object / File / Scanner', ko: 'Object / File / Scanner' },
        blurb: L(
          '读错类型会抛出 InputMismatchException。',
          'Wrong type → InputMismatchException.',
          '형 오류 시 InputMismatchException.'
        ),
        rows: [
          { code: 'equals(other)' },
          { code: 'toString()' },
          { code: 'File(pathname)' },
          { code: 'Scanner(file)' },
          { code: 'nextInt()  nextDouble()  nextBoolean()' },
          { code: 'nextLine()  next()  hasNext()  close()' }
        ]
      }
    ]
  },
  {
    id: 'u1',
    title: L('第 1 章 使用对象与方法', 'Unit 1 Using objects and methods', '1단원 객체와 메서드'),
    blurb: L(
      '约 15–25%。算法入门、类型、表达式、API、对象与 String。',
      'About 15–25%. Algorithms, types, expressions, APIs, objects, and String.',
      '약 15–25%. 알고리즘, 타입, 식, API, 객체, String.'
    ),
    items: [
      {
        name: L('1.1–1.6 基础', '1.1–1.6 Basics', '1.1–1.6 기초'),
        stats: [
          L('算法', 'Algorithms', '알고리즘'),
          L('变量与类型', 'Variables & types', '변수와 타입'),
          L('表达式与输出', 'Expressions & output', '식과 출력'),
          L('赋值与输入', 'Assignment & input', '대입과 입력'),
          L('强制转换与范围', 'Casting & range', '캐스팅과 범위'),
          L('复合赋值', 'Compound assignment', '복합 대입')
        ]
      },
      {
        name: L('1.7–1.11 方法与 Math', '1.7–1.11 Methods and Math', '1.7–1.11 메서드와 Math'),
        stats: [
          L('API 与库', 'APIs and libraries', 'API와 라이브러리'),
          L('注释文档', 'Comments', '주석'),
          L('方法签名', 'Method signatures', '메서드 시그니처'),
          L('调用类方法', 'Class methods', '클래스 메서드'),
          L('Math 类', 'Math', 'Math')
        ]
      },
      {
        name: L('1.12–1.15 对象与 String', '1.12–1.15 Objects and String', '1.12–1.15 객체와 String'),
        stats: [
          L('实例', 'Instances', '인스턴스'),
          L('new 与存储', 'Instantiation', '생성'),
          L('实例方法', 'Instance methods', '인스턴스 메서드'),
          L('String 操作', 'String work', 'String 조작')
        ],
        blurb: L(
          'substring 是半开区间：含 from，不含 to。',
          'substring is half-open: inclusive from, exclusive to.',
          'substring은 반열린 구간: from 포함, to 미포함.'
        )
      }
    ]
  },
  {
    id: 'u2',
    title: L('第 2 章 选择与循环', 'Unit 2 Selection and iteration', '2단원 선택과 반복'),
    blurb: L(
      '约 25–35%。布尔、if、while/for、字符串算法、嵌套循环、非正式运行时间。',
      'About 25–35%. Booleans, if, while/for, string algorithms, nested loops, informal run time.',
      '약 25–35%. 불리언, if, while/for, 문자열 알고리즘, 중첩 반복, 비공식 실행 시간.'
    ),
    items: [
      {
        name: L('2.1–2.6 选择', '2.1–2.6 Selection', '2.1–2.6 선택'),
        stats: [
          L('选择与重复', 'Selection / repetition', '선택과 반복'),
          L('布尔表达式', 'Boolean expressions', '불리언 식'),
          L('if', 'if', 'if'),
          L('嵌套 if', 'Nested if', '중첩 if'),
          L('复合布尔', 'Compound Booleans', '복합 불리언'),
          L('等价比较', 'Comparing Booleans', '불리언 비교')
        ]
      },
      {
        name: L('2.7–2.12 循环', '2.7–2.12 Iteration', '2.7–2.12 반복'),
        stats: [
          L('while', 'while', 'while'),
          L('for', 'for', 'for'),
          L('选择与循环算法', 'Selection / iteration algorithms', '선택/반복 알고리즘'),
          L('String 算法', 'String algorithms', 'String 알고리즘'),
          L('嵌套迭代', 'Nested iteration', '중첩 반복'),
          L('非正式运行时间', 'Informal run time', '비공식 실행 시간')
        ]
      }
    ]
  },
  {
    id: 'u3',
    title: L('第 3 章 类的创建', 'Unit 3 Class creation', '3단원 클래스 생성'),
    blurb: L(
      '约 10–18%。抽象、类解剖、构造器、方法、引用、作用域、this。对应 FRQ 类设计。',
      'About 10–18%. Abstraction, class anatomy, constructors, methods, references, scope, this. Maps to the class-design FRQ.',
      '약 10–18%. 추상화, 클래스 구조, 생성자, 메서드, 참조, 범위, this. 클래스 설계 FRQ와 연결.'
    ),
    items: [
      {
        name: L('3.1–3.4 设计与构造', '3.1–3.4 Design and constructors', '3.1–3.4 설계와 생성자'),
        stats: [
          L('抽象与程序设计', 'Abstraction & design', '추상화와 설계'),
          L('设计影响', 'Impact of design', '설계의 영향'),
          L('类的结构', 'Anatomy of a class', '클래스 구조'),
          L('构造器', 'Constructors', '생성자')
        ]
      },
      {
        name: L('3.5–3.9 方法与作用域', '3.5–3.9 Methods and scope', '3.5–3.9 메서드와 범위'),
        stats: [
          L('编写方法', 'Writing methods', '메서드 작성'),
          L('传递 / 返回引用', 'Pass / return references', '참조 전달/반환'),
          L('类变量与方法', 'Class variables & methods', '클래스 변수와 메서드'),
          L('作用域与访问', 'Scope and access', '범위와 접근'),
          L('this', 'this', 'this')
        ]
      }
    ]
  },
  {
    id: 'u4',
    title: L('第 4 章 数据集合', 'Unit 4 Data collections', '4단원 데이터 모음'),
    blurb: L(
      '约 30–40%。数组、文本文件、包装类、ArrayList、二维数组、查找排序、递归。',
      'About 30–40%. Arrays, text files, wrappers, ArrayList, 2D arrays, search/sort, recursion.',
      '약 30–40%. 배열, 텍스트 파일, 래퍼, ArrayList, 2D 배열, 탐색/정렬, 재귀.'
    ),
    items: [
      {
        name: L('4.1–4.7 数组与文件', '4.1–4.7 Arrays and files', '4.1–4.7 배열과 파일'),
        stats: [
          L('数据伦理', 'Ethics around data', '데이터 윤리'),
          L('数据集', 'Data sets', '데이터 집합'),
          L('数组创建与访问', 'Array create / access', '배열 생성/접근'),
          L('遍历', 'Traversals', '순회'),
          L('数组算法', 'Array algorithms', '배열 알고리즘'),
          L('文本文件', 'Text files', '텍스트 파일'),
          L('包装类', 'Wrapper classes', '래퍼 클래스')
        ]
      },
      {
        name: L('4.8–4.13 列表与二维', '4.8–4.13 Lists and 2D', '4.8–4.13 리스트와 2D'),
        stats: [
          L('ArrayList 方法', 'ArrayList methods', 'ArrayList 메서드'),
          L('列表遍历', 'List traversals', '리스트 순회'),
          L('列表算法', 'List algorithms', '리스트 알고리즘'),
          L('二维数组', '2D arrays', '2D 배열')
        ],
        blurb: L('对应 FRQ 3 与 4。', 'Maps to FRQ 3 and 4.', 'FRQ 3·4와 연결.')
      },
      {
        name: L('4.14–4.17 查找排序递归', '4.14–4.17 Search, sort, recursion', '4.14–4.17 탐색, 정렬, 재귀'),
        stats: [
          L('查找', 'Searching', '탐색'),
          L('排序', 'Sorting', '정렬'),
          L('递归', 'Recursion', '재귀'),
          L('递归查找与排序', 'Recursive search & sort', '재귀 탐색과 정렬')
        ]
      }
    ]
  }
]

export const APCSA_SOURCE = L(
  '依据 College Board《AP Computer Science A Course and Exam Description》(Fall 2025) 与 2026 Java Quick Reference 整理，供学习查阅。',
  'Study notes from College Board AP CSA CED (Fall 2025) and the 2026 Java Quick Reference.',
  'College Board AP CSA CED(2025 가을)와 2026 Java Quick Reference를 바탕으로 한 학습 노트.'
)
