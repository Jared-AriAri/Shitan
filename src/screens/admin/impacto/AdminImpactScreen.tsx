import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    BarChart3,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    CircleDollarSign,
    Eye,
    EyeOff,
    FileCheck2,
    Loader2,
    Pencil,
    Plus,
    Search,
    ShieldX,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase';

import ImpactDetails from './ImpactDetails';
import ImpactEvidenceEditor from './ImpactEvidenceEditor';

import type {
    ImpactFile,
    ImpactProfile,
    ImpactRow,
    ImpactVerificationFilter,
    ImpactVisibilityFilter,
} from './impactTypes';

import {
    formatCurrency,
    formatShortDate,
    getInitials,
    getProfileName,
    getStorageUrl,
    verificationClass,
    visibilityClass,
} from './impactUtils';

interface AdminImpactScreenProps {
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
    onEditorChange?: (
        open: boolean,
        closeHandler?: () => void,
    ) => void;
}

export default function AdminImpactScreen({
    showToast,
    refreshKey = 0,
    onChanged,
    onEditorChange,
}: AdminImpactScreenProps) {
    const [
        evidences,
        setEvidences,
    ] =
        useState<ImpactRow[]>(
            [],
        );

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        verificationFilter,
        setVerificationFilter,
    ] =
        useState<ImpactVerificationFilter>(
            'todos',
        );

    const [
        visibilityFilter,
        setVisibilityFilter,
    ] =
        useState<ImpactVisibilityFilter>(
            'todas',
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

    const [
        editorOpen,
        setEditorOpen,
    ] =
        useState(false);

    const [
        editingEvidence,
        setEditingEvidence,
    ] =
        useState<ImpactRow | null>(
            null,
        );

    const closeEditor =
        useCallback(
            () => {
                setEditorOpen(
                    false,
                );

                setEditingEvidence(
                    null,
                );

                onEditorChange?.(
                    false,
                );
            },
            [
                onEditorChange,
            ],
        );

    const openCreate =
        () => {
            setEditingEvidence(
                null,
            );

            setEditorOpen(
                true,
            );

            onEditorChange?.(
                true,
                closeEditor,
            );
        };

    const openEdit =
        (
            evidence: ImpactRow,
        ) => {
            setEditingEvidence(
                evidence,
            );

            setEditorOpen(
                true,
            );

            onEditorChange?.(
                true,
                closeEditor,
            );
        };

    const loadImpact =
        useCallback(
            async () => {
                setLoading(
                    true,
                );

                try {
                    const {
                        data:
                        evidenceData,
                        error:
                        evidenceError,
                    } =
                        await supabase
                            .from(
                                'evidencias_impacto',
                            )
                            .select(
                                'id,causa_id,titulo,descripcion,fecha_entrega,monto_utilizado,publica,verificada,verificada_por,verificada_en,creada_por,creado_en',
                            )
                            .order(
                                'creado_en',
                                {
                                    ascending:
                                        false,
                                },
                            );

                    if (
                        evidenceError
                    ) {
                        throw evidenceError;
                    }

                    const rows =
                        evidenceData ??
                        [];

                    if (
                        !rows.length
                    ) {
                        setEvidences(
                            [],
                        );

                        setSelectedId(
                            null,
                        );

                        return;
                    }

                    const evidenceIds =
                        rows.map(
                            (
                                evidence,
                            ) =>
                                evidence.id,
                        );

                    const causeIds =
                        [
                            ...new Set(
                                rows
                                    .map(
                                        (
                                            evidence,
                                        ) =>
                                            evidence.causa_id,
                                    )
                                    .filter(
                                        Boolean,
                                    ),
                            ),
                        ];

                    const profileIds =
                        [
                            ...new Set(
                                rows
                                    .flatMap(
                                        (
                                            evidence,
                                        ) => [
                                                evidence.creada_por,
                                                evidence.verificada_por,
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
                        filesResult,
                        profilesResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from(
                                    'causas',
                                )
                                .select(
                                    'id,titulo,slug,categoria,estado',
                                )
                                .in(
                                    'id',
                                    causeIds,
                                ),

                            supabase
                                .from(
                                    'archivos_evidencia',
                                )
                                .select(
                                    'id,evidencia_id,tipo,ruta_storage,nombre_archivo,orden,creado_en',
                                )
                                .in(
                                    'evidencia_id',
                                    evidenceIds,
                                )
                                .order(
                                    'orden',
                                    {
                                        ascending:
                                            true,
                                    },
                                ),

                            profileIds.length
                                ? supabase
                                    .from(
                                        'perfiles',
                                    )
                                    .select(
                                        'id,correo,nombre_completo,alias,telefono,avatar_url',
                                    )
                                    .in(
                                        'id',
                                        profileIds,
                                    )
                                : Promise.resolve({
                                    data: [],
                                    error: null,
                                }),
                        ]);

                    if (
                        causesResult.error
                    ) {
                        throw causesResult.error;
                    }

                    if (
                        filesResult.error
                    ) {
                        throw filesResult.error;
                    }

                    if (
                        profilesResult.error
                    ) {
                        throw profilesResult.error;
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
                                        {
                                            id:
                                                cause.id,
                                            titulo:
                                                cause.titulo,
                                            slug:
                                                cause.slug,
                                            categoria:
                                                cause.categoria,
                                            estado:
                                                cause.estado,
                                        },
                                    ],
                            ),
                        );

                    const profileMap =
                        new Map<
                            string,
                            ImpactProfile
                        >();

                    (
                        profilesResult.data ??
                        []
                    ).forEach(
                        (
                            profile,
                        ) => {
                            profileMap.set(
                                profile.id,
                                {
                                    id:
                                        profile.id,
                                    correo:
                                        profile.correo ??
                                        null,
                                    nombre_completo:
                                        profile.nombre_completo ??
                                        null,
                                    alias:
                                        profile.alias ??
                                        null,
                                    telefono:
                                        profile.telefono ??
                                        null,
                                    avatar_url:
                                        profile.avatar_url ??
                                        null,
                                },
                            );
                        },
                    );

                    const fileMap =
                        new Map<
                            string,
                            ImpactFile[]
                        >();

                    (
                        filesResult.data ??
                        []
                    ).forEach(
                        (
                            file,
                        ) => {
                            const current =
                                fileMap.get(
                                    file.evidencia_id,
                                ) ??
                                [];

                            current.push({
                                id:
                                    file.id,
                                evidencia_id:
                                    file.evidencia_id,
                                tipo:
                                    String(
                                        file.tipo,
                                    ),
                                ruta_storage:
                                    file.ruta_storage,
                                nombre_archivo:
                                    file.nombre_archivo ??
                                    null,
                                orden:
                                    Number(
                                        file.orden ??
                                        0,
                                    ),
                                creado_en:
                                    file.creado_en,
                                url:
                                    getStorageUrl(
                                        file.ruta_storage,
                                    ),
                            });

                            fileMap.set(
                                file.evidencia_id,
                                current,
                            );
                        },
                    );

                    const normalized:
                        ImpactRow[] =
                        rows.map(
                            (
                                evidence,
                            ) => ({
                                id:
                                    evidence.id,

                                causa_id:
                                    evidence.causa_id,

                                titulo:
                                    evidence.titulo,

                                descripcion:
                                    evidence.descripcion ??
                                    null,

                                fecha_entrega:
                                    evidence.fecha_entrega ??
                                    null,

                                monto_utilizado:
                                    evidence.monto_utilizado ===
                                        null ||
                                        evidence.monto_utilizado ===
                                        undefined
                                        ? null
                                        : Number(
                                            evidence.monto_utilizado,
                                        ),

                                publica:
                                    Boolean(
                                        evidence.publica,
                                    ),

                                verificada:
                                    Boolean(
                                        evidence.verificada,
                                    ),

                                verificada_por:
                                    evidence.verificada_por ??
                                    null,

                                verificada_en:
                                    evidence.verificada_en ??
                                    null,

                                creada_por:
                                    evidence.creada_por ??
                                    null,

                                creado_en:
                                    evidence.creado_en,

                                causa:
                                    causeMap.get(
                                        evidence.causa_id,
                                    ) ??
                                    null,

                                creador:
                                    evidence.creada_por
                                        ? profileMap.get(
                                            evidence.creada_por,
                                        ) ??
                                        null
                                        : null,

                                verificador:
                                    evidence.verificada_por
                                        ? profileMap.get(
                                            evidence.verificada_por,
                                        ) ??
                                        null
                                        : null,

                                archivos:
                                    fileMap.get(
                                        evidence.id,
                                    ) ??
                                    [],
                            }),
                        );

                    setEvidences(
                        normalized,
                    );

                    setSelectedId(
                        (
                            current,
                        ) =>
                            current &&
                                normalized.some(
                                    (
                                        evidence,
                                    ) =>
                                        evidence.id ===
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
                            : 'No se pudieron cargar las evidencias de impacto.',
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
        void loadImpact();
    }, [
        loadImpact,
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

            return evidences.filter(
                (
                    evidence,
                ) => {
                    const creator =
                        getProfileName(
                            evidence.creador,
                        );

                    const matchesSearch =
                        !query ||
                        [
                            evidence.titulo,
                            evidence.descripcion ??
                            '',
                            evidence.causa
                                ?.titulo ??
                            '',
                            evidence.causa
                                ?.categoria ??
                            '',
                            creator,
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

                    const matchesVerification =
                        verificationFilter ===
                        'todos' ||
                        (
                            verificationFilter ===
                            'verificados' &&
                            evidence.verificada
                        ) ||
                        (
                            verificationFilter ===
                            'pendientes' &&
                            !evidence.verificada
                        );

                    const matchesVisibility =
                        visibilityFilter ===
                        'todas' ||
                        (
                            visibilityFilter ===
                            'publicas' &&
                            evidence.publica
                        ) ||
                        (
                            visibilityFilter ===
                            'privadas' &&
                            !evidence.publica
                        );

                    return (
                        matchesSearch &&
                        matchesVerification &&
                        matchesVisibility
                    );
                },
            );
        }, [
            evidences,
            search,
            verificationFilter,
            visibilityFilter,
        ]);

    const statistics =
        useMemo(() => {
            const verified =
                evidences.filter(
                    (
                        evidence,
                    ) =>
                        evidence.verificada,
                ).length;

            const pending =
                evidences.filter(
                    (
                        evidence,
                    ) =>
                        !evidence.verificada,
                ).length;

            const publicCount =
                evidences.filter(
                    (
                        evidence,
                    ) =>
                        evidence.publica,
                ).length;

            const totalUsed =
                evidences.reduce(
                    (
                        total,
                        evidence,
                    ) =>
                        total +
                        (
                            evidence.monto_utilizado ??
                            0
                        ),
                    0,
                );

            return {
                total:
                    evidences.length,
                verified,
                pending,
                publicCount,
                totalUsed,
            };
        }, [
            evidences,
        ]);

    const hasFilters =
        Boolean(
            search.trim(),
        ) ||
        verificationFilter !==
        'todos' ||
        visibilityFilter !==
        'todas';

    const clearFilters =
        () => {
            setSearch('');

            setVerificationFilter(
                'todos',
            );

            setVisibilityFilter(
                'todas',
            );
        };

    const updateVerification =
        async (
            evidenceId: string,
            verified: boolean,
        ) => {
            if (
                updatingId
            ) {
                return;
            }

            setUpdatingId(
                evidenceId,
            );

            try {
                const {
                    data:
                    userData,
                    error:
                    userError,
                } =
                    await supabase.auth
                        .getUser();

                if (
                    userError
                ) {
                    throw userError;
                }

                const userId =
                    userData.user
                        ?.id ??
                    null;

                if (
                    verified &&
                    !userId
                ) {
                    throw new Error(
                        'No se encontró la sesión del administrador.',
                    );
                }

                const now =
                    new Date()
                        .toISOString();

                const {
                    error,
                } =
                    await supabase
                        .from(
                            'evidencias_impacto',
                        )
                        .update({
                            verificada:
                                verified,
                            verificada_por:
                                verified
                                    ? userId
                                    : null,
                            verificada_en:
                                verified
                                    ? now
                                    : null,
                        })
                        .eq(
                            'id',
                            evidenceId,
                        );

                if (error) {
                    throw error;
                }

                let verifier:
                    ImpactProfile | null =
                    null;

                if (
                    verified &&
                    userId
                ) {
                    const {
                        data:
                        profileData,
                        error:
                        profileError,
                    } =
                        await supabase
                            .from(
                                'perfiles',
                            )
                            .select(
                                'id,correo,nombre_completo,alias,telefono,avatar_url',
                            )
                            .eq(
                                'id',
                                userId,
                            )
                            .maybeSingle();

                    if (
                        profileError
                    ) {
                        throw profileError;
                    }

                    if (
                        profileData
                    ) {
                        verifier = {
                            id:
                                profileData.id,
                            correo:
                                profileData.correo ??
                                null,
                            nombre_completo:
                                profileData.nombre_completo ??
                                null,
                            alias:
                                profileData.alias ??
                                null,
                            telefono:
                                profileData.telefono ??
                                null,
                            avatar_url:
                                profileData.avatar_url ??
                                null,
                        };
                    }
                }

                setEvidences(
                    (
                        current,
                    ) =>
                        current.map(
                            (
                                evidence,
                            ) =>
                                evidence.id ===
                                    evidenceId
                                    ? {
                                        ...evidence,
                                        verificada:
                                            verified,
                                        verificada_por:
                                            verified
                                                ? userId
                                                : null,
                                        verificada_en:
                                            verified
                                                ? now
                                                : null,
                                        verificador:
                                            verified
                                                ? verifier
                                                : null,
                                    }
                                    : evidence,
                        ),
                );

                showToast(
                    verified
                        ? 'Evidencia verificada correctamente.'
                        : 'Se quitó la verificación de la evidencia.',
                    verified
                        ? 'success'
                        : 'info',
                );

                onChanged?.();
            } catch (
            error
            ) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : 'No se pudo actualizar la verificación.',
                    'error',
                );
            } finally {
                setUpdatingId(
                    null,
                );
            }
        };

    const updateVisibility =
        async (
            evidenceId: string,
            visible: boolean,
        ) => {
            if (
                updatingId
            ) {
                return;
            }

            setUpdatingId(
                evidenceId,
            );

            try {
                const {
                    error,
                } =
                    await supabase
                        .from(
                            'evidencias_impacto',
                        )
                        .update({
                            publica:
                                visible,
                        })
                        .eq(
                            'id',
                            evidenceId,
                        );

                if (error) {
                    throw error;
                }

                setEvidences(
                    (
                        current,
                    ) =>
                        current.map(
                            (
                                evidence,
                            ) =>
                                evidence.id ===
                                    evidenceId
                                    ? {
                                        ...evidence,
                                        publica:
                                            visible,
                                    }
                                    : evidence,
                        ),
                );

                showToast(
                    visible
                        ? 'La evidencia ahora es pública.'
                        : 'La evidencia ahora es privada.',
                    'success',
                );

                onChanged?.();
            } catch (
            error
            ) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : 'No se pudo cambiar la visibilidad.',
                    'error',
                );
            } finally {
                setUpdatingId(
                    null,
                );
            }
        };

    if (
        editorOpen
    ) {
        return (
            <ImpactEvidenceEditor
                open
                evidence={
                    editingEvidence
                }
                onClose={
                    closeEditor
                }
                onSaved={async () => {
                    closeEditor();

                    await loadImpact();

                    onChanged?.();
                }}
                showToast={
                    showToast
                }
            />
        );
    }

    return (
        <div className="w-full min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-violet-300">
                        Transparencia
                    </span>

                    <div className="mt-1 flex items-baseline gap-2">
                        <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text)] sm:text-xl">
                            Impacto
                        </h2>

                        {!loading && (
                            <span className="text-[9px] text-[var(--muted)]">
                                {
                                    evidences.length
                                }
                            </span>
                        )}
                    </div>

                    <p className="mt-1 max-w-2xl text-[9px] leading-4 text-[var(--muted)] sm:text-[10px]">
                        Revisa evidencias de impacto, valida su información, archivos, montos y visibilidad pública.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        openCreate
                    }
                    className="group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-400/[0.11] px-4 text-[9px] font-bold text-violet-200 transition-all hover:-translate-y-0.5 hover:bg-violet-400/[0.16] active:scale-[0.98]"
                >
                    <Plus
                        size={15}
                        className="transition-transform duration-500 group-hover:rotate-180"
                    />

                    Nueva evidencia
                </button>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
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

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/[0.08] text-violet-300">
                            <BarChart3
                                size={16}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Verificadas
                    </span>

                    <strong className="mt-2 block text-xl font-bold text-emerald-300">
                        {
                            statistics.verified
                        }
                    </strong>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Pendientes
                    </span>

                    <strong className="mt-2 block text-xl font-bold text-amber-200">
                        {
                            statistics.pending
                        }
                    </strong>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Públicas
                    </span>

                    <strong className="mt-2 block text-xl font-bold text-violet-300">
                        {
                            statistics.publicCount
                        }
                    </strong>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Monto utilizado
                    </span>

                    <strong className="mt-2 block truncate text-[15px] font-bold text-emerald-300">
                        {formatCurrency(
                            statistics.totalUsed,
                        )}
                    </strong>
                </div>
            </div>

            <section className="mt-3 rounded-2xl border border-white/[0.055] bg-white/[0.022] p-3 sm:p-4">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_210px_200px_auto]">
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
                            placeholder="Buscar evidencia..."
                            className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] pl-10 pr-4 text-[11px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-violet-400/25"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={
                                verificationFilter
                            }
                            onChange={(
                                event,
                            ) =>
                                setVerificationFilter(
                                    event.target
                                        .value as ImpactVerificationFilter,
                                )
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] text-[var(--text-soft)] outline-none"
                        >
                            <option value="todos">
                                Todas las verificaciones
                            </option>

                            <option value="verificados">
                                Verificadas
                            </option>

                            <option value="pendientes">
                                Pendientes
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
                                visibilityFilter
                            }
                            onChange={(
                                event,
                            ) =>
                                setVisibilityFilter(
                                    event.target
                                        .value as ImpactVisibilityFilter,
                                )
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] text-[var(--text-soft)] outline-none"
                        >
                            <option value="todas">
                                Toda visibilidad
                            </option>

                            <option value="publicas">
                                Públicas
                            </option>

                            <option value="privadas">
                                Privadas
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
                            className="h-11 rounded-xl bg-white/[0.04] px-4 text-[9px] font-semibold text-[var(--muted)] transition hover:bg-white/[0.07] hover:text-white"
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
                        className="animate-spin text-violet-300"
                    />
                </div>
            ) : !filtered.length ? (
                <div className="mt-4 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.018] px-5 text-center">
                    <BarChart3
                        size={28}
                        className="text-violet-300"
                    />

                    <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">
                        No hay evidencias
                    </h3>

                    <p className="mt-1 max-w-[320px] text-[9px] leading-4 text-[var(--muted)]">
                        {hasFilters
                            ? 'No existen evidencias que coincidan con los filtros.'
                            : 'Las evidencias de impacto registradas aparecerán aquí.'}
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-2.5">
                    {filtered.map(
                        (
                            evidence,
                        ) => {
                            const expanded =
                                selectedId ===
                                evidence.id;

                            const creatorName =
                                getProfileName(
                                    evidence.creador,
                                );

                            return (
                                <article
                                    key={
                                        evidence.id
                                    }
                                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${expanded
                                        ? 'border-violet-400/15 bg-white/[0.032]'
                                        : !evidence.verificada
                                            ? 'border-amber-300/[0.08] bg-amber-300/[0.015]'
                                            : 'border-white/[0.055] bg-white/[0.022] hover:border-white/[0.09]'
                                        }`}
                                >
                                    <div className="flex w-full items-stretch">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedId(
                                                    (
                                                        current,
                                                    ) =>
                                                        current ===
                                                            evidence.id
                                                            ? null
                                                            : evidence.id,
                                                )
                                            }
                                            className="group grid min-w-0 flex-1 gap-3 p-3 text-left sm:p-4 lg:grid-cols-[minmax(230px,1.4fr)_minmax(180px,1fr)_135px_140px_100px_28px] lg:items-center"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/[0.08] text-[10px] font-black text-violet-300">
                                                    {getInitials(
                                                        creatorName,
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <span className="block truncate text-[10px] font-semibold text-[var(--text)]">
                                                        {
                                                            evidence.titulo
                                                        }
                                                    </span>

                                                    <span className="mt-1 block truncate text-[7px] text-[var(--muted)]">
                                                        {
                                                            creatorName
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                    Causa
                                                </span>

                                                <span className="mt-0.5 block truncate text-[9px] text-[var(--text-soft)]">
                                                    {evidence.causa
                                                        ?.titulo ??
                                                        'Sin causa'}
                                                </span>
                                            </div>

                                            <div>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1.5 text-[7px] font-semibold ${verificationClass(
                                                        evidence.verificada,
                                                    )}`}
                                                >
                                                    {evidence.verificada
                                                        ? 'Verificada'
                                                        : 'Pendiente'}
                                                </span>
                                            </div>

                                            <div>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[7px] font-semibold ${visibilityClass(
                                                        evidence.publica,
                                                    )}`}
                                                >
                                                    {evidence.publica ? (
                                                        <Eye
                                                            size={10}
                                                        />
                                                    ) : (
                                                        <EyeOff
                                                            size={10}
                                                        />
                                                    )}

                                                    {evidence.publica
                                                        ? 'Pública'
                                                        : 'Privada'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 lg:block">
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300/[0.07] px-2 py-1 text-[7px] font-semibold text-cyan-300">
                                                    <FileCheck2
                                                        size={10}
                                                    />

                                                    {
                                                        evidence
                                                            .archivos
                                                            .length
                                                    }
                                                </span>

                                                <span className="text-[7px] text-[var(--muted)] lg:mt-1.5 lg:block">
                                                    {formatShortDate(
                                                        evidence.fecha_entrega ??
                                                        evidence.creado_en,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="hidden justify-end lg:flex">
                                                {expanded ? (
                                                    <ChevronUp
                                                        size={15}
                                                        className="text-violet-300"
                                                    />
                                                ) : (
                                                    <ChevronDown
                                                        size={15}
                                                        className="text-[var(--muted)]"
                                                    />
                                                )}
                                            </div>
                                        </button>

                                        <div className="flex shrink-0 items-center border-l border-white/[0.045] px-2 sm:px-3">
                                            <button
                                                type="button"
                                                aria-label="Editar evidencia"
                                                title="Editar evidencia"
                                                onClick={() =>
                                                    openEdit(
                                                        evidence,
                                                    )
                                                }
                                                className="group grid h-9 w-9 place-items-center rounded-xl bg-violet-400/[0.07] text-violet-200 transition-all hover:-translate-y-0.5 hover:bg-violet-400/[0.12] active:scale-[0.96]"
                                            >
                                                <Pencil
                                                    size={13}
                                                    className="transition-transform duration-300 group-hover:-rotate-6"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {expanded && (
                                        <ImpactDetails
                                            evidence={
                                                evidence
                                            }
                                            updating={
                                                updatingId ===
                                                evidence.id
                                            }
                                            onVerify={(
                                                verified,
                                            ) =>
                                                updateVerification(
                                                    evidence.id,
                                                    verified,
                                                )
                                            }
                                            onVisibilityChange={(
                                                visible,
                                            ) =>
                                                updateVisibility(
                                                    evidence.id,
                                                    visible,
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