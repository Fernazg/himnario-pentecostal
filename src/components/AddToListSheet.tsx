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
        <div className="-mx-5 flex flex-col border-t border-line">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-4 border-b border-line px-5 py-3.5 text-left text-[15px] font-medium text-accent transition-colors hover:bg-surface-2/60"
          >
            <span className="flex size-9 items-center justify-center rounded-[8px] border border-accent/40">
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
                className="flex items-center gap-4 border-b border-line px-5 py-3.5 text-left transition-colors hover:bg-surface-2/60"
              >
                <span className="flex size-9 items-center justify-center text-muted [&_svg]:stroke-[1.5]">
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
                    'flex size-6 items-center justify-center rounded-[6px] border',
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
