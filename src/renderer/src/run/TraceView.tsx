import type { JSX } from 'react'
import { boardsAt, traceSteps, type TraceEvent, type TraceSnap } from '@shared/instrumentJava'
import type { Msg } from '../i18n'

function Board({ snap }: { snap: TraceSnap }): JSX.Element {
  const cols = Math.max(1, ...snap.rows.map((row) => row.length))
  return (
    <div className={`trace-board is-${snap.kind}`}>
      <div className="trace-board-name">{snap.name}</div>
      <div
        className="trace-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(1.6em, auto))` }}
      >
        {snap.rows.flatMap((row, r) =>
          Array.from({ length: cols }, (_, c) => (
            <span className="trace-cell" key={`${snap.name}-${r}-${c}`}>
              {row[c] ?? ''}
            </span>
          ))
        )}
      </div>
    </div>
  )
}

export function TraceView({
  events,
  step,
  onStep,
  t
}: {
  events: TraceEvent[]
  step: number
  onStep: (n: number) => void
  t: (key: Msg) => string
}): JSX.Element | null {
  const steps = traceSteps(events)
  const boards = boardsAt(events, steps.length ? step : null)
  if (!boards.length && !steps.length) return null
  const current = steps[Math.min(Math.max(0, step), Math.max(0, steps.length - 1))]
  const max = Math.max(0, steps.length - 1)
  return (
    <div
      className="trace-view"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {boards.length ? (
        <div className="trace-boards">
          {boards.map((snap) => (
            <Board key={snap.name} snap={snap} />
          ))}
        </div>
      ) : null}
      {steps.length ? (
        <div className="trace-stepper">
          <div className="trace-step-meta">
            <span>{t('traceStep')}</span>
            {current ? (
              <span>
                {t('traceLine').replace('{n}', String(current.line))} · {step + 1}/{steps.length}
              </span>
            ) : null}
          </div>
          {current?.locals.length ? (
            <div className="trace-locals">
              {current.locals.map((local) => (
                <span key={local.name} className="trace-local">
                  {local.name} = {local.value}
                </span>
              ))}
            </div>
          ) : null}
          <div className="trace-slider">
            <button type="button" disabled={step <= 0} onClick={() => onStep(step - 1)}>
              {t('tracePrev')}
            </button>
            <input
              type="range"
              min={0}
              max={max}
              value={Math.min(step, max)}
              onChange={(e) => onStep(Number(e.target.value))}
            />
            <button type="button" disabled={step >= max} onClick={() => onStep(step + 1)}>
              {t('traceNext')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
