import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'

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
  const bodyRef = useRef(children)
  if (open) bodyRef.current = children

  useEffect(() => {
    if (open) {
      setPresent(true)
      setPhase('in')
      return
    }
    if (!present) return
    setPhase('out')
    const id = window.setTimeout(() => setPresent(false), OUT_MS)
    return () => window.clearTimeout(id)
    // present is read from the render that saw `open` change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!present) return null
  return (
    <div className={`modal-backdrop is-${phase}`} onClick={onClose}>
      <div
        className={`modal ${className ?? ''} is-${phase}`}
        onClick={(e) => e.stopPropagation()}
      >
        {bodyRef.current}
      </div>
    </div>
  )
}
