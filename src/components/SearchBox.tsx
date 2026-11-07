import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';

export const SearchBox = forwardRef<HTMLInputElement, { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }>(
  function SearchBox({ value, onChange, placeholder = 'Título, número, letra o autor', autoFocus }, ref) {
    return (
      <div className="relative">
        <Search size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
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
          className="w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-11 text-base placeholder:text-muted/80 focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
          >
            <X size={17} />
          </button>
        )}
      </div>
    );
  },
);
