import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    ChevronDown,
    ChevronUp,
    Loader2,
    Search,
    Shield,
    UserCheck,
    Users,
    UserX,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase';

import UserDetails from './UserDetails';

import type {
    UserRole,
    UserRoleFilter,
    UserRow,
    UserStatusFilter,
} from './userTypes';

import {
    formatRole,
    formatShortDate,
    getInitials,
    getUserName,
    normalizeRole,
    roleClass,
    statusClass,
} from './userUtils';

interface AdminUsersScreenProps {
    showToast: (
        message: string,
        type?:
            | 'success'
            | 'error'
            | 'info'
            | 'warning',
    ) => void;
    refreshKey?: number;
    onChanged?: () => void;
}

interface AdminUpdateUserResult {
    id: string;
    correo: string | null;
    nombre_completo: string | null;
    alias: string | null;
    telefono: string | null;
    avatar_url: string | null;
    rol: string;
    anonimo_por_defecto: boolean;
    activo: boolean;
    ultimo_acceso: string | null;
    creado_en: string;
    actualizado_en: string;
}

export default function AdminUsersScreen({
    showToast,
    refreshKey = 0,
    onChanged,
}: AdminUsersScreenProps) {
    const [
        users,
        setUsers,
    ] =
        useState<UserRow[]>(
            [],
        );

    const [
        currentUserId,
        setCurrentUserId,
    ] =
        useState<string | null>(
            null,
        );

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        roleFilter,
        setRoleFilter,
    ] =
        useState<UserRoleFilter>(
            'todos',
        );

    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState<UserStatusFilter>(
            'todos',
        );

    const [
        selectedId,
        setSelectedId,
    ] =
        useState<string | null>(
            null,
        );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        updatingId,
        setUpdatingId,
    ] =
        useState<string | null>(
            null,
        );

    const loadUsers =
        useCallback(
            async () => {
                setLoading(
                    true,
                );

                try {
                    const [
                        usersResult,
                        authResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from(
                                    'perfiles',
                                )
                                .select(
                                    'id,correo,nombre_completo,alias,telefono,avatar_url,rol,anonimo_por_defecto,activo,ultimo_acceso,creado_en,actualizado_en',
                                )
                                .order(
                                    'creado_en',
                                    {
                                        ascending:
                                            false,
                                    },
                                ),

                            supabase.auth
                                .getUser(),
                        ]);

                    if (
                        usersResult.error
                    ) {
                        throw usersResult.error;
                    }

                    if (
                        authResult.error
                    ) {
                        throw authResult.error;
                    }

                    setCurrentUserId(
                        authResult.data
                            .user
                            ?.id ??
                        null,
                    );

                    const normalized:
                        UserRow[] =
                        (
                            usersResult.data ??
                            []
                        ).map(
                            (
                                user,
                            ) => ({
                                id:
                                    user.id,

                                correo:
                                    user.correo ??
                                    null,

                                nombre_completo:
                                    user.nombre_completo ??
                                    null,

                                alias:
                                    user.alias ??
                                    null,

                                telefono:
                                    user.telefono ??
                                    null,

                                avatar_url:
                                    user.avatar_url ??
                                    null,

                                rol:
                                    normalizeRole(
                                        String(
                                            user.rol,
                                        ),
                                    ),

                                anonimo_por_defecto:
                                    Boolean(
                                        user.anonimo_por_defecto,
                                    ),

                                activo:
                                    Boolean(
                                        user.activo,
                                    ),

                                ultimo_acceso:
                                    user.ultimo_acceso ??
                                    null,

                                creado_en:
                                    user.creado_en,

                                actualizado_en:
                                    user.actualizado_en,
                            }),
                        );

                    setUsers(
                        normalized,
                    );

                    setSelectedId(
                        (
                            current,
                        ) =>
                            current &&
                                normalized.some(
                                    (
                                        user,
                                    ) =>
                                        user.id ===
                                        current,
                                )
                                ? current
                                : null,
                    );
                } catch (
                error
                ) {
                    showToast(
                        error instanceof Error
                            ? error.message
                            : 'No se pudieron cargar los usuarios.',
                        'error',
                    );
                } finally {
                    setLoading(
                        false,
                    );
                }
            },
            [
                showToast,
            ],
        );

    useEffect(() => {
        void loadUsers();
    }, [
        loadUsers,
        refreshKey,
    ]);

    const filtered =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLocaleLowerCase(
                        'es-MX',
                    );

            return users.filter(
                (
                    user,
                ) => {
                    const name =
                        getUserName(
                            user.nombre_completo,
                            user.alias,
                            user.correo,
                        );

                    const matchesSearch =
                        !query ||
                        [
                            name,
                            user.correo ??
                            '',
                            user.alias ??
                            '',
                            user.telefono ??
                            '',
                            user.id,
                        ].some(
                            (
                                value,
                            ) =>
                                value
                                    .toLocaleLowerCase(
                                        'es-MX',
                                    )
                                    .includes(
                                        query,
                                    ),
                        );

                    const matchesRole =
                        roleFilter ===
                        'todos' ||
                        user.rol ===
                        roleFilter;

                    const matchesStatus =
                        statusFilter ===
                        'todos' ||
                        (
                            statusFilter ===
                            'activos' &&
                            user.activo
                        ) ||
                        (
                            statusFilter ===
                            'inactivos' &&
                            !user.activo
                        );

                    return (
                        matchesSearch &&
                        matchesRole &&
                        matchesStatus
                    );
                },
            );
        }, [
            users,
            search,
            roleFilter,
            statusFilter,
        ]);

    const statistics =
        useMemo(() => {
            const active =
                users.filter(
                    (
                        user,
                    ) =>
                        user.activo,
                ).length;

            const donors =
                users.filter(
                    (
                        user,
                    ) =>
                        user.rol ===
                        'donante',
                ).length;

            const admins =
                users.filter(
                    (
                        user,
                    ) =>
                        user.rol ===
                        'admin' ||
                        user.rol ===
                        'adminmaster',
                ).length;

            const inactive =
                users.length -
                active;

            return {
                total:
                    users.length,
                active,
                donors,
                admins,
                inactive,
            };
        }, [
            users,
        ]);

    const hasFilters =
        Boolean(
            search.trim(),
        ) ||
        roleFilter !==
        'todos' ||
        statusFilter !==
        'todos';

    const clearFilters =
        () => {
            setSearch('');

            setRoleFilter(
                'todos',
            );

            setStatusFilter(
                'todos',
            );
        };

    const applyRpcResult =
        (
            userId: string,
            data:
                | AdminUpdateUserResult
                | AdminUpdateUserResult[]
                | null,
        ) => {
            const updated =
                Array.isArray(
                    data,
                )
                    ? data[0]
                    : data;

            if (
                !updated
            ) {
                return;
            }

            setUsers(
                (
                    current,
                ) =>
                    current.map(
                        (
                            user,
                        ) =>
                            user.id ===
                                userId
                                ? {
                                    ...user,

                                    correo:
                                        updated.correo ??
                                        null,

                                    nombre_completo:
                                        updated.nombre_completo ??
                                        null,

                                    alias:
                                        updated.alias ??
                                        null,

                                    telefono:
                                        updated.telefono ??
                                        null,

                                    avatar_url:
                                        updated.avatar_url ??
                                        null,

                                    rol:
                                        normalizeRole(
                                            String(
                                                updated.rol,
                                            ),
                                        ),

                                    anonimo_por_defecto:
                                        Boolean(
                                            updated.anonimo_por_defecto,
                                        ),

                                    activo:
                                        Boolean(
                                            updated.activo,
                                        ),

                                    ultimo_acceso:
                                        updated.ultimo_acceso ??
                                        null,

                                    creado_en:
                                        updated.creado_en,

                                    actualizado_en:
                                        updated.actualizado_en,
                                }
                                : user,
                    ),
            );
        };

    const changeRole =
        async (
            userId: string,
            role: UserRole,
        ) => {
            if (
                updatingId
            ) {
                return;
            }

            if (
                currentUserId ===
                userId
            ) {
                showToast(
                    'No puedes cambiar tu propio rol desde este módulo.',
                    'warning',
                );

                return;
            }

            setUpdatingId(
                userId,
            );

            try {
                const {
                    data,
                    error,
                } =
                    await supabase
                        .rpc(
                            'admin_actualizar_usuario',
                            {
                                p_usuario_id:
                                    userId,
                                p_rol:
                                    role,
                                p_activo:
                                    null,
                            },
                        );

                if (error) {
                    throw error;
                }

                if (!data) {
                    throw new Error(
                        'No se recibió la información actualizada del usuario.',
                    );
                }

                applyRpcResult(
                    userId,
                    data as
                    | AdminUpdateUserResult
                    | AdminUpdateUserResult[],
                );

                showToast(
                    `Rol actualizado a ${formatRole(
                        role,
                    )}.`,
                    'success',
                );

                onChanged?.();
            } catch (
            error
            ) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : 'No se pudo cambiar el rol.',
                    'error',
                );
            } finally {
                setUpdatingId(
                    null,
                );
            }
        };

    const changeActive =
        async (
            userId: string,
            active: boolean,
        ) => {
            if (
                updatingId
            ) {
                return;
            }

            if (
                currentUserId ===
                userId
            ) {
                showToast(
                    'No puedes cambiar el estado de tu propia cuenta desde este módulo.',
                    'warning',
                );

                return;
            }

            setUpdatingId(
                userId,
            );

            try {
                const currentUser =
                    users.find(
                        (
                            user,
                        ) =>
                            user.id ===
                            userId,
                    ) ??
                    null;

                const {
                    data,
                    error,
                } =
                    await supabase
                        .rpc(
                            'admin_actualizar_usuario',
                            {
                                p_usuario_id:
                                    userId,
                                p_rol:
                                    currentUser
                                        ?.rol ??
                                    null,
                                p_activo:
                                    active,
                            },
                        );

                if (error) {
                    throw error;
                }

                if (!data) {
                    throw new Error(
                        'No se recibió la información actualizada del usuario.',
                    );
                }

                applyRpcResult(
                    userId,
                    data as
                    | AdminUpdateUserResult
                    | AdminUpdateUserResult[],
                );

                showToast(
                    active
                        ? 'Usuario activado correctamente.'
                        : 'Usuario desactivado correctamente.',
                    'success',
                );

                onChanged?.();
            } catch (
            error
            ) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : 'No se pudo actualizar el usuario.',
                    'error',
                );
            } finally {
                setUpdatingId(
                    null,
                );
            }
        };

    return (
        <div className="w-full min-w-0">
            <div className="mb-4">
                <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Accesos
                </span>

                <div className="mt-1 flex items-baseline gap-2">
                    <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text)] sm:text-xl">
                        Usuarios
                    </h2>

                    {!loading && (
                        <span className="text-[9px] text-[var(--muted)]">
                            {
                                users.length
                            }
                        </span>
                    )}
                </div>

                <p className="mt-1 max-w-2xl text-[9px] leading-4 text-[var(--muted)] sm:text-[10px]">
                    Consulta usuarios, roles, actividad y acceso a Shitan Trust.
                </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Total
                    </span>

                    <strong className="mt-2 block text-xl font-bold text-[var(--text)]">
                        {
                            statistics.total
                        }
                    </strong>
                </div>

                <div className="rounded-2xl border border-emerald-400/[0.07] bg-emerald-400/[0.018] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-emerald-300/60">
                        Activos
                    </span>

                    <strong className="mt-2 block text-xl font-bold text-emerald-300">
                        {
                            statistics.active
                        }
                    </strong>
                </div>

                <div className="rounded-2xl border border-cyan-300/[0.07] bg-cyan-300/[0.018] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-cyan-300/60">
                        Donantes
                    </span>

                    <strong className="mt-2 block text-xl font-bold text-cyan-300">
                        {
                            statistics.donors
                        }
                    </strong>
                </div>

                <div className="rounded-2xl border border-violet-400/[0.07] bg-violet-400/[0.018] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-violet-300/60">
                        Administradores
                    </span>

                    <strong className="mt-2 block text-xl font-bold text-violet-300">
                        {
                            statistics.admins
                        }
                    </strong>
                </div>

                <div className="rounded-2xl border border-rose-400/[0.07] bg-rose-400/[0.018] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-rose-300/60">
                        Inactivos
                    </span>

                    <strong className="mt-2 block text-xl font-bold text-rose-300">
                        {
                            statistics.inactive
                        }
                    </strong>
                </div>
            </div>

            <section className="mt-3 rounded-2xl border border-white/[0.055] bg-white/[0.022] p-3 sm:p-4">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_220px_200px_auto]">
                    <div className="relative">
                        <Search
                            size={15}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                        />

                        <input
                            type="search"
                            value={
                                search
                            }
                            onChange={(
                                event,
                            ) =>
                                setSearch(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Buscar usuario..."
                            className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] pl-10 pr-4 text-[11px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-cyan-300/25"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={
                                roleFilter
                            }
                            onChange={(
                                event,
                            ) =>
                                setRoleFilter(
                                    event.target
                                        .value as UserRoleFilter,
                                )
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] text-[var(--text-soft)] outline-none"
                        >
                            <option value="todos">
                                Todos los roles
                            </option>

                            <option value="donante">
                                Donantes
                            </option>

                            <option value="admin">
                                Administradores
                            </option>

                            <option value="adminmaster">
                                Administradores principales
                            </option>
                        </select>

                        <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={
                                statusFilter
                            }
                            onChange={(
                                event,
                            ) =>
                                setStatusFilter(
                                    event.target
                                        .value as UserStatusFilter,
                                )
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] text-[var(--text-soft)] outline-none"
                        >
                            <option value="todos">
                                Todos los estados
                            </option>

                            <option value="activos">
                                Activos
                            </option>

                            <option value="inactivos">
                                Inactivos
                            </option>
                        </select>

                        <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                        />
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={
                                clearFilters
                            }
                            className="h-11 rounded-xl bg-white/[0.04] px-4 text-[9px] font-semibold text-[var(--muted)] transition-all hover:bg-white/[0.07] hover:text-white"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </section>

            {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Loader2
                        size={25}
                        className="animate-spin text-cyan-300"
                    />
                </div>
            ) : !filtered.length ? (
                <div className="mt-4 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.018] px-5 text-center">
                    <Users
                        size={28}
                        className="text-cyan-300"
                    />

                    <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">
                        No hay usuarios
                    </h3>

                    <p className="mt-1 max-w-[300px] text-[9px] leading-4 text-[var(--muted)]">
                        {hasFilters
                            ? 'No hay usuarios que coincidan con los filtros seleccionados.'
                            : 'Los usuarios registrados aparecerán aquí.'}
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-2.5">
                    {filtered.map(
                        (
                            user,
                        ) => {
                            const expanded =
                                selectedId ===
                                user.id;

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
                                <article
                                    key={
                                        user.id
                                    }
                                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${expanded
                                            ? 'border-cyan-300/15 bg-white/[0.032]'
                                            : 'border-white/[0.055] bg-white/[0.022] hover:border-white/[0.09] hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedId(
                                                (
                                                    current,
                                                ) =>
                                                    current ===
                                                        user.id
                                                        ? null
                                                        : user.id,
                                            )
                                        }
                                        className="group grid w-full gap-3 p-3 text-left sm:p-4 lg:grid-cols-[minmax(240px,1.4fr)_minmax(200px,1fr)_180px_120px_110px_28px] lg:items-center"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            {user.avatar_url ? (
                                                <img
                                                    src={
                                                        user.avatar_url
                                                    }
                                                    alt={
                                                        name
                                                    }
                                                    className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.08] text-[10px] font-black text-cyan-300">
                                                    {getInitials(
                                                        name,
                                                    )}
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className="block truncate text-[10px] font-semibold text-[var(--text)]">
                                                        {
                                                            name
                                                        }
                                                    </span>

                                                    {isCurrentUser && (
                                                        <span className="shrink-0 rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[6px] font-semibold text-[var(--muted)]">
                                                            Tú
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="mt-1 block truncate text-[7px] text-[var(--muted)]">
                                                    {user.alias
                                                        ? `@${user.alias}`
                                                        : user.id}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                Correo
                                            </span>

                                            <span className="mt-0.5 block truncate text-[9px] text-[var(--text-soft)]">
                                                {user.correo ||
                                                    '—'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                Rol
                                            </span>

                                            <span
                                                className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[7px] font-semibold ${roleClass(
                                                    user.rol,
                                                )}`}
                                            >
                                                <Shield
                                                    size={10}
                                                />

                                                {formatRole(
                                                    user.rol,
                                                )}
                                            </span>
                                        </div>

                                        <div>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[7px] font-semibold ${statusClass(
                                                    user.activo,
                                                )}`}
                                            >
                                                {user.activo ? (
                                                    <UserCheck
                                                        size={10}
                                                    />
                                                ) : (
                                                    <UserX
                                                        size={10}
                                                    />
                                                )}

                                                {user.activo
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[7px] text-[var(--muted)]">
                                                {formatShortDate(
                                                    user.ultimo_acceso ??
                                                    user.creado_en,
                                                )}
                                            </span>
                                        </div>

                                        <div className="hidden justify-end lg:flex">
                                            {expanded ? (
                                                <ChevronUp
                                                    size={15}
                                                    className="text-cyan-300"
                                                />
                                            ) : (
                                                <ChevronDown
                                                    size={15}
                                                    className="text-[var(--muted)]"
                                                />
                                            )}
                                        </div>
                                    </button>

                                    {expanded && (
                                        <UserDetails
                                            user={
                                                user
                                            }
                                            updating={
                                                updatingId ===
                                                user.id
                                            }
                                            currentUserId={
                                                currentUserId
                                            }
                                            onChangeRole={(
                                                role,
                                            ) =>
                                                changeRole(
                                                    user.id,
                                                    role,
                                                )
                                            }
                                            onChangeActive={(
                                                active,
                                            ) =>
                                                changeActive(
                                                    user.id,
                                                    active,
                                                )
                                            }
                                        />
                                    )}
                                </article>
                            );
                        },
                    )}
                </div>
            )}
        </div>
    );
}