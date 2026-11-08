import { BookOpen, Heart, House, ListMusic, Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cx } from './ui';
import { UpdatePrompt } from './UpdatePrompt';

const NAV = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/himnario', label: 'Himnario', icon: BookOpen },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
  { to: '/listas', label: 'Listas', icon: ListMusic },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <img src="/favicon.svg" alt="" className="size-9 rounded-xl" />
      <div className="leading-tight">
        <div className="font-serif text-lg font-semibold">Himnario</div>
        <div className="text-xs text-muted">El Almendro</div>
      </div>
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const songMode = pathname.startsWith('/cancion/');
  return (
    <div className="min-h-dvh md:flex">
      {/* Barra lateral en escritorio */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-line bg-surface px-3 py-6 md:flex lg:w-64">
        <Logo />
        <nav className="flex flex-col gap-1" aria-label="Principal">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-3 text-xs text-muted">Creado por Fernando Silva</p>
      </aside>

      <main className={cx('min-w-0 flex-1', !songMode && 'bottom-nav-space md:pb-10')}>
        <Outlet />
      </main>

      {/* Navegación inferior en móviles */}
      {!songMode && (
        <nav
          aria-label="Principal"
          className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx('flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-medium', isActive ? 'text-accent' : 'text-muted')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cx('flex h-7 w-12 items-center justify-center rounded-full transition', isActive && 'bg-accent-soft')}>
                      <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
      <UpdatePrompt />
    </div>
  );
}
