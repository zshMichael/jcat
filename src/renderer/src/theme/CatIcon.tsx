import type { HTMLAttributes, JSX } from 'react'
import { catMarkSrc } from './catMark'

type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & { size?: number }

/** Cat-J mark, painted with currentColor so it tracks nearby type. */
export function CatIcon({ size = 26, className, style, ...props }: Props): JSX.Element {
  return (
    <span
      className={['cat-mark', className].filter(Boolean).join(' ')}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${catMarkSrc})`,
        maskImage: `url(${catMarkSrc})`,
        ...style
      }}
      aria-hidden="true"
      {...props}
    />
  )
}
