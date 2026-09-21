import { loadSettings } from './settings'
import { readSecretKey } from './secretStore'
import { isExamLocked } from './examGate'
import { consumeSse, flushSse } from '../shared/sseParse'
import {
  AI_LIMITS,
  clipNote,
  clipText,
  mapHttpError,
  mapNetworkError,
  shouldSendFullSource
} from '../shared/aiLimits'
import type {
  CompleteRequest,
  CompleteResponse,
  DebugChunk,
  DebugRequest,
  Locale
} from '../shared/types'

const CHAT_URL = 'https://api.deepseek.com/chat/completions'

let completeSeq = 0
let debugSeq = 0
let completeAbort: AbortController | null = null
let debugAbort: AbortController | null = null

function requireKey(): string {
  const key = readSecretKey()
  if (!key) throw new Error('AI_NEED_KEY')
  return key
}

function speak(locale: Locale | undefined): string {
  if (locale === 'en') return 'English'
  if (locale === 'ko') return 'Korean'
  return '简体中文'
}

function debugShape(locale: Locale | undefined): string {
  if (locale === 'en') {
    return 'Line: Line N — what that line is doing / why it fails.\nScore: which AP scoring point this would lose.\nMinimal change: only the few lines to change.'
  }
  if (locale === 'ko') {
    return '줄: Line N — 그 줄이 하는 일 / 실패한 이유.\n배점: 잃을 AP 배점.\n최소 수정: 바꿀 몇 줄만.'
  }
  return '行：Line N — 这一行在做什么 / 为什么失败。\n给分：会丢掉哪一条 AP 给分点。\n最小改动：只改那几行。'
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

function withTimeout(parent: AbortSignal, ms: number): AbortSignal {
  const extra = AbortSignal.timeout(ms)
  return AbortSignal.any([parent, extra])
}

export async function complete(req: CompleteRequest): Promise<CompleteResponse> {
  if (isExamLocked()) return { text: '', error: 'EXAM_LOCKED' }
  const seq = ++completeSeq
  abortComplete()
  const ac = new AbortController()
  completeAbort = ac
  const settings = loadSettings()
  try {
    const key = requireKey()
    const prefix = clipText(req.prefix, AI_LIMITS.prefix)
    const suffix = clipText(req.suffix, AI_LIMITS.suffix)
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
            content: `${prefix.text}⟦CURSOR⟧${suffix.text}`
          }
        ]
      }),
      signal: withTimeout(ac.signal, AI_LIMITS.requestMs)
    })
    if (seq !== completeSeq) return { text: '' }
    if (!res.ok) return { text: '', error: mapHttpError(res.status) }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    if (seq !== completeSeq) return { text: '' }
    const parsed = parseGhost(json.choices?.[0]?.message?.content ?? '')
    if (parsed.text.split('\n').length > 6) {
      return { text: parsed.text.split('\n').slice(0, 4).join('\n'), why: parsed.why }
    }
    return parsed
  } catch (err) {
    if (seq !== completeSeq) return { text: '' }
    return { text: '', error: mapNetworkError(err) }
  } finally {
    if (completeAbort === ac) completeAbort = null
  }
}

function debugUser(req: DebugRequest, locale: Locale | undefined): string {
  const clipped =
    locale === 'en'
      ? 'Content truncated for length.'
      : locale === 'ko'
        ? '길이 제한으로 잘렸습니다.'
        : '内容过长，已截断。'
  const src = clipText(req.source ?? '', AI_LIMITS.source)
  const selected = req.selectedSource ? clipText(req.selectedSource, AI_LIMITS.selected) : null
  const output = clipText(req.errorOutput ?? '', AI_LIMITS.output)
  const note = clipText(req.note ?? '', AI_LIMITS.note)
  const sendFull = shouldSendFullSource(src.text, selected?.text)
  const parts = [
    req.filePath ? `file: ${req.filePath}` : '',
    req.errorLine
      ? `error line ${req.errorLine}${req.errorMessage ? `: ${req.errorMessage}` : ''}`
      : '',
    selected
      ? clipNote(
          clipped,
          `selected lines ${req.selectedRange?.startLine ?? '?'}–${req.selectedRange?.endLine ?? '?'}:\n\`\`\`java\n${selected.text}\n\`\`\``,
          selected.clipped
        )
      : '',
    sendFull && src.text
      ? clipNote(
          clipped,
          `full source (context only):\n\`\`\`java\n${src.text}\n\`\`\``,
          src.clipped
        )
      : '',
    output.text
      ? clipNote(clipped, `compiler/run output:\n\`\`\`\n${output.text}\n\`\`\``, output.clipped)
      : '',
    note.text ? clipNote(clipped, `student note: ${note.text}`, note.clipped) : ''
  ]
  return parts.filter(Boolean).join('\n\n')
}

export async function debugStream(
  req: DebugRequest,
  onChunk: (chunk: DebugChunk) => void
): Promise<void> {
  if (isExamLocked()) throw new Error('EXAM_LOCKED')
  const seq = ++debugSeq
  abortDebug()
  const ac = new AbortController()
  debugAbort = ac
  const settings = loadSettings()
  const key = requireKey()
  const lang = speak(req.locale)
  const live = (): boolean => seq === debugSeq && debugAbort === ac

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
          content: `You are an AP CSA FRQ reader inside Jcat, not a coder who finishes the lab. Reply in ${lang}. Use this shape, no greeting:\n${debugShape(req.locale)}\nANY Java MUST be inside a \`\`\`java fence, never as plain prose. Never paste a whole class if the file already has one. Do not write the rest of the FRQ.`
        },
        {
          role: 'user',
          content: debugUser(req, req.locale) || 'Find the issue and give a minimal fix.'
        }
      ]
    }),
    signal: withTimeout(ac.signal, AI_LIMITS.requestMs)
  })

  if (!live()) return
  if (!res.ok || !res.body) {
    throw new Error(mapHttpError(res.status))
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let idle = setTimeout(() => ac.abort(), AI_LIMITS.idleMs)
  const bump = (): void => {
    clearTimeout(idle)
    idle = setTimeout(() => ac.abort(), AI_LIMITS.idleMs)
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bump()
      const { events, rest } = consumeSse(buf, decoder.decode(value, { stream: true }))
      buf = rest
      for (const ev of events) {
        if (!live()) return
        if (ev.done) return
        if (ev.reasoning) onChunk({ kind: 'reasoning', text: ev.reasoning })
        if (ev.content) onChunk({ kind: 'content', text: ev.content })
      }
    }
    if (live()) {
      for (const ev of flushSse(buf)) {
        if (ev.done) return
        if (ev.reasoning) onChunk({ kind: 'reasoning', text: ev.reasoning })
        if (ev.content) onChunk({ kind: 'content', text: ev.content })
      }
    }
  } finally {
    clearTimeout(idle)
    if (debugAbort === ac) debugAbort = null
  }
}
