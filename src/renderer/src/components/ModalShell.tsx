import { useEffect, useState, type JSX, type ReactNode } from 'react'

const OUT_MS = 280

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function ModalShell({ open, onClose, children, className }: Props): JSX.Element | null {
  const [present, setPresent] = useState(open)
  const [phase, setPhase] = useState<'in' | 'out'>(open ? 'in' : 'out')
  const [openSeen, setOpenSeen] = useState(open)

  if (open !== openSeen) {
    setOpenSeen(open)
    if (open) {
      setPresent(true)
      setPhase('in')
    } else if (present) {
      setPhase('out')
    }
  }

  useEffect(() => {
    if (open || phase !== 'out') return
    const id = window.setTimeout(() => setPresent(false), OUT_MS)
    return () => window.clearTimeout(id)
  }, [open, phase])

  if (!present) return null
  return (
    <div className={`modal-backdrop is-${phase}`} onClick={onClose}>
      <div className={`modal ${className ?? ''} is-${phase}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
