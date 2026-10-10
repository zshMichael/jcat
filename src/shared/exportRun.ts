const READY_MARKERS = ['Jcat 已就绪', 'Jcat is ready', 'Jcat 준비']

export function exportRunText(output: string): string {
  const lines = output.replace(/\r\n/g, '\n').split('\n')
  const kept = lines.filter((line) => {
    const t = line.trim()
    return !READY_MARKERS.some((marker) => t.includes(marker))
  })
  while (kept.length && !kept[0].trim()) kept.shift()
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop()
  return kept.join('\n')
}
