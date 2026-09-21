import { BrowserWindow, dialog } from 'electron'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  type Stats
} from 'fs'
import { basename, dirname, extname, join, relative, sep } from 'path'
import { homedir } from 'os'
import type { FileNode } from '../shared/types'
import { loadSettings } from './settings'
import { dialogCopy } from './nativeDialogs'

const SKIP = new Set([
  '.git',
  'node_modules',
  'out',
  'target',
  'dist',
  '.idea',
  '.jcat',
  '__pycache__'
])

let currentRoot: string | null = null

export function getRoot(): string | null {
  return currentRoot
}

export function setRoot(root: string | null): void {
  currentRoot = root
}

export async function pickFolder(win: BrowserWindow): Promise<string | null> {
  const home = join(homedir(), 'Jcat')
  mkdirSync(home, { recursive: true })
  const copy = dialogCopy(loadSettings().locale)
  const result = await dialog.showOpenDialog(win, {
    title: copy.openFolder,
    defaultPath: currentRoot || home,
    buttonLabel: copy.open,
    message: copy.openFolderMsg,
    properties: ['openDirectory', 'createDirectory', 'promptToCreate']
  })
  if (result.canceled || !result.filePaths[0]) return null
  mkdirSync(result.filePaths[0], { recursive: true })
  currentRoot = result.filePaths[0]
  return currentRoot
}

export function readTree(dir = currentRoot, depth = 0): FileNode[] {
  if (!dir || !existsSync(dir) || depth > 12) return []
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  const nodes: FileNode[] = []
  for (const name of names.sort((a, b) => a.localeCompare(b))) {
    if (name.startsWith('.') && name !== '.gitignore') continue
    if (SKIP.has(name)) continue
    if (name.endsWith('.class')) continue
    const path = join(dir, name)
    let st: Stats
    try {
      st = statSync(path)
    } catch {
      continue
    }
    const isDir = st.isDirectory()
    const node: FileNode = { name, path, isDir, mtime: st.mtimeMs }
    if (isDir) node.children = readTree(path, depth + 1)
    nodes.push(node)
  }
  return nodes
}

export function readJavaSources(): Array<{ path: string; text: string }> {
  const root = currentRoot
  if (!root || !existsSync(root)) return []
  const out: Array<{ path: string; text: string }> = []
  const walk = (dir: string, depth: number): void => {
    if (depth > 12) return
    let names: string[]
    try {
      names = readdirSync(dir)
    } catch {
      return
    }
    for (const name of names) {
      if (name.startsWith('.') && name !== '.gitignore') continue
      if (SKIP.has(name) || name.endsWith('.class')) continue
      const path = join(dir, name)
      let st: Stats
      try {
        st = statSync(path)
      } catch {
        continue
      }
      if (st.isDirectory()) {
        walk(path, depth + 1)
        continue
      }
      if (!name.toLowerCase().endsWith('.java')) continue
      try {
        out.push({ path, text: readFileSync(path, 'utf8') })
      } catch {
        /* skip unreadable files; exam report must not crash */
      }
    }
  }
  walk(root, 0)
  return out
}

export function readText(file: string): string {
  return readFileSync(file, 'utf8')
}

export function writeText(file: string, content: string): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content, 'utf8')
}

export function createFile(file: string, content = ''): void {
  mkdirSync(dirname(file), { recursive: true })
  if (!existsSync(file)) writeFileSync(file, content, 'utf8')
}

export function createFolder(dir: string): void {
  mkdirSync(dir, { recursive: true })
}

export function fileName(file: string): string {
  return basename(file)
}

function uniqueName(dir: string, name: string): string {
  const ext = extname(name)
  const stem = basename(name, ext)
  let dest = join(dir, name)
  let i = 1
  while (existsSync(dest)) {
    dest = join(dir, `${stem} copy${i > 1 ? ` ${i}` : ''}${ext}`)
    i += 1
  }
  return dest
}

function assertInsideRoot(target: string): void {
  const root = currentRoot
  if (!root) return
  const rel = relative(root, target)
  if (rel.startsWith('..') || rel === '') {
    throw new Error('outside project')
  }
}

export function renameEntry(from: string, name: string): string {
  assertInsideRoot(from)
  const next = name.trim()
  if (!next || /[\\/]/.test(next) || next === '.' || next === '..') {
    throw new Error('bad name')
  }
  const dest = join(dirname(from), next)
  if (dest === from) return dest
  assertInsideRoot(dest)
  if (existsSync(dest)) throw new Error('exists')
  renameSync(from, dest)
  return dest
}

export function deleteEntry(target: string): void {
  assertInsideRoot(target)
  if (currentRoot && target === currentRoot) throw new Error('cannot delete root')
  rmSync(target, { recursive: true, force: true })
}

export function transferEntry(from: string, destDir: string, cut: boolean): string {
  assertInsideRoot(from)
  assertInsideRoot(destDir)
  if (!statSync(destDir).isDirectory()) destDir = dirname(destDir)
  const prefix = from.endsWith(sep) ? from : from + sep
  if (destDir === from || destDir.startsWith(prefix)) {
    throw new Error('into self')
  }
  let dest = join(destDir, basename(from))
  if (dest === from) {
    if (cut) return from
    dest = uniqueName(destDir, basename(from))
  } else if (existsSync(dest)) {
    dest = uniqueName(destDir, basename(from))
  }
  if (cut) renameSync(from, dest)
  else cpSync(from, dest, { recursive: true })
  return dest
}

export type PracticeKind = 'hello' | 'scanner'
export type FrqKind = 'methods' | 'class' | 'arraylist' | 'grid'

function uniqueDir(base: string): string {
  if (!existsSync(base)) return base
  let i = 2
  while (existsSync(`${base}-${i}`)) i += 1
  return `${base}-${i}`
}

const HELLO_JAVA = `public class Hello {
    public static void main(String[] args) {
        System.out.println("Jcat says hello.");
    }
}
`

const SCANNER_JAVA = `import java.util.Scanner;

public class ScannerLab {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        System.out.print("Your name: ");
        String name = input.nextLine();
        System.out.print("An integer: ");
        int n = input.nextInt();
        System.out.println("Hello, " + name + ". You typed " + n + ".");
        input.close();
    }
}
`

export function createEmpty(name: string): { root: string } {
  const home = join(homedir(), 'Jcat')
  mkdirSync(home, { recursive: true })
  const stem = name.trim().replace(/[\\/]/g, '') || 'untitled'
  const folder = uniqueDir(join(home, stem))
  mkdirSync(folder, { recursive: true })
  currentRoot = folder
  return { root: folder }
}

export function createPractice(kind: PracticeKind): { root: string; file: string } {
  const home = join(homedir(), 'Jcat')
  mkdirSync(home, { recursive: true })
  const folder = uniqueDir(join(home, kind === 'hello' ? 'hello' : 'scanner-lab'))
  mkdirSync(folder, { recursive: true })
  const name = kind === 'hello' ? 'Hello.java' : 'ScannerLab.java'
  const file = join(folder, name)
  writeFileSync(file, kind === 'hello' ? HELLO_JAVA : SCANNER_JAVA, 'utf8')
  currentRoot = folder
  return { root: folder, file }
}

const FRQ: Record<FrqKind, { dir: string; file: string; source: string }> = {
  methods: {
    dir: 'frq-methods',
    file: 'MethodsFRQ.java',
    source: `public class MethodsFRQ {
    /** Return how many values in nums are even. */
    public static int countEven(int[] nums) {
        return 0;
    }

    public static void main(String[] args) {
        int[] sample = {1, 2, 3, 4, 5, 6};
        System.out.println(countEven(sample));
    }
}
`
  },
  class: {
    dir: 'frq-class',
    file: 'Pet.java',
    source: `public class Pet {
    private String name;
    private int age;

    public Pet(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    /** Return true if this pet is older than other. */
    public boolean isOlderThan(Pet other) {
        return false;
    }

    public static void main(String[] args) {
        Pet a = new Pet("Mochi", 3);
        Pet b = new Pet("Luna", 5);
        System.out.println(a.isOlderThan(b));
    }
}
`
  },
  arraylist: {
    dir: 'frq-arraylist',
    file: 'ArrayListFRQ.java',
    source: `import java.util.ArrayList;

public class ArrayListFRQ {
    /** Count how many words have length at least min. */
    public static int countLong(ArrayList<String> words, int min) {
        return 0;
    }

    public static void main(String[] args) {
        ArrayList<String> words = new ArrayList<String>();
        words.add("cat");
        words.add("java");
        words.add("exam");
        System.out.println(countLong(words, 4));
    }
}
`
  },
  grid: {
    dir: 'frq-grid',
    file: 'GridFRQ.java',
    source: `public class GridFRQ {
    /** Return the sum of values in the given row. */
    public static int rowSum(int[][] grid, int row) {
        return 0;
    }

    public static void main(String[] args) {
        int[][] grid = {
            {1, 2, 3},
            {4, 5, 6}
        };
        System.out.println(rowSum(grid, 1));
    }
}
`
  }
}

export function createFrq(kind: FrqKind): { root: string; file: string } {
  const spec = FRQ[kind]
  if (!spec) throw new Error('unknown frq')
  const home = join(homedir(), 'Jcat')
  mkdirSync(home, { recursive: true })
  const folder = uniqueDir(join(home, spec.dir))
  mkdirSync(folder, { recursive: true })
  const file = join(folder, spec.file)
  writeFileSync(file, spec.source, 'utf8')
  currentRoot = folder
  return { root: folder, file }
}

