import type { Repository } from './repository';
import type { Category, Song } from './types';

/**
 * Himnario incluido con la aplicación (src/data/catalog.json).
 * Se instala la primera vez y en cada nueva versión del catálogo, sin
 * sobrescribir las canciones que el usuario haya editado.
 *
 * Para publicar cambios del catálogo: actualice catalog.json y suba
 * CATALOG_VERSION y CATALOG_STAMP.
 */
export const CATALOG_VERSION = 1;
const CATALOG_STAMP = Date.UTC(2026, 10, 7); // marca de tiempo de las canciones del catálogo

interface CatalogEntry {
  id: string;
  title: string;
  number?: string | null;
  category: Category;
  lyrics: string;
  author?: string;
  composer?: string;
  key?: string;
  notes?: string;
}

export async function loadCatalog(): Promise<Song[]> {
  const { default: data } = (await import('./catalog.json')) as { default: { songs: CatalogEntry[] } };
  return data.songs.map((s) => ({
    id: s.id,
    title: s.title,
    number: s.number ?? undefined,
    category: s.category,
    lyrics: s.lyrics,
    author: s.author,
    composer: s.composer,
    key: s.key,
    notes: s.notes,
    createdAt: CATALOG_STAMP,
    updatedAt: CATALOG_STAMP,
  }));
}

/** Una canción no editada por el usuario conserva updatedAt === createdAt. */
const untouched = (s: Song) => s.updatedAt === s.createdAt;

/**
 * Agrega o actualiza las canciones del catálogo. Con `force`, también vuelve a
 * agregar las que el usuario haya eliminado. Devuelve cuántas se escribieron.
 */
export async function installCatalog(repo: Repository, { force = false } = {}): Promise<number> {
  const installed = (await repo.getMeta<number>('catalogVersion')) ?? 0;
  if (!force && installed >= CATALOG_VERSION) return 0;

  const [catalog, current] = await Promise.all([loadCatalog(), repo.getAllSongs()]);
  const byId = new Map(current.map((s) => [s.id, s]));
  const deleted = new Set((await repo.getMeta<string[]>('catalogDeleted')) ?? []);

  const toWrite = catalog.filter((s) => {
    const cur = byId.get(s.id);
    if (cur) return untouched(cur) && cur.lyrics !== s.lyrics;
    return force || !deleted.has(s.id);
  });
  await repo.putSongs(toWrite);

  // Retira las canciones de demostración de versiones anteriores si no se editaron.
  for (const s of current) {
    if (s.id.startsWith('demo-') && untouched(s)) await repo.deleteSong(s.id);
  }
  if (force) await repo.setMeta('catalogDeleted', []);
  await repo.setMeta('catalogVersion', CATALOG_VERSION);
  return toWrite.length;
}

/** Recuerda que el usuario eliminó una canción del catálogo para no reinstalarla. */
export async function markCatalogDeleted(repo: Repository, id: string) {
  if (!id.startsWith('sa-')) return;
  const list = (await repo.getMeta<string[]>('catalogDeleted')) ?? [];
  if (!list.includes(id)) await repo.setMeta('catalogDeleted', [...list, id]);
}
