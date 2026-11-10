/**
 * Convierte texto copiado de un documento (PDF, Word, WhatsApp) al formato
 * de la app. Pensado para cancioneros como:
 *
 *   05. En Ti Confiaré
 *   Am (La Menor)
 *   I
 *   Sólo en Dios, Tú debes confiar.
 *   (Mujeres) Como muchos
 *   esperaron Su promesa.        ← línea cortada por el PDF: se une
 *   Coro I
 *   //Sólo debes confiar, y él te
 *   ayudará. //
 *   6                            ← número de página: se elimina
 *
 * Detecta varias canciones seguidas (incluso pegadas en la misma línea),
 * número, título, tonalidad, estrofas (I, II…), coros, puente y final.
 * Las líneas de acordes se respetan y se alinean con chordsOverToInline.
 */
import { keyName, parseKey } from './chords';
import { chordsOverToInline, isChordLine } from './songText';

export interface PastedSong {
  number?: string;
  title: string;
  key?: string;
  lyrics: string;
}

const UPPER = 'A-ZÁÉÍÓÚÜÑ¿¡"“«(';
const HEADER_RE = /^\s*(\d{1,3})\s*[.)\-–]\s*(.+?)\s*$/;
const PAGE_NUMBER_RE = /^\s*\d{1,3}\s*$/;
const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
const SECTION_RE = /^\s*(coro|estribillo|puente|final|intro|introducci[oó]n|pre-?coro|interludio|coda|estrofa|verso)\b\s*([IVX\d]*)\s*:?\s*$/i;
const ROMAN_RE = /^\s*(I|II|III|IV|V|VI|VII|VIII|IX|X)\s*[.:]?\s*$/;
const VOICE_END_RE = /\((mujeres|hombres|todos|solista|coro|damas|varones)\)\s*$/i;

/** Palabras que no suelen cerrar un verso: si una línea termina así, la siguiente la continúa. */
const CONNECTOR_END_RE =
  /\b(a|al|con|de|del|el|la|las|los|lo|en|y|e|o|u|que|por|para|mi|mis|tu|tus|su|sus|un|una|me|te|se|le|les|nos|es|no|tan|más|muy|sin|como|cuando|hasta|desde|sobre|entre|hacia|ante|tras|ni|pero|si)$/i;

const SPANISH_KEY_RE = /^(do|re|mi|fa|sol|la|si)\s*([#b♯♭]|sostenido|bemol)?\s*(mayor|menor)?$/i;

/** «D (Re Mayor)», «Am (La Menor)», «Tono: Sol», «Re menor»… → «Re», «Lam», «Sol», «Rem». */
export function parseKeyLine(line: string): string | null {
  const t = line.trim().replace(/^(tono|tonalidad|key)\s*:?\s*/i, '');
  if (!t || t.length > 30) return null;
  const paren = /\(([^)]+)\)/.exec(t)?.[1]?.trim();
  const head = t.replace(/\(.*\)/, '').trim();

  // Primero el nombre en español entre paréntesis (más explícito).
  for (const cand of [paren, head]) {
    if (!cand) continue;
    const m = SPANISH_KEY_RE.exec(cand);
    if (m) {
      const acc = m[2] ? (/^(#|♯|sostenido)$/i.test(m[2]) ? '#' : 'b') : '';
      const root = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
      const k = parseKey(root + acc + (m[3] && /menor/i.test(m[3]) ? 'm' : ''));
      if (k) return keyName(k, 'es');
    }
  }
  // Si no, un acorde suelto: «D», «Am», «F#m», «Sib».
  if (head && /^\S+$/.test(head)) {
    const k = parseKey(head);
    if (k) return keyName(k, 'es');
  }
  return null;
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[   ]/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/​/g, '')
    // Canciones pegadas en la misma línea: «…confiaré. //.   06. Cristo…»
    .replace(new RegExp(`([.!?…»"”/])[ ]+(\\d{1,3})\\.[ ]+(?=[${UPPER}])`, 'g'), '$1\n$2. ');
}

/** Marcas de repetición: «//Texto» → «// Texto», «texto//.» → «texto //». */
function tidyRepeats(line: string): string {
  return line
    .replace(/^\/\/\s*/, '// ')
    .replace(/\s*\/\/\s*\.?\s*$/, ' //')
    .replace(/^\/\/ \/\/$/, '//');
}

/** Evita que el texto se interprete como acordes o directivas. */
function escapeLyric(line: string): string {
  let l = line.replace(/\[/g, '(').replace(/\]/g, ')').replace(/\{/g, '(').replace(/\}/g, ')');
  if (l.startsWith('#')) l = '\u200b' + l; // espacio de ancho cero: trim() no lo elimina
  return l;
}

function startsLowercase(line: string): boolean {
  return /^[a-záéíóúüñ]/.test(line.trim());
}

interface Section {
  kind: 'verse' | 'chorus' | 'label' | 'none';
  label?: string;
  lines: string[];
}

function formatBody(lines: string[]): string {
  const sections: Section[] = [{ kind: 'none', lines: [] }];
  let verseCount = 0;
  const current = () => sections[sections.length - 1];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      // Línea en blanco: separa estrofas si ya hay texto.
      if (current().lines.length) sections.push({ kind: 'none', lines: [] });
      continue;
    }
    if (PAGE_NUMBER_RE.test(line)) continue;

    const roman = ROMAN_RE.exec(line);
    if (roman) {
      verseCount = ROMAN[roman[1]];
      sections.push({ kind: 'verse', label: `Estrofa ${verseCount}`, lines: [] });
      continue;
    }
    const sec = SECTION_RE.exec(line);
    if (sec) {
      const word = sec[1].toLowerCase();
      const suffix = sec[2] ? ` ${sec[2].toUpperCase()}` : '';
      if (word === 'coro' || word === 'estribillo') {
        sections.push({ kind: 'chorus', label: `Coro${suffix}`, lines: [] });
      } else if (word === 'estrofa' || word === 'verso') {
        verseCount = sec[2] ? Number(sec[2]) || ROMAN[sec[2].toUpperCase()] || verseCount + 1 : verseCount + 1;
        sections.push({ kind: 'verse', label: `Estrofa ${verseCount}`, lines: [] });
      } else {
        const name = word.startsWith('intro') ? 'Introducción' : word.replace(/^pre-?coro$/, 'Precoro');
        sections.push({ kind: 'label', label: name[0].toUpperCase() + name.slice(1) + suffix, lines: [] });
      }
      continue;
    }

    const sect = current();
    const prev = sect.lines[sect.lines.length - 1];
    const join =
      prev !== undefined &&
      !isChordLine(prev) &&
      !isChordLine(line) &&
      (startsLowercase(line) || VOICE_END_RE.test(prev) || CONNECTOR_END_RE.test(prev) || /^[)\].,;:!?»”]/.test(line));
    if (join) sect.lines[sect.lines.length - 1] = `${prev} ${line}`.replace(/\s+/g, ' ');
    else sect.lines.push(line);
  }

  const blocks: string[] = [];
  for (const s of sections) {
    if (!s.lines.length) continue;
    const body = s.lines.map((l) => (isChordLine(l) ? l : escapeLyric(tidyRepeats(l)))).join('\n');
    if (s.kind === 'chorus') blocks.push(`{soc${s.label && s.label !== 'Coro' ? `: ${s.label}` : ''}}\n${body}\n{eoc}`);
    else if (s.label) blocks.push(`# ${s.label}\n${body}`);
    else blocks.push(body);
  }
  return chordsOverToInline(blocks.join('\n\n'));
}

/** Analiza el texto pegado y devuelve una o más canciones. */
export function parsePastedSongs(text: string): PastedSong[] {
  const lines = cleanText(text).split('\n');
  const chunks: Array<{ number?: string; title?: string; body: string[] }> = [];
  let cur: { number?: string; title?: string; body: string[] } | null = null;

  for (const line of lines) {
    const h = HEADER_RE.exec(line);
    // Encabezado «05. Título»: debe tener letras y no parecer un verso numerado largo.
    if (h && /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(h[2]) && h[2].length <= 80 && !/[.,;]$/.test(h[2])) {
      cur = { number: String(Number(h[1])), title: h[2].trim(), body: [] };
      chunks.push(cur);
      continue;
    }
    if (!cur) {
      cur = { body: [] };
      chunks.push(cur);
    }
    cur.body.push(line);
  }

  const songs: PastedSong[] = [];
  for (const c of chunks) {
    const body = [...c.body];
    while (body.length && !body[0].trim()) body.shift();
    let title = c.title;
    // Sin encabezado numerado: la primera línea es el título.
    if (!title && body.length) {
      const first = body.shift()!.trim();
      if (!first) continue;
      title = first.replace(/^t[ií]tulo\s*:\s*/i, '');
    }
    while (body.length && !body[0].trim()) body.shift();
    let key: string | undefined;
    if (body.length && parseKeyLine(body[0])) key = parseKeyLine(body.shift()!) ?? undefined;
    const lyrics = formatBody(body);
    if (!title || (!lyrics.trim() && !c.number)) continue;
    songs.push({ number: c.number, title, key, lyrics });
  }
  return songs;
}
