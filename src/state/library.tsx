import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { IndexedDBRepository } from '../data/idbRepository';
import { newId, type Repository } from '../data/repository';
import { DEMO_SONGS } from '../data/seed';
import type { BackupFile, Category, RecentView, Song, SongInput, SongList } from '../data/types';
import { buildIndex, compareSongs, type SearchEntry } from '../lib/search';

const MAX_RECENTS = 30;
const CATEGORY_IDS: Category[] = ['himnos', 'alabanzas', 'coros'];

export interface ImportSummary {
  songs: number;
  lists: number;
  favorites: number;
}

interface LibraryCtx {
  ready: boolean;
  error: string | null;
  songs: Song[];
  songsById: Map<string, Song>;
  index: SearchEntry[];
  favorites: Map<string, number>;
  lists: SongList[];
  recents: RecentView[];

  saveSong: (input: SongInput, id?: string) => Promise<Song>;
  deleteSong: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
  recordView: (id: string) => void;
  clearRecents: () => Promise<void>;

  createList: (data: Pick<SongList, 'name' | 'kind' | 'date' | 'description'> & { songIds?: string[] }) => Promise<SongList>;
  updateList: (id: string, patch: Partial<Omit<SongList, 'id' | 'createdAt'>>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addToList: (listId: string, songId: string) => Promise<boolean>;
  removeFromList: (listId: string, index: number) => Promise<void>;
  moveInList: (listId: string, from: number, to: number) => Promise<void>;

  exportBackup: () => BackupFile;
  importBackup: (data: unknown) => Promise<ImportSummary>;
  restoreDemo: () => Promise<number>;
}

const Ctx = createContext<LibraryCtx | null>(null);

function sanitizeSong(raw: unknown): Song | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const title = str(r.title);
  if (!title) return null;
  const category = CATEGORY_IDS.includes(r.category as Category) ? (r.category as Category) : 'himnos';
  const now = Date.now();
  return {
    id: str(r.id) ?? newId(),
    title,
    number: r.number != null && String(r.number).trim() ? String(r.number).trim() : undefined,
    category,
    lyrics: typeof r.lyrics === 'string' ? r.lyrics : '',
    author: str(r.author),
    composer: str(r.composer),
    key: str(r.key),
    notes: str(r.notes),
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : now,
  };
}

export function LibraryProvider({ children, repo: repoProp }: { children: ReactNode; repo?: Repository }) {
  const [repo] = useState<Repository>(() => repoProp ?? new IndexedDBRepository());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Map<string, number>>(new Map());
  const [lists, setLists] = useState<SongList[]>([]);
  const [recents, setRecents] = useState<RecentView[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(await repo.getMeta<boolean>('seeded'))) {
          const now = Date.now();
          await repo.putSongs(DEMO_SONGS.map((s, i) => ({ ...s, id: `demo-${i + 1}`, createdAt: now, updatedAt: now })));
          await repo.setMeta('seeded', true);
        }
        const [s, f, l, r] = await Promise.all([repo.getAllSongs(), repo.getFavorites(), repo.getAllLists(), repo.getRecents()]);
        if (cancelled) return;
        setSongs(s.sort(compareSongs));
        setFavorites(new Map(f.map((x) => [x.songId, x.addedAt])));
        setLists(l.sort((a, b) => b.updatedAt - a.updatedAt));
        setRecents(r.sort((a, b) => b.viewedAt - a.viewedAt));
        setReady(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError('No se pudo abrir el almacenamiento local. Compruebe que el navegador no esté en modo privado.');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const songsById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const index = useMemo(() => buildIndex(songs), [songs]);

  const saveSong = useCallback(
    async (input: SongInput, id?: string) => {
      const now = Date.now();
      const existing = id ? songsById.get(id) : undefined;
      const song: Song = {
        ...input,
        id: existing?.id ?? newId(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await repo.putSong(song);
      setSongs((prev) => [...prev.filter((s) => s.id !== song.id), song].sort(compareSongs));
      return song;
    },
    [repo, songsById],
  );

  const putListLocal = useCallback(
    async (list: SongList) => {
      await repo.putList(list);
      setLists((prev) => [list, ...prev.filter((l) => l.id !== list.id)]);
    },
    [repo],
  );

  const deleteSong = useCallback(
    async (id: string) => {
      await repo.deleteSong(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
      setFavorites((prev) => {
        const n = new Map(prev);
        n.delete(id);
        return n;
      });
      setRecents((prev) => prev.filter((r) => r.songId !== id));
      // Quita la canción de las listas que la contengan.
      const affected = lists.filter((l) => l.songIds.includes(id));
      for (const l of affected) {
        await putListLocal({ ...l, songIds: l.songIds.filter((s) => s !== id), updatedAt: Date.now() });
      }
    },
    [repo, lists, putListLocal],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const isFav = favorites.has(id);
      if (isFav) await repo.deleteFavorite(id);
      else await repo.putFavorite({ songId: id, addedAt: Date.now() });
      setFavorites((prev) => {
        const n = new Map(prev);
        if (isFav) n.delete(id);
        else n.set(id, Date.now());
        return n;
      });
      return !isFav;
    },
    [repo, favorites],
  );

  const recordView = useCallback(
    (id: string) => {
      const entry = { songId: id, viewedAt: Date.now() };
      setRecents((prev) => {
        const next = [entry, ...prev.filter((r) => r.songId !== id)];
        const overflow = next.slice(MAX_RECENTS);
        overflow.forEach((o) => void repo.deleteRecent(o.songId));
        return next.slice(0, MAX_RECENTS);
      });
      void repo.putRecent(entry);
    },
    [repo],
  );

  const clearRecents = useCallback(async () => {
    await Promise.all(recents.map((r) => repo.deleteRecent(r.songId)));
    setRecents([]);
  }, [repo, recents]);

  const createList = useCallback<LibraryCtx['createList']>(
    async (data) => {
      const now = Date.now();
      const list: SongList = { ...data, id: newId(), songIds: data.songIds ?? [], createdAt: now, updatedAt: now };
      await putListLocal(list);
      return list;
    },
    [putListLocal],
  );

  const mutateList = useCallback(
    async (id: string, fn: (l: SongList) => SongList) => {
      const list = lists.find((l) => l.id === id);
      if (!list) return;
      await putListLocal({ ...fn(list), updatedAt: Date.now() });
    },
    [lists, putListLocal],
  );

  const updateList = useCallback<LibraryCtx['updateList']>((id, patch) => mutateList(id, (l) => ({ ...l, ...patch })), [mutateList]);

  const deleteList = useCallback(
    async (id: string) => {
      await repo.deleteList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
    },
    [repo],
  );

  const addToList = useCallback(
    async (listId: string, songId: string) => {
      const list = lists.find((l) => l.id === listId);
      if (!list || list.songIds.includes(songId)) return false;
      await mutateList(listId, (l) => ({ ...l, songIds: [...l.songIds, songId] }));
      return true;
    },
    [lists, mutateList],
  );

  const removeFromList = useCallback(
    (listId: string, idx: number) => mutateList(listId, (l) => ({ ...l, songIds: l.songIds.filter((_, i) => i !== idx) })),
    [mutateList],
  );

  const moveInList = useCallback(
    (listId: string, from: number, to: number) =>
      mutateList(listId, (l) => {
        if (to < 0 || to >= l.songIds.length) return l;
        const ids = [...l.songIds];
        const [moved] = ids.splice(from, 1);
        ids.splice(to, 0, moved);
        return { ...l, songIds: ids };
      }),
    [mutateList],
  );

  const exportBackup = useCallback(
    (): BackupFile => ({
      app: 'himnario-pentecostal',
      version: 1,
      exportedAt: new Date().toISOString(),
      songs,
      lists,
      favorites: [...favorites].map(([songId, addedAt]) => ({ songId, addedAt })),
    }),
    [songs, lists, favorites],
  );

  const importBackup = useCallback(
    async (data: unknown): Promise<ImportSummary> => {
      const obj = data as Partial<BackupFile> | unknown[];
      const rawSongs = Array.isArray(obj) ? obj : Array.isArray(obj?.songs) ? obj.songs : null;
      if (!rawSongs) throw new Error('El archivo no contiene canciones en un formato reconocido.');

      // Fusión: si la canción ya existe, se conserva la versión más reciente.
      const incoming = rawSongs.map(sanitizeSong).filter((s): s is Song => !!s);
      const toWrite = incoming.filter((s) => {
        const cur = songsById.get(s.id);
        return !cur || s.updatedAt >= cur.updatedAt;
      });
      await repo.putSongs(toWrite);
      const merged = new Map(songsById);
      toWrite.forEach((s) => merged.set(s.id, s));
      setSongs([...merged.values()].sort(compareSongs));

      let listCount = 0;
      let favCount = 0;
      if (!Array.isArray(obj)) {
        const validIds = new Set(merged.keys());
        const nextLists = new Map(lists.map((l) => [l.id, l]));
        for (const l of obj?.lists ?? []) {
          if (!l || typeof l.name !== 'string' || !Array.isArray(l.songIds)) continue;
          const cur = nextLists.get(l.id);
          if (cur && cur.updatedAt > l.updatedAt) continue;
          const list: SongList = {
            id: l.id || newId(),
            name: l.name,
            kind: l.kind === 'culto' ? 'culto' : 'personal',
            date: l.date,
            description: l.description,
            songIds: l.songIds.filter((id) => validIds.has(id)),
            createdAt: l.createdAt ?? Date.now(),
            updatedAt: l.updatedAt ?? Date.now(),
          };
          await repo.putList(list);
          nextLists.set(list.id, list);
          listCount++;
        }
        setLists([...nextLists.values()].sort((a, b) => b.updatedAt - a.updatedAt));

        const nextFav = new Map(favorites);
        for (const f of obj?.favorites ?? []) {
          if (!f || !validIds.has(f.songId) || nextFav.has(f.songId)) continue;
          await repo.putFavorite(f);
          nextFav.set(f.songId, f.addedAt);
          favCount++;
        }
        setFavorites(nextFav);
      }
      return { songs: toWrite.length, lists: listCount, favorites: favCount };
    },
    [repo, songsById, lists, favorites],
  );

  const restoreDemo = useCallback(async () => {
    const now = Date.now();
    const demo = DEMO_SONGS.map((s, i) => ({ ...s, id: `demo-${i + 1}`, createdAt: now, updatedAt: now }));
    await repo.putSongs(demo);
    const merged = new Map(songsById);
    demo.forEach((s) => merged.set(s.id, s));
    setSongs([...merged.values()].sort(compareSongs));
    return demo.length;
  }, [repo, songsById]);

  const value: LibraryCtx = {
    ready,
    error,
    songs,
    songsById,
    index,
    favorites,
    lists,
    recents,
    saveSong,
    deleteSong,
    toggleFavorite,
    recordView,
    clearRecents,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromList,
    moveInList,
    exportBackup,
    importBackup,
    restoreDemo,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLibrary fuera de LibraryProvider');
  return c;
}
