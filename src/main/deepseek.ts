import { loadSettings } from './settings'
import type {
  CompleteRequest,
  CompleteResponse,
  DebugChunk,
  DebugRequest,
  Locale
} from '../shared/types'

const CHAT_URL = 'https://api.deepseek.com/chat/completions'

let completeAbort: AbortController | null = null
let debugAbort: AbortController | null = null

function requireKey(): string {
  const key = loadSettings().apiKey.trim()
  if (!key) throw new Error('还没有填写 DeepSeek API Key。打开设置即可。')
  return key
}

function speak(locale: Locale | undefined): string {
  if (locale === 'en') return 'English'
  if (locale === 'ko') return 'Korean'
  return '简体中文'
}

function parseGhost(raw: string): { text: string; why: string } {
  const trimmed = raw.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      const json = JSON.parse(trimmed.slice(start, end + 1)) as {
        insert?: string
        text?: string
        why?: string
      }
      const text = String(json.insert ?? json.text ?? '')
      return { text, why: String(json.why ?? '').trim() }
    } catch {
      /* fall through */
    }
  }
  return { text: trimmed.replace(/^```(?:java)?\s*|\s*```$/g, ''), why: '' }
}

export function abortComplete(): void {
  completeAbort?.abort()
  completeAbort = null
}

export function abortDebug(): void {
  debugAbort?.abort()
  debugAbort = null
}

export async function complete(req: CompleteRequest): Promise<CompleteResponse> {
  abortComplete()
  const ac = new AbortController()
  completeAbort = ac
  const settings = loadSettings()
  try {
    const key = requireKey()
    const prefix = req.prefix.slice(-3500)
    const suffix = req.suffix.slice(0, 1500)
    const lang = speak(req.locale)
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.completionModel || 'deepseek-flash',
        max_tokens: 220,
        temperature: 0.15,
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You complete Java at ⟦CURSOR⟧ the way THIS file is already written: same names, indent, and habits. Do not restyle into textbook or AP-idiom code. Do not insert a lone { or } or finish a method/class unless the student is clearly mid-token toward that. If the code before the cursor is already a finished statement and nothing natural comes next, return {"insert":"","why":""}. insert is raw characters after the cursor (no markdown), at most 2 lines. why is one short reason in ${lang}. JSON only: {"insert":"...","why":"..."}.`
          },
          {
            role: 'user',
            content: `${prefix}⟦CURSOR⟧${suffix}`
          }
        ]
      }),
      signal: ac.signal
    })
    if (!res.ok) {
      const body = await res.text()
      return { text: '', error: `补全失败 ${res.status}: ${body.slice(0, 240)}` }
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const parsed = parseGhost(json.choices?.[0]?.message?.content ?? '')
    if (parsed.text.split('\n').length > 6) {
      return { text: parsed.text.split('\n').slice(0, 4).join('\n'), why: parsed.why }
    }
    return parsed
  } catch (err) {
    if ((err as Error).name === 'AbortError') return { text: '' }
    return { text: '', error: (err as Error).message }
  } finally {
    if (completeAbort === ac) completeAbort = null
  }
}

export async function debugStream(
  req: DebugRequest,
  onChunk: (chunk: DebugChunk) => void
): Promise<void> {
  abortDebug()
  debugAbort = new AbortController()
  const settings = loadSettings()
  const key = requireKey()
  const lang = speak(req.locale)
  const user = [
    req.filePath ? `文件: ${req.filePath}` : '',
    req.errorLine
      ? `报错指向第 ${req.errorLine} 行${req.errorMessage ? `：${req.errorMessage}` : ''}。先对着这一行说话。`
      : '',
    req.selectedSource
      ? `学生选中了第 ${req.selectedRange?.startLine ?? '?'}–${req.selectedRange?.endLine ?? '?'} 行，请主要分析这段，整份源码只作上下文:\n\`\`\`java\n${req.selectedSource}\n\`\`\``
      : '',
    req.source ? `完整源码:\n\`\`\`java\n${req.source}\n\`\`\`` : '',
    req.errorOutput ? `编译/运行输出:\n\`\`\`\n${req.errorOutput}\n\`\`\`` : '',
    req.note ? `用户说明: ${req.note}` : ''
  ]
    .filter(Boolean)
    .join('\n\n')

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.debugModel || 'deepseek-flash',
      stream: true,
      thinking: { type: settings.debugThinking ? 'enabled' : 'disabled' },
      messages: [
        {
          role: 'system',
          content: `You are an AP CSA FRQ reader inside Jcat, not a coder who finishes the lab. Reply in ${lang}. Use this shape, no greeting:\n行：Line N — what that line is doing / why it fails.\n给分：which AP scoring point this would lose (traversal, bounds, return, compare, constructor, etc.).\n最小改动：only the few lines to change. ANY Java MUST be inside a \`\`\`java fence, never as plain prose. Never paste a whole class if the file already has one. Do not write the rest of the FRQ.`
        },
        { role: 'user', content: user || '请直接找出问题并给出最小修复。' }
      ]
    }),
    signal: debugAbort.signal
  })

  if (!res.ok || !res.body) {
    const body = await res.text()
    throw new Error(`Debug 失败 ${res.status}: ${body.slice(0, 300)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string; reasoning_content?: string } }>
          }
          const delta = json.choices?.[0]?.delta
          if (delta?.reasoning_content)
            onChunk({ kind: 'reasoning', text: delta.reasoning_content })
          if (delta?.content) onChunk({ kind: 'content', text: delta.content })
        } catch {
          // ignore keep-alive or partial JSON
        }
      }
    }
  } finally {
    debugAbort = null
  }
}
