import type { AppSettings, ThemeId } from '@shared/types'
import { THEME_CARDS } from '@shared/themes'
import { useState, type JSX } from 'react'

type Props = {
  settings: AppSettings
  onClose: () => void
  onSave: (next: Partial<AppSettings>) => Promise<void>
  onTheme: (id: ThemeId) => void
}

export function SettingsModal({ settings, onClose, onSave, onTheme }: Props): JSX.Element {
  const [form, setForm] = useState(settings)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>设置</h3>
        <div className="field">
          <label>主题</label>
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
          <label>DeepSeek API Key</label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </div>
        <div className="field">
          <label>补全模型</label>
          <select
            value={form.completionModel}
            onChange={(e) => setForm({ ...form, completionModel: e.target.value })}
          >
            <option value="deepseek-flash">deepseek-flash</option>
            <option value="deepseek-v4-pro">deepseek-v4-pro</option>
          </select>
        </div>
        <div className="field">
          <label>Debug 模型</label>
          <select
            value={form.debugModel}
            onChange={(e) => setForm({ ...form, debugModel: e.target.value })}
          >
            <option value="deepseek-flash">deepseek-flash</option>
            <option value="deepseek-v4-pro">deepseek-v4-pro</option>
          </select>
        </div>
        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={form.debugThinking}
              onChange={(e) => setForm({ ...form, debugThinking: e.target.checked })}
            />{' '}
            Debug 开启 thinking（更慢）
          </label>
        </div>
        <div className="field">
          <label>JDK 路径（可选，覆盖 JAVA_HOME）</label>
          <input
            value={form.jdkHome}
            onChange={(e) => setForm({ ...form, jdkHome: e.target.value })}
            placeholder="/Library/Java/JavaVirtualMachines/..."
          />
        </div>
        <div className="field">
          <label>Maven 路径（可选）</label>
          <input
            value={form.mavenPath}
            onChange={(e) => setForm({ ...form, mavenPath: e.target.value })}
            placeholder="mvn"
          />
        </div>
        <div className="field">
          <label>补全延迟（毫秒）</label>
          <input
            type="number"
            min={200}
            max={2000}
            value={form.completionDelayMs}
            onChange={(e) => setForm({ ...form, completionDelayMs: Number(e.target.value) || 400 })}
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
          <button
            className="primary"
            onClick={() => {
              void onSave(form)
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
