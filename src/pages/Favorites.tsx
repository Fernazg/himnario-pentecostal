import { Heart } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { SongRow } from '../components/songMeta';
import { EmptyState, IconButton, PageHeader, Segmented } from '../components/ui';
import { compareSongs, normalize } from '../lib/search';
import { useLibrary } from '../state/library';
import { useToast } from '../state/toast';

export default function Favorites() {
  const { favorites, songsById, toggleFavorite, ready } = useLibrary();
  const toast = useToast();
  const [order, setOrder] = useState<'recent' | 'number'>('recent');
  const [q, setQ] = useState('');

  const songs = useMemo(() => {
    const entries = [...favorites].map(([id, at]) => ({ song: songsById.get(id), at })).filter((e) => e.song);
    const nq = normalize(q);
    const filtered = nq ? entries.filter((e) => normalize(`${e.song!.number ?? ''} ${e.song!.title}`).includes(nq)) : entries;
    return filtered
      .sort((a, b) => (order === 'recent' ? b.at - a.at : compareSongs(a.song!, b.song!)))
      .map((e) => e.song!);
  }, [favorites, songsById, order, q]);

  return (
    <div className="pt-safe mx-auto max-w-5xl">
      <PageHeader eyebrow="Colección personal" title="Favoritos" subtitle={`${favorites.size} ${favorites.size === 1 ? 'canción guardada' : 'canciones guardadas'}`} />
      {ready && favorites.size === 0 ? (
        <EmptyState icon={<Heart />} title="Aún no tiene favoritos">
          Toque el corazón en cualquier canción para guardarla aquí.{' '}
          <Link to="/himnario" className="font-medium text-accent">
            Ir al himnario
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 pb-4 md:px-10">
            {favorites.size > 8 && <div className="w-full sm:w-auto sm:flex-1"><SearchBox value={q} onChange={setQ} placeholder="Filtrar favoritos" /></div>}
            <Segmented
              label="Ordenar"
              value={order}
              onChange={setOrder}
              options={[
                { value: 'recent', label: 'Recientes' },
                { value: 'number', label: 'Por número' },
              ]}
            />
          </div>
          <ul>
            {songs.map((s) => (
              <SongRow
                key={s.id}
                song={s}
                to={`/cancion/${s.id}`}
                trailing={
                  <IconButton
                    label="Quitar de favoritos"
                    className="text-chord hover:bg-surface-2"
                    onClick={async () => {
                      await toggleFavorite(s.id);
                      toast('Quitada de favoritos');
                    }}
                  >
                    <Heart size={18} className="fill-current" />
                  </IconButton>
                }
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
