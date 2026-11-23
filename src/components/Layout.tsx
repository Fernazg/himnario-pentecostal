import { BookOpen, Heart, House, ListMusic, Settings, Tags } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cx } from './ui';
import { useLibrary } from '../state/library';
import { Splash } from './Splash';
import { UpdatePrompt } from './UpdatePrompt';

const NAV = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/himnario', label: 'Himnario', icon: BookOpen },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
  { to: '/listas', label: 'Listas', icon: ListMusic },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

function Logo() {
  return (
    <div className="flex items-center gap-3 px-3">
      <img src="/logo-libro.svg" alt="" className="h-7 w-auto" />
      <div className="leading-none">
        <div className="display text-[21px] text-on-deep">Himnario EA</div>
      </div>
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const songMode = pathname.startsWith('/cancion/');
  const { ready } = useLibrary();
  const navigate = useNavigate();
  // Atajo «/»: abre la búsqueda desde cualquier pantalla (salvo al escribir).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, [contenteditable]')) return;
      e.preventDefault();
      navigate('/himnario?buscar=1');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);
  if (!ready) return <Splash />;
  return (
    <div className="min-h-dvh md:flex">
      {/* Barra lateral en escritorio: el petróleo como estructura */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-deep px-3 pb-6 pt-7 text-on-deep md:flex lg:w-64">
        <Logo />
        <p className="eyebrow mt-8 px-3 pb-2 text-on-deep-muted">Navegación</p>
        <nav className="flex flex-col" aria-label="Principal">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'group relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium transition-colors',
                  isActive ? 'bg-white/[0.08] text-on-deep' : 'text-on-deep-muted hover:bg-white/[0.04] hover:text-on-deep',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cx('absolute left-0 top-2 bottom-2 w-[2px] rounded-full transition-colors', isActive ? 'bg-[#f0a074]' : 'bg-transparent')} />
                  <Icon size={19} strokeWidth={1.6} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-deep-line px-3 pt-4">
          <p className="eyebrow text-on-deep-muted">Creado por</p>
          <p className="mt-1 text-[13px] text-on-deep">Fernando Silva</p>
        </div>
      </aside>

      <main className={cx('min-w-0 flex-1', !songMode && 'bottom-nav-space md:pb-10')}>
        <Outlet />
      </main>

      {/* Navegación inferior en móviles */}
      {!songMode && (
        <nav aria-label="Principal" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/92 backdrop-blur-xl md:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-6">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'relative flex min-w-0 flex-col items-center gap-1 pb-2 pt-2.5 text-[10.5px] font-medium tracking-[-0.01em] transition-colors',
                    isActive ? 'text-accent' : 'text-faint',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cx('absolute top-0 h-[2px] w-7 rounded-b-full transition-colors', isActive ? 'bg-accent' : 'bg-transparent')} />
                    <Icon size={21} strokeWidth={isActive ? 1.9 : 1.5} />
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
