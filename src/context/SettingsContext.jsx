// Preferências globais: tema, modo cinematográfico, modo performance e som.
// Persistidas no servidor (por usuário); carregadas no boot com update otimista.

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import * as api from '../api/api';
import { useAuth } from './AuthContext';
import { THEMES, DEFAULT_CUSTOM } from '../data/themes';
import { rgba, mix } from '../utils/color';
import { sound } from '../services/sound';

const SettingsContext = createContext(null);

const INITIAL_PREFS = {
  themeId: 'luxo',
  custom: DEFAULT_CUSTOM,
  cinematic: true,
  performance: false,
  soundOn: false,
};

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
  const [prefs, setPrefs] = useState(INITIAL_PREFS);

  // Carrega preferências do servidor ao (t)rocar de usuário.
  useEffect(() => {
    let alive = true;
    (async () => {
      const remote = await api.getAllPreferences();
      if (!alive) return;
      setPrefs({
        themeId: remote.themeId ?? 'luxo',
        custom: { ...DEFAULT_CUSTOM, ...(remote.custom || {}) },
        cinematic: remote.cinematic ?? true,
        performance: remote.performance ?? false,
        soundOn: remote.soundOn ?? false,
      });
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  // Aplica tema e flags no documento.
  useEffect(() => {
    const root = document.documentElement;
    const theme = THEMES.find((t) => t.id === prefs.themeId);
    root.dataset.theme = prefs.themeId;
    root.dataset.mode = prefs.themeId === 'custom' || theme?.dark ? 'dark' : 'light';
    root.dataset.cinematic = prefs.cinematic ? 'on' : 'off';
    root.dataset.performance = prefs.performance ? 'on' : 'off';

    for (const key of Object.keys(customVars(DEFAULT_CUSTOM))) root.style.removeProperty(key);
    if (prefs.themeId === 'custom') {
      for (const [k, v] of Object.entries(customVars(prefs.custom))) root.style.setProperty(k, v);
    }
    sound.enabled = prefs.soundOn;
  }, [prefs]);

  const update = useCallback(
    (key, value) => {
      setPrefs((p) => ({ ...p, [key]: value }));
      api.setPreference(key, value).catch(() => {});
    },
    []
  );

  const value = useMemo(
    () => ({
      ...prefs,
      isCustom: prefs.themeId === 'custom',
      setTheme: (id) => update('themeId', id),
      setCustom: (patch) => update('custom', { ...prefs.custom, ...patch }),
      setCinematic: (v) => update('cinematic', v),
      setPerformance: (v) => update('performance', v),
      setSoundOn: (v) => update('soundOn', v),
    }),
    [prefs, update]
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings precisa estar dentro de SettingsProvider');
  return ctx;
}
