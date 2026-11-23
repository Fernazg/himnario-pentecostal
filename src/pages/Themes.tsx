import { ArrowUpRight, SearchX } from 'lucide-react';
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
  const px = size === 'sm' ? 17 : size === 'md' ? 22 : 30;
  return <Icon size={px} strokeWidth={1.5} style={{ color: toneVar(theme.tone) }} className="shrink-0" aria-hidden />;
}

/** Celda de la cuadrícula de temas: sin tarjeta, solo líneas finas. */
export function ThemeCard({ theme, count }: { theme: Theme; count: number }) {
  return (
    <Link
      to={`/categorias/${theme.id}`}
      className="group flex h-full min-h-[148px] flex-col justify-between gap-6 border-b border-r border-line p-4 transition-colors hover:bg-surface md:min-h-[168px] md:p-5"
    >
      <div className="flex items-start justify-between">
        <ThemeIcon theme={theme} />
        <ArrowUpRight size={15} strokeWidth={1.75} className="text-faint opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="min-w-0">
        <h3 className="display text-[19px] leading-[1.15] md:text-[21px]">{theme.name}</h3>
        <p className="num mt-2 text-[12px] text-muted">{count === 0 ? 'Sin canciones aún' : `${String(count).padStart(3, '0')} canciones`}</p>
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
      <PageHeader eyebrow={`${THEMES.length} temas`} title="Categorías" subtitle="Canciones agrupadas por el mensaje de su letra." />
      <div className="px-5 pb-6 md:px-10">
        <SearchBox value={q} onChange={setQ} placeholder="Buscar categoría" />
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={<SearchX />} title="Sin categorías">
          No hay categorías que coincidan con «{q}».
        </EmptyState>
      ) : (
        <ul className="mx-5 grid grid-cols-2 border-l border-t border-line md:mx-10 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((t) => (
            <li key={t.id}>
              <ThemeCard theme={t} count={byTheme.get(t.id)?.length ?? 0} />
            </li>
          ))}
        </ul>
      )}
      <p className="px-5 pt-6 text-[13px] leading-relaxed text-muted md:px-10">
        Cada canción se clasificó según el mensaje de su letra completa; una misma canción puede aparecer en varias categorías.
      </p>
    </div>
  );
}
