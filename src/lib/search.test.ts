import { describe, expect, it } from 'vitest';
import type { Song } from '../data/types';
import { buildIndex, normalize, searchSongs } from './search';

const mk = (p: Partial<Song> & { id: string; title: string }): Song => ({
  category: 'himnos', lyrics: '', createdAt: 0, updatedAt: 0, ...p,
});
const songs = [
  mk({ id: 'a', title: 'Gloria al Señor', number: '12', lyrics: '[Do]Cantaré con júbilo\nal [Sol]Rey eterno', author: 'Autora Prueba' }),
  mk({ id: 'b', title: 'Cantad alegres', number: '2', category: 'coros', lyrics: 'Fuego santo' }),
  mk({ id: 'c', title: 'Sin número', lyrics: 'El Rey de gloria' }),
];
const idx = buildIndex(songs);

describe('búsqueda', () => {
  it('normaliza tildes y signos', () => expect(normalize('¡Señor, Júbilo!')).toBe('senor jubilo'));
  it('busca por número exacto', () => expect(searchSongs(idx, '12')[0].song.id).toBe('a'));
  it('busca por título sin tildes', () => expect(searchSongs(idx, 'gloria al senor')[0].song.id).toBe('a'));
  it('busca por fragmento de letra ignorando acordes', () => {
    const r = searchSongs(idx, 'jubilo al rey');
    expect(r[0].song.id).toBe('a');
    expect(searchSongs(idx, 'con jubilo')[0].snippet).toBe('Cantaré con júbilo');
  });
  it('busca por autor', () => expect(searchSongs(idx, 'autora')[0].field).toBe('author'));
  it('filtra por categoría', () => expect(searchSongs(idx, '', 'coros').map((r) => r.song.id)).toEqual(['b']));
  it('ordena por número y luego título', () => expect(searchSongs(idx, '').map((r) => r.song.id)).toEqual(['b', 'a', 'c']));
});
