import { BookOpen, Flame, MicVocal, type LucideIcon } from 'lucide-react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { categoryInfo, type Category, type Song } from '../data/types';
import { formatKey } from '../lib/chords';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { cx } from './ui';

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  himnos: BookOpen,
  alabanzas: MicVocal,
  coros: Flame,
};

export const categoryColor = (c: Category) => `var(--cat-${c})`;

/** Índice de la canción: número en mono (o el ícono de su tipo si no tiene número). */
export function SongBadge({ song, size = 'md' }: { song: Song; size?: 'md' | 'lg' }) {
  const Icon = CATEGORY_ICON[song.category];
  return (
    <div
      className={cx('num flex shrink-0 items-start justify-start pt-[3px] text-faint', size === 'md' ? 'w-10 text-[13px]' : 'w-12 text-[15px]')}
      aria-hidden
    >
      {song.number ? song.number.padStart(3, '0') : <Icon size={size === 'md' ? 15 : 18} strokeWidth={1.5} className="mt-[2px]" />}
    </div>
  );
}

export function SongRow({
  song,
  to,
  subtitle,
  trailing,
  onClick,
  showCategory = true,
}: {
  song: Song;
  to?: string;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  /** En listas ya agrupadas por colección, la colección no se repite en cada fila. */
  showCategory?: boolean;
}) {
  const { favorites } = useLibrary();
  const { settings } = useSettings();
  const info = categoryInfo(song.category);
  const meta = [showCategory ? info.singular : null, song.key ? `Tono ${formatKey(song.key, settings.notation)}` : null, song.author]
    .filter(Boolean)
    .join(' · ');
  const second = subtitle ?? meta;
  const body = (
    <>
      <SongBadge song={song} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[16px] font-medium tracking-[-0.01em]">{song.title}</span>
          {favorites.has(song.id) && <Heart size={12} className="shrink-0 fill-chord text-chord" aria-label="Favorita" />}
        </div>
        {second && (
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
            {showCategory && <span className="size-1.5 shrink-0 rounded-full" style={{ background: categoryColor(song.category) }} aria-hidden />}
            <span className="truncate">{second}</span>
          </div>
        )}
      </div>
    </>
  );
  const rowClass = 'flex min-w-0 flex-1 items-start gap-3 py-3.5 text-left transition-colors';
  return (
    <li className="group flex items-center gap-1 border-b border-line px-5 [content-visibility:auto] [contain-intrinsic-size:auto_68px] last:border-b-0 hover:bg-surface-2/60 md:px-10">
      {to ? (
        <Link to={to} className={rowClass}>
          {body}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={rowClass}>
          {body}
        </button>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
      {trailing}
    </li>
  );
}
