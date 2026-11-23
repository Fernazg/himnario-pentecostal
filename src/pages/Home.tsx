import { ArrowRight, ArrowUpRight, Search, WifiOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORY_ICON, SongRow, categoryColor } from '../components/songMeta';
import { SectionLabel } from '../components/ui';
import { THEMES, toneVar } from '../data/themes';
import { CATEGORIES } from '../data/types';
import { useOnline } from '../hooks/useOnline';
import { useLibrary } from '../state/library';
import { useSongsByTheme } from './Themes';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const today = () => new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

export default function Home() {
  const { songs, recents, songsById, lists, error } = useLibrary();
  const navigate = useNavigate();
  const online = useOnline();
  const byTheme = useSongsByTheme();
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, songs.filter((s) => s.category === c.id).length]));
  const recentSongs = recents.map((r) => songsById.get(r.songId)).filter((s) => !!s).slice(0, 6);
  const upcoming = lists
    .filter((l) => l.kind === 'culto')
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
    .slice(0, 3);

  return (
    <div>
      {/* Portada en petróleo profundo */}
      <section className="pt-safe bg-deep text-on-deep">
        <div className="mx-auto max-w-5xl px-5 pb-8 pt-9 md:px-10 md:pb-12 md:pt-14">
          <p className="eyebrow animate-rise text-on-deep-muted">
            {greeting()} · {today()}
          </p>
          <h1 className="display animate-rise mt-4 text-[50px] leading-[0.95] md:text-[76px]" style={{ animationDelay: '40ms' }}>
            Himnario <em className="font-normal italic text-[#f0a074]">EA</em>
          </h1>
          <p className="animate-rise mt-3 max-w-sm text-[15px] leading-relaxed text-on-deep-muted" style={{ animationDelay: '80ms' }}>
            <span className="num text-on-deep">{songs.length}</span> canciones para el culto, el ensayo y la oración.
          </p>
          <button
            type="button"
            onClick={() => navigate('/himnario?buscar=1')}
            className="animate-rise mt-7 flex w-full items-center gap-3 rounded-[10px] border border-deep-line bg-white/[0.06] px-4 py-3.5 text-left text-[15px] text-on-deep-muted transition-colors hover:bg-white/[0.1] md:max-w-xl"
            style={{ animationDelay: '120ms' }}
          >
            <Search size={19} strokeWidth={1.75} className="text-on-deep" />
            <span className="flex-1">Buscar por título, número, letra o tema</span>
            <span className="num hidden rounded border border-deep-line px-1.5 py-0.5 text-[11px] md:inline">/</span>
          </button>
          {!online && (
            <p className="mt-4 inline-flex items-center gap-2 text-[13px] text-on-deep-muted">
              <WifiOff size={14} /> Sin conexión — todo sigue disponible
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl">
        {error && <p className="mx-5 mt-5 rounded-[10px] border border-[#a3302a]/30 p-3 text-sm text-[#a3302a] md:mx-10">{error}</p>}

        {/* Colecciones: índice tipográfico */}
        <section className="px-5 pt-9 md:px-10" aria-labelledby="col-title">
          <SectionLabel>
            <span id="col-title">Colecciones</span>
          </SectionLabel>
          <ul className="md:grid md:grid-cols-3 md:gap-0">
            {CATEGORIES.map((c, i) => {
              const Icon = CATEGORY_ICON[c.id];
              return (
                <li key={c.id} className={i > 0 ? 'border-t border-line md:border-l md:border-t-0 md:pl-6' : 'md:pr-6'}>
                  <Link
                    to={`/himnario?cat=${c.id}`}
                    className="group flex items-center gap-4 py-5 md:flex-col md:items-start md:gap-6 md:py-7"
                  >
                    <Icon size={22} strokeWidth={1.5} style={{ color: categoryColor(c.id) }} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="display text-[24px] leading-tight">{c.label}</h3>
                      <p className="mt-1 text-[13px] text-muted">{c.description}</p>
                    </div>
                    <span className="num text-[13px] text-muted md:hidden">{counts[c.id]}</span>
                    <div className="hidden w-full items-center justify-between md:flex">
                      <span className="num text-[13px] text-muted">{counts[c.id]} canciones</span>
                      <ArrowRight size={16} className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Temas */}
        <section className="pt-10" aria-labelledby="temas-title">
          <div className="px-5 md:px-10">
            <SectionLabel
              action={
                <Link to="/categorias" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent">
                  Ver los {THEMES.length} <ArrowUpRight size={14} />
                </Link>
              }
            >
              <span id="temas-title">Explorar por tema</span>
            </SectionLabel>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4 md:flex-wrap md:px-10">
            {THEMES.slice(0, 12).map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.id}
                  to={`/categorias/${t.id}`}
                  className="flex shrink-0 items-center gap-2 rounded-[8px] border border-line bg-surface px-3 py-2 text-[13px] font-medium transition-colors hover:border-accent/50"
                >
                  <Icon size={15} strokeWidth={1.6} style={{ color: toneVar(t.tone) }} />
                  {t.name}
                  <span className="num text-[11px] text-faint">{byTheme.get(t.id)?.length ?? 0}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {upcoming.length > 0 && (
          <section className="px-5 pt-10 md:px-10">
            <SectionLabel
              action={
                <Link to="/listas" className="text-[13px] font-medium text-accent">
                  Ver listas
                </Link>
              }
            >
              Cultos y reuniones
            </SectionLabel>
            <ul>
              {upcoming.map((l) => (
                <li key={l.id} className="border-b border-line last:border-b-0">
                  <Link to={`/listas/${l.id}`} className="flex items-baseline gap-4 py-4">
                    <span className="num w-16 shrink-0 text-[12px] uppercase text-muted">
                      {l.date ? new Date(l.date + 'T12:00').toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '—'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[16px] font-medium">{l.name}</span>
                    <span className="num text-[12px] text-faint">{l.songIds.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="pt-10">
          <div className="px-5 md:px-10">
            <SectionLabel>Recientes</SectionLabel>
          </div>
          {recentSongs.length ? (
            <ul>
              {recentSongs.map((s) => (
                <SongRow key={s.id} song={s} to={`/cancion/${s.id}`} />
              ))}
            </ul>
          ) : (
            <p className="px-5 py-5 text-[15px] text-muted md:px-10">
              Las canciones que abra aparecerán aquí.{' '}
              <Link to="/himnario" className="font-medium text-accent underline decoration-accent/30 underline-offset-4">
                Explorar el himnario
              </Link>
            </p>
          )}
        </section>

        <footer className="px-5 pb-6 pt-12 md:hidden">
          <p className="eyebrow text-faint">Creado por Fernando Silva</p>
        </footer>
      </div>
    </div>
  );
}
