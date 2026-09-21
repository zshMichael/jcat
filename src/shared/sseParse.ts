export type SseDelta = {
  content?: string
  reasoning?: string
  done: boolean
}

function parseDataLine(data: string): SseDelta | null {
  const trimmed = data.trim()
  if (!trimmed || trimmed === '[DONE]') return { done: trimmed === '[DONE]' }
  try {
    const json = JSON.parse(trimmed) as {
      choices?: Array<{ delta?: { content?: string; reasoning_content?: string } }>
    }
    const delta = json.choices?.[0]?.delta
    if (!delta) return { done: false }
    return {
      content: delta.content,
      reasoning: delta.reasoning_content,
      done: false
    }
  } catch {
    return null
  }
}

/** Feed SSE text (possibly partial). Returns parsed deltas and leftover buffer. */
export function consumeSse(buffer: string, chunk: string): { events: SseDelta[]; rest: string } {
  const events: SseDelta[] = []
  let buf = buffer + chunk
  const lines = buf.split(/\r?\n/)
  buf = lines.pop() ?? ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(':')) continue
    if (!trimmed.startsWith('data:')) continue
    const parsed = parseDataLine(trimmed.slice(5))
    if (parsed) events.push(parsed)
  }
  return { events, rest: buf }
}

/** Flush a trailing buffer that never ended with a newline. */
export function flushSse(buffer: string): SseDelta[] {
  const trimmed = buffer.trim()
  if (!trimmed) return []
  if (!trimmed.startsWith('data:')) return []
  const parsed = parseDataLine(trimmed.slice(5))
  return parsed ? [parsed] : []
}
