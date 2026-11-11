import {
  AArrowDown,
  AArrowUp,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Guitar,
  Heart,
  ListPlus,
  Maximize,
  Minimize,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AddToListSheet } from '../components/AddToListSheet';
import { CATEGORY_ICON, categoryColor } from '../components/songMeta';
import { SongView } from '../components/SongView';
import { Button, EmptyState, IconButton, Segmented, Sheet, cx } from '../components/ui';
import { categoryInfo } from '../data/types';
import { themeById, toneVar } from '../data/themes';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  allKeys,
  isFlatKey,
  keyName,
  normalizeSteps,
  parseKey,
  transposeKey,
  type MusicalKey,
} from '../lib/chords';
import { shareOrCopy } from '../lib/share';
import { extractChords, toChordsOverText } from '../lib/songText';
import { useLibrary } from '../state/library';
import { FONT_MAX, FONT_MIN, useSettings } from '../state/settings';
import { useToast } from '../state/toast';

export default function SongPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const listId = params.get('lista');
  const navigate = useNavigate();
  const toast = useToast();
  const { songsById, favorites, toggleFavorite, recordView, lists, ready } = useLibrary();
  const { settings, update, getTranspose, setTranspose } = useSettings();
  const song = songsById.get(id);

  const [keySheet, setKeySheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const [listSheet, setListSheet] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useWakeLock(settings.keepAwake && !!song);

  useEffect(() => {
    if (song) recordView(song.id);
    window.scrollTo(0, 0);
  }, [song?.id]);

  const steps = song ? getTranspose(song.id) : 0;

  // Tonalidad original: la indicada o, si falta, la del primer acorde.
  const originalKey: MusicalKey | null = useMemo(() => {
    if (!song) return null;
    return parseKey(song.key) ?? parseKey(extractChords(song.lyrics)[0]);
  }, [song]);
  const currentKey = originalKey ? transposeKey(originalKey, steps) : null;
  const preferFlats = currentKey ? isFlatKey(currentKey) : false;
  const hasChords = useMemo(() => (song ? extractChords(song.lyrics).length > 0 : false), [song]);

  const setSteps = useCallback((n: number) => song && setTranspose(song.id, normalizeSteps(n)), [song, setTranspose]);
  const setFont = useCallback((n: number) => update({ fontSize: Math.min(FONT_MAX, Math.max(FONT_MIN, n)) }), [update]);

  // Lista de culto: navegación anterior / siguiente.
  const list = listId ? lists.find((l) => l.id === listId) : undefined;
  const pos = list ? list.songIds.indexOf(id) : -1;
  const prevId = list && pos > 0 ? list.songIds[pos - 1] : undefined;
  const nextId = list && pos >= 0 && pos < list.songIds.length - 1 ? list.songIds[pos + 1] : undefined;
  const goTo = (sid?: string) => sid && navigate(`/cancion/${sid}?lista=${listId}`, { replace: true });

  // Pantalla completa (API nativa cuando existe; modo presentación siempre).
  const enterPresent = async () => {
    setPresenting(true);
    setControlsVisible(false);
    try {
      if (document.fullscreenEnabled && !document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {
      /* iPhone no admite la API: se usa el modo presentación. */
    }
  };
  const exitPresent = useCallback(async () => {
    setPresenting(false);
    setControlsVisible(true);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
  }, []);
  useEffect(() => {
    const onFs = () => !document.fullscreenElement && setPresenting(false);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  useEffect(() => {
    if (!presenting) setControlsVisible(true);
  }, [presenting]);

  // Atajos de teclado (escritorio).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey) return;
      if (e.key === '+' || e.key === '=') setSteps(steps + 1);
      else if (e.key === '-') setSteps(steps - 1);
      else if (e.key === 'f') (presenting ? exitPresent() : enterPresent());
      else if (e.key === 'ArrowRight' && nextId) goTo(nextId);
      else if (e.key === 'ArrowLeft' && prevId) goTo(prevId);
      else if (e.key === 'Escape' && presenting) exitPresent();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!ready) return null;
  if (!song) {
    return (
      <div className="pt-safe">
        <div className="p-2">
          <IconButton label="Volver" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </IconButton>
        </div>
        <EmptyState icon={<Guitar size={28} />} title="Canción no encontrada">
          Puede que haya sido eliminada.{' '}
          <Link to="/himnario" className="font-medium text-accent">
            Ir al himnario
          </Link>
        </EmptyState>
      </div>
    );
  }

  const info = categoryInfo(song.category);
  const Icon = CATEGORY_ICON[song.category];
  const isFav = favorites.has(song.id);
  const notation = settings.notation;
  const showChords = settings.showChords && hasChords;

  const onShare = async () => {
    const header = [
      `${song.number ? song.number + '. ' : ''}${song.title}`,
      currentKey && showChords ? `Tono: ${keyName(currentKey, notation)}` : '',
      [song.author, song.composer].filter(Boolean).join(' / '),
    ]
      .filter(Boolean)
      .join('\n');
    const body = toChordsOverText(song.lyrics, { steps, notation, preferFlats, showChords });
    const r = await shareOrCopy({ title: song.title, text: `${header}\n\n${body}`, url: `${location.origin}/cancion/${song.id}` });
    if (r === 'copied') toast('Letra copiada al portapapeles');
  };

  const onFav = async () => {
    const added = await toggleFavorite(song.id);
    toast(added ? 'Agregada a favoritos' : 'Quitada de favoritos');
  };

  return (
    <div className={cx('min-h-dvh', presenting && 'bg-bg')}>
      {/* Barra superior */}
      {!presenting && (
        <header className="pt-safe sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center gap-1 px-2 py-1.5 md:px-6">
            <IconButton label="Volver" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/himnario'))}>
              <ArrowLeft size={22} />
            </IconButton>
            <div className="min-w-0 flex-1 truncate text-center text-sm font-medium text-muted">
              {list ? `${list.name} · ${pos + 1}/${list.songIds.length}` : info.label}
            </div>
            <IconButton label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'} onClick={onFav} active={isFav}>
              <Heart size={21} className={cx(isFav && 'fill-current')} />
            </IconButton>
            <IconButton label="Compartir" onClick={onShare}>
              <Share2 size={20} />
            </IconButton>
            <IconButton label="Más opciones" onClick={() => setMenu(true)}>
              <EllipsisVertical size={20} />
            </IconButton>
          </div>
        </header>
      )}

      <article
        className={cx('mx-auto max-w-3xl px-5 md:px-8', presenting ? 'pb-24 pt-[max(1.5rem,env(safe-area-inset-top))]' : 'pb-40 pt-6')}
        onClick={() => presenting && setControlsVisible((v) => !v)}
      >
        {!presenting ? (
          <div className="mb-7">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: categoryColor(song.category) }}>
              <Icon size={16} />
              <span>
                {info.singular}
                {song.number ? ` · N.º ${song.number}` : ''}
              </span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{song.title}</h1>
            {(song.author || song.composer) && (
              <p className="mt-2 text-sm text-muted">
                {song.author && <>Letra: {song.author}</>}
                {song.author && song.composer && ' · '}
                {song.composer && <>Música: {song.composer}</>}
              </p>
            )}
            {currentKey && hasChords && (
              <button
                type="button"
                onClick={() => setKeySheet(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-sm"
              >
                <span className="text-muted">Tono</span>
                <span className="font-semibold text-chord">{keyName(currentKey, notation)}</span>
                {steps !== 0 && originalKey && (
                  <span className="text-muted">
                    (original {keyName(originalKey, notation)}, {steps > 0 ? '+' : ''}
                    {steps})
                  </span>
                )}
              </button>
            )}
            {currentKey && !hasChords && (
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-sm">
                <span className="text-muted">Tono</span>
                <span className="font-semibold text-chord">{keyName(currentKey, notation)}</span>
              </span>
            )}
            {!!song.themes?.length && (
              <nav aria-label="Categorías temáticas" className="mt-4 flex flex-wrap gap-2">
                {song.themes.map((tid) => {
                  const t = themeById(tid);
                  if (!t) return null;
                  const Icon = t.icon;
                  return (
                    <Link
                      key={tid}
                      to={`/categorias/${tid}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium transition hover:border-accent/50"
                    >
                      <Icon size={14} style={{ color: toneVar(t.tone) }} />
                      {t.name}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        ) : (
          <h1 className="mb-5 font-serif text-2xl font-semibold" style={{ fontSize: settings.fontSize * 1.15 }}>
            {song.number ? `${song.number}. ` : ''}
            {song.title}
            {currentKey && showChords && <span className="ml-3 align-middle font-sans text-[0.55em] text-chord">{keyName(currentKey, notation)}</span>}
          </h1>
        )}

        <SongView
          lyrics={song.lyrics}
          steps={steps}
          notation={notation}
          preferFlats={preferFlats}
          showChords={showChords}
          fontSize={settings.fontSize}
          font={settings.lyricsFont}
        />

        {song.notes && !presenting && (
          <aside className="mt-10 rounded-2xl bg-surface-2 p-4 text-sm">
            <div className="mb-1 font-semibold">Observaciones</div>
            <p className="whitespace-pre-line text-muted">{song.notes}</p>
          </aside>
        )}

        {list && !presenting && (
          <div className="mt-10 grid grid-cols-2 gap-3">
            <Button disabled={!prevId} onClick={() => goTo(prevId)} className="justify-start">
              <ChevronLeft size={18} /> Anterior
            </Button>
            <Button disabled={!nextId} onClick={() => goTo(nextId)} className="justify-end" variant={nextId ? 'primary' : 'secondary'}>
              Siguiente <ChevronRight size={18} />
            </Button>
          </div>
        )}
      </article>

      {/* Controles de lectura */}
      {controlsVisible && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-1 px-2 py-1.5">
            {hasChords ? (
              <div className="flex items-center rounded-full bg-surface-2">
                <IconButton label="Bajar medio tono" onClick={() => setSteps(steps - 1)}>
                  <Minus size={19} />
                </IconButton>
                <button
                  type="button"
                  onClick={() => setKeySheet(true)}
                  className="min-w-14 px-1 text-center font-semibold text-chord"
                  aria-label="Elegir tonalidad"
                >
                  {currentKey ? keyName(currentKey, notation) : steps > 0 ? `+${steps}` : steps}
                </button>
                <IconButton label="Subir medio tono" onClick={() => setSteps(steps + 1)}>
                  <Plus size={19} />
                </IconButton>
              </div>
            ) : (
              <span className="px-3 text-xs text-muted">Sin acordes</span>
            )}
            <div className="flex items-center">
              <IconButton label="Reducir letra" onClick={() => setFont(settings.fontSize - 2)} disabled={settings.fontSize <= FONT_MIN}>
                <AArrowDown size={21} />
              </IconButton>
              <IconButton label="Aumentar letra" onClick={() => setFont(settings.fontSize + 2)} disabled={settings.fontSize >= FONT_MAX}>
                <AArrowUp size={21} />
              </IconButton>
              {hasChords && (
                <IconButton
                  label={settings.showChords ? 'Ocultar acordes' : 'Mostrar acordes'}
                  aria-pressed={settings.showChords}
                  active={settings.showChords}
                  onClick={() => update({ showChords: !settings.showChords })}
                >
                  <Guitar size={20} />
                </IconButton>
              )}
              <IconButton
                label={presenting ? 'Salir de pantalla completa' : 'Pantalla completa'}
                onClick={() => (presenting ? exitPresent() : enterPresent())}
              >
                {presenting ? <Minimize size={20} /> : <Maximize size={20} />}
              </IconButton>
            </div>
          </div>
        </div>
      )}
      {presenting && !controlsVisible && (
        <div className="fixed right-3 z-30 flex gap-2" style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}>
          {list && prevId && (
            <IconButton label="Canción anterior" onClick={() => goTo(prevId)} className="bg-surface/80 shadow backdrop-blur">
              <ChevronLeft size={20} />
            </IconButton>
          )}
          {list && nextId && (
            <IconButton label="Canción siguiente" onClick={() => goTo(nextId)} className="bg-surface/80 shadow backdrop-blur">
              <ChevronRight size={20} />
            </IconButton>
          )}
          <IconButton label="Salir de pantalla completa" onClick={exitPresent} className="bg-surface/80 shadow backdrop-blur">
            <Minimize size={20} />
          </IconButton>
        </div>
      )}

      {/* Selector de tonalidad */}
      <Sheet open={keySheet} onClose={() => setKeySheet(false)} title="Tonalidad">
        {originalKey ? (
          <>
            <p className="mb-3 text-sm text-muted">
              Original: <span className="font-semibold text-ink">{keyName(originalKey, notation)}</span>
              {steps !== 0 && (
                <>
                  {' '}
                  · Transpuesto {steps > 0 ? '+' : ''}
                  {steps} {Math.abs(steps) === 1 ? 'semitono' : 'semitonos'}
                </>
              )}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {allKeys(originalKey.minor).map((k) => {
                const delta = normalizeSteps(k.semitone - originalKey.semitone);
                const selected = currentKey?.semitone === k.semitone;
                return (
                  <button
                    key={k.semitone}
                    type="button"
                    onClick={() => setSteps(delta)}
                    aria-pressed={selected}
                    className={cx(
                      'flex min-h-14 flex-col items-center justify-center rounded-2xl border text-base font-semibold transition',
                      selected ? 'border-accent bg-accent text-on-accent' : 'border-line hover:border-accent/50',
                    )}
                  >
                    {keyName(k, notation)}
                    <span className={cx('text-[11px] font-normal', selected ? 'opacity-80' : 'text-muted')}>
                      {delta === 0 ? 'original' : `${delta > 0 ? '+' : ''}${delta}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Use los botones − y + para transponer semitonos.</p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Notación"
            value={notation}
            onChange={(v) => update({ notation: v })}
            options={[
              { value: 'es', label: 'Do Re Mi' },
              { value: 'en', label: 'C D E' },
            ]}
          />
          <Button onClick={() => setSteps(0)} disabled={steps === 0}>
            <RotateCcw size={16} /> Tono original
          </Button>
        </div>
      </Sheet>

      {/* Menú de opciones */}
      <Sheet open={menu} onClose={() => setMenu(false)} title={song.title}>
        <div className="-mx-2 flex flex-col">
          {[
            { icon: ListPlus, label: 'Agregar a una lista', action: () => setListSheet(true) },
            { icon: Heart, label: isFav ? 'Quitar de favoritos' : 'Agregar a favoritos', action: onFav },
            { icon: Share2, label: 'Compartir letra', action: onShare },
            { icon: Maximize, label: 'Pantalla completa', action: enterPresent },
            { icon: Pencil, label: 'Editar canción', action: () => navigate(`/editar/${song.id}`) },
          ].map(({ icon: I, label, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setMenu(false);
                void action();
              }}
              className="flex items-center gap-4 rounded-xl px-3 py-3.5 text-left hover:bg-surface-2"
            >
              <I size={20} className="text-muted" />
              {label}
            </button>
          ))}
        </div>
      </Sheet>

      <AddToListSheet open={listSheet} onClose={() => setListSheet(false)} songId={song.id} />
    </div>
  );
}
