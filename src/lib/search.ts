import type { Category, Song } from '../data/types';
import { plainLyrics } from './songText';
import { themeById } from '../data/themes';

/** Minúsculas, sin tildes ni signos: "¡Señor!" → "senor". */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchEntry {
  song: Song;
  title: string;
  number: string;
  people: string;
  lyrics: string;
  /** Nombres de las categorías temáticas, normalizados. */
  themes: string;
}

export function buildIndex(songs: Song[]): SearchEntry[] {
  return songs.map((song) => ({
    song,
    title: normalize(song.title),
    number: (song.number ?? '').trim().toLowerCase(),
    people: normalize(`${song.author ?? ''} ${song.composer ?? ''}`),
    lyrics: normalize(plainLyrics(song.lyrics)),
    themes: normalize((song.themes ?? []).map((id) => themeById(id)?.name ?? '').join(' | ')),
  }));
}

export type MatchField = 'number' | 'title' | 'author' | 'theme' | 'lyrics';

export interface SearchResult {
  song: Song;
  score: number;
  field: MatchField;
  /** Fragmento de letra donde aparece la búsqueda. */
  snippet?: string;
}

export function compareSongs(a: Song, b: Song): number {
  const an = a.number?.trim();
  const bn = b.number?.trim();
  if (an && bn) {
    const c = an.localeCompare(bn, 'es', { numeric: true });
    if (c) return c;
  } else if (an) return -1;
  else if (bn) return 1;
  return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
}

function lyricSnippet(song: Song, terms: string[]): string | undefined {
  const lines = plainLyrics(song.lyrics).split('\n');
  const line = lines.find((l) => {
    const n = normalize(l);
    return terms.every((t) => n.includes(t));
  }) ?? lines.find((l) => normalize(l).includes(terms[0]));
  return line?.trim();
}

export function searchSongs(index: SearchEntry[], query: string, category?: Category | null): SearchResult[] {
  const q = normalize(query);
  const pool = category ? index.filter((e) => e.song.category === category) : index;
  if (!q) {
    return pool.map((e) => ({ song: e.song, score: 0, field: 'title' as const })).sort((a, b) => compareSongs(a.song, b.song));
  }
  const terms = q.split(' ');
  const results: SearchResult[] = [];
  for (const e of pool) {
    let score = 0;
    let field: MatchField = 'title';
    if (e.number && e.number === q) {
      score = 1000;
      field = 'number';
    } else if (e.number && /^\d/.test(q) && e.number.startsWith(q)) {
      score = 600;
      field = 'number';
    } else if (e.title === q) score = 900;
    else if (e.title.startsWith(q)) score = 800;
    else if (e.title.includes(q)) score = 700;
    else if (terms.every((t) => e.title.includes(t))) score = 650;
    else if (terms.every((t) => e.people.includes(t))) {
      score = 500;
      field = 'author';
    } else if (q.length >= 4 && terms.every((t) => e.themes.includes(t))) {
      score = 450;
      field = 'theme';
    } else if (e.lyrics.includes(q)) {
      score = 400;
      field = 'lyrics';
    } else if (terms.every((t) => e.lyrics.includes(t))) {
      score = 300;
      field = 'lyrics';
    }
    if (score) {
      results.push({ song: e.song, score, field, snippet: field === 'lyrics' ? lyricSnippet(e.song, terms) : undefined });
    }
  }
  return results.sort((a, b) => b.score - a.score || compareSongs(a.song, b.song));
}
