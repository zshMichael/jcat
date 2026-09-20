import type { AppSettings, Locale, ThemeId } from '@shared/types'
import { THEME_CARDS } from '@shared/themes'
import { useEffect, useState, type JSX } from 'react'
import type { Msg } from '../i18n'
import { ModalShell } from './ModalShell'
import { ApGuide } from './SidePanel'

const DEEPSEEK_SITE = 'https://platform.deepseek.com'
const CREATOR_MAIL = 'zshOvO@163.com'
const CREATOR_MAILTO = `mailto:${CREATOR_MAIL}`

type Props = {
  open: boolean
  settings: AppSettings
  onClose: () => void
  onSave: (next: Partial<AppSettings>) => Promise<void>
  onTheme: (id: ThemeId) => void
  t: (key: Msg) => string
}

export function SettingsModal({ open, settings, onClose, onSave, onTheme, t }: Props): JSX.Element {
  const [form, setForm] = useState(settings)
  const [apOpen, setApOpen] = useState(false)
  const locale: Locale = settings.locale

  useEffect(() => {
    if (!open) return
    setForm(settings)
    setApOpen(false)
    // Reset the form when the modal opens, not on every settings save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <ModalShell
        open={open}
        onClose={() => {
          setApOpen(false)
          onClose()
        }}
      >
        <div className="modal-head">
          <h3>{t('settings')}</h3>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                void onSave(form)
              }}
            >
              {t('save')}
            </button>
          </div>
        </div>
        <div className="field">
          <label>{t('theme')}</label>
          <div className="theme-grid">
            {THEME_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`theme-card ${form.theme === card.id ? 'is-on' : ''}`}
                onClick={() => {
                  setForm({ ...form, theme: card.id })
                  onTheme(card.id)
                }}
              >
                <span className="name">{card.name}</span>
                <span className="blurb">{card.blurb}</span>
                <span className="swatches">
                  {card.swatches.map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-head">
            <label>{t('apiKey')}</label>
            <a
              className="field-link"
              href={DEEPSEEK_SITE}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault()
                void window.jcat.shell.openExternal(DEEPSEEK_SITE)
              }}
            >
              {t('deepseekSite')}
            </a>
          </div>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="sk-..."
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>{t('completionModel')}</label>
          <select
            value={form.completionModel}
            onChange={(e) => setForm({ ...form, completionModel: e.target.value })}
          >
            <option value="deepseek-flash">deepseek-flash</option>
            <option value="deepseek-v4-pro">deepseek-v4-pro</option>
          </select>
        </div>
        <div className="field">
          <label>{t('debugModel')}</label>
          <select
            value={form.debugModel}
            onChange={(e) => setForm({ ...form, debugModel: e.target.value })}
          >
            <option value="deepseek-flash">deepseek-flash</option>
            <option value="deepseek-v4-pro">deepseek-v4-pro</option>
          </select>
        </div>
        <div className="field">
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.debugThinking}
              onChange={(e) => setForm({ ...form, debugThinking: e.target.checked })}
            />{' '}
            {t('debugThinking')}
          </label>
        </div>
        <div className="field">
          <label>{t('jdkPath')}</label>
          <input
            value={form.jdkHome}
            onChange={(e) => setForm({ ...form, jdkHome: e.target.value })}
            placeholder="/Library/Java/JavaVirtualMachines/..."
          />
        </div>
        <div className="field">
          <label>{t('mavenPath')}</label>
          <input
            value={form.mavenPath}
            onChange={(e) => setForm({ ...form, mavenPath: e.target.value })}
            placeholder="mvn"
          />
        </div>
        <div className="field">
          <label>{t('delayMs')}</label>
          <input
            type="number"
            min={200}
            max={2000}
            value={form.completionDelayMs}
            onChange={(e) => setForm({ ...form, completionDelayMs: Number(e.target.value) || 400 })}
          />
        </div>
        <div className="field">
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!form.homeworkHideLines}
              onChange={(e) => setForm({ ...form, homeworkHideLines: e.target.checked })}
            />{' '}
            {t('homeworkHideLines')}
          </label>
        </div>
        <div className="field">
          <label>{t('apGuide')}</label>
          <button type="button" className="ap-index-btn" onClick={() => setApOpen(true)}>
            {t('viewAp')}
          </button>
        </div>
        <div className="settings-foot">
          <button
            type="button"
            className="creator-link"
            data-email={CREATOR_MAIL}
            title={CREATOR_MAIL}
            onClick={() => void window.jcat.shell.openExternal(CREATOR_MAILTO)}
          >
            {t('contactCreator')}
          </button>
          <p className="settings-mark">{t('madeBy')}</p>
        </div>
      </ModalShell>
      <ModalShell open={apOpen} onClose={() => setApOpen(false)} className="ap-modal">
        <h3>{t('apGuide')}</h3>
        <ApGuide locale={locale} />
        <div className="modal-actions">
          <button onClick={() => setApOpen(false)}>{t('cancel')}</button>
        </div>
      </ModalShell>
    </>
  )
}
