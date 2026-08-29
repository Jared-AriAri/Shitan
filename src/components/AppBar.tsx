import { useState } from 'react';
import type { ReactNode } from 'react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  transparent?: boolean;
  rightContent?: ReactNode;
  onProfileClick?: () => void;
  onLoginClick?: () => void;
  onLoggedOut?: () => void;
}

function Icon({
  type,
  size = 18,
}: {
  type: 'back' | 'login' | 'logout' | 'chevron' | 'shield';
  size?: number;
}) {
  const paths = {
    back: <path d="M15 18l-6-6 6-6" />,
    login: (
      <>
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H8" />
        <path d="M11 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 8l-4 4 4 4" />
        <path d="M6 12h10" />
        <path d="M13 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
      </>
    ),
    chevron: <path d="m9 6 6 6-6 6" />,
    shield: (
      <>
        <path d="M12 3l7 3v5c0 4.5-2.7 8-7 10-4.3-2-7-5.5-7-10V6l7-3z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
}

const roles: Record<
  UserRole,
  { label: string; color: string; bg: string }
> = {
  donante: {
    label: 'Donante',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,.08)',
  },
  admin: {
    label: 'Administrador',
    color: '#C4A96B',
    bg: 'rgba(196,169,107,.10)',
  },
  adminmaster: {
    label: 'Admin Master',
    color: '#7DD3FC',
    bg: 'rgba(56,189,248,.10)',
  },
};

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function AppBar({
  title = 'Inicio',
  showBack = false,
  onBack,
  transparent = false,
  rightContent,
  onProfileClick,
  onLoginClick,
  onLoggedOut,
}: AppBarProps) {
  const {
    session,
    profile,
    role,
    loading,
    logout,
  } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

  const authenticated = Boolean(session?.user);

  const currentRole: UserRole =
    profile?.role || role || 'donante';

  const roleInfo = roles[currentRole];

  const displayName =
    profile?.full_name?.trim() ||
    session?.user.user_metadata?.nombre_completo?.trim() ||
    profile?.alias?.trim() ||
    session?.user.email?.split('@')[0] ||
    'Mi perfil';

  const alias =
    profile?.alias?.trim() ||
    session?.user.user_metadata?.alias?.trim() ||
    '';

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
      onLoggedOut?.();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      className={[
        'relative z-40 w-full',
        transparent
          ? 'bg-transparent'
          : 'bg-[#07101f]/95 backdrop-blur-xl',
      ].join(' ')}
    >
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1480px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[.04] text-slate-300 transition hover:bg-white/[.08] hover:text-white active:scale-95"
              aria-label="Volver"
            >
              <Icon type="back" size={19} />
            </button>
          )}

          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="Shitan Trust"
              className="h-12 w-12 shrink-0 object-contain md:h-14 md:w-14"
            />

            <div className="hidden min-w-0 sm:block">
              <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#C4A96B]">
                Shitan Trust
              </span>

              <h1 className="truncate text-sm font-bold text-slate-100 md:text-base">
                {title}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {rightContent}

          {!loading && !authenticated && (
            <button
              type="button"
              onClick={onLoginClick}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#C4A96B]/10 px-3.5 text-[#D8C58E] transition hover:bg-[#C4A96B]/15 active:scale-[.97]"
            >
              <Icon type="login" size={17} />

              <span className="text-xs font-semibold">
                Iniciar sesión
              </span>

              <Icon type="chevron" size={14} />
            </button>
          )}

          {!loading && authenticated && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onProfileClick}
                className="group flex h-[58px] min-w-0 items-center gap-3 rounded-2xl bg-white/[.035] px-3 transition-all hover:bg-white/[.06] active:scale-[.985]"
                aria-label={`Abrir perfil de ${displayName}`}
              >
                <span
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#08111f]"
                  style={{
                    background:
                      currentRole === 'adminmaster'
                        ? 'linear-gradient(135deg,#7DD3FC,#38BDF8)'
                        : 'linear-gradient(135deg,#D8C58E,#A98B50)',
                  }}
                >
                  {initials(displayName)}

                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#07101f] bg-emerald-400" />
                </span>

                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-[170px] truncate text-xs font-bold text-slate-100">
                    {displayName}
                  </span>

                  <span className="mt-1 flex items-center gap-1.5">
                    <span
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[.08em]"
                      style={{
                        color: roleInfo.color,
                        background: roleInfo.bg,
                      }}
                    >
                      <Icon type="shield" size={10} />
                      {roleInfo.label}
                    </span>

                    {alias && (
                      <span className="max-w-[110px] truncate text-[9px] text-slate-500">
                        @{alias}
                      </span>
                    )}
                  </span>
                </span>

                <span className="hidden text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-400 md:block">
                  <Icon type="chevron" size={15} />
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex h-[58px] items-center gap-2.5 rounded-2xl bg-rose-500/[.06] px-3.5 text-rose-300 transition hover:bg-rose-500/[.10] active:scale-[.97] disabled:opacity-50"
                aria-label="Cerrar sesión"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/[.09]">
                  <Icon type="logout" size={17} />
                </span>

                <span className="hidden text-left md:block">
                  <span className="block text-[8px] font-bold uppercase tracking-[.16em] text-rose-300/45">
                    Sesión
                  </span>

                  <span className="block text-xs font-semibold text-rose-300">
                    {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}