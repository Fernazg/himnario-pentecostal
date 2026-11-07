import { describe, expect, it } from 'vitest';
import { formatKey, isChord, keyName, parseKey, transposeChord, transposeKey } from './chords';
import { chordsOverToInline, isChordLine, parseSongText, plainLyrics, toChordsOverText } from './songText';

describe('parseChord / isChord', () => {
  it.each(['Do', 'Rem', 'Mim', 'Fa', 'Sol7', 'Lam', 'Si°', 'Do#', 'Reb', 'Fa#m7/Do#', 'Sib', 'Solsus4', 'Lam7(b5)', 'Do6/9', 'Remaj7', 'Fadd9',
    'C', 'Dm', 'G7', 'Bb', 'F#m7b5', 'Cmaj7/E', 'Asus2', 'Ebdim7', 'Gadd9/B', 'SOL', 'Sol+', 'Ddim'])('%s es acorde', (c) => {
    expect(isChord(c)).toBe(true);
  });
  it.each(['la', 'mi', 'Solo', 'Dios', 'Santo', 'Señor', 'Alabad', 'Si,', 'Gloria', 'Amén', 'De', 'Cristo'])('%s no es acorde', (c) => {
    expect(isChord(c)).toBe(false);
  });
});

describe('transposeChord', () => {
  it('sube semitonos conservando tipo de acorde', () => {
    expect(transposeChord('Do', 2, 'es')).toBe('Re');
    expect(transposeChord('Rem', 2, 'es')).toBe('Mim');
    expect(transposeChord('Sol7', 1, 'es')).toBe('Sol#7');
    expect(transposeChord('Sol7', 1, 'es', true)).toBe('Lab7');
    expect(transposeChord('Si°', 1, 'es')).toBe('Do°');
    expect(transposeChord('Lam7(b5)', 3, 'es')).toBe('Dom7(b5)');
    expect(transposeChord('Do6/9', 2, 'es')).toBe('Re6/9');
  });
  it('transpone inversiones (bajo)', () => {
    expect(transposeChord('Do/Mi', 2, 'es')).toBe('Re/Fa#');
    expect(transposeChord('Fa#m7/Do#', -1, 'es')).toBe('Fam7/Do');
    expect(transposeChord('G/B', 5, 'en')).toBe('C/E');
  });
  it('baja semitonos y da la vuelta', () => {
    expect(transposeChord('Do', -1, 'es')).toBe('Si');
    expect(transposeChord('Do', 12, 'es')).toBe('Do');
    expect(transposeChord('Mib', -3, 'es', false)).toBe('Do');
  });
  it('convierte notación sin transponer respetando la grafía', () => {
    expect(transposeChord('Sib', 0, 'en')).toBe('Bb');
    expect(transposeChord('Fa#m', 0, 'en')).toBe('F#m');
    expect(transposeChord('Ebmaj7', 0, 'es')).toBe('Mibmaj7');
    expect(transposeChord('Fadd9', 0, 'es')).toBe('Faadd9');
  });
  it('deja intacto lo que no es acorde', () => {
    expect(transposeChord('N.C.', 3, 'es')).toBe('N.C.');
  });
});

describe('tonalidades', () => {
  it('analiza y nombra tonalidades', () => {
    expect(parseKey('Lam')).toEqual({ semitone: 9, minor: true });
    expect(parseKey('Sol')).toEqual({ semitone: 7, minor: false });
    expect(parseKey('Dmaj7')).toEqual({ semitone: 2, minor: false });
    expect(keyName(transposeKey(parseKey('Sol')!, 3), 'es')).toBe('Sib');
    expect(keyName(transposeKey(parseKey('Lam')!, 5), 'es')).toBe('Rem');
    expect(formatKey('Mib', 'en')).toBe('Eb');
  });
});

describe('texto de canción', () => {
  const body = '# Estrofa 1\n[Do]Santo, santo, [Sol]santo\nSin acordes\n\n{soc}\n[Fa]Coro [Do]aquí\n{eoc}\n{c: Repetir}';
  it('analiza secciones, coro y segmentos', () => {
    const lines = parseSongText(body);
    expect(lines[0]).toEqual({ kind: 'section', label: 'Estrofa 1', chorus: false });
    expect(lines[1]).toEqual({ kind: 'lyric', chorus: false, segments: [{ chord: 'Do', text: 'Santo, santo, ' }, { chord: 'Sol', text: 'santo' }] });
    expect(lines.find((l) => l.kind === 'section' && l.chorus)).toBeTruthy();
    expect(lines.at(-1)).toEqual({ kind: 'comment', text: 'Repetir', chorus: false });
  });
  it('extrae letra plana', () => {
    expect(plainLyrics(body)).toContain('Santo, santo, santo');
    expect(plainLyrics(body)).not.toContain('[');
  });
  it('detecta líneas de acordes', () => {
    expect(isChordLine('Do   Sol   Lam  Fa')).toBe(true);
    expect(isChordLine('C  G/B  Am  | F')).toBe(true);
    expect(isChordLine('Santo es el Señor')).toBe(false);
    expect(isChordLine('A mi Dios')).toBe(false);
  });
  it('convierte acordes sobre letra a formato en línea y viceversa', () => {
    const src = 'Do            Sol\nSanto, santo, santo\nLam  Fa';
    const inline = chordsOverToInline(src);
    expect(inline).toBe('[Do]Santo, santo, [Sol]santo\n[Lam] [Fa]');
    const back = toChordsOverText(inline, { steps: 2, notation: 'es', preferFlats: false, showChords: true });
    expect(back.split('\n')[0]).toBe('Re            La');
    expect(back.split('\n')[1]).toBe('Santo, santo, santo');
  });
});
