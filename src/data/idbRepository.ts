import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Repository } from './repository';
import type { Favorite, RecentView, Song, SongList } from './types';

interface HimnarioDB extends DBSchema {
  songs: { key: string; value: Song; indexes: { category: string; updatedAt: number } };
  lists: { key: string; value: SongList };
  favorites: { key: string; value: Favorite };
  recents: { key: string; value: RecentView; indexes: { viewedAt: number } };
  meta: { key: string; value: unknown };
}

const DB_NAME = 'himnario-pentecostal';
const DB_VERSION = 1;

export class IndexedDBRepository implements Repository {
  private dbPromise: Promise<IDBPDatabase<HimnarioDB>>;

  constructor(name = DB_NAME) {
    this.dbPromise = openDB<HimnarioDB>(name, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const songs = db.createObjectStore('songs', { keyPath: 'id' });
          songs.createIndex('category', 'category');
          songs.createIndex('updatedAt', 'updatedAt');
          db.createObjectStore('lists', { keyPath: 'id' });
          db.createObjectStore('favorites', { keyPath: 'songId' });
          const recents = db.createObjectStore('recents', { keyPath: 'songId' });
          recents.createIndex('viewedAt', 'viewedAt');
          db.createObjectStore('meta');
        }
        // Futuras migraciones: if (oldVersion < 2) { ... }
      },
    });
  }

  async getAllSongs() {
    return (await this.dbPromise).getAll('songs');
  }
  async putSong(song: Song) {
    await (await this.dbPromise).put('songs', song);
  }
  async putSongs(songs: Song[]) {
    const tx = (await this.dbPromise).transaction('songs', 'readwrite');
    await Promise.all([...songs.map((s) => tx.store.put(s)), tx.done]);
  }
  async deleteSong(id: string) {
    const db = await this.dbPromise;
    const tx = db.transaction(['songs', 'favorites', 'recents'], 'readwrite');
    await Promise.all([
      tx.objectStore('songs').delete(id),
      tx.objectStore('favorites').delete(id),
      tx.objectStore('recents').delete(id),
      tx.done,
    ]);
  }

  async getAllLists() {
    return (await this.dbPromise).getAll('lists');
  }
  async putList(list: SongList) {
    await (await this.dbPromise).put('lists', list);
  }
  async deleteList(id: string) {
    await (await this.dbPromise).delete('lists', id);
  }

  async getFavorites() {
    return (await this.dbPromise).getAll('favorites');
  }
  async putFavorite(fav: Favorite) {
    await (await this.dbPromise).put('favorites', fav);
  }
  async deleteFavorite(songId: string) {
    await (await this.dbPromise).delete('favorites', songId);
  }

  async getRecents() {
    return (await this.dbPromise).getAll('recents');
  }
  async putRecent(r: RecentView) {
    await (await this.dbPromise).put('recents', r);
  }
  async deleteRecent(songId: string) {
    await (await this.dbPromise).delete('recents', songId);
  }

  async getMeta<T>(key: string) {
    return (await (await this.dbPromise).get('meta', key)) as T | undefined;
  }
  async setMeta<T>(key: string, value: T) {
    await (await this.dbPromise).put('meta', value, key);
  }
}
