/** Floor for a short snippet. Longer lines grow past this in `cardWidthForCode`. */
export const EXPORT_MIN_CARD_WIDTH = 480
export const EXPORT_MAX_PNG_WIDTH = 2880
/** Left 56px plus right 80px. Keep in step with `.export-card` padding. */
export const EXPORT_PAD_X = 136
export const EXPORT_LINE_GUTTER = 52

export function expandExportTabs(line: string): string {
  return line.replace(/\t/g, '    ')
}

export function cardWidthForCode(
  maxLinePx: number,
  hideLines: boolean,
  paddingX = EXPORT_PAD_X,
  gutter = EXPORT_LINE_GUTTER
): number {
  const extra = hideLines ? 0 : gutter
  return Math.max(EXPORT_MIN_CARD_WIDTH, Math.ceil(maxLinePx + paddingX + extra))
}

export function moveExportOrder<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items
  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function pngScaleToMaxWidth(width: number, maxWidth = EXPORT_MAX_PNG_WIDTH): number {
  if (width <= 0 || width <= maxWidth) return 1
  return maxWidth / width
}
