import type { JSX } from 'react'
import type { Msg } from '../i18n'

type Props = {
  maximized: boolean
  t: (key: Msg) => string
}

export function WindowControls({ maximized, t }: Props): JSX.Element {
  return (
    <div className="window-controls">
      <button
        type="button"
        className="win-cap win-min"
        title={t('winMin')}
        aria-label={t('winMin')}
        onClick={() => void window.jcat.window.minimize()}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1 5.5h8" />
        </svg>
      </button>
      <button
        type="button"
        className="win-cap win-max"
        title={maximized ? t('winRestore') : t('winMax')}
        aria-label={maximized ? t('winRestore') : t('winMax')}
        onClick={() => void window.jcat.window.maximize()}
      >
        {maximized ? (
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <rect x="2.5" y="2.5" width="6" height="6" />
            <path d="M3.5 2.5V1.5H8.5V6.5H7.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <rect x="1.5" y="1.5" width="7" height="7" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="win-cap win-close"
        title={t('winClose')}
        aria-label={t('winClose')}
        onClick={() => void window.jcat.window.close()}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
        </svg>
      </button>
    </div>
  )
}
