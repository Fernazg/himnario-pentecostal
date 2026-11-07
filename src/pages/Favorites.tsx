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
    <div className="pt-safe mx-auto max-w-4xl">
      <PageHeader title="Favoritos" subtitle={`${favorites.size} ${favorites.size === 1 ? 'canción' : 'canciones'}`} />
      {ready && favorites.size === 0 ? (
        <EmptyState icon={<Heart size={28} />} title="Aún no tiene favoritos">
          Toque el corazón en cualquier canción para guardarla aquí.{' '}
          <Link to="/himnario" className="font-medium text-accent">
            Ir al himnario
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="space-y-3 px-4 pb-2 md:px-8">
            {favorites.size > 8 && <SearchBox value={q} onChange={setQ} placeholder="Filtrar favoritos" />}
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
          <ul className="px-2 md:px-6">
            {songs.map((s) => (
              <SongRow
                key={s.id}
                song={s}
                to={`/cancion/${s.id}`}
                trailing={
                  <IconButton
                    label="Quitar de favoritos"
                    active
                    onClick={async () => {
                      await toggleFavorite(s.id);
                      toast('Quitada de favoritos');
                    }}
                  >
                    <Heart size={19} className="fill-current" />
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
