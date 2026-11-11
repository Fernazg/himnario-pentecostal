import { SearchX } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { EmptyState, PageHeader } from '../components/ui';
import { THEMES, toneVar, type Theme } from '../data/themes';
import type { Song } from '../data/types';
import { normalize } from '../lib/search';
import { useLibrary } from '../state/library';

/** Canciones por categoría temática (una canción puede estar en varias). */
export function useSongsByTheme(): Map<string, Song[]> {
  const { songs } = useLibrary();
  return useMemo(() => {
    const map = new Map<string, Song[]>(THEMES.map((t) => [t.id, []]));
    for (const s of songs) for (const id of s.themes ?? []) map.get(id)?.push(s);
    return map;
  }, [songs]);
}

export function ThemeIcon({ theme, size = 'md' }: { theme: Theme; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = theme.icon;
  const color = toneVar(theme.tone);
  const box = size === 'sm' ? 'size-9 rounded-xl' : size === 'md' ? 'size-12 rounded-2xl' : 'size-16 rounded-3xl';
  const icon = size === 'sm' ? 18 : size === 'md' ? 22 : 30;
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${box}`}
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
      aria-hidden
    >
      <Icon size={icon} />
    </div>
  );
}

export function ThemeCard({ theme, count }: { theme: Theme; count: number }) {
  return (
    <Link
      to={`/categorias/${theme.id}`}
      className="group flex h-full flex-col gap-3 rounded-3xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
    >
      <ThemeIcon theme={theme} />
      <div className="min-w-0">
        <h3 className="font-serif text-[1.05rem] font-semibold leading-snug">{theme.name}</h3>
        <p className="mt-1 text-sm text-muted">
          {count === 0 ? 'Sin canciones aún' : `${count} ${count === 1 ? 'canción' : 'canciones'}`}
        </p>
      </div>
    </Link>
  );
}

export default function Themes() {
  const byTheme = useSongsByTheme();
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const shown = useMemo(() => {
    const nq = normalize(dq);
    if (!nq) return THEMES;
    return THEMES.filter((t) => nq.split(' ').every((w) => normalize(`${t.name} ${t.description}`).includes(w)));
  }, [dq]);

  return (
    <div className="pt-safe mx-auto max-w-5xl">
      <PageHeader title="Categorías" subtitle="Encuentre canciones según el mensaje de su letra" />
      <div className="px-4 pb-4 md:px-8">
        <SearchBox value={q} onChange={setQ} placeholder="Buscar categoría" />
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={<SearchX size={28} />} title="Sin categorías">
          No hay categorías que coincidan con «{q}».
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 md:px-8 lg:grid-cols-4">
          {shown.map((t) => (
            <li key={t.id}>
              <ThemeCard theme={t} count={byTheme.get(t.id)?.length ?? 0} />
            </li>
          ))}
        </ul>
      )}
      <p className="px-4 pt-6 text-xs text-muted md:px-8">
        Cada canción se clasificó según el mensaje de su letra completa; una misma canción puede aparecer en varias categorías.
      </p>
    </div>
  );
}
