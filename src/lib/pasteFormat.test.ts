import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseSongText } from './songText';
import { parseKeyLine, parsePastedSongs } from './pasteFormat';

const fixture = (n: string) => readFileSync(new URL(`./__fixtures__/${n}`, import.meta.url), 'utf8');
const lyricLines = (lyrics: string) =>
  parseSongText(lyrics).flatMap((l) => (l.kind === 'lyric' ? [l.segments.map((s) => s.text).join('')] : []));
const sections = (lyrics: string) => parseSongText(lyrics).flatMap((l) => (l.kind === 'section' ? [l.label] : []));

describe('parseKeyLine', () => {
  it.each([
    ['D (Re Mayor)', 'Re'],
    ['A (La mayor)', 'La'],
    ['Am (La Menor)', 'Lam'],
    ['Dm (Re Menor)', 'Rem'],
    ['Em (Mi Menor)', 'Mim'],
    ['C (Do Mayor)', 'Do'],
    ['Tono: Sol', 'Sol'],
    ['Si bemol mayor', 'Sib'],
    ['F#m', 'Fa#m'],
  ])('%s → %s', (input, expected) => expect(parseKeyLine(input)).toBe(expected));
  it('no confunde un verso con una tonalidad', () => {
    expect(parseKeyLine('Sólo en Dios, Tú debes confiar.')).toBeNull();
    expect(parseKeyLine('La soledad no me dejaba')).toBeNull();
  });
});

describe('parsePastedSongs: alabanzas 1–3', () => {
  const songs = parsePastedSongs(fixture('alabanzas-01-03.txt'));
  it('detecta las tres canciones con número, título y tono', () => {
    expect(songs.map((s) => [s.number, s.title, s.key])).toEqual([
      ['1', 'El Alfarero', 'Re'],
      ['2', 'Lléname', 'La'],
      ['3', 'Desciende', 'Sol'],
    ]);
  });
  it('une las líneas cortadas por el PDF', () => {
    const l = lyricLines(songs[0].lyrics);
    expect(l[0]).toBe('Un día orando, le dije a mi Señor.');
    expect(l).toContain('Haz como Tú quieras, hazme un nuevo ser.');
    expect(l).toContain('Me dijo: “No me gustas te voy a quebrantar.');
    expect(l).toContain('Y quiero que aprendas, también a perdonar.');
    expect(l).toHaveLength(12);
  });
  it('arma estrofas y coro en el orden original y quita números de página', () => {
    expect(sections(songs[0].lyrics)).toEqual(['Estrofa 1', 'Estrofa 2', 'Coro']);
    expect(sections(songs[1].lyrics)).toEqual(['Estrofa 1', 'Coro', 'Estrofa 2']);
    expect(songs[0].lyrics).not.toMatch(/^1$/m);
    expect(lyricLines(songs[1].lyrics).at(-1)).toBe('Sabes Señor, te quiero gritar, ¡yo te amo!');
  });
  it('ordena las marcas de repetición', () => {
    const l = lyricLines(songs[2].lyrics);
    expect(l).toContain('// Que hablaban en lenguas. //');
    expect(l).toContain('// Y hoy está aquí. //');
    expect(l).toContain('Unos hombres tiempo atrás.');
  });
});

describe('parsePastedSongs: voces, coros numerados y canciones pegadas', () => {
  const songs = parsePastedSongs(fixture('alabanzas-05-06.txt'));
  it('separa canciones aunque vengan en la misma línea', () => {
    expect(songs.map((s) => s.number)).toEqual(['5', '6', '7', '8', '10']);
    expect(songs.map((s) => s.key)).toEqual(['Lam', 'Sol', 'Rem', 'Mim', 'Do']);
    expect(songs[3].title).toBe('¿Cómo no creer en Dios?');
  });
  it('une las partes de voces cortadas', () => {
    const l = lyricLines(songs[0].lyrics);
    expect(l).toContain('(Mujeres) Como muchos esperaron Su promesa.');
    expect(l).toContain('(Mujeres) Porque sé, (Hombres) Porque sé.');
    expect(l).toContain('(Mujeres) Yo sí sé, (Hombres) Yo sí sé.');
    expect(lyricLines(songs[3].lyrics)[0]).toBe('(Hombres) ¿Cómo no creer en Dios?');
  });
  it('conserva Coro I / Coro II y limpia la marca final «//.»', () => {
    expect(sections(songs[0].lyrics)).toEqual(['Estrofa 1', 'Coro I', 'Estrofa 2', 'Coro II']);
    expect(lyricLines(songs[0].lyrics).at(-1)).toBe('Esperanza bendita, sólo en Ti confiaré. //');
  });
  it('une una palabra que quedó sola tras un conector y reconoce «Final»', () => {
    expect(lyricLines(songs[1].lyrics)).toContain('Ya no sufras más, y ven con Cristo');
    expect(songs[1].lyrics).not.toMatch(/^6$/m);
    expect(sections(songs[2].lyrics)).toEqual(['Estrofa 1', 'Final']);
    expect(lyricLines(songs[2].lyrics).at(-1)).toBe('Que siendo Dios… Estás conmigo.');
  });
});

describe('parsePastedSongs: otros formatos', () => {
  it('sin número: la primera línea es el título; respeta acordes encima de la letra', () => {
    const [s] = parsePastedSongs('Mi Dios es fiel\nTono: Re\n\nRe           La\nMi Dios es fiel en todo tiempo\nSim          Sol\nsu amor no cambiará');
    expect(s.title).toBe('Mi Dios es fiel');
    expect(s.number).toBeUndefined();
    expect(s.key).toBe('Re');
    expect(lyricLines(s.lyrics)).toEqual(['Mi Dios es fiel en todo tiempo', 'su amor no cambiará']);
    expect(s.lyrics.match(/\[([^\]]+)\]/g)).toEqual(['[Re]', '[La]', '[Sim]', '[Sol]']);
  });
  it('evita que corchetes o # del texto se lean como acordes o secciones', () => {
    const [s] = parsePastedSongs('Prueba\n[Repetir] esta parte\n#1 en mi vida');
    expect(s.lyrics).not.toContain('[');
    expect(parseSongText(s.lyrics).every((l) => l.kind !== 'section')).toBe(true);
  });
});
