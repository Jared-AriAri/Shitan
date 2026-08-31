import { useState } from 'react';

import type { ReactNode } from 'react';

import { UserRole } from '../types';

import { useAuth } from '../contexts/AuthContext';

interface AppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  transparent?: boolean;
  rightContent?: ReactNode;
  onProfileClick?: () => void;
  onLoginClick?: () => void;
  onLoggedOut?: () => void;
  onLogoClick?: () => void;
}

function Icon({
  type,
  size = 18,
}: {
  type:
  | 'back'
  | 'refresh'
  | 'login'
  | 'logout'
  | 'chevron'
  | 'shield';
  size?: number;
}) {
  const paths = {
    back: (
      <path d="M15 18l-6-6 6-6" />
    ),

    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.93-4" />
        <path d="M4 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.93 4" />
        <path d="M20 20v-5h-5" />
      </>
    ),

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

    chevron: (
      <path d="m9 6 6 6-6 6" />
    ),

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
      strokeWidth="1.8"
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
  {
    label: string;
    color: string;
    bg: string;
  }
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

function initials(
  value: string,
) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return 'U';
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function AppBar({
  title = 'Inicio',
  showBack = false,
  onBack,
  showRefresh = false,
  onRefresh,
  refreshing = false,
  transparent = false,
  rightContent,
  onProfileClick,
  onLoginClick,
  onLoggedOut,
  onLogoClick,
}: AppBarProps) {
  const {
    session,
    profile,
    role,
    loading,
    logout,
  } = useAuth();

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const authenticated =
    Boolean(
      session?.user,
    );

  const currentRole: UserRole =
    profile?.role ||
    role ||
    'donante';

  const roleInfo =
    roles[currentRole];

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

  const handleLogout =
    async () => {
      if (
        loggingOut
      ) {
        return;
      }

      try {
        setLoggingOut(
          true,
        );

        await logout();

        onLoggedOut?.();
      } finally {
        setLoggingOut(
          false,
        );
      }
    };

  const handleBack =
    () => {
      if (
        onBack
      ) {
        onBack();

        return;
      }

      if (
        typeof window !==
        'undefined' &&
        window.history.length >
        1
      ) {
        window.history.back();
      }
    };

  const handleRefresh =
    async () => {
      if (
        refreshing ||
        !onRefresh
      ) {
        return;
      }

      await onRefresh();
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
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1480px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {showBack && (
            <button
              type="button"
              onClick={
                handleBack
              }
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[.04] text-slate-300 transition-all duration-300 hover:-translate-x-0.5 hover:bg-white/[.08] hover:text-white active:scale-95"
              aria-label="Volver"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
                <Icon
                  type="back"
                  size={19}
                />
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={
              onLogoClick
            }
            className="group flex min-w-0 items-center gap-2.5 rounded-2xl text-left transition-all duration-300 active:scale-[0.98] sm:gap-3"
            aria-label="Ir al inicio"
          >
            <img
              src="/logo.png"
              alt="Shitan Trust"
              className="h-11 w-11 shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.04] sm:h-12 sm:w-12 md:h-14 md:w-14"
            />

            <div className="hidden min-w-0 sm:block">
              <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#C4A96B]">
                Shitan Trust
              </span>

              <h1 className="truncate text-sm font-bold text-slate-100 md:text-base">
                {title}
              </h1>
            </div>
          </button>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          {showRefresh &&
            onRefresh && (
              <button
                type="button"
                onClick={() =>
                  void handleRefresh()
                }
                disabled={
                  refreshing
                }
                className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.035] bg-white/[0.025] text-slate-400 transition-all duration-300 hover:border-white/[0.07] hover:bg-white/[0.055] hover:text-slate-100 active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                aria-label={
                  refreshing
                    ? 'Actualizando'
                    : 'Actualizar'
                }
              >
                <span
                  className={`flex items-center justify-center ${refreshing
                    ? 'animate-spin text-[#C4A96B]'
                    : 'transition-all duration-500 ease-out group-hover:rotate-[180deg]'
                    }`}
                >
                  <Icon
                    type="refresh"
                    size={18}
                  />
                </span>

                {!refreshing && (
                  <span className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-inset ring-white/[0.015] transition-all duration-300 group-hover:ring-white/[0.05]" />
                )}
              </button>
            )}

          {rightContent}

          {!loading &&
            !authenticated && (
              <button
                type="button"
                onClick={
                  onLoginClick
                }
                className="flex h-11 items-center gap-2 rounded-xl bg-[#C4A96B]/10 px-3 text-[#D8C58E] transition hover:bg-[#C4A96B]/15 active:scale-[.97] sm:px-3.5"
              >
                <Icon
                  type="login"
                  size={17}
                />

                <span className="whitespace-nowrap text-[10px] font-semibold sm:text-xs">
                  Iniciar sesión
                </span>

                <span className="hidden sm:inline-flex">
                  <Icon
                    type="chevron"
                    size={14}
                  />
                </span>
              </button>
            )}

          {!loading &&
            authenticated && (
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={
                    onProfileClick
                  }
                  className="group flex h-[54px] min-w-0 items-center gap-2 rounded-2xl bg-white/[.035] px-2 transition-all hover:bg-white/[.06] active:scale-[.985] sm:h-[58px] sm:gap-3 sm:px-3"
                  aria-label={`Abrir perfil de ${displayName}`}
                >
                  <span
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-[#08111f] sm:h-10 sm:w-10 sm:text-sm"
                    style={{
                      background:
                        currentRole ===
                          'adminmaster'
                          ? 'linear-gradient(135deg,#7DD3FC,#38BDF8)'
                          : 'linear-gradient(135deg,#D8C58E,#A98B50)',
                    }}
                  >
                    {initials(
                      displayName,
                    )}

                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#07101f] bg-emerald-400" />
                  </span>

                  <span className="hidden min-w-0 text-left sm:block">
                    <span className="block max-w-[170px] truncate text-xs font-bold text-slate-100">
                      {
                        displayName
                      }
                    </span>

                    <span className="mt-1 flex items-center gap-1.5">
                      <span
                        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[.08em]"
                        style={{
                          color:
                            roleInfo.color,
                          background:
                            roleInfo.bg,
                        }}
                      >
                        <Icon
                          type="shield"
                          size={10}
                        />

                        {
                          roleInfo.label
                        }
                      </span>

                      {alias && (
                        <span className="max-w-[110px] truncate text-[9px] text-slate-500">
                          @{alias}
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="hidden text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-400 md:block">
                    <Icon
                      type="chevron"
                      size={15}
                    />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loggingOut
                  }
                  className="flex h-[54px] shrink-0 items-center gap-2 rounded-2xl bg-rose-500/[.06] px-2.5 text-rose-300 transition hover:bg-rose-500/[.10] active:scale-[.97] disabled:opacity-50 sm:h-[58px] sm:px-3.5"
                  aria-label="Cerrar sesión"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/[.09]">
                    <Icon
                      type="logout"
                      size={17}
                    />
                  </span>

                  <span className="text-left">
                    <span className="hidden text-[8px] font-bold uppercase tracking-[.16em] text-rose-300/45 md:block">
                      Sesión
                    </span>

                    <span className="block whitespace-nowrap text-[9px] font-semibold text-rose-300 min-[380px]:text-[10px] sm:text-xs">
                      {loggingOut
                        ? 'Cerrando...'
                        : 'Cerrar sesión'}
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