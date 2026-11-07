import { ArrowLeft, Library, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { SongRow } from '../components/songMeta';
import { ConfirmDialog, EmptyState, IconButton, cx } from '../components/ui';
import { CATEGORIES, type Category, type Song } from '../data/types';
import { useIncremental } from '../hooks/useIncremental';
import { searchSongs } from '../lib/search';
import { useLibrary } from '../state/library';
import { useToast } from '../state/toast';

export default function AdminSongs() {
  const { index, songs, deleteSong } = useLibrary();
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Song | null>(null);
  const dq = useDeferredValue(q);
  const results = useMemo(() => searchSongs(index, dq, cat), [index, dq, cat]);
  const { count, sentinel } = useIncremental(results.length, 80, `${dq}|${cat}`);

  return (
    <div className="pt-safe mx-auto max-w-4xl">
      <div className="flex items-center gap-2 px-2 pt-2 md:px-6">
        <IconButton label="Volver a ajustes" onClick={() => navigate('/ajustes')}>
          <ArrowLeft size={22} />
        </IconButton>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-3 px-4 pb-3 md:px-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Administrar canciones</h1>
          <p className="mt-1 text-sm text-muted">
            {CATEGORIES.map((c) => `${songs.filter((s) => s.category === c.id).length} ${c.label.toLowerCase()}`).join(' · ')}
          </p>
        </div>
        <Link
          to="/editar/nueva"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:opacity-90"
        >
          <Plus size={18} /> Nueva canción
        </Link>
      </header>
      <div className="space-y-3 px-4 pb-2 md:px-8">
        <SearchBox value={q} onChange={setQ} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {[{ id: null as Category | null, label: 'Todas' }, ...CATEGORIES].map((c) => (
            <button
              key={c.id ?? 'all'}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
              className={cx(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium',
                cat === c.id ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {results.length === 0 ? (
        <EmptyState icon={<Library size={28} />} title="No hay canciones">
          Agregue la primera con «Nueva canción» o importe un respaldo desde Ajustes.
        </EmptyState>
      ) : (
        <ul className="px-2 md:px-6">
          {results.slice(0, count).map(({ song }) => (
            <SongRow
              key={song.id}
              song={song}
              to={`/cancion/${song.id}`}
              trailing={
                <div className="flex">
                  <IconButton label={`Editar ${song.title}`} onClick={() => navigate(`/editar/${song.id}`)}>
                    <Pencil size={18} />
                  </IconButton>
                  <IconButton label={`Eliminar ${song.title}`} onClick={() => setToDelete(song)}>
                    <Trash2 size={18} />
                  </IconButton>
                </div>
              }
            />
          ))}
        </ul>
      )}
      <div ref={sentinel} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="¿Eliminar canción?"
        message={<>Se eliminará «{toDelete?.title}» del himnario, de favoritos y de todas las listas.</>}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteSong(toDelete.id);
          toast('Canción eliminada');
        }}
      />
    </div>
  );
}
