import { ChevronRight, History, ListMusic, Search, WifiOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORY_ICON, SongRow, categoryColor } from '../components/songMeta';
import { CATEGORIES } from '../data/types';
import { useLibrary } from '../state/library';
import { useOnline } from '../hooks/useOnline';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Home() {
  const { songs, recents, songsById, lists, error } = useLibrary();
  const navigate = useNavigate();
  const online = useOnline();
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, songs.filter((s) => s.category === c.id).length]));
  const recentSongs = recents.map((r) => songsById.get(r.songId)).filter((s) => !!s).slice(0, 6);
  const upcoming = lists
    .filter((l) => l.kind === 'culto')
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
    .slice(0, 3);

  return (
    <div className="pt-safe mx-auto max-w-5xl">
      <header className="px-4 pt-6 md:px-8 md:pt-10">
        <p className="text-sm font-medium text-muted">{greeting()}</p>
        <h1 className="mt-0.5 font-serif text-3xl font-semibold tracking-tight md:text-4xl">Himnario EA</h1>
        {!online && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">
            <WifiOff size={13} /> Sin conexión: todo sigue disponible
          </p>
        )}
        {error && <p className="mt-3 rounded-xl bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
      </header>

      <div className="px-4 pt-5 md:px-8">
        <button
          type="button"
          onClick={() => navigate('/himnario?buscar=1')}
          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left text-muted shadow-sm transition hover:border-accent/50"
        >
          <Search size={20} className="text-accent" />
          <span>Buscar por título, número, letra o autor</span>
        </button>
      </div>

      <section className="px-4 pt-7 md:px-8" aria-labelledby="cat-title">
        <h2 id="cat-title" className="sr-only">
          Categorías
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.id];
            const color = categoryColor(c.id);
            return (
              <Link
                key={c.id}
                to={`/himnario?cat=${c.id}`}
                className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-4 transition hover:shadow-md sm:flex-col sm:items-start sm:p-5"
              >
                <div
                  className="absolute -right-8 -top-8 size-24 rounded-full opacity-[0.07] transition group-hover:scale-110"
                  style={{ background: color }}
                />
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
                >
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-lg font-semibold leading-tight">{c.label}</h3>
                  <p className="mt-0.5 text-sm text-muted">
                    {counts[c.id]} {counts[c.id] === 1 ? 'canción' : 'canciones'}
                  </p>
                </div>
                <ChevronRight size={20} className="text-muted sm:hidden" />
              </Link>
            );
          })}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="px-4 pt-8 md:px-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Cultos y reuniones</h2>
            <Link to="/listas" className="text-sm font-medium text-accent">
              Ver listas
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {upcoming.map((l) => (
              <Link key={l.id} to={`/listas/${l.id}`} className="w-56 shrink-0 rounded-2xl border border-line bg-surface p-4 transition hover:shadow-md">
                <ListMusic size={20} className="text-accent" />
                <div className="mt-3 truncate font-medium">{l.name}</div>
                <div className="text-sm text-muted">
                  {l.date ? new Date(l.date + 'T12:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' : ''}
                  {l.songIds.length} {l.songIds.length === 1 ? 'canción' : 'canciones'}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 pt-8 md:px-8">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-xl font-semibold">
          <History size={19} className="text-muted" /> Recientes
        </h2>
        {recentSongs.length ? (
          <ul className="-mx-2">
            {recentSongs.map((s) => (
              <SongRow key={s.id} song={s} to={`/cancion/${s.id}`} />
            ))}
          </ul>
        ) : (
          <p className="py-3 text-sm text-muted">
            Las canciones que abra aparecerán aquí.{' '}
            <Link to="/himnario" className="font-medium text-accent">
              Explorar el himnario
            </Link>
          </p>
        )}
      </section>
      <footer className="px-4 pb-4 pt-10 text-center text-xs text-muted md:hidden">Creado por Fernando Silva</footer>
    </div>
  );
}
