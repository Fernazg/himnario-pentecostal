import { ArrowLeft, Library, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { SongRow } from '../components/songMeta';
import { ConfirmDialog, EmptyState, IconButton, Tabs } from '../components/ui';
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
    <div className="pt-safe mx-auto max-w-5xl">
      <div className="flex items-center gap-2 px-2 pt-2 md:px-7">
        <IconButton label="Volver a ajustes" onClick={() => navigate('/ajustes')}>
          <ArrowLeft size={21} />
        </IconButton>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4 px-5 pb-6 pt-3 md:px-10">
        <div>
          <p className="eyebrow text-muted">Administración</p>
          <h1 className="display mt-3 text-[38px] leading-[1.04] md:text-[52px]">Canciones</h1>
          <p className="num mt-2 text-[13px] text-muted">
            {CATEGORIES.map((c) => `${songs.filter((s) => s.category === c.id).length} ${c.label.toLowerCase()}`).join(' · ')}
          </p>
        </div>
        <Link
          to="/editar/nueva"
          className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-accent px-4 text-[14px] font-medium text-on-accent transition-colors hover:bg-accent-strong"
        >
          <Plus size={17} strokeWidth={1.75} /> Nueva canción
        </Link>
      </header>
      <div className="space-y-4 px-5 md:px-10">
        <SearchBox value={q} onChange={setQ} />
        <Tabs
          label="Filtrar por colección"
          value={cat}
          onChange={setCat}
          options={[{ value: null as Category | null, label: 'Todas' }, ...CATEGORIES.map((c) => ({ value: c.id as Category | null, label: c.label }))]}
        />
      </div>
      {results.length === 0 ? (
        <EmptyState icon={<Library />} title="No hay canciones">
          Agregue la primera con «Nueva canción» o importe un respaldo desde Ajustes.
        </EmptyState>
      ) : (
        <ul>
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
