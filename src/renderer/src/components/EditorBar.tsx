import type { JSX, RefObject } from 'react'
import { AnimSelect, type AnimOption } from './AnimSelect'
import type { Msg } from '../i18n'

type Tab = { path: string; name: string; dirty: boolean }

type Props = {
  tabs: Tab[]
  active: string
  onSelect: (path: string) => void
  onClose: (path: string) => void
  outline: AnimOption[]
  outlineValue: string
  onOutline: (id: string) => void
  canFormat: boolean
  findOpen: boolean
  findQuery: string
  findIndex: number
  findTotal: number
  findRef: RefObject<HTMLInputElement | null>
  onFindQuery: (value: string) => void
  onFindNext: () => void
  onFindPrev: () => void
  onFindOpen: () => void
  onFindClose: () => void
  onFormat: () => void
  t: (key: Msg) => string
}

export function EditorBar({
  tabs,
  active,
  onSelect,
  onClose,
  outline,
  outlineValue,
  onOutline,
  canFormat,
  findOpen,
  findQuery,
  findIndex,
  findTotal,
  findRef,
  onFindQuery,
  onFindNext,
  onFindPrev,
  onFindOpen,
  onFindClose,
  onFormat,
  t
}: Props): JSX.Element {
  return (
    <div className="editor-bar">
      <div className="tabs">
        <div className="tab-row">
          {tabs.map((tab) => (
            <div
              key={tab.path}
              className={`tab ${tab.path === active ? 'is-on' : ''} ${tab.dirty ? 'dirty' : ''}`}
            >
              <button type="button" className="tab-name" onClick={() => onSelect(tab.path)}>
                {tab.name}
              </button>
              <button
                type="button"
                className="tab-x"
                title={t('closeTab')}
                onClick={(e) => {
                  e.stopPropagation()
                  onClose(tab.path)
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="tab-tools">
          <AnimSelect
            value={outlineValue}
            options={outline}
            onChange={onOutline}
            disabled={outline.length === 0}
            title={t('methods')}
            placeholder={t('noMethods')}
            className="outline-select"
          />
          <button type="button" onClick={onFindOpen} title={`${t('find')} ⌘F`}>
            {t('find')}
          </button>
          {canFormat ? (
            <button type="button" onClick={onFormat} title={t('format')}>
              {t('format')}
            </button>
          ) : null}
        </div>
      </div>
      {findOpen ? (
        <form
          className="find-bar"
          onSubmit={(e) => {
            e.preventDefault()
            onFindNext()
          }}
        >
          <input
            ref={findRef}
            value={findQuery}
            placeholder={t('find')}
            onChange={(e) => onFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                onFindClose()
              }
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault()
                onFindPrev()
              }
            }}
          />
          <span className="find-count">
            {findQuery ? `${findTotal ? findIndex + 1 : 0}/${findTotal}` : '0/0'}
          </span>
          <button type="button" onClick={onFindPrev} disabled={!findTotal}>
            {t('findPrev')}
          </button>
          <button type="submit" disabled={!findTotal}>
            {t('findNext')}
          </button>
          <button type="button" onClick={onFindClose}>
            {t('cancel')}
          </button>
        </form>
      ) : null}
    </div>
  )
}
