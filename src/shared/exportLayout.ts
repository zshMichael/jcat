export const EXPORT_MIN_CARD_WIDTH = 880
export const EXPORT_MAX_PNG_WIDTH = 2880
export const EXPORT_PAD_X = 64
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

export function pngScaleToMaxWidth(width: number, maxWidth = EXPORT_MAX_PNG_WIDTH): number {
  if (width <= 0 || width <= maxWidth) return 1
  return maxWidth / width
}
