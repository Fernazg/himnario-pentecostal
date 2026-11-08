import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Notation } from '../lib/chords';

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
  notation: Notation;
  showChords: boolean;
  fontSize: number;
  lyricsFont: 'serif' | 'sans';
  keepAwake: boolean;
}

export const FONT_MIN = 14;
export const FONT_MAX = 40;

const DEFAULTS: Settings = {
  theme: 'system',
  notation: 'es',
  showChords: true,
  fontSize: 20,
  lyricsFont: 'serif',
  keepAwake: true,
};

const KEY = 'himnario.settings';
const TRANSPOSE_KEY = 'himnario.transpose';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  getTranspose: (songId: string) => number;
  setTranspose: (songId: string, steps: number) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => load(KEY, DEFAULTS));
  const [transpose, setTransposeMap] = useState<Record<string, number>>(() => load(TRANSPOSE_KEY, {}));

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(TRANSPOSE_KEY, JSON.stringify(transpose));
  }, [transpose]);

  // Tema claro/oscuro, siguiendo al sistema si corresponde.
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#0b181c' : '#f7f4ec'));
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    setTransposeMap({});
  }, []);
  const getTranspose = useCallback((id: string) => transpose[id] ?? 0, [transpose]);
  const setTranspose = useCallback((id: string, steps: number) => {
    setTransposeMap((m) => {
      const next = { ...m };
      if (steps === 0) delete next[id];
      else next[id] = steps;
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, update, reset, getTranspose, setTranspose }),
    [settings, update, reset, getTranspose, setTranspose],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSettings fuera de SettingsProvider');
  return c;
}
