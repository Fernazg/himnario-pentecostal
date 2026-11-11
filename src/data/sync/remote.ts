import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Song, SongList } from '../types';
import type { RemoteChanges } from '../../state/library';
import { cleanThemes } from '../themes';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'himnario.auth' },
  });
  return client;
}

export interface SongRow {
  id: string;
  title: string;
  number: string | null;
  category: Song['category'];
  lyrics: string;
  author: string | null;
  composer: string | null;
  key: string | null;
  notes: string | null;
  themes?: string[] | null;
  created_at: number;
  updated_at: number;
  deleted: boolean;
  synced_at?: number;
}

export interface ListRow {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
  song_ids: string[];
  created_at: number;
  updated_at: number;
  deleted: boolean;
  synced_at?: number;
}

const u = <T,>(v: T | null | undefined) => (v === null ? undefined : v);

export const songToRow = (s: Song, deleted = false): SongRow => ({
  id: s.id,
  title: s.title,
  number: s.number ?? null,
  category: s.category,
  lyrics: s.lyrics,
  author: s.author ?? null,
  composer: s.composer ?? null,
  key: s.key ?? null,
  notes: s.notes ?? null,
  themes: s.themes ?? [],
  created_at: s.createdAt,
  updated_at: s.updatedAt,
  deleted,
});

export const rowToSong = (r: SongRow): Song => ({
  id: r.id,
  title: r.title,
  number: u(r.number),
  category: r.category,
  lyrics: r.lyrics,
  author: u(r.author),
  composer: u(r.composer),
  key: u(r.key),
  notes: u(r.notes),
  themes: cleanThemes(r.themes),
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
});

export const listToRow = (l: SongList, deleted = false): ListRow => ({
  id: l.id,
  name: l.name,
  date: l.date ?? null,
  description: l.description ?? null,
  song_ids: l.songIds,
  created_at: l.createdAt,
  updated_at: l.updatedAt,
  deleted,
});

export const rowToList = (r: ListRow): SongList => ({
  id: r.id,
  name: r.name,
  kind: 'culto',
  shared: true,
  date: u(r.date),
  description: u(r.description),
  songIds: Array.isArray(r.song_ids) ? r.song_ids : [],
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
});

const PAGE = 1000;

async function fetchSince<T extends { synced_at?: number }>(table: string, since: number): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase()
      .from(table)
      .select('*')
      .gt('synced_at', since)
      .order('synced_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data as T[]));
    if (!data || data.length < PAGE) return out;
  }
}

/** Descarga los cambios posteriores a `since` (marca del servidor, en ms). */
export async function pullChanges(since: number): Promise<{ changes: RemoteChanges; cursor: number }> {
  const [songRows, listRows] = await Promise.all([fetchSince<SongRow>('songs', since), fetchSince<ListRow>('lists', since)]);
  let cursor = since;
  for (const r of [...songRows, ...listRows]) cursor = Math.max(cursor, Number(r.synced_at ?? 0));
  return {
    cursor,
    changes: {
      songs: songRows.filter((r) => !r.deleted).map(rowToSong),
      deletedSongIds: songRows.filter((r) => r.deleted).map((r) => r.id),
      lists: listRows.filter((r) => !r.deleted).map(rowToList),
      deletedListIds: listRows.filter((r) => r.deleted).map((r) => r.id),
    },
  };
}

export async function upsertSongs(rows: SongRow[]) {
  if (!rows.length) return;
  const { error } = await supabase().from('songs').upsert(rows);
  if (error) throw new Error(error.message);
}

export async function upsertLists(rows: ListRow[]) {
  if (!rows.length) return;
  const { error } = await supabase().from('lists').upsert(rows);
  if (error) throw new Error(error.message);
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase().rpc('is_admin');
  return !error && data === true;
}
