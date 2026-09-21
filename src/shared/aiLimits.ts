export const AI_LIMITS = {
  source: 24_000,
  selected: 8_000,
  output: 8_000,
  note: 2_000,
  prefix: 3_500,
  suffix: 1_500,
  requestMs: 90_000,
  idleMs: 25_000
} as const

export type Clip = { text: string; clipped: boolean }

export function clipText(value: string, max: number): Clip {
  if (value.length <= max) return { text: value, clipped: false }
  return { text: value.slice(0, max), clipped: true }
}

export function clipNote(label: string, value: string, clipped: boolean): string {
  if (!clipped) return value
  return `${value}\n\n[${label}]`
}

export function shouldSendFullSource(source: string, selected: string | undefined): boolean {
  if (!selected) return true
  if (!source) return false
  if (selected.length >= source.length * 0.8) return false
  return true
}

export function mapHttpError(status: number): string {
  if (status === 401) return 'AI_UNAUTHORIZED'
  if (status === 403) return 'AI_FORBIDDEN'
  if (status === 429) return 'AI_RATE_LIMIT'
  if (status >= 500) return 'AI_SERVER'
  return 'AI_HTTP'
}

export function mapNetworkError(err: unknown): string {
  const name = (err as { name?: string })?.name
  const msg = String((err as Error)?.message ?? err)
  if (name === 'AbortError' || /aborted/i.test(msg)) return 'AI_ABORTED'
  if (/timeout/i.test(msg)) return 'AI_TIMEOUT'
  if (/fetch|network|ENOTFOUND|ECONN|Failed to fetch/i.test(msg)) return 'AI_NETWORK'
  return 'AI_UNKNOWN'
}
