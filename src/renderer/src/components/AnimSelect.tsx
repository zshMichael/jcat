import { useEffect, useRef, useState, type JSX } from 'react'

export type AnimOption = { id: string; label: string }

type Props = {
  value: string
  options: AnimOption[]
  onChange: (id: string) => void
  disabled?: boolean
  title?: string
  className?: string
  placeholder?: string
}

export function AnimSelect({
  value,
  options,
  onChange,
  disabled,
  title,
  className,
  placeholder
}: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const current = options.find((item) => item.id === value)?.label || placeholder || value

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div
      className={`sort-menu anim-select ${open ? 'is-open' : ''} ${className ?? ''} ${disabled ? 'is-disabled' : ''}`}
      ref={ref}
    >
      <button
        type="button"
        className="tree-sort anim-select-btn"
        title={title}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v)
        }}
      >
        <span className="anim-select-label">{current || placeholder}</span>
        <span className="sort-caret">▾</span>
      </button>
      <div className="sort-menu-list">
        <div className="sort-menu-inner">
          {options.length === 0 ? (
            <button type="button" disabled>
              {placeholder}
            </button>
          ) : (
            options.map((item) => (
              <button
                key={item.id}
                type="button"
                className={value === item.id ? 'is-on' : ''}
                onClick={() => {
                  onChange(item.id)
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
