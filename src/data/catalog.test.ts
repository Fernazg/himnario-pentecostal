import { describe, expect, it, vi } from 'vitest';
import type { Repository } from './repository';
import type { Song } from './types';
import { installCatalog, markCatalogDeleted } from './catalog';

vi.mock('./catalog.json', () => ({
  default: {
    songs: [
      { id: 'sa-a', title: 'A', number: '1', category: 'himnos', lyrics: 'nueva letra', themes: ['cielo'] },
      { id: 'sa-b', title: 'B', number: null, category: 'coros', lyrics: 'b' },
      { id: 'sa-c', title: 'C', category: 'alabanzas', lyrics: 'c' },
    ],
  },
}));

function memoryRepo(initial: Song[] = []): Repository & { songs: Map<string, Song> } {
  const songs = new Map(initial.map((s) => [s.id, s]));
  const meta = new Map<string, unknown>();
  return {
    songs,
    getAllSongs: async () => [...songs.values()],
    putSong: async (s) => void songs.set(s.id, s),
    putSongs: async (list) => list.forEach((s) => songs.set(s.id, s)),
    deleteSong: async (id) => void songs.delete(id),
    getAllLists: async () => [],
    putList: async () => {},
    deleteList: async () => {},
    getFavorites: async () => [],
    putFavorite: async () => {},
    deleteFavorite: async () => {},
    getRecents: async () => [],
    putRecent: async () => {},
    deleteRecent: async () => {},
    getMeta: async <T,>(k: string) => meta.get(k) as T | undefined,
    setMeta: async (k, v) => void meta.set(k, v),
  };
}

const song = (p: Partial<Song> & { id: string }): Song => ({ title: 'x', category: 'himnos', lyrics: '', createdAt: 1, updatedAt: 1, ...p });

describe('installCatalog', () => {
  it('instala el catálogo una sola vez y quita demos no editadas', async () => {
    const repo = memoryRepo([song({ id: 'demo-1' }), song({ id: 'demo-2', updatedAt: 5 })]);
    expect(await installCatalog(repo)).toBe(3);
    expect(repo.songs.has('demo-1')).toBe(false);
    expect(repo.songs.has('demo-2')).toBe(true);
    expect(repo.songs.get('sa-b')!.number).toBeUndefined();
    expect(await installCatalog(repo)).toBe(0);
  });

  it('no sobrescribe canciones editadas ni reinstala las eliminadas', async () => {
    const repo = memoryRepo([song({ id: 'sa-a', lyrics: 'mi versión con [Do]acordes', createdAt: 1, updatedAt: 9 })]);
    await markCatalogDeleted(repo, 'sa-c');
    await installCatalog(repo);
    expect(repo.songs.get('sa-a')!.lyrics).toContain('[Do]');
    expect(repo.songs.has('sa-c')).toBe(false);
    // Restaurar fuerza las eliminadas, pero respeta las editadas.
    await installCatalog(repo, { force: true });
    expect(repo.songs.has('sa-c')).toBe(true);
    expect(repo.songs.get('sa-a')!.lyrics).toContain('[Do]');
  });

  it('retira canciones que salieron del catálogo, salvo las editadas', async () => {
    const repo = memoryRepo([
      song({ id: 'sa-vieja', category: 'alabanzas' }),
      song({ id: 'sa-vieja-editada', category: 'alabanzas', updatedAt: 9 }),
      song({ id: 'mia', category: 'alabanzas' }),
    ]);
    await installCatalog(repo);
    expect(repo.songs.has('sa-vieja')).toBe(false);
    expect(repo.songs.has('sa-vieja-editada')).toBe(true);
    expect(repo.songs.has('mia')).toBe(true);
  });

  it('agrega los temas a canciones editadas sin tocar su letra', async () => {
    const repo = memoryRepo([song({ id: 'sa-a', lyrics: 'mi versión', createdAt: 1, updatedAt: 9 })]);
    await installCatalog(repo);
    expect(repo.songs.get('sa-a')!.lyrics).toBe('mi versión');
    expect(repo.songs.get('sa-a')!.themes).toEqual(['cielo']);
    expect(repo.songs.get('sa-a')!.updatedAt).toBe(9);
  });
});
