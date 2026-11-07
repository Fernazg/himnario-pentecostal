import { CalendarDays, ChevronRight, ListMusic, Plus, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListFormSheet } from '../components/ListFormSheet';
import { Button, EmptyState, PageHeader, Segmented } from '../components/ui';
import type { SongList } from '../data/types';
import { useLibrary } from '../state/library';

export const formatListDate = (d?: string) =>
  d ? new Date(d + 'T12:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

function ListCard({ list }: { list: SongList }) {
  const Icon = list.kind === 'culto' ? CalendarDays : User;
  return (
    <li>
      <Link to={`/listas/${list.id}`} className="flex items-center gap-4 rounded-2xl px-2 py-3 transition hover:bg-surface-2">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{list.name}</div>
          <div className="truncate text-sm first-letter:uppercase text-muted">
            {list.date ? formatListDate(list.date) + ' · ' : ''}
            {list.songIds.length} {list.songIds.length === 1 ? 'canción' : 'canciones'}
          </div>
        </div>
        <ChevronRight size={18} className="text-muted" />
      </Link>
    </li>
  );
}

export default function Lists() {
  const { lists, createList, ready } = useLibrary();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'culto' | 'personal'>('all');
  const shown = lists
    .filter((l) => filter === 'all' || l.kind === filter)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="pt-safe mx-auto max-w-4xl">
      <PageHeader
        title="Listas"
        subtitle="Cultos, reuniones y listas personales"
        actions={
          <Button variant="primary" onClick={() => setCreating(true)} className="px-4">
            <Plus size={18} /> Nueva
          </Button>
        }
      />
      {ready && lists.length === 0 ? (
        <EmptyState icon={<ListMusic size={28} />} title="Organice sus cultos">
          Cree una lista para el culto del domingo, un ensayo o sus alabanzas preferidas, y ordene las canciones a su gusto.
          <div className="mt-5">
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={18} /> Crear primera lista
            </Button>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="px-4 pb-2 md:px-8">
            <Segmented
              label="Filtrar listas"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'culto', label: 'Cultos' },
                { value: 'personal', label: 'Personales' },
              ]}
            />
          </div>
          <ul className="px-2 md:px-6">
            {shown.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </ul>
          {shown.length === 0 && <p className="px-4 py-6 text-sm text-muted md:px-8">No hay listas de este tipo.</p>}
        </>
      )}
      <ListFormSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={async (v) => {
          const l = await createList(v);
          navigate(`/listas/${l.id}`);
        }}
      />
    </div>
  );
}
