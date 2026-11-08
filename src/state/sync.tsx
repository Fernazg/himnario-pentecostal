import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { syncEnabled } from '../data/sync/config';
import type { ListRow, SongRow } from '../data/sync/remote';
import { useLibrary, type LocalChange } from './library';
import { useToast } from './toast';

/**
 * Sincronización con el himnario compartido.
 * - Todos descargan los cambios (al abrir, al volver la conexión y cada 5 min).
 * - Solo los administradores publican: sus cambios se envían al instante o se
 *   guardan en una cola mientras no haya conexión.
 * La app funciona igual sin conexión: IndexedDB sigue siendo la fuente local.
 */

type QueueItem =
  | { kind: 'song'; id: string; row: SongRow }
  | { kind: 'songDelete'; id: string; at: number }
  | { kind: 'list'; id: string; row: ListRow };

const QUEUE_KEY = 'himnario.syncQueue';
const PULL_EVERY = 5 * 60_000;

const loadQueue = (): QueueItem[] => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
};
const saveQueue = (q: QueueItem[]) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'offline' | 'error';

interface SyncCtx {
  enabled: boolean;
  status: SyncStatus;
  lastSync: number | null;
  error: string | null;
  pending: number;
  user: User | null;
  isAdmin: boolean;
  syncNow: () => Promise<number>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<'confirm' | 'ok'>;
  resetPassword: (email: string) => Promise<void>;
  /** Verdadero tras abrir el enlace de "olvidé mi contraseña". */
  recovering: boolean;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SyncCtx | null>(null);

const remote = () => import('../data/sync/remote');

function friendlyAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(msg)) return 'Falta confirmar el correo: abra el enlace que le enviamos.';
  if (/already registered/i.test(msg)) return 'Ese correo ya tiene cuenta. Use «Ingresar».';
  if (/password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 8 caracteres.';
  if (/rate limit|too many/i.test(msg)) return 'Demasiados intentos. Espere unos minutos.';
  if (/failed to fetch|network/i.test(msg)) return 'Sin conexión a internet.';
  return msg;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { ready, repo, applyRemote, onLocalChange } = useLibrary();
  const toast = useToast();
  const enabled = syncEnabled();
  const [status, setStatus] = useState<SyncStatus>(enabled ? 'idle' : 'disabled');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(() => loadQueue().length);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const running = useRef<Promise<number> | null>(null);
  const adminRef = useRef(false);
  adminRef.current = isAdmin;

  // Sesión de administrador.
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let unsub: (() => void) | undefined;
    remote().then(async ({ supabase, checkIsAdmin }) => {
      const { data } = await supabase().auth.getSession();
      if (!alive) return;
      const update = async (u: User | null) => {
        setUser(u);
        setIsAdmin(u ? await checkIsAdmin() : false);
      };
      await update(data.session?.user ?? null);
      const { data: sub } = supabase().auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') setRecovering(true);
        void update(session?.user ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, [enabled]);

  const flush = useCallback(async () => {
    let queue = loadQueue();
    if (!queue.length || !adminRef.current) return;
    const { upsertSongs, upsertLists, supabase } = await remote();
    const songs = queue.filter((q): q is Extract<QueueItem, { kind: 'song' }> => q.kind === 'song');
    const lists = queue.filter((q): q is Extract<QueueItem, { kind: 'list' }> => q.kind === 'list');
    const dels = queue.filter((q): q is Extract<QueueItem, { kind: 'songDelete' }> => q.kind === 'songDelete');
    await upsertSongs(songs.map((q) => q.row));
    await upsertLists(lists.map((q) => q.row));
    for (const d of dels) {
      const { error: e } = await supabase().from('songs').update({ deleted: true, updated_at: d.at }).eq('id', d.id);
      if (e) throw new Error(e.message);
    }
    // Conserva lo que se haya encolado mientras se enviaba.
    const sent = new Set(queue.map((q) => JSON.stringify(q)));
    queue = loadQueue().filter((q) => !sent.has(JSON.stringify(q)));
    saveQueue(queue);
    setPending(queue.length);
  }, []);

  const syncNow = useCallback(async (): Promise<number> => {
    if (!enabled || !ready) return 0;
    if (running.current) return running.current;
    if (!navigator.onLine) {
      setStatus('offline');
      return 0;
    }
    const run = (async () => {
      setStatus('syncing');
      try {
        await flush();
        const { pullChanges } = await remote();
        const since = (await repo.getMeta<number>('syncCursor')) ?? 0;
        const { changes, cursor } = await pullChanges(since);
        const applied = await applyRemote(changes);
        await repo.setMeta('syncCursor', cursor);
        setLastSync(Date.now());
        setError(null);
        setStatus('idle');
        if (applied && since > 0) toast(`Himnario actualizado: ${applied} ${applied === 1 ? 'cambio' : 'cambios'}`);
        return applied;
      } catch (e) {
        const msg = friendlyAuthError((e as Error).message);
        setError(msg);
        setStatus(navigator.onLine ? 'error' : 'offline');
        return 0;
      } finally {
        running.current = null;
      }
    })();
    running.current = run;
    return run;
  }, [enabled, ready, flush, repo, applyRemote, toast]);

  // Cambios locales de administradores → cola de publicación.
  useEffect(() => {
    if (!enabled) return;
    return onLocalChange((c: LocalChange) => {
      if (!adminRef.current) return;
      void remote().then(({ songToRow, listToRow }) => {
        let item: QueueItem | null = null;
        if (c.type === 'song') item = { kind: 'song', id: c.song.id, row: songToRow(c.song) };
        else if (c.type === 'songDeleted') item = { kind: 'songDelete', id: c.id, at: Date.now() };
        else if (c.type === 'list' && c.list.shared) item = { kind: 'list', id: c.list.id, row: listToRow(c.list) };
        else if (c.type === 'listDeleted' && c.list.shared)
          item = { kind: 'list', id: c.list.id, row: listToRow({ ...c.list, updatedAt: Date.now() }, true) };
        if (!item) return;
        const q = loadQueue().filter((x) => !(x.kind === item!.kind && x.id === item!.id));
        q.push(item);
        saveQueue(q);
        setPending(q.length);
        void syncNow();
      });
    });
  }, [enabled, onLocalChange, syncNow]);

  // Disparadores: al iniciar, al iniciar sesión, al volver la conexión, al volver a la app y cada 5 min.
  useEffect(() => {
    if (!enabled || !ready) return;
    void syncNow();
    const onOnline = () => void syncNow();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncNow();
    };
    const timer = window.setInterval(() => document.visibilityState === 'visible' && void syncNow(), PULL_EVERY);
    const onOffline = () => setStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, ready, syncNow, isAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { supabase } = await remote();
    const { error: e } = await supabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (e) throw new Error(friendlyAuthError(e.message));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { supabase } = await remote();
    const { data, error: e } = await supabase().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: `${location.origin}/ajustes` },
    });
    if (e) throw new Error(friendlyAuthError(e.message));
    return data.session ? 'ok' : 'confirm';
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { supabase } = await remote();
    const { error: e } = await supabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${location.origin}/ajustes?clave=nueva`,
    });
    if (e) throw new Error(friendlyAuthError(e.message));
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { supabase } = await remote();
    const { error: e } = await supabase().auth.updateUser({ password });
    if (e) throw new Error(friendlyAuthError(e.message));
    setRecovering(false);
  }, []);

  const signOut = useCallback(async () => {
    const { supabase } = await remote();
    await supabase().auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ enabled, status, lastSync, error, pending, user, isAdmin, syncNow, signIn, signUp, resetPassword, recovering, updatePassword, signOut }),
    [enabled, status, lastSync, error, pending, user, isAdmin, syncNow, signIn, signUp, resetPassword, recovering, updatePassword, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSync() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSync fuera de SyncProvider');
  return c;
}
