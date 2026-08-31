import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Banknote,
    ChevronDown,
    ChevronUp,
    CircleDollarSign,
    Gift,
    Loader2,
    Package,
    Search,
    TrendingUp,
    Users,
} from 'lucide-react';

import {
    supabase,
} from '../../../lib/supabase';

import ContributionDetails from './ContributionDetails';

import type {
    ContributionFilter,
    ContributionItem,
    ContributionReceipt,
    ContributionRow,
    ContributionStatus,
    ContributionStatusFilter,
} from './contributionTypes';

import {
    contributionStatusClass,
    formatContributionStatus,
    formatContributionType,
    formatCurrency,
    formatShortDate,
    getDonorName,
    getInitials,
} from './contributionUtils';

interface AdminContributionsScreenProps {
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

const RECEIPTS_BUCKET =
    'comprobantes';

export default function AdminContributionsScreen({
    showToast,
    refreshKey = 0,
    onChanged,
}: AdminContributionsScreenProps) {
    const [
        contributions,
        setContributions,
    ] =
        useState<ContributionRow[]>(
            [],
        );

    const [
        search,
        setSearch,
    ] =
        useState('');

    const [
        typeFilter,
        setTypeFilter,
    ] =
        useState<ContributionFilter>(
            'todas',
        );

    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState<ContributionStatusFilter>(
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
    ] =
        useState(true);

    const [
        updatingId,
        setUpdatingId,
    ] =
        useState<string | null>(
            null,
        );

    const createReceiptUrl =
        async (
            path: string,
        ) => {
            const {
                data,
                error,
            } =
                await supabase.storage
                    .from(
                        RECEIPTS_BUCKET,
                    )
                    .createSignedUrl(
                        path,
                        60 * 60,
                    );

            if (
                error
            ) {
                return null;
            }

            return (
                data?.signedUrl ??
                null
            );
        };

    const loadContributions =
        useCallback(
            async () => {
                setLoading(
                    true,
                );

                try {
                    const {
                        data:
                        contributionData,
                        error:
                        contributionError,
                    } =
                        await supabase
                            .from(
                                'aportaciones',
                            )
                            .select(
                                'id,folio,causa_id,donante_id,tipo,monto,nombre_donante,alias_donante,correo_donante,telefono_donante,anonima,mensaje,referencia_transferencia,estado,revisada_por,revisada_en,motivo_rechazo,creada_en,actualizada_en',
                            )
                            .order(
                                'creada_en',
                                {
                                    ascending:
                                        false,
                                },
                            );

                    if (
                        contributionError
                    ) {
                        throw contributionError;
                    }

                    const base =
                        contributionData ??
                        [];

                    if (
                        !base.length
                    ) {
                        setContributions(
                            [],
                        );

                        return;
                    }

                    const contributionIds =
                        base.map(
                            (
                                item,
                            ) =>
                                item.id,
                        );

                    const causeIds =
                        [
                            ...new Set(
                                base
                                    .map(
                                        (
                                            item,
                                        ) =>
                                            item.causa_id,
                                    )
                                    .filter(
                                        Boolean,
                                    ),
                            ),
                        ];

                    const userIds =
                        [
                            ...new Set(
                                base
                                    .flatMap(
                                        (
                                            item,
                                        ) => [
                                                item.donante_id,
                                                item.revisada_por,
                                            ],
                                    )
                                    .filter(
                                        (
                                            value,
                                        ): value is string =>
                                            Boolean(
                                                value,
                                            ),
                                    ),
                            ),
                        ];

                    const [
                        causesResult,
                        profilesResult,
                        detailsResult,
                        receiptsResult,
                    ] =
                        await Promise.all([
                            causeIds.length
                                ? supabase
                                    .from(
                                        'causas',
                                    )
                                    .select(
                                        'id,titulo,slug,categoria',
                                    )
                                    .in(
                                        'id',
                                        causeIds,
                                    )
                                : Promise.resolve({
                                    data: [],
                                    error: null,
                                }),

                            userIds.length
                                ? supabase
                                    .from(
                                        'perfiles',
                                    )
                                    .select(
                                        'id,nombre_completo,alias,correo,telefono,avatar_url',
                                    )
                                    .in(
                                        'id',
                                        userIds,
                                    )
                                : Promise.resolve({
                                    data: [],
                                    error: null,
                                }),

                            supabase
                                .from(
                                    'detalle_aportaciones_especie',
                                )
                                .select(
                                    'id,aportacion_id,meta_especie_id,nombre,cantidad,unidad,notas,creado_en',
                                )
                                .in(
                                    'aportacion_id',
                                    contributionIds,
                                )
                                .order(
                                    'creado_en',
                                    {
                                        ascending:
                                            true,
                                    },
                                ),

                            supabase
                                .from(
                                    'comprobantes',
                                )
                                .select(
                                    'id,aportacion_id,usuario_id,ruta_storage,nombre_archivo,tipo_mime,tamano_bytes,creado_en',
                                )
                                .in(
                                    'aportacion_id',
                                    contributionIds,
                                )
                                .order(
                                    'creado_en',
                                    {
                                        ascending:
                                            true,
                                    },
                                ),
                        ]);

                    if (
                        causesResult.error
                    ) {
                        throw causesResult.error;
                    }

                    if (
                        profilesResult.error
                    ) {
                        throw profilesResult.error;
                    }

                    if (
                        detailsResult.error
                    ) {
                        throw detailsResult.error;
                    }

                    if (
                        receiptsResult.error
                    ) {
                        throw receiptsResult.error;
                    }

                    const causeMap =
                        new Map(
                            (
                                causesResult.data ??
                                []
                            ).map(
                                (
                                    cause,
                                ) => [
                                        cause.id,
                                        cause,
                                    ],
                            ),
                        );

                    const profileMap =
                        new Map(
                            (
                                profilesResult.data ??
                                []
                            ).map(
                                (
                                    profile,
                                ) => [
                                        profile.id,
                                        profile,
                                    ],
                            ),
                        );

                    const detailMap =
                        new Map<
                            string,
                            ContributionItem[]
                        >();

                    (
                        detailsResult.data ??
                        []
                    ).forEach(
                        (
                            item,
                        ) => {
                            const list =
                                detailMap.get(
                                    item.aportacion_id,
                                ) ??
                                [];

                            list.push({
                                id:
                                    item.id,
                                aportacion_id:
                                    item.aportacion_id,
                                meta_especie_id:
                                    item.meta_especie_id ??
                                    null,
                                nombre:
                                    item.nombre,
                                cantidad:
                                    Number(
                                        item.cantidad,
                                    ),
                                unidad:
                                    item.unidad,
                                notas:
                                    item.notas ??
                                    null,
                                creado_en:
                                    item.creado_en ??
                                    null,
                            });

                            detailMap.set(
                                item.aportacion_id,
                                list,
                            );
                        },
                    );

                    const receiptsWithUrls =
                        await Promise.all(
                            (
                                receiptsResult.data ??
                                []
                            ).map(
                                async (
                                    receipt,
                                ): Promise<ContributionReceipt> => {
                                    const url =
                                        receipt.ruta_storage
                                            ? await createReceiptUrl(
                                                receipt.ruta_storage,
                                            )
                                            : null;

                                    return {
                                        id:
                                            receipt.id,
                                        aportacion_id:
                                            receipt.aportacion_id,
                                        usuario_id:
                                            receipt.usuario_id,
                                        ruta_storage:
                                            receipt.ruta_storage,
                                        nombre_archivo:
                                            receipt.nombre_archivo ??
                                            null,
                                        tipo_mime:
                                            receipt.tipo_mime ??
                                            null,
                                        tamano_bytes:
                                            receipt.tamano_bytes ===
                                                null ||
                                                receipt.tamano_bytes ===
                                                undefined
                                                ? null
                                                : Number(
                                                    receipt.tamano_bytes,
                                                ),
                                        creado_en:
                                            receipt.creado_en ??
                                            null,
                                        url,
                                    };
                                },
                            ),
                        );

                    const receiptMap =
                        new Map<
                            string,
                            ContributionReceipt[]
                        >();

                    receiptsWithUrls.forEach(
                        (
                            receipt,
                        ) => {
                            const list =
                                receiptMap.get(
                                    receipt.aportacion_id,
                                ) ??
                                [];

                            list.push(
                                receipt,
                            );

                            receiptMap.set(
                                receipt.aportacion_id,
                                list,
                            );
                        },
                    );

                    const normalized:
                        ContributionRow[] =
                        base.map(
                            (
                                item,
                            ) => {
                                const perfil =
                                    profileMap.get(
                                        item.donante_id,
                                    ) ??
                                    null;

                                const revisor =
                                    item.revisada_por
                                        ? profileMap.get(
                                            item.revisada_por,
                                        ) ??
                                        null
                                        : null;

                                const estado: ContributionStatus =
                                    item.estado ===
                                        'aprobada'
                                        ? 'aprobada'
                                        : item.estado ===
                                            'rechazada'
                                            ? 'rechazada'
                                            : item.estado ===
                                                'cancelado'
                                                ? 'cancelado'
                                                : 'pendiente';

                                return {
                                    id:
                                        item.id,
                                    folio:
                                        Number(
                                            item.folio,
                                        ),
                                    causa_id:
                                        item.causa_id,
                                    donante_id:
                                        item.donante_id,
                                    tipo:
                                        item.tipo ===
                                            'especie'
                                            ? 'especie'
                                            : 'economica',
                                    monto:
                                        item.monto ===
                                            null ||
                                            item.monto ===
                                            undefined
                                            ? null
                                            : Number(
                                                item.monto,
                                            ),
                                    nombre_donante:
                                        item.nombre_donante ??
                                        null,
                                    alias_donante:
                                        item.alias_donante ??
                                        null,
                                    correo_donante:
                                        item.correo_donante ??
                                        null,
                                    telefono_donante:
                                        item.telefono_donante ??
                                        null,
                                    anonima:
                                        Boolean(
                                            item.anonima,
                                        ),
                                    mensaje:
                                        item.mensaje ??
                                        null,
                                    referencia_transferencia:
                                        item.referencia_transferencia ??
                                        null,
                                    estado,
                                    revisada_por:
                                        item.revisada_por ??
                                        null,
                                    revisada_en:
                                        item.revisada_en ??
                                        null,
                                    motivo_rechazo:
                                        item.motivo_rechazo ??
                                        null,
                                    creada_en:
                                        item.creada_en,
                                    actualizada_en:
                                        item.actualizada_en,
                                    causa:
                                        causeMap.get(
                                            item.causa_id,
                                        ) ??
                                        null,
                                    perfil,
                                    revisor,
                                    detalles:
                                        detailMap.get(
                                            item.id,
                                        ) ??
                                        [],
                                    comprobantes:
                                        receiptMap.get(
                                            item.id,
                                        ) ??
                                        [],
                                };
                            },
                        );

                    setContributions(
                        normalized,
                    );
                } catch (
                error
                ) {
                    showToast(
                        error instanceof
                            Error
                            ? error.message
                            : 'No se pudieron cargar las aportaciones.',
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

    useEffect(
        () => {
            void loadContributions();
        },
        [
            loadContributions,
            refreshKey,
        ],
    );

    const filtered =
        useMemo(
            () => {
                const query =
                    search
                        .trim()
                        .toLocaleLowerCase(
                            'es-MX',
                        );

                return contributions.filter(
                    (
                        contribution,
                    ) => {
                        const donor =
                            getDonorName(
                                contribution.anonima,
                                contribution.nombre_donante ??
                                contribution.perfil
                                    ?.nombre_completo ??
                                null,
                                contribution.alias_donante ??
                                contribution.perfil
                                    ?.alias ??
                                null,
                                contribution.correo_donante ??
                                contribution.perfil
                                    ?.correo ??
                                null,
                            );

                        const matchesSearch =
                            !query ||
                            [
                                donor,
                                contribution.id,
                                String(
                                    contribution.folio,
                                ),
                                contribution.referencia_transferencia ??
                                '',
                                contribution.causa
                                    ?.titulo ??
                                '',
                                contribution.correo_donante ??
                                '',
                                contribution.perfil
                                    ?.correo ??
                                '',
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

                        const matchesType =
                            typeFilter ===
                            'todas' ||
                            contribution.tipo ===
                            typeFilter;

                        const matchesStatus =
                            statusFilter ===
                            'todos' ||
                            contribution.estado ===
                            statusFilter;

                        return (
                            matchesSearch &&
                            matchesType &&
                            matchesStatus
                        );
                    },
                );
            },
            [
                contributions,
                search,
                typeFilter,
                statusFilter,
            ],
        );

    const statistics =
        useMemo(
            () => {
                const confirmed =
                    contributions.filter(
                        (
                            item,
                        ) =>
                            item.estado ===
                            'aprobada',
                    );

                const totalMoney =
                    confirmed.reduce(
                        (
                            total,
                            item,
                        ) =>
                            total +
                            (
                                item.tipo ===
                                    'economica'
                                    ? item.monto ??
                                    0
                                    : 0
                            ),
                        0,
                    );

                const pending =
                    contributions.filter(
                        (
                            item,
                        ) =>
                            item.estado ===
                            'pendiente',
                    ).length;

                const inKind =
                    contributions.filter(
                        (
                            item,
                        ) =>
                            item.tipo ===
                            'especie',
                    ).length;

                return {
                    total:
                        contributions.length,
                    totalMoney,
                    pending,
                    inKind,
                };
            },
            [
                contributions,
            ],
        );

    const hasFilters =
        Boolean(
            search.trim(),
        ) ||
        typeFilter !==
        'todas' ||
        statusFilter !==
        'todos';

    const clearFilters =
        () => {
            setSearch('');
            setTypeFilter(
                'todas',
            );
            setStatusFilter(
                'todos',
            );
        };

    const updateStatus =
        async (
            contributionId: string,
            status: ContributionStatus,
        ) => {
            if (
                updatingId
            ) {
                return;
            }

            setUpdatingId(
                contributionId,
            );

            try {
                const {
                    data:
                    authData,
                    error:
                    authError,
                } =
                    await supabase.auth.getUser();

                if (
                    authError
                ) {
                    throw authError;
                }

                if (
                    !authData.user
                ) {
                    throw new Error(
                        'No se pudo identificar al administrador.',
                    );
                }

                const now =
                    new Date().toISOString();

                const {
                    error,
                } =
                    await supabase
                        .from(
                            'aportaciones',
                        )
                        .update({
                            estado:
                                status,
                            revisada_por:
                                authData.user.id,
                            revisada_en:
                                now,
                            actualizada_en:
                                now,
                            motivo_rechazo:
                                status ===
                                    'rechazada'
                                    ? null
                                    : null,
                        })
                        .eq(
                            'id',
                            contributionId,
                        );

                if (
                    error
                ) {
                    throw error;
                }

                const reviewer =
                    contributions.find(
                        (
                            item,
                        ) =>
                            item.id ===
                            contributionId,
                    );

                const {
                    data:
                    reviewerProfile,
                } =
                    await supabase
                        .from(
                            'perfiles',
                        )
                        .select(
                            'id,nombre_completo,alias,correo,telefono,avatar_url',
                        )
                        .eq(
                            'id',
                            authData.user.id,
                        )
                        .maybeSingle();

                setContributions(
                    (
                        current,
                    ) =>
                        current.map(
                            (
                                item,
                            ) =>
                                item.id ===
                                    contributionId
                                    ? {
                                        ...item,
                                        estado:
                                            status,
                                        revisada_por:
                                            authData
                                                .user
                                                .id,
                                        revisada_en:
                                            now,
                                        actualizada_en:
                                            now,
                                        revisor:
                                            reviewerProfile ??
                                            reviewer
                                                ?.revisor ??
                                            null,
                                    }
                                    : item,
                        ),
                );

                showToast(
                    `Aportación ${formatContributionStatus(
                        status,
                    ).toLowerCase()} correctamente.`,
                    'success',
                );

                onChanged?.();
            } catch (
            error
            ) {
                showToast(
                    error instanceof
                        Error
                        ? error.message
                        : 'No se pudo actualizar la aportación.',
                    'error',
                );
            } finally {
                setUpdatingId(
                    null,
                );
            }
        };

    const toggleSelected =
        (
            id: string,
        ) => {
            setSelectedId(
                (
                    current,
                ) =>
                    current ===
                        id
                        ? null
                        : id,
            );
        };

    return (
        <div className="w-full min-w-0">
            <div className="mb-4">
                <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-amber-300">
                    Operación
                </span>

                <h2 className="mt-1 text-lg font-bold tracking-[-0.035em] text-[var(--text)] sm:text-xl">
                    Aportaciones
                </h2>

                <p className="mt-1 max-w-2xl text-[8px] leading-4 text-[var(--muted)]">
                    Revisa aportaciones económicas y en especie, comprobantes y evidencias antes de validarlas.
                </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Total
                            </span>

                            <strong className="mt-2 block text-xl font-bold text-[var(--text)]">
                                {
                                    statistics.total
                                }
                            </strong>
                        </div>

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-[var(--text-soft)]">
                            <Users
                                size={16}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Aprobado
                            </span>

                            <strong className="mt-2 block text-xl font-bold text-emerald-300">
                                {formatCurrency(
                                    statistics.totalMoney,
                                )}
                            </strong>
                        </div>

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                            <TrendingUp
                                size={16}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Pendientes
                            </span>

                            <strong className="mt-2 block text-xl font-bold text-amber-200">
                                {
                                    statistics.pending
                                }
                            </strong>
                        </div>

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300/[0.08] text-amber-200">
                            <Banknote
                                size={16}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                En especie
                            </span>

                            <strong className="mt-2 block text-xl font-bold text-cyan-300">
                                {
                                    statistics.inKind
                                }
                            </strong>
                        </div>

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/[0.08] text-cyan-300">
                            <Package
                                size={16}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <section className="mt-3 rounded-2xl border border-white/[0.055] bg-white/[0.022] p-3 sm:p-4">
                <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_200px_200px_auto]">
                    <div className="relative min-w-0">
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
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Buscar aportación..."
                            className="h-11 w-full min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.025] pl-10 pr-4 text-[11px] text-[var(--text)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-amber-300/25 focus:bg-white/[0.04]"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={
                                typeFilter
                            }
                            onChange={(
                                event,
                            ) =>
                                setTypeFilter(
                                    event
                                        .target
                                        .value as ContributionFilter,
                                )
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] text-[var(--text-soft)] outline-none focus:border-amber-300/25"
                        >
                            <option value="todas">
                                Todos los tipos
                            </option>

                            <option value="economica">
                                Económicas
                            </option>

                            <option value="especie">
                                En especie
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
                                    event
                                        .target
                                        .value as ContributionStatusFilter,
                                )
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] text-[var(--text-soft)] outline-none focus:border-amber-300/25"
                        >
                            <option value="todos">
                                Todos los estados
                            </option>

                            <option value="pendiente">
                                Pendientes
                            </option>

                            <option value="confirmada">
                                Aprobadas
                            </option>

                            <option value="rechazada">
                                Rechazadas
                            </option>

                            <option value="cancelada">
                                Canceladas
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
                            className="flex h-11 items-center justify-center rounded-xl bg-white/[0.04] px-4 text-[9px] font-semibold text-[var(--muted)] transition hover:bg-white/[0.07] hover:text-[var(--text)]"
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
                        className="animate-spin text-amber-300"
                    />
                </div>
            ) : !filtered.length ? (
                <div className="mt-4 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.018] px-5 text-center">
                    <CircleDollarSign
                        size={28}
                        className="text-amber-300"
                    />

                    <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">
                        No hay aportaciones
                    </h3>

                    <p className="mt-1 max-w-[320px] text-[9px] leading-4 text-[var(--muted)]">
                        {hasFilters
                            ? 'No existen aportaciones que coincidan con los filtros.'
                            : 'Las aportaciones registradas aparecerán aquí.'}
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-2.5">
                    {filtered.map(
                        (
                            contribution,
                        ) => {
                            const expanded =
                                selectedId ===
                                contribution.id;

                            const donorName =
                                getDonorName(
                                    contribution.anonima,
                                    contribution.nombre_donante ??
                                    contribution.perfil
                                        ?.nombre_completo ??
                                    null,
                                    contribution.alias_donante ??
                                    contribution.perfil
                                        ?.alias ??
                                    null,
                                    contribution.correo_donante ??
                                    contribution.perfil
                                        ?.correo ??
                                    null,
                                );

                            return (
                                <article
                                    key={
                                        contribution.id
                                    }
                                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${expanded
                                        ? 'border-amber-300/15 bg-white/[0.032]'
                                        : 'border-white/[0.055] bg-white/[0.022] hover:border-white/[0.09] hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleSelected(
                                                contribution.id,
                                            )
                                        }
                                        className="group grid w-full min-w-0 gap-3 p-3 text-left sm:p-4 lg:grid-cols-[minmax(240px,1.5fr)_minmax(180px,1fr)_120px_145px_110px_28px] lg:items-center"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div
                                                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[10px] font-black ${contribution.anonima
                                                    ? 'bg-white/[0.05] text-slate-400'
                                                    : 'bg-amber-300/[0.09] text-amber-200'
                                                    }`}
                                            >
                                                {getInitials(
                                                    donorName,
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <span className="block truncate text-[10px] font-semibold text-[var(--text)]">
                                                    {
                                                        donorName
                                                    }
                                                </span>

                                                <span className="mt-1 block truncate font-mono text-[7px] text-[var(--muted)]">
                                                    Folio{' '}
                                                    #
                                                    {
                                                        contribution.folio
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                Causa
                                            </span>

                                            <span className="mt-0.5 block truncate text-[9px] text-[var(--text-soft)]">
                                                {contribution.causa
                                                    ?.titulo ??
                                                    'Sin causa'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                Tipo
                                            </span>

                                            <span className="mt-0.5 flex items-center gap-1.5 text-[8px] font-medium text-[var(--text-soft)]">
                                                {contribution.tipo ===
                                                    'especie' ? (
                                                    <Gift
                                                        size={12}
                                                        className="text-cyan-300"
                                                    />
                                                ) : (
                                                    <CircleDollarSign
                                                        size={12}
                                                        className="text-amber-200"
                                                    />
                                                )}

                                                {formatContributionType(
                                                    contribution.tipo,
                                                )}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                Aportación
                                            </span>

                                            <span className="mt-0.5 block truncate text-[9px] font-semibold text-[var(--text)]">
                                                {contribution.tipo ===
                                                    'economica'
                                                    ? formatCurrency(
                                                        contribution.monto,
                                                    )
                                                    : `${contribution
                                                        .detalles
                                                        .length
                                                    } ${contribution
                                                        .detalles
                                                        .length ===
                                                        1
                                                        ? 'producto'
                                                        : 'productos'
                                                    }`}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 lg:block">
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1.5 text-[7px] font-semibold ${contributionStatusClass(
                                                    contribution.estado,
                                                )}`}
                                            >
                                                {formatContributionStatus(
                                                    contribution.estado,
                                                )}
                                            </span>

                                            <span className="text-[7px] text-[var(--muted)] lg:mt-1.5 lg:block">
                                                {formatShortDate(
                                                    contribution.creada_en,
                                                )}
                                            </span>
                                        </div>

                                        <div className="hidden justify-end lg:flex">
                                            {expanded ? (
                                                <ChevronUp
                                                    size={15}
                                                    className="text-amber-200"
                                                />
                                            ) : (
                                                <ChevronDown
                                                    size={15}
                                                    className="text-[var(--muted)] transition-transform group-hover:translate-y-0.5"
                                                />
                                            )}
                                        </div>
                                    </button>

                                    {expanded && (
                                        <ContributionDetails
                                            contribution={
                                                contribution
                                            }
                                            updating={
                                                updatingId ===
                                                contribution.id
                                            }
                                            onUpdateStatus={(
                                                status,
                                            ) =>
                                                updateStatus(
                                                    contribution.id,
                                                    status,
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