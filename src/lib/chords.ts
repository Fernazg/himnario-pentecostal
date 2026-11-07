/**
 * Motor de acordes: análisis, transposición y conversión de notación.
 *
 * Admite notación española (Do, Re, Mi, Fa, Sol, La, Si) e internacional
 * (C, D, E, F, G, A, B), con sostenidos/bemoles (#, b, ♯, ♭), cualquier
 * tipo de acorde (m, 7, maj7, sus4, dim, °, aug, add9, 7(b9)…) e
 * inversiones con bajo (Do/Mi, G/B).
 */

export type Notation = 'es' | 'en';

export const NOTE_LETTERS: Record<Notation, readonly string[]> = {
  es: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'],
  en: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
};

const NATURAL_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** Nombres cromáticos por semitono: [letra, alteración]. */
const SHARP_SPELLING: Array<[number, number]> = [
  [0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0],
];
const FLAT_SPELLING: Array<[number, number]> = [
  [0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0],
];

/** Tonalidades que se escriben habitualmente con bemoles. */
const FLAT_MAJOR_KEYS = new Set([1, 3, 5, 8, 10]); // Reb, Mib, Fa, Lab, Sib
const FLAT_MINOR_KEYS = new Set([0, 2, 3, 5, 7, 10]); // Dom, Rem, Mibm, Fam, Solm, Sibm

export interface ParsedNote {
  letter: number; // índice 0..6 (Do..Si)
  accidental: number; // -2..2
  semitone: number; // 0..11
  notation: Notation;
}

export interface ParsedChord {
  root: ParsedNote;
  suffix: string;
  bass?: ParsedNote;
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

// Orden importante: "Sol" antes que "Si" no colisiona, pero se prueba completo.
const ES_PATTERNS: Array<[RegExp, number]> = [
  [/^(SOL|Sol)/, 4],
  [/^(DO|Do)/, 0],
  [/^(RE|Re)/, 1],
  [/^(MI|Mi)/, 2],
  [/^(FA|Fa)/, 3],
  [/^(LA|La)/, 5],
  [/^(SI|Si)/, 6],
];
const EN_LETTERS = 'CDEFGAB';

function readAccidentals(s: string, start: number): [number, number] {
  let acc = 0;
  let i = start;
  while (i < s.length && i - start < 2) {
    const c = s[i];
    if (c === '#' || c === '♯') acc++;
    else if (c === 'b' || c === '♭') acc--;
    else break;
    i++;
  }
  return [acc, i - start];
}

/** Lee una nota al inicio de `s`. Devuelve null si no hay nota. */
function readNote(s: string, notation: Notation): { note: ParsedNote; length: number } | null {
  let letter = -1;
  let len = 0;
  if (notation === 'es') {
    for (const [re, idx] of ES_PATTERNS) {
      const m = re.exec(s);
      if (m) {
        letter = idx;
        len = m[0].length;
        break;
      }
    }
  } else {
    const idx = EN_LETTERS.indexOf(s[0] ?? '');
    if (idx >= 0) {
      letter = idx;
      len = 1;
    }
  }
  if (letter < 0) return null;
  const [accidental, accLen] = readAccidentals(s, len);
  return {
    note: {
      letter,
      accidental,
      semitone: mod12(NATURAL_SEMITONES[letter] + accidental),
      notation,
    },
    length: len + accLen,
  };
}

/** Sufijos válidos de acorde (m, 7, maj7, sus4, dim, °, add9, (b9), 6/9…). */
const SUFFIX_RE =
  /^(?:maj|Maj|min|mi|dim|aug|sus|add|alt|omit|no|M|m|°|º|ø|Δ|\+|-|\d{1,2}|[#b♯♭]|\((?:[#b♯♭+\-\d,]|add|sus|maj|no|omit)*\)|\/(?=\d))*$/;

function parseWith(input: string, notation: Notation): ParsedChord | null {
  const head = readNote(input, notation);
  if (!head) return null;
  let rest = input.slice(head.length);
  let bass: ParsedNote | undefined;

  // Busca un bajo "/Nota" al final (la barra puede pertenecer a 6/9).
  const slash = rest.lastIndexOf('/');
  if (slash >= 0) {
    const bassStr = rest.slice(slash + 1);
    const b = readNote(bassStr, notation) ?? readNote(bassStr, notation === 'es' ? 'en' : 'es');
    if (b && b.length === bassStr.length) {
      bass = b.note;
      rest = rest.slice(0, slash);
    }
  }
  if (!SUFFIX_RE.test(rest)) return null;
  return { root: head.note, suffix: rest, bass };
}

export function parseChord(input: string): ParsedChord | null {
  const s = input.trim();
  if (!s) return null;
  // Se prueba primero la notación española; si el sufijo no es válido
  // (p. ej. "Fadd9" leído como "Fa"+"dd9"), se intenta la internacional.
  return parseWith(s, 'es') ?? parseWith(s, 'en');
}

export function isChord(token: string): boolean {
  return parseChord(token) !== null;
}

export function noteName(letter: number, accidental: number, notation: Notation): string {
  const acc = accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental);
  return NOTE_LETTERS[notation][letter] + acc;
}

export function semitoneName(semitone: number, notation: Notation, preferFlats: boolean): string {
  const [letter, acc] = (preferFlats ? FLAT_SPELLING : SHARP_SPELLING)[mod12(semitone)];
  return noteName(letter, acc, notation);
}

function renderNote(note: ParsedNote, steps: number, notation: Notation, preferFlats: boolean): string {
  if (steps === 0 && Math.abs(note.accidental) <= 1) {
    // Sin transposición se respeta la grafía original.
    return noteName(note.letter, note.accidental, notation);
  }
  return semitoneName(note.semitone + steps, notation, preferFlats);
}

/**
 * Transpone un acorde `steps` semitonos y lo escribe en la notación indicada.
 * Conserva sufijos, extensiones e inversiones. Si el texto no es un acorde
 * reconocible se devuelve sin cambios.
 */
export function transposeChord(
  chord: string,
  steps: number,
  notation: Notation,
  preferFlats = false,
): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  const root = renderNote(parsed.root, steps, notation, preferFlats);
  const bass = parsed.bass ? '/' + renderNote(parsed.bass, steps, notation, preferFlats) : '';
  return root + parsed.suffix + bass;
}

/* ───────────────────────────── Tonalidades ───────────────────────────── */

export interface MusicalKey {
  semitone: number;
  minor: boolean;
}

export function parseKey(key: string | undefined | null): MusicalKey | null {
  if (!key) return null;
  const parsed = parseChord(key.trim());
  if (!parsed) return null;
  const minor = /^(m|min|mi|-)(?!aj)/.test(parsed.suffix);
  return { semitone: parsed.root.semitone, minor };
}

export function isFlatKey(key: MusicalKey): boolean {
  return (key.minor ? FLAT_MINOR_KEYS : FLAT_MAJOR_KEYS).has(mod12(key.semitone));
}

export function keyName(key: MusicalKey, notation: Notation): string {
  return semitoneName(key.semitone, notation, isFlatKey(key)) + (key.minor ? 'm' : '');
}

export function transposeKey(key: MusicalKey, steps: number): MusicalKey {
  return { semitone: mod12(key.semitone + steps), minor: key.minor };
}

/** Las 12 tonalidades (mayores o menores) para el selector. */
export function allKeys(minor: boolean): MusicalKey[] {
  return Array.from({ length: 12 }, (_, i) => ({ semitone: i, minor }));
}

/** Normaliza el desplazamiento a -5..+6 para mostrarlo de forma compacta. */
export function normalizeSteps(steps: number): number {
  const m = mod12(steps);
  return m > 6 ? m - 12 : m;
}

/** Convierte una tonalidad escrita por el usuario a la notación indicada. */
export function formatKey(key: string | undefined, notation: Notation): string {
  const k = parseKey(key);
  return k ? keyName(k, notation) : key ?? '';
}
