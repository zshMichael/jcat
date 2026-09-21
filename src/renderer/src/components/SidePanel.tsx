import { Fragment, useEffect, useState, type JSX } from 'react'
import * as monaco from 'monaco-editor'
import type { Locale, ThemeId } from '@shared/types'
import { APCSA_SECTIONS, APCSA_SOURCE, type ApItem } from '@shared/apcsa'
import { splitDebugParts, splitDebugTurns } from '../debug/debugParts'
import { defineJcatThemes, monacoThemeName } from '../editor/theme'
import type { Msg } from '../i18n'

type Props = {
  t: (key: Msg) => string
  themeId: ThemeId
  debugText: string
  debugReasoning: string
  debugNote: string
  debugging: boolean
  selectionHint: string | null
  onNote: (value: string) => void
  onAnalyze: () => void
  onStop: () => void
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function JavaCodeBox({
  code,
  themeId,
  copyLabel,
  copiedLabel
}: {
  code: string
  themeId: ThemeId
  copyLabel: string
  copiedLabel: string
}): JSX.Element {
  const [html, setHtml] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    defineJcatThemes(monaco)
    monaco.editor.setTheme(monacoThemeName(themeId))
    let live = true
    void monaco.editor.colorize(code, 'java', {}).then((colored) => {
      if (live) setHtml(colored)
    })
    return () => {
      live = false
    }
  }, [code, themeId])
  return (
    <div className="debug-java">
      <div className="debug-java-bar">
        <span>Java</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code).then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1400)
            })
          }}
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre
        className="debug-java-code"
        dangerouslySetInnerHTML={{ __html: html || escapeHtml(code) }}
      />
    </div>
  )
}

function DebugTurnBody({
  text,
  themeId,
  copyLabel,
  copiedLabel
}: {
  text: string
  themeId: ThemeId
  copyLabel: string
  copiedLabel: string
}): JSX.Element {
  const parts = splitDebugParts(text)
  if (!parts.length) return <div className="debug-prose">{text}</div>
  return (
    <>
      {parts.map((part, i) =>
        part.kind === 'java' ? (
          <JavaCodeBox
            key={`j-${i}`}
            code={part.code}
            themeId={themeId}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
          />
        ) : (
          <div key={`p-${i}`} className="debug-prose">
            {part.text}
          </div>
        )
      )}
    </>
  )
}

function DebugReply({
  text,
  themeId,
  placeholder,
  copyLabel,
  copiedLabel
}: {
  text: string
  themeId: ThemeId
  placeholder: string
  copyLabel: string
  copiedLabel: string
}): JSX.Element {
  if (!text) return <>{placeholder}</>
  const turns = splitDebugTurns(text)
  if (!turns.length) return <>{placeholder}</>
  return (
    <>
      {turns.map((turn, i) => (
        <Fragment key={`turn-${i}`}>
          {i > 0 ? <hr className="debug-turn" /> : null}
          {turn ? (
            <DebugTurnBody
              text={turn}
              themeId={themeId}
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
            />
          ) : null}
        </Fragment>
      ))}
    </>
  )
}

export function SidePanel({
  t,
  themeId,
  debugText,
  debugReasoning,
  debugNote,
  debugging,
  selectionHint,
  onNote,
  onAnalyze,
  onStop
}: Props): JSX.Element {
  return (
    <aside className="sidepanel">
      <div className="debug-head">
        <h2>{t('aiDebug')}</h2>
      </div>
      {selectionHint ? <div className="debug-sel">{selectionHint}</div> : null}
      <div className="debug-body">
        {debugReasoning ? <div className="reasoning">{debugReasoning}</div> : null}
        <DebugReply
          text={debugText}
          themeId={themeId}
          placeholder={debugging ? t('thinking') : t('debugHint')}
          copyLabel={t('copy')}
          copiedLabel={t('copied')}
        />
      </div>
      <div className="debug-note">
        <textarea
          value={debugNote}
          placeholder={t('debugNote')}
          rows={1}
          onChange={(e) => onNote(e.target.value)}
        />
        {debugging ? (
          <button type="button" onClick={onStop}>
            {t('debugStop')}
          </button>
        ) : (
          <button className="primary" onClick={onAnalyze}>
            {t('analyze')}
          </button>
        )}
      </div>
    </aside>
  )
}

function ApCopy({
  item,
  locale,
  compact
}: {
  item: ApItem
  locale: Locale
  compact?: boolean
}): JSX.Element {
  return (
    <div className={`ap-copy ${compact ? 'is-compact' : ''}`}>
      {item.stats && item.stats.length > 0 ? (
        <div className="ap-chips">
          {item.stats.map((stat) => (
            <span key={stat.en} className="ap-chip">
              {stat[locale]}
            </span>
          ))}
        </div>
      ) : null}
      {item.rows && item.rows.length > 0 ? (
        <ul className="ap-rows">
          {item.rows.map((row, i) => (
            <li key={`${row.code ?? ''}-${row.note?.en ?? i}`} className="ap-row">
              {row.code ? <code>{row.code}</code> : null}
              {row.note ? <span className="ap-note">{row.note[locale]}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {item.blurb ? <p className="ap-item-blurb">{item.blurb[locale]}</p> : null}
    </div>
  )
}

export function ApGuide({ locale }: { locale: Locale }): JSX.Element {
  const [openId, setOpenId] = useState('ref')
  return (
    <div className="ap-list">
      {APCSA_SECTIONS.map((section) => {
        const open = openId === section.id
        return (
          <section key={section.id} className={`ap-section ${open ? 'is-open' : ''}`}>
            <button
              type="button"
              className="ap-head"
              onClick={() => setOpenId(open ? '' : section.id)}
            >
              <span>{section.title[locale]}</span>
              <i className="chev">{open ? '▾' : '▸'}</i>
            </button>
            <div className="ap-fold">
              <div className="ap-fold-inner">
                <p className="ap-blurb">{section.blurb[locale]}</p>
                {section.items.map((item) => (
                  <div key={item.name.en} className="ap-item">
                    <strong>{item.name[locale]}</strong>
                    <ApCopy item={item} locale={locale} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}
      <p className="ap-source">{APCSA_SOURCE[locale]}</p>
    </div>
  )
}

export function ExamReference({
  locale,
  open,
  t
}: {
  locale: Locale
  open: boolean
  t: (key: Msg) => string
}): JSX.Element {
  const ref = APCSA_SECTIONS.find((s) => s.id === 'ref')
  const items = ref?.items ?? []
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const safe = items.length ? ((index % items.length) + items.length) % items.length : 0
  const item = items[safe]
  return (
    <div className={`exam-ref ${open ? 'is-open' : ''}`}>
      <div className="exam-ref-fold">
        <div className="exam-ref-sheet">
          {item ? (
            <>
              <div className="exam-card-nav">
                <button
                  type="button"
                  disabled={items.length < 2}
                  onClick={() => {
                    setFlipped(false)
                    setIndex((i) => (i - 1 + items.length) % items.length)
                  }}
                >
                  {t('examCardPrev')}
                </button>
                <span>
                  {safe + 1} / {items.length}
                </span>
                <button
                  type="button"
                  disabled={items.length < 2}
                  onClick={() => {
                    setFlipped(false)
                    setIndex((i) => (i + 1) % items.length)
                  }}
                >
                  {t('examCardNext')}
                </button>
              </div>
              <button
                type="button"
                className={`exam-card ${flipped ? 'is-flip' : ''}`}
                onClick={() => setFlipped((v) => !v)}
                aria-label={t('examCardHint')}
              >
                <span className="exam-card-face exam-card-front">
                  <strong>{item.name[locale]}</strong>
                  <em>{t('examCardHint')}</em>
                </span>
                <span className="exam-card-face exam-card-back">
                  <ApCopy item={item} locale={locale} compact />
                </span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
