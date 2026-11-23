import { ArrowLeft, Music } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { SongRow } from '../components/songMeta';
import { EmptyState, IconButton, Tabs } from '../components/ui';
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
        <EmptyState icon={<Music />} title="Categoría no encontrada">
          <Link to="/categorias" className="font-medium text-accent">
            Ver todas las categorías
          </Link>
        </EmptyState>
      </div>
    );
  }

  const countFor = (c: Category | null) => (c ? all.filter((s) => s.category === c).length : all.length);

  return (
    <div className="pt-safe mx-auto max-w-5xl">
      <div className="px-2 pt-2 md:px-7">
        <IconButton label="Volver a categorías" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/categorias'))}>
          <ArrowLeft size={21} />
        </IconButton>
      </div>
      <header className="px-5 pb-6 pt-3 md:px-10">
        <p className="eyebrow flex items-center gap-2 text-muted">
          <ThemeIcon theme={theme} size="sm" />
          Categoría temática
        </p>
        <h1 className="display mt-3 text-[38px] leading-[1.04] md:text-[52px]">{theme.name}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{theme.description}</p>
        <p className="num mt-3 text-[13px] text-accent">{all.length} {all.length === 1 ? 'canción' : 'canciones'}</p>
      </header>

      {all.length === 0 ? (
        <EmptyState icon={<Music />} title="Aún no hay canciones en esta categoría">
          Cuando se agreguen canciones con este tema aparecerán aquí. Puede asignarlo desde el editor de cada canción, en «Categorías temáticas».
        </EmptyState>
      ) : (
        <>
          <div className="sticky top-0 z-20 space-y-4 bg-bg/95 px-5 pt-2 backdrop-blur-md md:px-10">
            {all.length > 8 && <SearchBox value={q} onChange={setQ} placeholder="Buscar en esta categoría" />}
            <Tabs
              label="Filtrar por tipo"
              value={type}
              onChange={setType}
              options={[
                { value: null as Category | null, label: 'Todas', count: countFor(null) },
                ...CATEGORIES.filter((c) => countFor(c.id) > 0).map((c) => ({ value: c.id as Category | null, label: c.label, count: countFor(c.id) })),
              ]}
            />
          </div>

          {groups.length === 0 ? (
            <p className="px-5 py-10 text-[15px] text-muted md:px-10">No hay canciones que coincidan con «{q}».</p>
          ) : (
            groups.map(({ cat, songs }) => (
              <section key={cat.id} aria-labelledby={`g-${cat.id}`}>
                {(!type || groups.length > 1) && (
                  <h2 id={`g-${cat.id}`} className="eyebrow flex items-baseline justify-between bg-surface-2/70 px-5 py-2 text-muted md:px-10">
                    {categoryInfo(cat.id).label}
                    <span className="num">{songs.length}</span>
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
            <section className="pt-12">
              <h2 className="eyebrow px-5 pb-3 text-muted md:px-10">Categorías relacionadas</h2>
              <ul className="mx-5 grid grid-cols-2 border-l border-t border-line md:mx-10 md:grid-cols-4">
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
