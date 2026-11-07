import { ArrowLeft, Info, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_ICON, categoryColor } from '../components/songMeta';
import { SongView } from '../components/SongView';
import { Button, ConfirmDialog, EmptyState, Field, IconButton, Segmented, cx, inputClass } from '../components/ui';
import { CATEGORIES, type Category, type SongInput } from '../data/types';
import { allKeys, isChord, isFlatKey, keyName, parseKey } from '../lib/chords';
import { chordsOverToInline, extractChords, isChordLine } from '../lib/songText';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

const EMPTY: SongInput = { title: '', number: '', category: 'himnos', lyrics: '', author: '', composer: '', key: '', notes: '' };

const FORMAT_HELP = `# Estrofa 1
[Do]Escriba el acorde entre [Fa]corchetes
justo antes de la [Sol7]sílaba que lo [Do]lleva.

{soc}
[Fa]Las líneas entre {soc} y {eoc} se [Do]muestran como coro.
{eoc}

{c: Comentario, p. ej. Repetir dos veces}`;

export default function SongEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'nueva';
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const { songsById, saveSong, deleteSong, ready } = useLibrary();
  const existing = !isNew ? songsById.get(id!) : undefined;

  const [form, setForm] = useState<SongInput>(EMPTY);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [showHelp, setShowHelp] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !ready) return;
    if (existing) setForm({ ...EMPTY, ...existing });
    loaded.current = true;
  }, [ready, existing]);

  const set = <K extends keyof SongInput>(k: K, v: SongInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const chords = useMemo(() => extractChords(form.lyrics), [form.lyrics]);
  const invalidChords = useMemo(() => [...new Set(chords.filter((c) => c && !isChord(c)))], [chords]);
  const hasChordLines = useMemo(() => form.lyrics.split('\n').some(isChordLine), [form.lyrics]);
  const keyValid = !form.key?.trim() || !!parseKey(form.key);
  const titleError = submitted && !form.title.trim();

  const keyOptions = useMemo(
    () => [...allKeys(false), ...allKeys(true)].map((k) => keyName(k, settings.notation)),
    [settings.notation],
  );

  if (!ready) return null;
  if (!isNew && !existing) {
    return (
      <EmptyState icon={<Info size={28} />} title="Canción no encontrada">
        No existe o fue eliminada.
      </EmptyState>
    );
  }

  const save = async () => {
    setSubmitted(true);
    if (!form.title.trim() || !keyValid) {
      toast(!form.title.trim() ? 'El título es obligatorio' : 'La tonalidad no es válida');
      return;
    }
    const clean = (s?: string) => (s?.trim() ? s.trim() : undefined);
    // Si no se indica tonalidad, se toma la del primer acorde.
    const firstChord = parseKey(chords[0]);
    const song = await saveSong(
      {
        title: form.title.trim(),
        number: clean(form.number),
        category: form.category,
        lyrics: form.lyrics.replace(/\s+$/, ''),
        author: clean(form.author),
        composer: clean(form.composer),
        key: clean(form.key) ?? (firstChord ? keyName(firstChord, 'es') : undefined),
        notes: clean(form.notes),
      },
      existing?.id,
    );
    toast(isNew ? 'Canción agregada' : 'Cambios guardados');
    navigate(`/cancion/${song.id}`, { replace: true });
  };

  return (
    <div className="pt-safe mx-auto max-w-3xl pb-28">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line/70 bg-bg/90 px-2 py-1.5 backdrop-blur-xl md:px-6">
        <IconButton label="Volver" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </IconButton>
        <h1 className="flex-1 truncate font-serif text-lg font-semibold">{isNew ? 'Nueva canción' : 'Editar canción'}</h1>
        <Button variant="primary" onClick={save}>
          Guardar
        </Button>
      </header>

      <div className="space-y-5 px-4 pt-5 md:px-8">
        <Field label="Título *">
          <input
            className={cx(inputClass, titleError && 'border-red-600')}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Título de la canción"
            aria-invalid={titleError}
            maxLength={150}
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Categoría</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Categoría">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICON[c.id];
              const selected = form.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set('category', c.id as Category)}
                  className={cx(
                    'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-xs font-medium transition sm:text-sm',
                    selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/40',
                  )}
                >
                  <Icon size={20} style={{ color: categoryColor(c.id) }} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Número">
            <input
              className={inputClass}
              value={form.number ?? ''}
              onChange={(e) => set('number', e.target.value)}
              placeholder="Opcional"
              inputMode="numeric"
              maxLength={10}
            />
          </Field>
          <Field label="Tonalidad original" hint={!keyValid ? <span className="text-red-600">No es una tonalidad válida</span> : 'Ej.: Sol, Lam, D'}>
            <input
              className={cx(inputClass, !keyValid && 'border-red-600')}
              value={form.key ?? ''}
              onChange={(e) => set('key', e.target.value)}
              placeholder="Automática"
              list="key-options"
              autoCapitalize="words"
              maxLength={8}
            />
            <datalist id="key-options">
              {keyOptions.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Autor (letra)">
            <input className={inputClass} value={form.author ?? ''} onChange={(e) => set('author', e.target.value)} placeholder="Solo si se conoce" maxLength={120} />
          </Field>
          <Field label="Compositor (música)">
            <input className={inputClass} value={form.composer ?? ''} onChange={(e) => set('composer', e.target.value)} placeholder="Solo si se conoce" maxLength={120} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Letra y acordes</span>
            <Segmented
              label="Modo"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'edit', label: 'Editar' },
                { value: 'preview', label: 'Vista previa' },
              ]}
            />
          </div>

          {tab === 'edit' ? (
            <>
              {hasChordLines && (
                <div className="mb-2 flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft p-3 text-sm">
                  <span className="flex-1">Hay acordes escritos en líneas separadas. ¿Desea alinearlos automáticamente sobre la letra?</span>
                  <Button variant="primary" onClick={() => set('lyrics', chordsOverToInline(form.lyrics))}>
                    <Wand2 size={16} /> Convertir
                  </Button>
                </div>
              )}
              <textarea
                className={cx(inputClass, 'min-h-[22rem] font-mono text-[15px] leading-relaxed')}
                value={form.lyrics}
                onChange={(e) => set('lyrics', e.target.value)}
                placeholder={FORMAT_HELP}
                spellCheck={false}
                autoCapitalize="sentences"
                aria-label="Letra y acordes"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {['# Estrofa', '{soc}\n\n{eoc}', '{c: Repetir}'].map((snippet) => (
                  <button
                    key={snippet}
                    type="button"
                    onClick={() => set('lyrics', (form.lyrics ? form.lyrics.replace(/\n*$/, '\n\n') : '') + snippet)}
                    className="rounded-full bg-surface-2 px-3 py-1.5 font-mono text-xs hover:bg-line"
                  >
                    + {snippet.split('\n')[0] === '{soc}' ? 'Coro' : snippet}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowHelp((v) => !v)}
                  className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-accent hover:bg-surface-2"
                  aria-expanded={showHelp}
                >
                  <Info size={14} /> Formato
                </button>
              </div>
              {showHelp && (
                <div className="mt-3 space-y-2 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
                  <p>
                    Escriba cada acorde entre corchetes justo antes de la sílaba donde se toca: <code className="text-chord">[Sol]Ala[Re]bad</code>.
                    Se aceptan notación española (Do, Rem, Sol7, Si°, Fa#m7/Do#) e internacional (C, Dm, G7).
                  </p>
                  <p>
                    También puede pegar la letra con los acordes en la línea de arriba y pulsar <strong>Convertir</strong>.
                  </p>
                  <p>
                    <code># Nombre</code> crea una sección, <code>{'{soc}'}</code>…<code>{'{eoc}'}</code> marca el coro y{' '}
                    <code>{'{c: texto}'}</code> agrega una indicación.
                  </p>
                </div>
              )}
              {invalidChords.length > 0 && (
                <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                  Acordes no reconocidos (no se transpondrán): {invalidChords.join(', ')}
                </p>
              )}
            </>
          ) : (
            <div className="min-h-[22rem] rounded-2xl border border-line bg-surface p-5">
              <SongView
                lyrics={form.lyrics}
                steps={0}
                notation={settings.notation}
                preferFlats={(() => {
                  const k = parseKey(form.key) ?? parseKey(chords[0]);
                  return k ? isFlatKey(k) : false;
                })()}
                showChords
                fontSize={18}
                font={settings.lyricsFont}
              />
            </div>
          )}
        </div>

        <Field label="Observaciones">
          <textarea
            className={cx(inputClass, 'min-h-24')}
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Indicaciones para músicos, ritmo, fuente, permisos…"
          />
        </Field>

        <p className="flex gap-2 rounded-2xl bg-surface-2 p-3 text-xs text-muted">
          <Info size={16} className="shrink-0" />
          Agregue solo contenido propio, de dominio público o con autorización. Indique autor y compositor únicamente cuando estén verificados.
        </p>

        {!isNew && (
          <Button variant="ghost" className="text-red-700 dark:text-red-400" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={17} /> Eliminar canción
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="¿Eliminar canción?"
        message={<>Se eliminará «{existing?.title}» del himnario, de favoritos y de todas las listas. Esta acción no se puede deshacer.</>}
        onConfirm={async () => {
          await deleteSong(existing!.id);
          toast('Canción eliminada');
          navigate('/himnario', { replace: true });
        }}
      />
    </div>
  );
}
