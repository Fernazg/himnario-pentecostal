import { CalendarDays, ChevronRight, ListMusic, Plus, User, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListFormSheet } from '../components/ListFormSheet';
import { Button, EmptyState, PageHeader, Tabs } from '../components/ui';
import type { SongList } from '../data/types';
import { useLibrary } from '../state/library';

export const formatListDate = (d?: string) =>
  d ? new Date(d + 'T12:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

function ListCard({ list }: { list: SongList }) {
  const Icon = list.shared ? Users : list.kind === 'culto' ? CalendarDays : User;
  return (
    <li className="border-b border-line">
      <Link to={`/listas/${list.id}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/60 md:px-10">
        <span className="num w-14 shrink-0 text-[12px] uppercase leading-tight text-muted">
          {list.date ? new Date(list.date + 'T12:00').toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '—'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-medium tracking-[-0.01em]">{list.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
            <Icon size={13} strokeWidth={1.6} className="shrink-0" />
            {list.shared ? 'Compartida con la iglesia' : list.kind === 'culto' ? 'Culto o reunión' : 'Personal'}
          </div>
        </div>
        <span className="num text-[13px] text-faint">{list.songIds.length}</span>
        <ChevronRight size={17} strokeWidth={1.6} className="text-faint transition-transform group-hover:translate-x-0.5" />
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
    <div className="pt-safe mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Repertorio"
        title="Listas"
        subtitle="Cultos, reuniones y listas personales"
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus size={17} /> Nueva
          </Button>
        }
      />
      {ready && lists.length === 0 ? (
        <EmptyState icon={<ListMusic />} title="Organice sus cultos">
          Cree una lista para el culto del domingo, un ensayo o sus alabanzas preferidas, y ordene las canciones a su gusto.
          <div className="mt-5">
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={18} /> Crear primera lista
            </Button>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="px-5 md:px-10">
            <Tabs
              label="Filtrar listas"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all' as const, label: 'Todas', count: lists.length },
                { value: 'culto' as const, label: 'Cultos', count: lists.filter((l) => l.kind === 'culto').length },
                { value: 'personal' as const, label: 'Personales', count: lists.filter((l) => l.kind === 'personal').length },
              ]}
            />
          </div>
          <ul>
            {shown.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </ul>
          {shown.length === 0 && <p className="px-5 py-8 text-[15px] text-muted md:px-10">No hay listas de este tipo.</p>}
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
