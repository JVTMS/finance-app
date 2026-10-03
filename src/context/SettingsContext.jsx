// Preferências globais: tema, modo cinematográfico, modo performance e som.
// Persistidas por usuário (com escopo global antes do login).

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import * as api from '../api/api';
import { useAuth } from './AuthContext';
import { THEMES, DEFAULT_CUSTOM } from '../data/themes';
import { rgba, mix } from '../utils/color';
import { sound } from '../services/sound';

const SettingsContext = createContext(null);

function customVars(custom) {
  const c = { ...DEFAULT_CUSTOM, ...custom };
  const glowK = c.glow / 45;
  const glassK = c.glass / 55;
  const bgK = c.background / 60;
  return {
    '--bg-0': mix('#050505', c.accent, 0.04 * bgK),
    '--bg-1': mix('#0b0b0e', c.accent, 0.08 * bgK),
    '--bg-glow': rgba(c.accent, 0.1 * bgK),
    '--surface': rgba('#1a1a1f', 0.1 + 0.55 * glassK),
    '--surface-2': rgba('#232329', 0.1 + 0.65 * glassK),
    '--surface-solid': '#141418',
    '--border': rgba(c.accent, 0.15),
    '--border-strong': rgba(c.accent, 0.32),
    '--text': '#f2f2f0',
    '--text-dim': '#a5a5a0',
    '--text-faint': '#6d6d69',
    '--accent': c.accent,
    '--accent-2': c.accent2,
    '--accent-soft': rgba(c.accent, 0.15 * glowK),
    '--glow': rgba(c.accent, 0.35 * glowK),
    '--glass-tint': 'rgba(255,255,255,0.05)',
    '--glass-tint-2': 'rgba(255,255,255,0.015)',
    '--shadow': 'rgba(0,0,0,0.55)',
  };
}

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [prefVersion, setPrefVersion] = useState(0);

  const scope = user?.id ?? 'global';

  const settings = useMemo(
    () => ({
      themeId: api.getPref(scope, 'theme', 'luxo'),
      custom: { ...DEFAULT_CUSTOM, ...(api.getPref(scope, 'customTheme', {}) || {}) },
      cinematic: api.getPref(scope, 'cinematic', true),
      performance: api.getPref(scope, 'performance', false),
      soundOn: api.getPref(scope, 'sound', false),
    }),
    [scope, prefVersion]
  );

  const update = useCallback(
    (key, value) => {
      api.setPref(scope, key, value);
      setPrefVersion((v) => v + 1);
    },
    [scope]
  );

  // Aplica tema e flags no documento.
  useEffect(() => {
    const root = document.documentElement;
    const theme = THEMES.find((t) => t.id === settings.themeId);
    root.dataset.theme = settings.themeId;
    root.dataset.mode = settings.themeId === 'custom' || theme?.dark ? 'dark' : 'light';
    root.dataset.cinematic = settings.cinematic ? 'on' : 'off';
    root.dataset.performance = settings.performance ? 'on' : 'off';

    for (const key of Object.keys(customVars(DEFAULT_CUSTOM))) root.style.removeProperty(key);
    if (settings.themeId === 'custom') {
      for (const [k, v] of Object.entries(customVars(settings.custom))) root.style.setProperty(k, v);
    }
    sound.enabled = settings.soundOn;
  }, [settings]);

  const value = useMemo(
    () => ({
      ...settings,
      isCustom: settings.themeId === 'custom',
      setTheme: (id) => update('theme', id),
      setCustom: (patch) => update('customTheme', { ...settings.custom, ...patch }),
      setCinematic: (v) => update('cinematic', v),
      setPerformance: (v) => update('performance', v),
      setSoundOn: (v) => update('sound', v),
    }),
    [settings, update]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings precisa estar dentro de SettingsProvider');
  return ctx;
}
