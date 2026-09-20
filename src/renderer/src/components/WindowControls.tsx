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
          <path d="M1 5h8" />
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
            <path d="M3 3.2h4.2v4.2H3z" />
            <path d="M2.2 4.4V2.2H6.8" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <rect x="1.6" y="1.6" width="6.8" height="6.8" rx="0.4" />
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
          <path d="M2 2l6 6M8 2L2 8" />
        </svg>
      </button>
    </div>
  )
}
