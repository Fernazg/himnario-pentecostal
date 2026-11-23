import { Plus, SearchX } from 'lucide-react';
import { useDeferredValue, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { SongRow } from '../components/songMeta';
import { EmptyState, PageHeader, Tabs } from '../components/ui';
import { CATEGORIES, categoryInfo, type Category } from '../data/types';
import { useIncremental } from '../hooks/useIncremental';
import { searchSongs } from '../lib/search';
import { useLibrary } from '../state/library';

export default function Hymnal() {
  const { index, songs, ready } = useLibrary();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cat = (params.get('cat') as Category | null) ?? null;
  const deferredQ = useDeferredValue(q);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('buscar');
    setParams(next, { replace: true });
  };

  // Sin búsqueda ni filtro: índice agrupado por colección (evita mezclar «1» de himnos y de alabanzas).
  const grouped = !deferredQ.trim() && !cat;
  const results = useMemo(() => {
    const r = searchSongs(index, deferredQ, cat);
    if (!grouped) return r;
    const order = new Map(CATEGORIES.map((c, i) => [c.id, i]));
    return [...r].sort((a, b) => order.get(a.song.category)! - order.get(b.song.category)!);
  }, [index, deferredQ, cat, grouped]);
  const { count, sentinel } = useIncremental(results.length, 80, `${deferredQ}|${cat}`);
  const shown = results.slice(0, count);
  const groups = grouped
    ? CATEGORIES.map((c) => ({ id: c.id, items: shown.filter((r) => r.song.category === c.id) })).filter((g) => g.items.length)
    : [{ id: null as Category | null, items: shown }];
  const countFor = (c: Category | null) => (c ? songs.filter((s) => s.category === c).length : songs.length);

  return (
    <div className="pt-safe mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Índice"
        title="Himnario"
        subtitle={ready ? (q ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}` : `${results.length} canciones`) : 'Cargando…'}
        actions={
          <Link
            to="/editar/nueva"
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line px-3 text-[13px] font-medium text-ink transition-colors hover:border-faint"
            aria-label="Agregar canción"
            title="Agregar canción"
          >
            <Plus size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">Agregar</span>
          </Link>
        }
      />
      <div className="sticky top-0 z-20 space-y-4 bg-bg/95 px-5 pt-2 backdrop-blur-md md:px-10">
        <SearchBox value={q} onChange={(v) => setParam('q', v)} autoFocus={params.get('buscar') === '1'} placeholder="Título, número, letra, autor o tema" />
        <Tabs
          label="Filtrar por colección"
          value={cat}
          onChange={(v) => setParam('cat', v)}
          options={[{ value: null, label: 'Todas', count: countFor(null) }, ...CATEGORIES.map((c) => ({ value: c.id as Category | null, label: c.label, count: countFor(c.id) }))]}
        />
      </div>

      {ready && results.length === 0 ? (
        <EmptyState icon={<SearchX />} title="Sin resultados">
          {q ? (
            <>No encontramos canciones para «{q}». Pruebe con otra palabra, un número o un tema.</>
          ) : (
            <>
              Aún no hay canciones en esta colección.{' '}
              <Link to="/editar/nueva" className="font-medium text-accent">
                Agregar una
              </Link>
            </>
          )}
        </EmptyState>
      ) : (
        groups.map((g) => (
          <section key={g.id ?? 'all'}>
            {grouped && g.id && (
              <h2 className="eyebrow flex items-baseline justify-between bg-surface-2/70 px-5 py-2 text-muted md:px-10">
                {categoryInfo(g.id).label}
                <span className="num">{countFor(g.id)}</span>
              </h2>
            )}
            <ul>
              {g.items.map((r) => (
                <SongRow
                  key={r.song.id}
                  song={r.song}
                  to={`/cancion/${r.song.id}`}
                  showCategory={!grouped}
                  subtitle={r.snippet ? <span className="font-serif italic">«{r.snippet}»</span> : undefined}
                />
              ))}
            </ul>
          </section>
        ))
      )}
      <div ref={sentinel} />
    </div>
  );
}
