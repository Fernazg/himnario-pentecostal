/**
 * Formato de letra con acordes (compatible con ChordPro básico):
 *
 *   # Estrofa 1                ← encabezado de sección
 *   [Do]Santo, santo, [Sol]santo   ← acordes entre corchetes antes de la sílaba
 *   {soc} … {eoc}              ← inicio/fin de coro (ChordPro)
 *   {c: Repetir dos veces}     ← comentario
 *
 * También se puede convertir desde el formato "acordes sobre la letra".
 */
import { isChord, transposeChord, type Notation } from './chords';

export interface Segment {
  chord?: string;
  text: string;
}

export type SongLine =
  | { kind: 'lyric'; segments: Segment[]; chorus: boolean }
  | { kind: 'section'; label: string; chorus: boolean }
  | { kind: 'comment'; text: string; chorus: boolean }
  | { kind: 'empty' };

const DIRECTIVE_RE = /^\{\s*([a-zA-Z_]+)\s*(?::\s*(.*?))?\s*\}$/;
const CHORD_TOKEN_RE = /\[([^\]]*)\]/g;

export function parseLine(line: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let current: Segment = { text: '' };
  CHORD_TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CHORD_TOKEN_RE.exec(line))) {
    current.text += line.slice(last, m.index);
    if (current.chord !== undefined || current.text) segments.push(current);
    current = { chord: m[1].trim(), text: '' };
    last = m.index + m[0].length;
  }
  current.text += line.slice(last);
  if (current.chord !== undefined || current.text) segments.push(current);
  return segments;
}

export function parseSongText(body: string): SongLine[] {
  const out: SongLine[] = [];
  let chorus = false;
  for (const raw of body.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '');
    const trimmed = line.trim();
    if (!trimmed) {
      if (out.length && out[out.length - 1].kind !== 'empty') out.push({ kind: 'empty' });
      continue;
    }
    const d = DIRECTIVE_RE.exec(trimmed);
    if (d) {
      const name = d[1].toLowerCase();
      const value = d[2]?.trim() ?? '';
      if (name === 'soc' || name === 'start_of_chorus') {
        chorus = true;
        out.push({ kind: 'section', label: value || 'Coro', chorus: true });
      } else if (name === 'eoc' || name === 'end_of_chorus') {
        chorus = false;
      } else if (['c', 'comment', 'ci', 'comment_italic', 'cb'].includes(name)) {
        out.push({ kind: 'comment', text: value, chorus });
      } else if (['sov', 'start_of_verse', 'sob', 'start_of_bridge'].includes(name)) {
        if (value) out.push({ kind: 'section', label: value, chorus });
      }
      // Otras directivas (title, key, etc.) se ignoran en la letra.
      continue;
    }
    if (trimmed.startsWith('#')) {
      const label = trimmed.replace(/^#+\s*/, '');
      chorus = /^coro\b/i.test(label);
      out.push({ kind: 'section', label, chorus });
      continue;
    }
    out.push({ kind: 'lyric', segments: parseLine(line), chorus });
  }
  while (out.length && out[out.length - 1].kind === 'empty') out.pop();
  return out;
}

/** Letra sin acordes ni directivas (para búsqueda y compartir). */
export function plainLyrics(body: string): string {
  return parseSongText(body)
    .map((l) => {
      if (l.kind === 'lyric') return l.segments.map((s) => s.text).join('').trim();
      if (l.kind === 'section') return `${l.label}:`;
      if (l.kind === 'comment') return `(${l.text})`;
      return '';
    })
    .join('\n');
}

export function extractChords(body: string): string[] {
  const chords: string[] = [];
  for (const line of parseSongText(body)) {
    if (line.kind !== 'lyric') continue;
    for (const s of line.segments) if (s.chord) chords.push(s.chord);
  }
  return chords;
}

/* ─────────────── Conversión desde/hacia "acordes sobre la letra" ─────────────── */

const NON_CHORD_TOKENS = /^(\||\|\||-|–|\/|x\d+|\(x?\d+\)|\(|\))$/i;

/** Una línea es de acordes si todas sus palabras son acordes (o separadores). */
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  let chords = 0;
  for (const t of tokens) {
    const clean = t.replace(/^\(|\)$/g, '');
    if (isChord(clean)) chords++;
    else if (!NON_CHORD_TOKENS.test(t)) return false;
  }
  return chords > 0;
}

/**
 * Convierte texto con acordes en una línea superior al formato con corchetes.
 * Ej.:  "Do        Sol\nSanto, santo, santo" → "[Do]Santo, santo, [Sol]santo"
 */
export function chordsOverToInline(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isChordLine(line)) {
      out.push(line);
      continue;
    }
    const positions: Array<{ col: number; chord: string }> = [];
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) positions.push({ col: m.index, chord: m[0] });

    const next = lines[i + 1];
    const nextIsLyric = next !== undefined && next.trim() !== '' && !isChordLine(next) && !next.trim().startsWith('#');
    if (!nextIsLyric) {
      out.push(positions.map((p) => (isChord(p.chord) ? `[${p.chord}]` : p.chord)).join(' '));
      continue;
    }
    let lyric = next;
    const maxCol = positions[positions.length - 1].col;
    if (lyric.length < maxCol) lyric = lyric.padEnd(maxCol, ' ');
    for (let p = positions.length - 1; p >= 0; p--) {
      const { col, chord } = positions[p];
      const token = isChord(chord) ? `[${chord}]` : '';
      lyric = lyric.slice(0, col) + token + lyric.slice(col);
    }
    out.push(lyric.replace(/\s+$/, ''));
    i++;
  }
  return out.join('\n');
}

export interface RenderOptions {
  steps: number;
  notation: Notation;
  preferFlats: boolean;
  showChords: boolean;
}

/** Genera texto plano (acordes sobre la letra) en la tonalidad actual. */
export function toChordsOverText(body: string, opts: RenderOptions): string {
  const result: string[] = [];
  for (const line of parseSongText(body)) {
    if (line.kind === 'empty') result.push('');
    else if (line.kind === 'section') result.push(`${line.label}:`);
    else if (line.kind === 'comment') result.push(`(${line.text})`);
    else {
      const lyric = line.segments.map((s) => s.text).join('');
      if (!opts.showChords || !line.segments.some((s) => s.chord)) {
        result.push(lyric.trimEnd());
        continue;
      }
      let chordLine = '';
      let textLine = '';
      for (const s of line.segments) {
        if (s.chord) {
          const c = transposeChord(s.chord, opts.steps, opts.notation, opts.preferFlats);
          if (chordLine.length > textLine.length) textLine = textLine.padEnd(chordLine.length, ' ');
          chordLine = chordLine.padEnd(textLine.length, ' ') + c + ' ';
        }
        textLine += s.text;
      }
      result.push(chordLine.trimEnd());
      if (textLine.trim()) result.push(textLine.trimEnd());
    }
  }
  return result.join('\n');
}
