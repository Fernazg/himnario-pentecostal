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
        <header className="pt-safe sticky top-0 z-30 border-b border-line bg-bg/92 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center gap-0.5 px-2 py-1.5 md:px-6">
            <IconButton label="Volver" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/himnario'))}>
              <ArrowLeft size={21} />
            </IconButton>
            <div className="eyebrow min-w-0 flex-1 truncate text-center text-muted">
              {list ? `${list.name} · ${pos + 1} / ${list.songIds.length}` : info.label}
            </div>
            <IconButton label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'} onClick={onFav} className={isFav ? 'text-chord' : ''}>
              <Heart size={20} className={cx(isFav && 'fill-current')} />
            </IconButton>
            <IconButton label="Compartir" onClick={onShare}>
              <Share2 size={19} />
            </IconButton>
            <IconButton label="Más opciones" onClick={() => setMenu(true)}>
              <EllipsisVertical size={19} />
            </IconButton>
          </div>
        </header>
      )}

      <article
        className={cx('mx-auto max-w-3xl px-5 md:px-10', presenting ? 'pb-24 pt-[max(1.5rem,env(safe-area-inset-top))]' : 'pb-40 pt-8 md:pt-12')}
        onClick={() => presenting && setControlsVisible((v) => !v)}
      >
        {!presenting ? (
          <div className="mb-9">
            <p className="eyebrow flex items-center gap-2 text-muted">
              <Icon size={14} strokeWidth={1.75} style={{ color: categoryColor(song.category) }} />
              {info.singular}
              {song.number && <span className="num text-ink">N.º {song.number.padStart(3, '0')}</span>}
            </p>
            <h1 className="display mt-3 text-[38px] leading-[1.04] md:text-[52px]">{song.title}</h1>
            {(song.author || song.composer) && (
              <p className="mt-3 text-[14px] text-muted">
                {song.author && <>Letra: {song.author}</>}
                {song.author && song.composer && ' · '}
                {song.composer && <>Música: {song.composer}</>}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4">
              {currentKey && hasChords && (
                <button type="button" onClick={() => setKeySheet(true)} className="group flex items-baseline gap-2">
                  <span className="eyebrow text-muted">Tono</span>
                  <span className="num text-[17px] font-semibold text-chord underline decoration-chord/30 underline-offset-4 group-hover:decoration-chord">
                    {keyName(currentKey, notation)}
                  </span>
                  {steps !== 0 && originalKey && (
                    <span className="num text-[12px] text-muted">
                      orig. {keyName(originalKey, notation)} · {steps > 0 ? '+' : ''}
                      {steps}
                    </span>
                  )}
                </button>
              )}
              {currentKey && !hasChords && (
                <span className="flex items-baseline gap-2">
                  <span className="eyebrow text-muted">Tono</span>
                  <span className="num text-[17px] font-semibold text-chord">{keyName(currentKey, notation)}</span>
                </span>
              )}
              {!!song.themes?.length && (
                <nav aria-label="Categorías temáticas" className="flex flex-wrap gap-1.5">
                  {song.themes.map((tid) => {
                    const t = themeById(tid);
                    if (!t) return null;
                    const TIcon = t.icon;
                    return (
                      <Link
                        key={tid}
                        to={`/categorias/${tid}`}
                        className="inline-flex items-center gap-1.5 rounded-[6px] border border-line px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-ink"
                      >
                        <TIcon size={13} strokeWidth={1.75} style={{ color: toneVar(t.tone) }} />
                        {t.name}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>
          </div>
        ) : (
          <h1 className="display mb-6" style={{ fontSize: settings.fontSize * 1.3 }}>
            {song.number ? <span className="num mr-3 text-[0.55em] text-muted">{song.number.padStart(3, '0')}</span> : null}
            {song.title}
            {currentKey && showChords && <span className="num ml-3 align-middle text-[0.5em] text-chord">{keyName(currentKey, notation)}</span>}
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
          <aside className="mt-12 border-t border-line pt-4">
            <p className="eyebrow mb-2 text-muted">Observaciones</p>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-muted">{song.notes}</p>
          </aside>
        )}

        {list && !presenting && (
          <nav className="mt-12 grid grid-cols-2 border-y border-line" aria-label="Navegación de la lista">
            <button type="button" disabled={!prevId} onClick={() => goTo(prevId)} className="flex items-center gap-2 py-4 text-left text-[14px] font-medium disabled:opacity-30">
              <ChevronLeft size={18} strokeWidth={1.75} /> Anterior
            </button>
            <button
              type="button"
              disabled={!nextId}
              onClick={() => goTo(nextId)}
              className="flex items-center justify-end gap-2 border-l border-line py-4 text-right text-[14px] font-medium text-accent disabled:text-ink disabled:opacity-30"
            >
              Siguiente <ChevronRight size={18} strokeWidth={1.75} />
            </button>
          </nav>
        )}
      </article>

      {/* Controles de lectura: barra en petróleo profundo */}
      {controlsVisible && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 bg-deep text-on-deep md:left-60 lg:left-64">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-1 px-2 py-1.5 md:px-6">
            {hasChords ? (
              <div className="flex items-center rounded-[10px] border border-deep-line">
                <IconButton label="Bajar medio tono" onClick={() => setSteps(steps - 1)} className="text-on-deep hover:bg-white/10">
                  <Minus size={18} />
                </IconButton>
                <button
                  type="button"
                  onClick={() => setKeySheet(true)}
                  className="num min-w-[3.75rem] self-stretch border-x border-deep-line px-1 text-center text-[15px] font-semibold text-[#f0a074]"
                  aria-label="Elegir tonalidad"
                >
                  {currentKey ? keyName(currentKey, notation) : steps > 0 ? `+${steps}` : steps}
                </button>
                <IconButton label="Subir medio tono" onClick={() => setSteps(steps + 1)} className="text-on-deep hover:bg-white/10">
                  <Plus size={18} />
                </IconButton>
              </div>
            ) : (
              <span className="eyebrow px-3 text-on-deep-muted">Sin acordes</span>
            )}
            <div className="flex items-center">
              <IconButton label="Reducir letra" onClick={() => setFont(settings.fontSize - 2)} disabled={settings.fontSize <= FONT_MIN} className="text-on-deep hover:bg-white/10">
                <AArrowDown size={20} />
              </IconButton>
              <IconButton label="Aumentar letra" onClick={() => setFont(settings.fontSize + 2)} disabled={settings.fontSize >= FONT_MAX} className="text-on-deep hover:bg-white/10">
                <AArrowUp size={20} />
              </IconButton>
              {hasChords && (
                <IconButton
                  label={settings.showChords ? 'Ocultar acordes' : 'Mostrar acordes'}
                  aria-pressed={settings.showChords}
                  onClick={() => update({ showChords: !settings.showChords })}
                  className={settings.showChords ? 'bg-white/12 text-[#f0a074] hover:bg-white/15' : 'text-on-deep hover:bg-white/10'}
                >
                  <Guitar size={19} />
                </IconButton>
              )}
              <IconButton
                label={presenting ? 'Salir de pantalla completa' : 'Pantalla completa'}
                onClick={() => (presenting ? exitPresent() : enterPresent())}
                className="text-on-deep hover:bg-white/10"
              >
                {presenting ? <Minimize size={19} /> : <Maximize size={19} />}
              </IconButton>
            </div>
          </div>
        </div>
      )}
      {presenting && !controlsVisible && (
        <div className="fixed right-3 z-30 flex gap-1 rounded-[12px] bg-deep/90 p-1 text-on-deep backdrop-blur" style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}>
          {list && prevId && (
            <IconButton label="Canción anterior" onClick={() => goTo(prevId)} className="text-on-deep hover:bg-white/10">
              <ChevronLeft size={20} />
            </IconButton>
          )}
          {list && nextId && (
            <IconButton label="Canción siguiente" onClick={() => goTo(nextId)} className="text-on-deep hover:bg-white/10">
              <ChevronRight size={20} />
            </IconButton>
          )}
          <IconButton label="Salir de pantalla completa" onClick={exitPresent} className="text-on-deep hover:bg-white/10">
            <Minimize size={20} />
          </IconButton>
        </div>
      )}

      {/* Selector de tonalidad */}
      <Sheet open={keySheet} onClose={() => setKeySheet(false)} title="Tonalidad">
        {originalKey ? (
          <>
            <p className="mb-4 text-[14px] text-muted">
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
                      'num flex min-h-14 flex-col items-center justify-center rounded-[8px] border text-[16px] font-semibold transition-colors',
                      selected ? 'border-accent bg-accent text-on-accent' : 'border-line hover:border-accent/50',
                    )}
                  >
                    {keyName(k, notation)}
                    <span className={cx('text-[10px] font-normal uppercase tracking-wider', selected ? 'opacity-80' : 'text-faint')}>
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
              className="flex items-center gap-4 border-b border-line px-2 py-3.5 text-left text-[15px] transition-colors last:border-b-0 hover:text-accent [&_svg]:stroke-[1.6]"
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
