import type { JSX, SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { size?: number }

/** Faceless cat head fused with a J — matches the app icon mark. */
export function CatIcon({ size = 22, ...props }: Props): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.4 26.2 L17.6 12.6 L30.4 22.6" />
        <path d="M37.4 22.6 L47.2 12.2 L43.8 26.4" />
        <path d="M20.4 26.2 C14.2 33.2 14.6 45.2 28.4 51" />
        <path d="M43.8 26.4 C50.4 33.4 51 43.4 37.2 48.4" />
      </g>
      <path
        fill="currentColor"
        d="M30.9 12.2c1.2 0 2.15.95 2.15 2.15v31.4c0 4.8-2.55 8.7-8 11.6-.95.5-2.15.2-2.7-.7-.55-.9-.3-2.1.55-2.7 4.25-2.9 6.35-5.65 6.35-8.2V14.35c0-1.2.95-2.15 2.15-2.15z"
      />
      <circle fill="currentColor" cx="21.2" cy="54.7" r="3.45" />
    </svg>
  )
}
