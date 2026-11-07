import { memo, useMemo } from 'react';
import { transposeChord, type Notation } from '../lib/chords';
import { parseSongText, type Segment, type SongLine } from '../lib/songText';
import { cx } from './ui';

interface Props {
  lyrics: string;
  steps: number;
  notation: Notation;
  preferFlats: boolean;
  showChords: boolean;
  fontSize: number;
  font: 'serif' | 'sans';
}

/**
 * Divide los segmentos para que la letra pueda saltar de línea entre palabras
 * manteniendo cada acorde pegado a su sílaba.
 */
function splitForWrap(segments: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const s of segments) {
    const parts = s.text.split(/(?<=\s)(?=\S)/);
    out.push({ chord: s.chord, text: parts[0] ?? '' });
    for (let i = 1; i < parts.length; i++) out.push({ text: parts[i] });
  }
  return out;
}

type Block = { chorus: boolean; lines: SongLine[] };

function toBlocks(lines: SongLine[]): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  for (const l of lines) {
    if (l.kind === 'empty') {
      cur = null;
      continue;
    }
    const chorus = l.chorus;
    if (!cur || cur.chorus !== chorus || (l.kind === 'section' && cur.lines.length)) {
      cur = { chorus, lines: [] };
      blocks.push(cur);
    }
    cur.lines.push(l);
  }
  return blocks;
}

export const SongView = memo(function SongView({ lyrics, steps, notation, preferFlats, showChords, fontSize, font }: Props) {
  const blocks = useMemo(() => toBlocks(parseSongText(lyrics)), [lyrics]);
  const tr = (c: string) => transposeChord(c, steps, notation, preferFlats);

  if (!lyrics.trim()) {
    return <p className="text-muted">Esta canción todavía no tiene letra.</p>;
  }

  return (
    <div className={cx('space-y-[1.1em]', font === 'serif' ? 'font-serif' : 'font-sans')} style={{ fontSize }}>
      {blocks.map((block, bi) => (
        <section key={bi} className={cx('stanza', block.chorus && 'border-l-[3px] border-gold/60 pl-[0.8em]')}>
          {block.lines.map((line, li) => {
            if (line.kind === 'section')
              return (
                <h3 key={li} className="mb-[0.3em] font-sans text-[0.68em] font-semibold uppercase tracking-[0.12em] text-muted">
                  {line.label}
                </h3>
              );
            if (line.kind === 'comment')
              return (
                <p key={li} className="font-sans text-[0.75em] italic text-muted">
                  {line.text}
                </p>
              );
            if (line.kind !== 'lyric') return null;
            const hasChords = line.segments.some((s) => s.chord);
            const hasText = line.segments.some((s) => s.text.trim());
            if (!showChords || !hasChords) {
              if (!hasText) return null;
              return (
                <p key={li} className="leading-[1.45]">
                  {line.segments.map((s) => s.text).join('')}
                </p>
              );
            }
            if (!hasText) {
              // Línea solo de acordes (introducción, interludio).
              return (
                <p key={li} className="song-chord flex flex-wrap gap-x-[0.9em] text-[0.82em]">
                  {line.segments.filter((s) => s.chord).map((s, i) => (
                    <span key={i}>{tr(s.chord!)}</span>
                  ))}
                </p>
              );
            }
            return (
              <div key={li} className="song-line mb-[0.15em]">
                {splitForWrap(line.segments).map((s, si) => (
                  <span key={si} className="song-seg">
                    <span className="song-chord">{s.chord ? tr(s.chord) : ''}</span>
                    <span>{s.text}</span>
                  </span>
                ))}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
});
