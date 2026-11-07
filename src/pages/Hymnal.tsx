import { Plus, SearchX } from 'lucide-react';
import { useDeferredValue, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { SongRow } from '../components/songMeta';
import { EmptyState, PageHeader, cx } from '../components/ui';
import { CATEGORIES, type Category } from '../data/types';
import { useIncremental } from '../hooks/useIncremental';
import { searchSongs } from '../lib/search';
import { useLibrary } from '../state/library';

export default function Hymnal() {
  const { index, ready } = useLibrary();
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

  const results = useMemo(() => searchSongs(index, deferredQ, cat), [index, deferredQ, cat]);
  const { count, sentinel } = useIncremental(results.length, 80, `${deferredQ}|${cat}`);

  return (
    <div className="pt-safe mx-auto max-w-4xl">
      <PageHeader
        title="Himnario"
        subtitle={ready ? `${results.length} ${results.length === 1 ? 'canción' : 'canciones'}` : 'Cargando…'}
        actions={
          <Link
            to="/editar/nueva"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-2"
            aria-label="Agregar canción"
            title="Agregar canción"
          >
            <Plus size={22} />
          </Link>
        }
      />
      <div className="sticky top-0 z-20 space-y-3 bg-bg/95 px-4 pb-3 pt-2 backdrop-blur md:px-8">
        <SearchBox value={q} onChange={(v) => setParam('q', v)} autoFocus={params.get('buscar') === '1'} />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Filtrar por categoría">
          {[{ id: null as Category | null, label: 'Todas' }, ...CATEGORIES].map((c) => (
            <button
              key={c.id ?? 'all'}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => setParam('cat', c.id)}
              className={cx(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition',
                cat === c.id ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-ink hover:border-accent/50',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 md:px-6">
        {ready && results.length === 0 ? (
          <EmptyState icon={<SearchX size={28} />} title="Sin resultados">
            {q ? (
              <>No encontramos canciones para «{q}». Pruebe con otra palabra o número.</>
            ) : (
              <>
                Aún no hay canciones en esta categoría.{' '}
                <Link to="/editar/nueva" className="font-medium text-accent">
                  Agregar una
                </Link>
              </>
            )}
          </EmptyState>
        ) : (
          <ul>
            {results.slice(0, count).map((r) => (
              <SongRow
                key={r.song.id}
                song={r.song}
                to={`/cancion/${r.song.id}`}
                subtitle={r.snippet ? <span className="italic">«{r.snippet}»</span> : undefined}
              />
            ))}
          </ul>
        )}
        <div ref={sentinel} />
      </div>
    </div>
  );
}
