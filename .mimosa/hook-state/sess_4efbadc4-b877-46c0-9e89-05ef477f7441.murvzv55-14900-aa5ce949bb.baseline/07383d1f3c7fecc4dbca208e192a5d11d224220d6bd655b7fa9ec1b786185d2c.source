// Seletor de temas com amostras visuais + editor de tema personalizado.

import { Palette, Check, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { THEMES, DEFAULT_CUSTOM } from '../data/themes';
import { cx } from '../utils/format';
import { sound } from '../services/sound';

export default function ThemeSelector() {
  const { themeId, setTheme, custom, setCustom, isCustom } = useSettings();

  return (
    <div className="theme-selector">
      <div className="theme-grid" role="radiogroup" aria-label="Tema visual">
        {THEMES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={themeId === t.id}
            className={cx('theme-option', themeId === t.id && 'is-active')}
            onClick={() => {
              sound.click();
              setTheme(t.id);
            }}
          >
            <span
              className="theme-option__preview"
              style={{ '--sw-bg': t.swatch[0], '--sw-a': t.swatch[1], '--sw-b': t.swatch[2] }}
              aria-hidden
            >
              <span className="theme-option__bar" />
              <span className="theme-option__dot" />
            </span>
            <span className="theme-option__name">{t.name}</span>
            <span className="theme-option__hint">{t.hint}</span>
            {themeId === t.id && (
              <span className="theme-option__check">
                <Check size={13} aria-hidden />
              </span>
            )}
          </button>
        ))}

        <button
          role="radio"
          aria-checked={isCustom}
          className={cx('theme-option', isCustom && 'is-active')}
          onClick={() => {
            sound.click();
            setTheme('custom');
          }}
        >
          <span className="theme-option__preview theme-option__preview--custom" aria-hidden>
            <Palette size={18} />
          </span>
          <span className="theme-option__name">Personalizado</span>
          <span className="theme-option__hint">Escolha suas cores</span>
          {isCustom && (
            <span className="theme-option__check">
              <Check size={13} aria-hidden />
            </span>
          )}
        </button>
      </div>

      {isCustom && (
        <div className="custom-theme fade-in" aria-label="Ajustes do tema personalizado">
          <h4 className="custom-theme__title">
            <Sparkles size={14} aria-hidden /> Ajustes do tema
          </h4>
          <div className="custom-theme__grid">
            <label className="custom-theme__field">
              <span>Cor principal</span>
              <input
                type="color"
                value={custom.accent}
                onChange={(e) => setCustom({ accent: e.target.value })}
                aria-label="Cor principal"
              />
            </label>
            <label className="custom-theme__field">
              <span>Cor secundária</span>
              <input
                type="color"
                value={custom.accent2}
                onChange={(e) => setCustom({ accent2: e.target.value })}
                aria-label="Cor secundária"
              />
            </label>
            <label className="custom-theme__field">
              <span>Brilho · {custom.glow}%</span>
              <input
                type="range"
                min="10"
                max="100"
                value={custom.glow}
                onChange={(e) => setCustom({ glow: Number(e.target.value) })}
                aria-label="Intensidade do brilho"
              />
            </label>
            <label className="custom-theme__field">
              <span>Transparência · {custom.glass}%</span>
              <input
                type="range"
                min="20"
                max="100"
                value={custom.glass}
                onChange={(e) => setCustom({ glass: Number(e.target.value) })}
                aria-label="Transparência dos painéis"
              />
            </label>
            <label className="custom-theme__field">
              <span>Background · {custom.background}%</span>
              <input
                type="range"
                min="10"
                max="100"
                value={custom.background}
                onChange={(e) => setCustom({ background: Number(e.target.value) })}
                aria-label="Intensidade do background"
              />
            </label>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setCustom({ ...DEFAULT_CUSTOM })}
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
