import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { useToast } from '../state/toast';
import { Button } from './ui';

/** Registra el Service Worker y avisa cuando hay una nueva versión. */
export function UpdatePrompt() {
  const toast = useToast();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (offlineReady) {
      toast('Listo para usarse sin conexión');
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady, toast]);

  if (!needRefresh) return null;
  return (
    <div
      className="fixed inset-x-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-xl md:bottom-6"
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      role="alert"
    >
      <p className="flex-1 text-sm">Hay una nueva versión del himnario.</p>
      <Button variant="ghost" onClick={() => setNeedRefresh(false)}>
        Luego
      </Button>
      <Button variant="primary" onClick={() => updateServiceWorker(true)}>
        Actualizar
      </Button>
    </div>
  );
}
