export type LogLoc = { file: string; line: number; column: number }

export type LogPart = { text: string; loc?: LogLoc }

const FILE_LINE =
  /(?<![^\s:(])((?:[A-Za-z]:[\\/])?(?:[^:\s()[\]]+[\\/])*[^:\s()[\]]+\.java)(?::(\d+)(?::(\d+))?|:\[(\d+),(\d+)\])/g

export function splitOutput(text: string): LogPart[] {
  const parts: LogPart[] = []
  let last = 0
  FILE_LINE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FILE_LINE.exec(text))) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) })
    parts.push({
      text: match[0],
      loc: {
        file: match[1],
        line: Number(match[2] || match[4]),
        column: Number(match[3] || match[5] || 1)
      }
    })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts.length ? parts : [{ text }]
}
