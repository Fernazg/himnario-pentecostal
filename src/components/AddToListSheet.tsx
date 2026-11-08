import { Check, ListMusic, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLibrary } from '../state/library';
import { useSync } from '../state/sync';
import { useToast } from '../state/toast';
import { ListFormSheet } from './ListFormSheet';
import { Sheet, cx } from './ui';

export function AddToListSheet({ open, onClose, songId }: { open: boolean; onClose: () => void; songId: string }) {
  const { lists, addToList, removeFromList, createList } = useLibrary();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const { isAdmin } = useSync();

  const toggle = async (listId: string) => {
    const list = lists.find((l) => l.id === listId)!;
    const idx = list.songIds.indexOf(songId);
    if (idx >= 0) {
      await removeFromList(listId, idx);
      toast(`Quitada de «${list.name}»`);
    } else {
      await addToList(listId, songId);
      toast(`Agregada a «${list.name}»`);
    }
  };

  return (
    <>
      <Sheet open={open && !creating} onClose={onClose} title="Agregar a una lista">
        <div className="-mx-2 flex flex-col">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-4 rounded-xl px-3 py-3 text-left font-medium text-accent hover:bg-surface-2"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft">
              <Plus size={20} />
            </span>
            Nueva lista
          </button>
          {lists.filter((l) => !l.shared || isAdmin).map((l) => {
            const inList = l.songIds.includes(songId);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => toggle(l.id)}
                aria-pressed={inList}
                className="flex items-center gap-4 rounded-xl px-3 py-3 text-left hover:bg-surface-2"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-muted">
                  <ListMusic size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="text-sm text-muted">
                    {l.kind === 'culto' ? 'Culto' : 'Personal'} · {l.songIds.length} canciones
                  </span>
                </span>
                <span
                  className={cx(
                    'flex size-6 items-center justify-center rounded-full border-2',
                    inList ? 'border-accent bg-accent text-on-accent' : 'border-line',
                  )}
                >
                  {inList && <Check size={14} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>
      <ListFormSheet
        open={open && creating}
        onClose={() => setCreating(false)}
        onSubmit={async (v) => {
          await createList({ ...v, songIds: [songId] });
          toast(`Agregada a «${v.name}»`);
        }}
      />
    </>
  );
}
