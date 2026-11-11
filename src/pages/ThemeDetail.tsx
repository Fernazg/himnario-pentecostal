import { ArrowLeft, Music } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { SongRow } from '../components/songMeta';
import { EmptyState, IconButton, cx } from '../components/ui';
import { themeById, THEMES } from '../data/themes';
import { CATEGORIES, categoryInfo, type Category } from '../data/types';
import { compareSongs, normalize } from '../lib/search';
import { useLibrary } from '../state/library';
import { ThemeCard, ThemeIcon, useSongsByTheme } from './Themes';

export default function ThemeDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { ready } = useLibrary();
  const byTheme = useSongsByTheme();
  const theme = themeById(id);
  const [type, setType] = useState<Category | null>(null);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);

  const all = useMemo(() => byTheme.get(id) ?? [], [byTheme, id]);
  const filtered = useMemo(() => {
    const nq = normalize(dq);
    return all
      .filter((s) => !type || s.category === type)
      .filter((s) => !nq || normalize(`${s.number ?? ''} ${s.title}`).includes(nq))
      .sort(compareSongs);
  }, [all, type, dq]);

  // Agrupado por tipo (Himnos, Alabanzas especiales, Coros) y numerado.
  const groups = CATEGORIES.map((c) => ({ cat: c, songs: filtered.filter((s) => s.category === c.id) })).filter((g) => g.songs.length);

  // Categorías relacionadas: las que más comparten canciones con esta.
  const related = useMemo(() => {
    if (!theme) return [];
    const ids = new Set(all.map((s) => s.id));
    return THEMES.filter((t) => t.id !== theme.id)
      .map((t) => ({ t, n: (byTheme.get(t.id) ?? []).filter((s) => ids.has(s.id)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 4);
  }, [theme, all, byTheme]);

  if (!ready) return null;
  if (!theme) {
    return (
      <div className="pt-safe">
        <div className="p-2">
          <IconButton label="Volver a categorías" onClick={() => navigate('/categorias')}>
            <ArrowLeft size={22} />
          </IconButton>
        </div>
        <EmptyState icon={<Music size={28} />} title="Categoría no encontrada">
          <Link to="/categorias" className="font-medium text-accent">
            Ver todas las categorías
          </Link>
        </EmptyState>
      </div>
    );
  }

  const countFor = (c: Category | null) => (c ? all.filter((s) => s.category === c).length : all.length);

  return (
    <div className="pt-safe mx-auto max-w-4xl">
      <div className="px-2 pt-2 md:px-6">
        <IconButton label="Volver a categorías" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/categorias'))}>
          <ArrowLeft size={22} />
        </IconButton>
      </div>
      <header className="flex items-start gap-4 px-4 pb-4 pt-1 md:px-8">
        <ThemeIcon theme={theme} size="lg" />
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{theme.name}</h1>
          <p className="mt-1 text-sm text-muted">{theme.description}</p>
          <p className="mt-1 text-sm font-medium text-accent">
            {all.length} {all.length === 1 ? 'canción' : 'canciones'}
          </p>
        </div>
      </header>

      {all.length === 0 ? (
        <EmptyState icon={<Music size={28} />} title="Aún no hay canciones en esta categoría">
          Cuando se agreguen canciones con este tema aparecerán aquí. Puede asignarlo desde el editor de cada canción, en «Categorías temáticas».
        </EmptyState>
      ) : (
        <>
          <div className="sticky top-0 z-20 space-y-3 bg-bg/95 px-4 pb-3 pt-1 backdrop-blur md:px-8">
            {all.length > 8 && <SearchBox value={q} onChange={setQ} placeholder="Buscar en esta categoría" />}
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Filtrar por tipo">
              {[{ id: null as Category | null, label: 'Todas' }, ...CATEGORIES].map((c) => {
                const n = countFor(c.id);
                if (c.id && n === 0) return null;
                return (
                  <button
                    key={c.id ?? 'all'}
                    type="button"
                    aria-pressed={type === c.id}
                    onClick={() => setType(c.id)}
                    className={cx(
                      'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition',
                      type === c.id ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface hover:border-accent/50',
                    )}
                  >
                    {c.label} <span className="opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted md:px-8">No hay canciones que coincidan con «{q}».</p>
          ) : (
            groups.map(({ cat, songs }) => (
              <section key={cat.id} className="px-2 pb-2 md:px-6" aria-labelledby={`g-${cat.id}`}>
                {(!type || groups.length > 1) && (
                  <h2 id={`g-${cat.id}`} className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    {categoryInfo(cat.id).label} · {songs.length}
                  </h2>
                )}
                <ul>
                  {songs.map((s) => (
                    <SongRow
                      key={s.id}
                      song={s}
                      to={`/cancion/${s.id}`}
                      subtitle={
                        s.themes?.[0] === theme.id
                          ? `${categoryInfo(s.category).singular} · tema principal`
                          : `${categoryInfo(s.category).singular} · también: ${themeById(s.themes?.[0] ?? '')?.name ?? ''}`
                      }
                    />
                  ))}
                </ul>
              </section>
            ))
          )}

          {related.length > 0 && (
            <section className="px-4 pt-8 md:px-8">
              <h2 className="mb-3 font-serif text-lg font-semibold">Categorías relacionadas</h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {related.map(({ t }) => (
                  <li key={t.id}>
                    <ThemeCard theme={t} count={byTheme.get(t.id)?.length ?? 0} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
