import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Mail,
    Phone,
    Shield,
    ShieldCheck,
    UserRound,
    UserX,
} from 'lucide-react';

import type {
    UserRole,
    UserRow,
} from './userTypes';

import {
    formatDate,
    formatRole,
    getInitials,
    getUserName,
    roleClass,
    statusClass,
} from './userUtils';

import { useAuth } from '@/contexts/AuthContext';

interface UserDetailsProps {
    user: UserRow;
    updating: boolean;
    currentUserId: string | null;
    onChangeRole: (
        role: UserRole,
    ) => void | Promise<void>;
    onChangeActive: (
        active: boolean,
    ) => void | Promise<void>;
}

export default function UserDetails({
    user,
    updating,
    currentUserId,
    onChangeRole,
    onChangeActive,
}: UserDetailsProps) {
    const {
        role,
        profile,
    } = useAuth();

    const currentRole =
        profile?.role ||
        role ||
        'donante';

    const canManageUsers =
        currentRole ===
        'adminmaster';

    const name =
        getUserName(
            user.nombre_completo,
            user.alias,
            user.correo,
        );

    const isCurrentUser =
        currentUserId ===
        user.id;

    return (
        <div className="border-t border-white/[0.05] bg-black/[0.08] p-3 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
                <main className="min-w-0 space-y-4">
                    <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4 sm:p-5">
                        <div className="flex min-w-0 items-center gap-4">
                            {user.avatar_url ? (
                                <img
                                    src={
                                        user.avatar_url
                                    }
                                    alt={
                                        name
                                    }
                                    className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                                />
                            ) : (
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cyan-300/[0.08] text-[13px] font-black text-cyan-300">
                                    {getInitials(
                                        name,
                                    )}
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <span className="block text-[7px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Usuario
                                </span>

                                <h3 className="mt-1 truncate text-[14px] font-bold text-[var(--text)]">
                                    {
                                        name
                                    }
                                </h3>

                                {user.alias && (
                                    <span className="mt-1 block truncate text-[8px] text-cyan-300/75">
                                        @
                                        {
                                            user.alias
                                        }
                                    </span>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span
                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[7px] font-semibold ${roleClass(
                                            user.rol,
                                        )}`}
                                    >
                                        {formatRole(
                                            user.rol,
                                        )}
                                    </span>

                                    <span
                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[7px] font-semibold ${statusClass(
                                            user.activo,
                                        )}`}
                                    >
                                        {user.activo
                                            ? 'Activo'
                                            : 'Inactivo'}
                                    </span>

                                    {isCurrentUser && (
                                        <span className="inline-flex rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[7px] font-semibold text-[var(--text-soft)]">
                                            Tu cuenta
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
                                    <Mail
                                        size={15}
                                    />
                                </div>

                                <div className="min-w-0">
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                        Correo
                                    </span>

                                    <span className="mt-1 block break-all text-[9px] font-medium text-[var(--text-soft)]">
                                        {user.correo ||
                                            '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.07] text-emerald-300">
                                    <Phone
                                        size={15}
                                    />
                                </div>

                                <div className="min-w-0">
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                        Teléfono
                                    </span>

                                    <span className="mt-1 block text-[9px] font-medium text-[var(--text-soft)]">
                                        {user.telefono ||
                                            '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <CalendarDays
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                                />

                                <div>
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                        Registro
                                    </span>

                                    <span className="mt-1 block text-[9px] text-[var(--text-soft)]">
                                        {formatDate(
                                            user.creado_en,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <Clock3
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                                />

                                <div>
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                        Último acceso
                                    </span>

                                    <span className="mt-1 block text-[9px] text-[var(--text-soft)]">
                                        {formatDate(
                                            user.ultimo_acceso,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                        <div className="flex items-center gap-2">
                            <Shield
                                size={15}
                                className="text-violet-300"
                            />

                            <span className="text-[9px] font-semibold text-[var(--text)]">
                                Preferencias
                            </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/[0.025] px-3 py-3">
                            <div>
                                <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                    Anónimo por defecto
                                </span>

                                <span className="mt-1 block text-[7px] text-[var(--muted)]">
                                    Preferencia usada al realizar aportaciones.
                                </span>
                            </div>

                            <span
                                className={`rounded-full px-2.5 py-1 text-[7px] font-semibold ${user.anonimo_por_defecto
                                    ? 'bg-violet-400/10 text-violet-300'
                                    : 'bg-white/[0.04] text-[var(--muted)]'
                                    }`}
                            >
                                {user.anonimo_por_defecto
                                    ? 'Sí'
                                    : 'No'}
                            </span>
                        </div>
                    </section>
                </main>

                <aside className="min-w-0">
                    <div className="space-y-4 xl:sticky xl:top-4">
                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Rol
                            </span>

                            <div className="mt-3 grid gap-2">
                                <button
                                    type="button"
                                    disabled={
                                        !canManageUsers ||
                                        updating ||
                                        user.rol ===
                                        'donante' ||
                                        isCurrentUser
                                    }
                                    onClick={() =>
                                        void onChangeRole(
                                            'donante',
                                        )
                                    }
                                    className="flex h-10 items-center justify-center rounded-xl bg-cyan-300/[0.07] text-[8px] font-semibold text-cyan-300 transition-all hover:bg-cyan-300/[0.12] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    Donante
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        !canManageUsers ||
                                        updating ||
                                        user.rol ===
                                        'admin' ||
                                        isCurrentUser
                                    }
                                    onClick={() =>
                                        void onChangeRole(
                                            'admin',
                                        )
                                    }
                                    className="flex h-10 items-center justify-center rounded-xl bg-violet-400/[0.07] text-[8px] font-semibold text-violet-300 transition-all hover:bg-violet-400/[0.12] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    Administrador
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        !canManageUsers ||
                                        updating ||
                                        user.rol ===
                                        'adminmaster' ||
                                        isCurrentUser
                                    }
                                    onClick={() =>
                                        void onChangeRole(
                                            'adminmaster',
                                        )
                                    }
                                    className="flex h-10 items-center justify-center rounded-xl bg-amber-300/[0.07] text-[8px] font-semibold text-amber-200 transition-all hover:bg-amber-300/[0.12] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    Administrador principal
                                </button>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Estado de cuenta
                            </span>

                            <button
                                type="button"
                                disabled={
                                    !canManageUsers ||
                                    updating ||
                                    isCurrentUser
                                }
                                onClick={() =>
                                    void onChangeActive(
                                        !user.activo,
                                    )
                                }
                                className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[9px] font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 ${user.activo
                                    ? 'bg-rose-400/[0.07] text-rose-300 hover:bg-rose-400/[0.12]'
                                    : 'bg-emerald-400/[0.08] text-emerald-300 hover:bg-emerald-400/[0.14]'
                                    }`}
                            >
                                {user.activo ? (
                                    <UserX
                                        size={14}
                                    />
                                ) : (
                                    <CheckCircle2
                                        size={14}
                                    />
                                )}

                                {user.activo
                                    ? 'Desactivar usuario'
                                    : 'Activar usuario'}
                            </button>

                            {isCurrentUser && (
                                <span className="mt-2 block text-center text-[7px] leading-4 text-[var(--muted)]">
                                    No puedes modificar el rol ni desactivar tu propia cuenta desde aquí.
                                </span>
                            )}

                            {!canManageUsers && (
                                <span className="mt-2 block text-center text-[7px] leading-4 text-[var(--muted)]">
                                    Solo un administrador principal puede cambiar roles o activar y desactivar usuarios.
                                </span>
                            )}
                        </section>

                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <UserRound
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                                />

                                <div className="min-w-0">
                                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                        ID de usuario
                                    </span>

                                    <span className="mt-1 block break-all font-mono text-[7px] leading-4 text-[var(--muted)]">
                                        {
                                            user.id
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-start gap-3 border-t border-white/[0.05] pt-3">
                                <ShieldCheck
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                                />

                                <div>
                                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                        Actualizado
                                    </span>

                                    <span className="mt-1 block text-[7px] text-[var(--muted)]">
                                        {formatDate(
                                            user.actualizado_en,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        </div>
    );
}