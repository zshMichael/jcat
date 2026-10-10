export const WINDOW_MIN_W = 960
export const WINDOW_MIN_H = 640
export const WINDOW_SCALE = 0.78
export const WINDOW_MARGIN = 32

export type WorkArea = { x: number; y: number; width: number; height: number }
export type WindowBounds = { x: number; y: number; width: number; height: number }

function fit(preferred: number, min: number, avail: number): number {
  const room = Math.max(1, avail)
  const lower = Math.min(min, room)
  return Math.min(room, Math.max(lower, Math.round(preferred)))
}

export function initialWindowBounds(work: WorkArea): WindowBounds {
  const width = fit(work.width * WINDOW_SCALE, WINDOW_MIN_W, work.width - WINDOW_MARGIN)
  const height = fit(work.height * WINDOW_SCALE, WINDOW_MIN_H, work.height - WINDOW_MARGIN)
  return {
    width,
    height,
    x: work.x + Math.round((work.width - width) / 2),
    y: work.y + Math.round((work.height - height) / 2)
  }
}
