import { ChevronRight, ClipboardPaste, Download, FilePlus2, Library, RotateCcw, ShieldCheck, Smartphone, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SharedHymnalSection } from '../components/SharedHymnal';
import { Button, ConfirmDialog, PageHeader, Segmented, Toggle } from '../components/ui';
import { useInstall } from '../hooks/useInstall';
import { downloadFile } from '../lib/share';
import { useLibrary } from '../state/library';
import { FONT_MAX, FONT_MIN, useSettings } from '../state/settings';
import { useToast } from '../state/toast';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-5 pt-8 first-of-type:pt-2 md:px-10">
      <h2 className="eyebrow border-b border-line pb-2.5 text-muted">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-4">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium tracking-[-0.01em]">{label}</div>
        {hint && <div className="mt-0.5 text-[13px] leading-relaxed text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function LinkRow({ to, icon, label, hint }: { to: string; icon: ReactNode; label: string; hint?: string }) {
  return (
    <Link to={to} className="group flex items-center gap-4 py-4">
      <span className="text-accent [&_svg]:stroke-[1.6]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium tracking-[-0.01em] group-hover:text-accent">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] text-muted">{hint}</span>}
      </span>
      <ChevronRight size={17} strokeWidth={1.6} className="text-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function Settings() {
  const { settings, update, reset } = useSettings();
  const { songs, lists, favorites, exportBackup, importBackup, restoreCatalog } = useLibrary();
  const toast = useToast();
  const install = useInstall();
  const fileRef = useRef<HTMLInputElement>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const onExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(`himnario-respaldo-${date}.json`, JSON.stringify(exportBackup(), null, 2));
    toast('Respaldo descargado');
  };

  const onImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const r = await importBackup(data);
      toast(`Importado: ${r.songs} canciones, ${r.lists} listas, ${r.favorites} favoritos`);
    } catch (e) {
      toast(e instanceof SyntaxError ? 'El archivo no es un JSON válido' : (e as Error).message);
    }
  };

  const onPersist = async () => {
    const ok = await navigator.storage?.persist?.();
    setPersisted(!!ok);
    toast(ok ? 'Datos protegidos en este dispositivo' : 'El navegador no concedió el almacenamiento persistente');
  };

  return (
    <div className="pt-safe mx-auto max-w-3xl pb-6">
      <PageHeader eyebrow="Preferencias" title="Ajustes" />

      <Section title="Apariencia">
        <Row label="Tema">
          <Segmented
            label="Tema"
            value={settings.theme}
            onChange={(theme) => update({ theme })}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ]}
          />
        </Row>
        <Row label="Tipografía de la letra">
          <Segmented
            label="Tipografía"
            value={settings.lyricsFont}
            onChange={(lyricsFont) => update({ lyricsFont })}
            options={[
              { value: 'serif', label: <span className="font-serif">Clásica</span> },
              { value: 'sans', label: <span className="font-sans">Moderna</span> },
            ]}
          />
        </Row>
        <div className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium">Tamaño de letra</span>
            <span className="num text-[13px] text-muted">{settings.fontSize} px</span>
          </div>
          <input
            type="range"
            min={FONT_MIN}
            max={FONT_MAX}
            step={1}
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="mt-3 w-full accent-[var(--accent)]"
            aria-label="Tamaño de letra"
          />
          <p className={settings.lyricsFont === 'serif' ? 'mt-3 font-serif' : 'mt-3'} style={{ fontSize: settings.fontSize }}>
            Cantad alegres al Señor
          </p>
        </div>
      </Section>

      <Section title="Acordes">
        <Row label="Notación" hint={settings.notation === 'es' ? 'Do, Re, Mi, Fa, Sol, La, Si' : 'C, D, E, F, G, A, B'}>
          <Segmented
            label="Notación"
            value={settings.notation}
            onChange={(notation) => update({ notation })}
            options={[
              { value: 'es', label: 'Española' },
              { value: 'en', label: 'Internacional' },
            ]}
          />
        </Row>
        <Row label="Mostrar acordes" hint="Desactívelo para ver solo la letra">
          <Toggle label="Mostrar acordes" checked={settings.showChords} onChange={(showChords) => update({ showChords })} />
        </Row>
        <Row label="Mantener pantalla encendida" hint="Mientras una canción está abierta">
          <Toggle label="Mantener pantalla encendida" checked={settings.keepAwake} onChange={(keepAwake) => update({ keepAwake })} />
        </Row>
      </Section>

      <SharedHymnalSection Section={Section} Row={Row} />

      <Section title="Administración">
        <LinkRow to="/ajustes/canciones" icon={<Library size={20} />} label="Administrar canciones" hint={`${songs.length} canciones en el himnario`} />
        <LinkRow to="/editar/nueva" icon={<FilePlus2 size={20} />} label="Agregar canción" hint="Letra, acordes y datos" />
        <LinkRow to="/editar/nueva?pegar=1" icon={<ClipboardPaste size={20} />} label="Pegar desde documento" hint="Una o varias canciones copiadas de un PDF o Word" />
      </Section>

      <Section title="Datos y respaldo">
        <Row label="Exportar respaldo" hint={`${songs.length} canciones · ${lists.length} listas · ${favorites.size} favoritos`}>
          <Button onClick={onExport}>
            <Download size={16} /> Exportar
          </Button>
        </Row>
        <Row label="Importar canciones" hint="Archivo JSON de respaldo o de canciones">
          <Button onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Importar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = '';
            }}
          />
        </Row>
        <Row
          label="Proteger datos sin conexión"
          hint={persisted ? 'Activado: el navegador no borrará sus datos' : 'Evita que el navegador libere el almacenamiento'}
        >
          {persisted ? (
            <ShieldCheck size={22} className="text-accent" aria-label="Activado" />
          ) : (
            <Button onClick={onPersist} disabled={!navigator.storage?.persist}>
              Activar
            </Button>
          )}
        </Row>
        <Row label="Restaurar himnario incluido" hint="Vuelve a agregar los himnos, alabanzas y coros que haya eliminado; no modifica los que editó">
          <Button
            onClick={async () => {
              const n = await restoreCatalog();
              toast(n ? `${n} canciones restauradas` : 'El himnario ya está completo');
            }}
          >
            Restaurar
          </Button>
        </Row>
        <Row label="Restablecer preferencias" hint="Tema, notación, tamaño y tonos guardados">
          <Button onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Restablecer
          </Button>
        </Row>
      </Section>

      <Section title="Aplicación">
        <Row
          label="Instalar en este dispositivo"
          hint={
            install.installed
              ? 'La aplicación ya está instalada'
              : install.ios
                ? 'En Safari: toque Compartir y luego «Agregar a pantalla de inicio»'
                : install.canPrompt
                  ? 'Acceso directo y uso sin conexión'
                  : 'Use la opción «Instalar aplicación» del menú del navegador'
          }
        >
          {!install.installed && install.canPrompt && (
            <Button
              variant="primary"
              onClick={async () => {
                if (await install.prompt()) toast('Himnario instalado');
              }}
            >
              <Smartphone size={16} /> Instalar
            </Button>
          )}
        </Row>
        <Row label="Himnario EA" hint={`Versión ${__APP_VERSION__} · Funciona sin conexión`} />
        <Row label="Creado por" hint="Fernando Silva">
          <span className="display text-[22px] italic text-accent">FS</span>
        </Row>
      </Section>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="¿Restablecer preferencias?"
        message="Se restaurarán los ajustes de apariencia y acordes, y se olvidarán los tonos transpuestos. Sus canciones, favoritos y listas no se modifican."
        confirmLabel="Restablecer"
        onConfirm={() => {
          reset();
          toast('Preferencias restablecidas');
        }}
      />
    </div>
  );
}
