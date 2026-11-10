import { ChevronDown, ChevronUp, ClipboardPaste, TriangleAlert } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CATEGORIES, type Category, type Song } from '../data/types';
import { normalize } from '../lib/search';
import { parsePastedSongs, type PastedSong } from '../lib/pasteFormat';
import { parseSongText } from '../lib/songText';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { SongView } from './SongView';
import { Button, Segmented, Sheet, cx, inputClass } from './ui';

const PLACEHOLDER = `Pegue aquí el texto tal como lo copió del documento. Por ejemplo:

01. El Alfarero
D (Re Mayor)
I
Un día orando, le dije a mi
Señor.
…
Coro
Quiero una sonrisa, cuando todo
va mal.`;

/** Busca una canción ya existente que la pegada reemplazaría (mismo número o mismo título). */
export function findExisting(songs: Song[], p: PastedSong, category: Category): Song | undefined {
  const inCat = songs.filter((s) => s.category === category);
  if (p.number) {
    const byNum = inCat.find((s) => s.number === p.number);
    if (byNum) return byNum;
  }
  const t = normalize(p.title);
  return inCat.find((s) => normalize(s.title) === t);
}

function summary(lyrics: string) {
  const lines = parseSongText(lyrics);
  const secs = lines.flatMap((l) => (l.kind === 'section' ? [l.label] : []));
  const count = lines.filter((l) => l.kind === 'lyric').length;
  return { secs, count };
}

export function PasteSheet({
  open,
  onClose,
  defaultCategory = 'alabanzas',
  onUseSingle,
  onSavedMany,
}: {
  open: boolean;
  onClose: () => void;
  defaultCategory?: Category;
  /** Con una sola canción: cargarla en el formulario para revisarla antes de guardar. */
  onUseSingle?: (song: PastedSong, category: Category, existing?: Song) => void;
  /** Tras guardar varias canciones. */
  onSavedMany?: (count: number, category: Category) => void;
}) {
  const { songs, saveSong } = useLibrary();
  const { settings } = useSettings();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const dText = useDeferredValue(text);

  useEffect(() => {
    if (open) {
      setText('');
      setCategory(defaultCategory);
      setOpenIdx(0);
    }
  }, [open, defaultCategory]);

  const parsed = useMemo(() => (dText.trim() ? parsePastedSongs(dText) : []), [dText]);
  const canReadClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const p of parsed) {
        const existing = findExisting(songs, p, category);
        await saveSong(
          {
            ...(existing ?? {}),
            title: p.title,
            number: p.number ?? existing?.number,
            category,
            key: p.key ?? existing?.key,
            lyrics: p.lyrics,
          },
          existing?.id,
        );
      }
      onSavedMany?.(parsed.length, category);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const footer =
    parsed.length === 0 ? null : parsed.length === 1 && onUseSingle ? (
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={saveAll} disabled={saving}>
          Guardar directamente
        </Button>
        <Button variant="primary" onClick={() => (onUseSingle(parsed[0], category, findExisting(songs, parsed[0], category)), onClose())}>
          Revisar en el formulario
        </Button>
      </div>
    ) : (
      <Button variant="primary" className="w-full" onClick={saveAll} disabled={saving}>
        {saving ? 'Guardando…' : `Guardar ${parsed.length} ${parsed.length === 1 ? 'canción' : 'canciones'}`}
      </Button>
    );

  return (
    <Sheet open={open} onClose={onClose} title="Pegar desde documento" footer={footer}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          La app une las líneas cortadas, reconoce número, título, tono, estrofas (I, II…), coros, puente, final y voces (Mujeres / Hombres), y
          quita los números de página. Puede pegar varias canciones a la vez.
        </p>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Categoría</span>
          <Segmented
            label="Categoría"
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map((c) => ({ value: c.id, label: c.id === 'alabanzas' ? 'Alabanzas' : c.id === 'coros' ? 'Coros' : 'Himnos' }))}
          />
        </div>
        <textarea
          className={cx(inputClass, 'min-h-48 font-mono text-[14px] leading-relaxed')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          aria-label="Texto pegado"
          spellCheck={false}
        />
        {canReadClipboard && !text && (
          <Button
            onClick={async () => {
              try {
                setText(await navigator.clipboard.readText());
              } catch {
                /* El usuario negó el permiso: puede pegar a mano. */
              }
            }}
          >
            <ClipboardPaste size={16} /> Pegar del portapapeles
          </Button>
        )}

        {text.trim() && parsed.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <TriangleAlert size={16} /> No se reconoció ninguna canción todavía.
          </p>
        )}

        {parsed.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">
              {parsed.length === 1 ? 'Se reconoció 1 canción' : `Se reconocieron ${parsed.length} canciones`}
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {parsed.map((p, i) => {
                const { secs, count } = summary(p.lyrics);
                const existing = findExisting(songs, p, category);
                const expanded = openIdx === i;
                return (
                  <li key={i} className="bg-surface">
                    <button
                      type="button"
                      onClick={() => setOpenIdx(expanded ? null : i)}
                      aria-expanded={expanded}
                      className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-surface-2"
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-sm font-semibold text-accent">
                        {p.number ?? '—'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.title}</span>
                        <span className="block text-xs text-muted">
                          {p.key ? `Tono ${p.key} · ` : 'Sin tono · '}
                          {count} versos{secs.length ? ` · ${secs.join(', ')}` : ''}
                        </span>
                        {existing && (
                          <span className="mt-1 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                            Reemplazará a «{existing.title}»
                          </span>
                        )}
                      </span>
                      {expanded ? <ChevronUp size={18} className="mt-1 text-muted" /> : <ChevronDown size={18} className="mt-1 text-muted" />}
                    </button>
                    {expanded && (
                      <div className="border-t border-line bg-bg px-4 py-4">
                        <SongView
                          lyrics={p.lyrics}
                          steps={0}
                          notation={settings.notation}
                          preferFlats={false}
                          showChords
                          fontSize={16}
                          font={settings.lyricsFont}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  );
}
