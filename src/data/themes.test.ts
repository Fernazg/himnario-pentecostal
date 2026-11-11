import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildIndex, searchSongs } from '../lib/search';
import { THEMES, cleanThemes, themeById } from './themes';
import type { Song } from './types';

const catalog: { songs: Array<{ id: string; title: string; themes?: string[] }> } = JSON.parse(
  readFileSync(new URL('./catalog.json', import.meta.url), 'utf8'),
);

describe('categorías temáticas', () => {
  it('tienen ids únicos y nombre, ícono y descripción', () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    for (const t of THEMES) expect(t.name && t.description && t.icon).toBeTruthy();
  });

  it('el catálogo solo usa temas existentes, sin repetir, máximo 3 por canción', () => {
    for (const s of catalog.songs) {
      for (const id of s.themes ?? []) expect(themeById(id), `${s.title}: ${id}`).toBeDefined();
      expect(new Set(s.themes ?? []).size).toBe((s.themes ?? []).length);
      expect((s.themes ?? []).length).toBeLessThanOrEqual(3);
    }
  });

  it('cada categoría tiene canciones en el himnario incluido', () => {
    for (const t of THEMES) {
      const n = catalog.songs.filter((s) => s.themes?.includes(t.id)).length;
      expect(n, t.name).toBeGreaterThan(0);
    }
  });

  it('clasifica por mensaje: casos de control', () => {
    const themesOf = (title: string) => catalog.songs.find((s) => s.title === title)?.themes ?? [];
    expect(themesOf('Noche de Paz')[0]).toBe('navidad');
    expect(themesOf('Castillo Fuerte')).toContain('proteccion');
    expect(themesOf('Santa Biblia')[0]).toBe('palabra');
    expect(themesOf('Ciento Veinte Pentecostés')[0]).toBe('espiritu-santo');
    expect(themesOf('Desciende')[0]).toBe('espiritu-santo');
    // Que la letra mencione "cielo" no basta: este himno trata del hogar terrenal.
    expect(themesOf('Hogar De Mis Recuerdos')).toEqual([]);
  });

  it('cleanThemes descarta ids desconocidos y duplicados', () => {
    expect(cleanThemes(['cielo', 'x', 'cielo', 3])).toEqual(['cielo']);
    expect(cleanThemes(undefined)).toEqual([]);
  });

  it('la búsqueda encuentra canciones por el nombre de su tema', () => {
    const mk = (id: string, title: string, themes: string[]): Song => ({ id, title, themes, category: 'himnos', lyrics: 'texto', createdAt: 0, updatedAt: 0 });
    const idx = buildIndex([mk('a', 'Belén', ['navidad']), mk('b', 'Otra', ['cielo'])]);
    const r = searchSongs(idx, 'navidad');
    expect(r.map((x) => x.song.id)).toEqual(['a']);
    expect(r[0].field).toBe('theme');
  });
});
