import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';

export const SearchBox = forwardRef<HTMLInputElement, { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }>(
  function SearchBox({ value, onChange, placeholder = 'Título, número, letra o autor', autoFocus }, ref) {
    return (
      <div className="relative">
        <Search size={18} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          ref={ref}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label="Buscar canciones"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[10px] border border-line bg-surface py-3 pl-11 pr-11 text-[16px] placeholder:text-faint transition-shadow focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-[8px] text-muted hover:bg-surface-2"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>
    );
  },
);
