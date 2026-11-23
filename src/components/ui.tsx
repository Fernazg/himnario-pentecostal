/**
 * Componentes base del sistema de diseño «Edición».
 * Radios contenidos (8–10 px), líneas finas en lugar de sombras, petróleo
 * como color de acción y tipografía editorial para los títulos.
 */
import { X } from 'lucide-react';
import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from 'react';

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'secondary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-medium tracking-[-0.005em] transition-colors duration-150 active:translate-y-px disabled:opacity-40 disabled:active:translate-y-0 [&_svg]:stroke-[1.75]',
        variant === 'primary' && 'bg-accent text-on-accent hover:bg-accent-strong',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:border-faint',
        variant === 'ghost' && 'text-ink hover:bg-surface-2',
        variant === 'danger' && 'bg-[#a3302a] text-white hover:bg-[#8a2823] dark:bg-[#e0786f] dark:text-[#1a0a09]',
        className,
      )}
    />
  );
}

export function IconButton({
  label,
  className,
  active,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-150 disabled:opacity-30 [&_svg]:stroke-[1.75]',
        active ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-surface-2',
        className,
      )}
    />
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className="animate-fade absolute inset-0 bg-[#061216]/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet relative flex max-h-[88dvh] w-full flex-col rounded-t-2xl border-t border-line bg-surface sm:max-w-lg sm:rounded-2xl sm:border">
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-2 border-b border-line px-5 pb-3 pt-2 sm:pt-3">
          <h2 id={id} className="display text-[22px] leading-tight">
            {title}
          </h2>
          <IconButton label="Cerrar" onClick={onClose} className="-mr-2">
            <X size={20} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="pb-safe border-t border-line px-5 py-3">{footer}</div>}
        {!footer && <div className="pb-safe" />}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-[15px] leading-relaxed text-muted">{message}</p>
    </Sheet>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start px-5 py-14 md:px-10">
      <div className="mb-5 text-faint [&_svg]:size-8 [&_svg]:stroke-[1.25]">{icon}</div>
      <h3 className="display text-[26px] leading-tight">{title}</h3>
      {children && <div className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pb-5 pt-8 md:px-10 md:pb-7 md:pt-12">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2.5 text-muted">{eyebrow}</p>}
        <h1 className="display text-[40px] leading-[1.02] md:text-[54px]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}

/** Encabezado de sección: etiqueta en versalitas mono con línea fina. */
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
      <h2 className="eyebrow text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[16px] text-ink placeholder:text-faint transition-shadow focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[10px] border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-h-9 rounded-[8px] px-3.5 text-[13px] font-medium transition-colors',
            value === o.value ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--border)]' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Filtros como pestañas de texto con subrayado (en lugar de píldoras). */
export function Tabs<T extends string | null>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: ReactNode; count?: number }>;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="tab"
            aria-selected={on}
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cx(
              '-mb-px shrink-0 border-b-2 pb-2.5 pt-1 text-[14px] font-medium transition-colors',
              on ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {o.label}
            {o.count !== undefined && <span className="num ml-1.5 text-[12px] text-faint">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line')}
    >
      <span className={cx('absolute top-0.5 size-5 rounded-full bg-white transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
    </button>
  );
}
