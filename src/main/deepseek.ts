import { loadSettings } from './settings'
import type { CompleteRequest, CompleteResponse, DebugChunk, DebugRequest } from '../shared/types'

const CHAT_URL = 'https://api.deepseek.com/chat/completions'
const FIM_URL = 'https://api.deepseek.com/beta/completions'

let completeAbort: AbortController | null = null
let debugAbort: AbortController | null = null

function requireKey(): string {
  const key = loadSettings().apiKey.trim()
  if (!key) throw new Error('还没有填写 DeepSeek API Key。打开设置即可。')
  return key
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
  completeAbort = new AbortController()
  const settings = loadSettings()
  try {
    const key = requireKey()
    const prefix = req.prefix.slice(-4000)
    const suffix = req.suffix.slice(0, 2000)
    const res = await fetch(FIM_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.completionModel || 'deepseek-flash',
        prompt: prefix,
        suffix,
        max_tokens: 96,
        temperature: 0.2,
        stop: ['\n\n\n']
      }),
      signal: completeAbort.signal
    })
    if (!res.ok) {
      const body = await res.text()
      return { text: '', error: `补全失败 ${res.status}: ${body.slice(0, 240)}` }
    }
    const json = (await res.json()) as { choices?: Array<{ text?: string }> }
    return { text: json.choices?.[0]?.text ?? '' }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return { text: '' }
    return { text: '', error: (err as Error).message }
  } finally {
    completeAbort = null
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
  const user = [
    req.filePath ? `文件: ${req.filePath}` : '',
    req.source ? `源码:\n\`\`\`java\n${req.source}\n\`\`\`` : '',
    req.errorOutput ? `编译/运行输出:\n\`\`\`\n${req.errorOutput}\n\`\`\`` : '',
    req.note ? `用户说明: ${req.note}` : '请直接找出问题并给出最小修复。'
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
          content:
            '你是 Jcat 里的 Java 调试助手。根据源码和报错，用中文直接指出原因和最小改法。给出修复代码时用一个 java 代码块包起来，方便复制。不要寒暄。'
        },
        { role: 'user', content: user }
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
