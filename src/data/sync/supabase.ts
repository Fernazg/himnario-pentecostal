/**
 * Sincronización opcional con Supabase (no activada por defecto).
 *
 * La app funciona 100 % local con IndexedDB. Para compartir un himnario entre
 * dispositivos o administrarlo de forma central:
 *   1. Cree las tablas con docs/supabase.sql.
 *   2. Defina VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local.
 *   3. Llame a `syncSongs(repo)` (p. ej. al iniciar o al recuperar conexión).
 *
 * Se usa la API REST de PostgREST con fetch, sin dependencias adicionales.
 * Estrategia: "gana la última modificación" según `updatedAt`.
 */
import type { Repository } from '../repository';
import type { Song } from '../types';

export interface SyncProvider {
  pullSongs(since: number): Promise<Song[]>;
  pushSongs(songs: Song[]): Promise<void>;
}

interface SongRow {
  id: string;
  title: string;
  number: string | null;
  category: Song['category'];
  lyrics: string;
  author: string | null;
  composer: string | null;
  key: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

const toRow = (s: Song): SongRow => ({
  id: s.id,
  title: s.title,
  number: s.number ?? null,
  category: s.category,
  lyrics: s.lyrics,
  author: s.author ?? null,
  composer: s.composer ?? null,
  key: s.key ?? null,
  notes: s.notes ?? null,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

const fromRow = (r: SongRow): Song => ({
  id: r.id,
  title: r.title,
  number: r.number ?? undefined,
  category: r.category,
  lyrics: r.lyrics,
  author: r.author ?? undefined,
  composer: r.composer ?? undefined,
  key: r.key ?? undefined,
  notes: r.notes ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export class SupabaseSync implements SyncProvider {
  constructor(
    private url: string,
    private anonKey: string,
    private accessToken?: string,
  ) {}

  private headers(extra: Record<string, string> = {}) {
    return {
      apikey: this.anonKey,
      Authorization: `Bearer ${this.accessToken ?? this.anonKey}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  async pullSongs(since: number) {
    const res = await fetch(`${this.url}/rest/v1/songs?updated_at=gt.${since}&order=updated_at.asc`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Supabase: ${res.status}`);
    return ((await res.json()) as SongRow[]).map(fromRow);
  }

  async pushSongs(songs: Song[]) {
    if (!songs.length) return;
    const res = await fetch(`${this.url}/rest/v1/songs`, {
      method: 'POST',
      headers: this.headers({ Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify(songs.map(toRow)),
    });
    if (!res.ok) throw new Error(`Supabase: ${res.status}`);
  }
}

export function supabaseFromEnv(): SupabaseSync | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && key ? new SupabaseSync(url, key) : null;
}

/** Sincroniza en ambos sentidos y devuelve las canciones recibidas. */
export async function syncSongs(repo: Repository, provider: SyncProvider): Promise<Song[]> {
  const lastSync = (await repo.getMeta<number>('lastSync')) ?? 0;
  const local = await repo.getAllSongs();
  const remote = await provider.pullSongs(lastSync);
  const localById = new Map(local.map((s) => [s.id, s]));
  const incoming = remote.filter((r) => (localById.get(r.id)?.updatedAt ?? -1) < r.updatedAt);
  await repo.putSongs(incoming);
  await provider.pushSongs(local.filter((s) => s.updatedAt > lastSync));
  await repo.setMeta('lastSync', Date.now());
  return incoming;
}
