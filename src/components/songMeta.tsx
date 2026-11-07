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

export function SongBadge({ song, size = 'md' }: { song: Song; size?: 'md' | 'lg' }) {
  const Icon = CATEGORY_ICON[song.category];
  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-center rounded-xl font-semibold tabular-nums',
        size === 'md' ? 'size-11 text-sm' : 'size-14 text-base',
      )}
      style={{ background: `color-mix(in srgb, ${categoryColor(song.category)} 14%, transparent)`, color: categoryColor(song.category) }}
      aria-hidden
    >
      {song.number ? song.number : <Icon size={size === 'md' ? 18 : 22} />}
    </div>
  );
}

export function SongRow({
  song,
  to,
  subtitle,
  trailing,
  onClick,
}: {
  song: Song;
  to?: string;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  const { favorites } = useLibrary();
  const { settings } = useSettings();
  const info = categoryInfo(song.category);
  const meta = [info.singular, song.key ? formatKey(song.key, settings.notation) : null, song.author].filter(Boolean).join(' · ');
  const body = (
    <>
      <SongBadge song={song} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{song.title}</span>
          {favorites.has(song.id) && <Heart size={13} className="shrink-0 fill-accent text-accent" aria-label="Favorita" />}
        </div>
        <div className="truncate text-sm text-muted">{subtitle ?? meta}</div>
      </div>
    </>
  );
  const rowClass = 'flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-surface-2 active:bg-surface-2';
  return (
    <li className="flex items-center gap-1 [content-visibility:auto] [contain-intrinsic-size:auto_60px]">
      {to ? (
        <Link to={to} className={rowClass}>
          {body}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={rowClass}>
          {body}
        </button>
      ) : (
        <div className={rowClass.replace(/hover:\S+|active:\S+/g, '')}>{body}</div>
      )}
      {trailing}
    </li>
  );
}
