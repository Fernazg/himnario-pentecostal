import { CloudCheck, CloudOff, LogIn, LogOut, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useSync } from '../state/sync';
import { useToast } from '../state/toast';
import { Button, Field, Segmented, Sheet, inputClass } from './ui';

function timeAgo(t: number | null) {
  if (!t) return 'aún no';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return new Date(t).toLocaleString('es', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
}

function AuthSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp, resetPassword } = useSync();
  const toast = useToast();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (open) {
      setMsg(null);
      setPassword('');
    }
  }, [open]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || password.length < 8) {
      setMsg({ kind: 'error', text: 'Escriba su correo y una contraseña de al menos 8 caracteres.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'in') {
        await signIn(email, password);
        toast('Sesión iniciada');
        onClose();
      } else {
        const r = await signUp(email, password);
        if (r === 'ok') {
          toast('Cuenta creada');
          onClose();
        } else {
          setMsg({
            kind: 'info',
            text: 'Le enviamos un correo de confirmación. Abra el enlace y luego vuelva aquí y pulse «Ingresar». Revise también la carpeta de spam.',
          });
          setMode('in');
        }
      }
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setMsg({ kind: 'error', text: 'Escriba primero su correo.' });
      return;
    }
    try {
      await resetPassword(email);
      setMsg({ kind: 'info', text: 'Le enviamos un correo para crear una nueva contraseña.' });
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message });
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Acceso de administradores"
      footer={
        <Button variant="primary" className="w-full" onClick={() => submit()} disabled={busy}>
          {busy ? 'Un momento…' : mode === 'in' ? 'Ingresar' : 'Crear cuenta'}
        </Button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">
          Solo los administradores pueden publicar cambios para toda la iglesia. Los demás pueden usar el himnario sin cuenta.
        </p>
        <Segmented
          label="Modo"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setMsg(null);
          }}
          options={[
            { value: 'in', label: 'Ingresar' },
            { value: 'up', label: 'Crear cuenta' },
          ]}
        />
        <Field label="Correo">
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
          />
        </Field>
        <Field label="Contraseña" hint={mode === 'up' ? 'Mínimo 8 caracteres' : undefined}>
          <input
            className={inputClass}
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {msg && (
          <p className={msg.kind === 'error' ? 'text-sm text-red-700 dark:text-red-400' : 'rounded-xl bg-accent-soft p-3 text-sm'}>
            {msg.text}
          </p>
        )}
        {mode === 'in' && (
          <button type="button" onClick={forgot} className="text-sm font-medium text-accent">
            Olvidé mi contraseña
          </button>
        )}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

function NewPasswordSheet() {
  const { recovering, updatePassword } = useSync();
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet
      open={recovering}
      onClose={() => {}}
      title="Nueva contraseña"
      footer={
        <Button
          variant="primary"
          className="w-full"
          onClick={async () => {
            if (pw.length < 8) return setErr('Mínimo 8 caracteres.');
            try {
              await updatePassword(pw);
              toast('Contraseña actualizada');
            } catch (e) {
              setErr((e as Error).message);
            }
          }}
        >
          Guardar contraseña
        </Button>
      }
    >
      <Field label="Escriba su nueva contraseña">
        <input className={inputClass} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </Field>
      {err && <p className="mt-2 text-sm text-red-700 dark:text-red-400">{err}</p>}
    </Sheet>
  );
}

export function SharedHymnalSection({ Section, Row }: { Section: React.FC<{ title: string; children: React.ReactNode }>; Row: React.FC<{ label: string; hint?: React.ReactNode; children?: React.ReactNode }> }) {
  const sync = useSync();
  const toast = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);

  if (!sync.enabled) return null;

  const statusText =
    sync.status === 'syncing'
      ? 'Sincronizando…'
      : sync.status === 'offline'
        ? 'Sin conexión: se actualizará al volver internet'
        : sync.status === 'error'
          ? `No se pudo sincronizar: ${sync.error}`
          : `Actualizado ${timeAgo(sync.lastSync)}`;
  const StatusIcon = sync.status === 'offline' ? CloudOff : sync.status === 'error' ? TriangleAlert : CloudCheck;

  return (
    <>
      <Section title="Himnario compartido">
        <Row
          label="Sincronización"
          hint={
            <span className="inline-flex items-start gap-1.5">
              <StatusIcon size={15} className="mt-0.5 shrink-0" />
              <span>
                {statusText}
                {sync.pending > 0 && ` · ${sync.pending} cambio(s) por publicar`}
              </span>
            </span>
          }
        >
          <Button
            onClick={async () => {
              const n = await sync.syncNow();
              toast(n ? `${n} cambios recibidos` : 'El himnario está al día');
            }}
            disabled={sync.status === 'syncing'}
          >
            <RefreshCw size={16} className={sync.status === 'syncing' ? 'animate-spin' : ''} /> Sincronizar
          </Button>
        </Row>
        {sync.user ? (
          <Row
            label={sync.user.email ?? 'Sesión iniciada'}
            hint={
              sync.isAdmin ? (
                <span className="inline-flex items-center gap-1 text-accent">
                  <ShieldCheck size={15} /> Administrador: sus cambios se publican para toda la iglesia
                </span>
              ) : (
                'Esta cuenta no tiene permisos de administrador. Pida al responsable que la agregue.'
              )
            }
          >
            <Button
              onClick={async () => {
                await sync.signOut();
                toast('Sesión cerrada');
              }}
            >
              <LogOut size={16} /> Salir
            </Button>
          </Row>
        ) : (
          <Row label="Administradores" hint="Inicie sesión para publicar himnos y listas de culto para todos">
            <Button onClick={() => setAuthOpen(true)}>
              <LogIn size={16} /> Ingresar
            </Button>
          </Row>
        )}
      </Section>
      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
      <NewPasswordSheet />
    </>
  );
}
