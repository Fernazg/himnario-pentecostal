export type Category = 'himnos' | 'alabanzas' | 'coros';

export const CATEGORIES: ReadonlyArray<{ id: Category; label: string; singular: string; description: string }> = [
  { id: 'himnos', label: 'Himnos', singular: 'Himno', description: 'Himnos tradicionales de la fe' },
  { id: 'alabanzas', label: 'Alabanzas especiales', singular: 'Alabanza especial', description: 'Para ministraciones y ocasiones especiales' },
  { id: 'coros', label: 'Coros pentecostales', singular: 'Coro pentecostal', description: 'Coros de júbilo y adoración' },
];

export const categoryInfo = (id: Category) => CATEGORIES.find((c) => c.id === id)!;

export interface Song {
  id: string;
  title: string;
  /** Número opcional dentro del himnario (texto para admitir "12A"). */
  number?: string;
  category: Category;
  /** Letra con acordes en formato [Acorde]sílaba. */
  lyrics: string;
  author?: string;
  composer?: string;
  /** Tonalidad original, p. ej. "Sol" o "Lam". */
  key?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type SongInput = Omit<Song, 'id' | 'createdAt' | 'updatedAt'>;

export type ListKind = 'personal' | 'culto';

export interface SongList {
  id: string;
  name: string;
  kind: ListKind;
  /** Fecha del culto o reunión (YYYY-MM-DD). */
  date?: string;
  description?: string;
  songIds: string[];
  /** Lista de culto publicada para toda la iglesia (sincronizada). */
  shared?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Favorite {
  songId: string;
  addedAt: number;
}

export interface RecentView {
  songId: string;
  viewedAt: number;
}

export interface BackupFile {
  app: 'himnario-pentecostal';
  version: 1;
  exportedAt: string;
  songs: Song[];
  lists?: SongList[];
  favorites?: Favorite[];
}
