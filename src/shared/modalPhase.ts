export type ModalPhase = 'closed' | 'in' | 'out'

/** One step of the dialog's presence. An open request always shows the dialog. */
export function nextModalPhase(phase: ModalPhase, open: boolean): ModalPhase {
  if (open) return 'in'
  if (phase === 'in') return 'out'
  return phase
}
