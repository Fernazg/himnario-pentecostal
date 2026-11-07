import { useEffect, useState } from 'react';
import type { ListKind, SongList } from '../data/types';
import { Button, Field, Segmented, Sheet, inputClass } from './ui';

export interface ListFormValues {
  name: string;
  kind: ListKind;
  date?: string;
  description?: string;
}

export function ListFormSheet({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial?: SongList;
  onSubmit: (v: ListFormValues) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ListKind>('culto');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setKind(initial?.kind ?? 'culto');
    setDate(initial?.date ?? '');
    setDescription(initial?.description ?? '');
  }, [open, initial]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      name: name.trim(),
      kind,
      date: kind === 'culto' && date ? date : undefined,
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? 'Editar lista' : 'Nueva lista'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => submit()} disabled={!name.trim()}>
            {initial ? 'Guardar' : 'Crear lista'}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Segmented
          label="Tipo de lista"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'culto', label: 'Culto o reunión' },
            { value: 'personal', label: 'Personal' },
          ]}
        />
        <Field label="Nombre">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'culto' ? 'Culto dominical' : 'Mis alabanzas'}
            autoFocus
            maxLength={80}
          />
        </Field>
        {kind === 'culto' && (
          <Field label="Fecha (opcional)">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        )}
        <Field label="Descripción (opcional)">
          <input
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas para el grupo de alabanza"
            maxLength={200}
          />
        </Field>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
