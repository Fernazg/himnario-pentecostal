import { ArrowDown, ArrowLeft, ArrowUp, Check, EllipsisVertical, ListMusic, Pencil, Play, Plus, Share2, Trash2, X } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ListFormSheet } from '../components/ListFormSheet';
import { SearchBox } from '../components/SearchBox';
import { SongBadge, SongRow } from '../components/songMeta';
import { Button, ConfirmDialog, EmptyState, IconButton, Sheet, cx } from '../components/ui';
import { formatKey } from '../lib/chords';
import { searchSongs } from '../lib/search';
import { shareOrCopy } from '../lib/share';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';
import { formatListDate } from './Lists';

function AddSongsSheet({ open, onClose, listId }: { open: boolean; onClose: () => void; listId: string }) {
  const { index, lists, addToList, removeFromList } = useLibrary();
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const list = lists.find((l) => l.id === listId);
  const results = useMemo(() => searchSongs(index, dq).slice(0, 60), [index, dq]);
  if (!list) return null;
  return (
    <Sheet open={open} onClose={onClose} title="Agregar canciones" footer={<Button variant="primary" className="w-full" onClick={onClose}>Listo</Button>}>
      <div className="sticky top-0 z-10 bg-surface pb-2">
        <SearchBox value={q} onChange={setQ} />
      </div>
      <ul className="-mx-2">
        {results.map(({ song }) => {
          const idx = list.songIds.indexOf(song.id);
          const inList = idx >= 0;
          return (
            <li key={song.id}>
              <button
                type="button"
                aria-pressed={inList}
                onClick={() => (inList ? removeFromList(listId, idx) : addToList(listId, song.id))}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-surface-2"
              >
                <SongBadge song={song} />
                <span className="min-w-0 flex-1 truncate font-medium">{song.title}</span>
                <span
                  className={cx(
                    'flex size-8 items-center justify-center rounded-full',
                    inList ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink',
                  )}
                >
                  {inList ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {results.length === 0 && <p className="py-6 text-center text-sm text-muted">Sin resultados.</p>}
    </Sheet>
  );
}

export default function ListDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings, getTranspose } = useSettings();
  const { lists, songsById, updateList, deleteList, removeFromList, moveInList, ready } = useLibrary();
  const list = lists.find((l) => l.id === id);
  const [editingOrder, setEditingOrder] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!ready) return null;
  if (!list) {
    return (
      <div className="pt-safe">
        <div className="p-2">
          <IconButton label="Volver" onClick={() => navigate('/listas')}>
            <ArrowLeft size={22} />
          </IconButton>
        </div>
        <EmptyState icon={<ListMusic size={28} />} title="Lista no encontrada" />
      </div>
    );
  }

  const items = list.songIds.map((sid) => songsById.get(sid)).filter((s) => !!s);

  const share = async () => {
    const lines = items.map((s, i) => {
      const steps = getTranspose(s.id);
      const key = s.key ? ` (${formatKey(s.key, settings.notation)}${steps ? ` ${steps > 0 ? '+' : ''}${steps}` : ''})` : '';
      return `${i + 1}. ${s.number ? `#${s.number} ` : ''}${s.title}${key}`;
    });
    const text = [list.name, list.date ? formatListDate(list.date) : '', list.description ?? '', '', ...lines].filter((l, i) => l || i > 2).join('\n');
    const r = await shareOrCopy({ title: list.name, text });
    if (r === 'copied') toast('Lista copiada al portapapeles');
  };

  return (
    <div className="pt-safe mx-auto max-w-4xl">
      <div className="flex items-center justify-between px-2 pt-2 md:px-6">
        <IconButton label="Volver a listas" onClick={() => navigate('/listas')}>
          <ArrowLeft size={22} />
        </IconButton>
        <IconButton label="Opciones de la lista" onClick={() => setMenu(true)}>
          <EllipsisVertical size={20} />
        </IconButton>
      </div>
      <header className="px-4 pb-4 pt-2 md:px-8">
        <p className="text-sm font-medium text-accent">{list.kind === 'culto' ? 'Culto o reunión' : 'Lista personal'}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">{list.name}</h1>
        <p className="mt-1 text-sm text-muted first-letter:uppercase">
          {list.date ? formatListDate(list.date) + ' · ' : ''}
          {items.length} {items.length === 1 ? 'canción' : 'canciones'}
        </p>
        {list.description && <p className="mt-2 text-sm">{list.description}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" disabled={!items.length} onClick={() => navigate(`/cancion/${items[0]!.id}?lista=${list.id}`)}>
            <Play size={17} className="fill-current" /> Comenzar
          </Button>
          <Button onClick={() => setAdding(true)}>
            <Plus size={18} /> Agregar
          </Button>
          {items.length > 0 && (
            <Button variant={editingOrder ? 'primary' : 'secondary'} onClick={() => setEditingOrder((v) => !v)}>
              {editingOrder ? <Check size={17} /> : <Pencil size={16} />} {editingOrder ? 'Hecho' : 'Ordenar'}
            </Button>
          )}
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState icon={<ListMusic size={28} />} title="Lista vacía">
          Agregue canciones con el botón «Agregar» o desde cualquier canción con «Agregar a una lista».
        </EmptyState>
      ) : (
        <ol className="px-2 md:px-6">
          {items.map((s, i) => (
            <SongRow
              key={s.id}
              song={s}
              to={editingOrder ? undefined : `/cancion/${s.id}?lista=${list.id}`}
              subtitle={`${i + 1} de ${items.length}${s.key ? ' · ' + formatKey(s.key, settings.notation) : ''}`}
              trailing={
                editingOrder && (
                  <div className="flex">
                    <IconButton label="Subir" disabled={i === 0} onClick={() => moveInList(list.id, i, i - 1)}>
                      <ArrowUp size={18} />
                    </IconButton>
                    <IconButton label="Bajar" disabled={i === items.length - 1} onClick={() => moveInList(list.id, i, i + 1)}>
                      <ArrowDown size={18} />
                    </IconButton>
                    <IconButton label="Quitar de la lista" onClick={() => removeFromList(list.id, list.songIds.indexOf(s.id))}>
                      <X size={18} />
                    </IconButton>
                  </div>
                )
              }
            />
          ))}
        </ol>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={list.name}>
        <div className="-mx-2 flex flex-col">
          {[
            { icon: Pencil, label: 'Editar nombre y fecha', action: () => setEditing(true) },
            { icon: Share2, label: 'Compartir lista', action: share },
            { icon: Trash2, label: 'Eliminar lista', action: () => setConfirmDelete(true), danger: true },
          ].map(({ icon: I, label, action, danger }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setMenu(false);
                void action();
              }}
              className={cx('flex items-center gap-4 rounded-xl px-3 py-3.5 text-left hover:bg-surface-2', danger && 'text-red-700 dark:text-red-400')}
            >
              <I size={20} className={danger ? '' : 'text-muted'} />
              {label}
            </button>
          ))}
        </div>
      </Sheet>
      <AddSongsSheet open={adding} onClose={() => setAdding(false)} listId={list.id} />
      <ListFormSheet open={editing} onClose={() => setEditing(false)} initial={list} onSubmit={(v) => updateList(list.id, v)} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="¿Eliminar lista?"
        message={<>Se eliminará «{list.name}». Las canciones no se borran del himnario.</>}
        onConfirm={async () => {
          await deleteList(list.id);
          toast('Lista eliminada');
          navigate('/listas', { replace: true });
        }}
      />
    </div>
  );
}
