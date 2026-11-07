import type { Favorite, RecentView, Song, SongList } from './types';

/**
 * Contrato de almacenamiento. La implementación actual es IndexedDB (local,
 * sin conexión). Una implementación remota (p. ej. Supabase) puede cumplir
 * la misma interfaz o sincronizarse sobre ella: ver src/data/sync/supabase.ts.
 */
export interface Repository {
  getAllSongs(): Promise<Song[]>;
  putSong(song: Song): Promise<void>;
  putSongs(songs: Song[]): Promise<void>;
  deleteSong(id: string): Promise<void>;

  getAllLists(): Promise<SongList[]>;
  putList(list: SongList): Promise<void>;
  deleteList(id: string): Promise<void>;

  getFavorites(): Promise<Favorite[]>;
  putFavorite(fav: Favorite): Promise<void>;
  deleteFavorite(songId: string): Promise<void>;

  getRecents(): Promise<RecentView[]>;
  putRecent(r: RecentView): Promise<void>;
  deleteRecent(songId: string): Promise<void>;

  getMeta<T>(key: string): Promise<T | undefined>;
  setMeta<T>(key: string, value: T): Promise<void>;
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
