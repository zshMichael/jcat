import { useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { nextModalPhase, type ModalPhase } from '@shared/modalPhase'

const OUT_MS = 280

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function ModalShell({ open, onClose, children, className }: Props): JSX.Element | null {
  const [phase, setPhase] = useState<ModalPhase>(open ? 'in' : 'closed')
  const openedAt = useRef(0)
  const next = nextModalPhase(phase, open)
  if (next !== phase) setPhase(next)

  useLayoutEffect(() => {
    if (open) openedAt.current = Date.now()
  }, [open])

  useEffect(() => {
    if (phase !== 'out') return
    const id = window.setTimeout(() => {
      setPhase((current) => (current === 'out' ? 'closed' : current))
    }, OUT_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  if (phase === 'closed') return null
  return (
    <div
      className={`modal-backdrop is-${phase}`}
      onClick={() => {
        if (Date.now() - openedAt.current < 400) return
        onClose()
      }}
    >
      <div className={`modal ${className ?? ''} is-${phase}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
