import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    CheckCircle2,
    ChevronDown,
    Clock3,
    Edit3,
    Eye,
    HeartHandshake,
    ImageOff,
    Loader2,
    MapPin,
    Plus,
    Search,
    Star,
    Trash2,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase';
import ConfirmDialog from '../../../components/ConfirmDialog';
import AdminCauseApprovalDetail from './AdminCauseApprovalDetail';

import type {
    CauseCreator,
    CauseImage,
    CauseProduct,
    CauseRow,
    CauseStatus,
    CauseStatusFilter,
} from './adminCauseTypes';

interface AdminCausesScreenProps {
    showToast: (
        message: string,
        type?:
            | 'success'
            | 'error'
            | 'info'
            | 'warning',
    ) => void;
    refreshKey?: number;
    onCreateCause: () => void;
    onEditCause: (
        causeId: string,
    ) => void;
}

function formatCurrency(
    value: number | null,
) {
    if (
        value === null ||
        value === undefined
    ) {
        return '—';
    }

    return value.toLocaleString(
        'es-MX',
        {
            style: 'currency',
            currency: 'MXN',
        },
    );
}

function formatDate(
    value: string | null,
) {
    if (!value) {
        return '—';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return '—';
    }

    return new Intl.DateTimeFormat(
        'es-MX',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        },
    ).format(date);
}

function formatCategory(
    value: string,
) {
    if (!value) {
        return '—';
    }

    const clean =
        value.replace(
            /_/g,
            ' ',
        );

    return (
        clean
            .charAt(0)
            .toUpperCase() +
        clean.slice(1)
    );
}

function normalizeStatus(
    value: string,
): CauseStatus {
    if (
        value ===
        'esperando_aprobacion'
    ) {
        return 'esperando_aprobacion';
    }

    if (
        value ===
        'aprobado'
    ) {
        return 'aprobado';
    }

    if (
        value ===
        'publicado'
    ) {
        return 'publicado';
    }

    return 'borrador';
}

function statusLabel(
    status: CauseStatus,
) {
    if (
        status ===
        'esperando_aprobacion'
    ) {
        return 'Esperando aprobación';
    }

    if (
        status ===
        'aprobado'
    ) {
        return 'Aprobado';
    }

    if (
        status ===
        'publicado'
    ) {
        return 'Publicado';
    }

    return 'Borrador';
}

function statusClass(
    status: CauseStatus,
) {
    if (
        status ===
        'esperando_aprobacion'
    ) {
        return 'border-amber-300/15 bg-amber-300/10 text-amber-200';
    }

    if (
        status ===
        'aprobado'
    ) {
        return 'border-cyan-300/15 bg-cyan-300/10 text-cyan-300';
    }

    if (
        status ===
        'publicado'
    ) {
        return 'border-emerald-400/15 bg-emerald-400/10 text-emerald-300';
    }

    return 'border-slate-400/10 bg-slate-400/10 text-slate-300';
}

function CauseImagePreview({
    src,
    title,
    featured,
    className = '',
}: {
    src: string | null;
    title: string;
    featured?: boolean;
    className?: string;
}) {
    const [
        failed,
        setFailed,
    ] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    return (
        <div
            className={`group/image relative overflow-hidden bg-white/[0.025] ${className}`}
        >
            {src && !failed ? (
                <img
                    src={src}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    onError={() =>
                        setFailed(true)
                    }
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/image:scale-[1.06]"
                />
            ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-emerald-400/[0.07] via-white/[0.02] to-transparent text-[var(--muted)]">
                    <ImageOff
                        size={18}
                        strokeWidth={1.5}
                    />

                    <span className="hidden text-[7px] sm:block">
                        Sin imagen
                    </span>
                </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-70" />

            {featured && (
                <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg border border-amber-300/15 bg-black/55 text-amber-300 shadow-lg backdrop-blur-md">
                    <Star
                        size={11}
                        fill="currentColor"
                    />
                </span>
            )}
        </div>
    );
}

export default function AdminCausesScreen({
    showToast,
    refreshKey = 0,
    onCreateCause,
    onEditCause,
}: AdminCausesScreenProps) {
    const [
        causes,
        setCauses,
    ] =
        useState<CauseRow[]>(
            [],
        );

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        categoryFilter,
        setCategoryFilter,
    ] = useState('todas');

    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState<CauseStatusFilter>(
            'todos',
        );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        deletingId,
        setDeletingId,
    ] =
        useState<string | null>(
            null,
        );

    const [
        approvingId,
        setApprovingId,
    ] =
        useState<string | null>(
            null,
        );

    const [
        causeToDelete,
        setCauseToDelete,
    ] =
        useState<CauseRow | null>(
            null,
        );

    const [
        selectedCauseId,
        setSelectedCauseId,
    ] =
        useState<string | null>(
            null,
        );

    const loadCauses =
        useCallback(
            async () => {
                setLoading(true);

                try {
                    const {
                        data:
                        causesData,
                        error:
                        causesError,
                    } =
                        await supabase
                            .from('causas')
                            .select(
                                'id,slug,titulo,resumen,historia,categoria,estado,meta_economica,organizador,beneficiario,ubicacion,fecha_inicio,fecha_limite,fecha_completada,destacada,orden,creado_por,creado_en,actualizado_en,tipo_meta,latitud,longitud,google_place_id',
                            )
                            .order(
                                'orden',
                                {
                                    ascending:
                                        true,
                                },
                            )
                            .order(
                                'creado_en',
                                {
                                    ascending:
                                        false,
                                },
                            );

                    if (
                        causesError
                    ) {
                        throw causesError;
                    }

                    const rows =
                        causesData ??
                        [];

                    if (
                        !rows.length
                    ) {
                        setCauses(
                            [],
                        );

                        setSelectedCauseId(
                            null,
                        );

                        return;
                    }

                    const causeIds =
                        rows.map(
                            (cause) =>
                                cause.id,
                        );

                    const creatorIds =
                        [
                            ...new Set(
                                rows
                                    .map(
                                        (cause) =>
                                            cause.creado_por,
                                    )
                                    .filter(
                                        (
                                            id,
                                        ): id is string =>
                                            Boolean(id),
                                    ),
                            ),
                        ];

                    const [
                        imagesResult,
                        productsResult,
                        profilesResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from(
                                    'imagenes_causa',
                                )
                                .select(
                                    'id,causa_id,storage_path,public_url,nombre_archivo,mime_type,size_bytes,es_principal,orden,creado_en',
                                )
                                .in(
                                    'causa_id',
                                    causeIds,
                                )
                                .order(
                                    'es_principal',
                                    {
                                        ascending:
                                            false,
                                    },
                                )
                                .order(
                                    'orden',
                                    {
                                        ascending:
                                            true,
                                    },
                                ),

                            supabase
                                .from(
                                    'metas_especie',
                                )
                                .select(
                                    'id,causa_id,nombre,descripcion,unidad,cantidad_objetivo,orden,creado_en',
                                )
                                .in(
                                    'causa_id',
                                    causeIds,
                                )
                                .order(
                                    'orden',
                                    {
                                        ascending:
                                            true,
                                    },
                                ),

                            creatorIds.length
                                ? supabase
                                    .from(
                                        'perfiles',
                                    )
                                    .select(
                                        'id,correo,nombre_completo,alias,telefono,avatar_url',
                                    )
                                    .in(
                                        'id',
                                        creatorIds,
                                    )
                                : Promise.resolve({
                                    data: [],
                                    error: null,
                                }),
                        ]);

                    if (
                        imagesResult.error
                    ) {
                        throw imagesResult.error;
                    }

                    if (
                        productsResult.error
                    ) {
                        throw productsResult.error;
                    }

                    if (
                        profilesResult.error
                    ) {
                        throw profilesResult.error;
                    }

                    const imageMap =
                        new Map<
                            string,
                            CauseImage[]
                        >();

                    (
                        imagesResult.data ??
                        []
                    ).forEach(
                        (image) => {
                            const current =
                                imageMap.get(
                                    image.causa_id,
                                ) ??
                                [];

                            current.push({
                                id:
                                    image.id,
                                causa_id:
                                    image.causa_id,
                                storage_path:
                                    image.storage_path,
                                public_url:
                                    image.public_url,
                                nombre_archivo:
                                    image.nombre_archivo ??
                                    null,
                                mime_type:
                                    image.mime_type ??
                                    null,
                                size_bytes:
                                    image.size_bytes ===
                                        null ||
                                        image.size_bytes ===
                                        undefined
                                        ? null
                                        : Number(
                                            image.size_bytes,
                                        ),
                                es_principal:
                                    Boolean(
                                        image.es_principal,
                                    ),
                                orden:
                                    Number(
                                        image.orden ??
                                        0,
                                    ),
                                creado_en:
                                    image.creado_en,
                            });

                            imageMap.set(
                                image.causa_id,
                                current,
                            );
                        },
                    );

                    const productMap =
                        new Map<
                            string,
                            CauseProduct[]
                        >();

                    (
                        productsResult.data ??
                        []
                    ).forEach(
                        (product) => {
                            const current =
                                productMap.get(
                                    product.causa_id,
                                ) ??
                                [];

                            current.push({
                                id:
                                    product.id,
                                causa_id:
                                    product.causa_id,
                                nombre:
                                    product.nombre,
                                descripcion:
                                    product.descripcion ??
                                    null,
                                unidad:
                                    product.unidad,
                                cantidad_objetivo:
                                    Number(
                                        product.cantidad_objetivo,
                                    ),
                                orden:
                                    Number(
                                        product.orden ??
                                        0,
                                    ),
                                creado_en:
                                    product.creado_en,
                            });

                            productMap.set(
                                product.causa_id,
                                current,
                            );
                        },
                    );

                    const creatorMap =
                        new Map<
                            string,
                            CauseCreator
                        >();

                    (
                        profilesResult.data ??
                        []
                    ).forEach(
                        (profile) => {
                            creatorMap.set(
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

                    const normalized:
                        CauseRow[] =
                        rows.map(
                            (cause) => {
                                const images =
                                    imageMap.get(
                                        cause.id,
                                    ) ??
                                    [];

                                const principalImage =
                                    images.find(
                                        (image) =>
                                            image.es_principal,
                                    ) ??
                                    images[0] ??
                                    null;

                                return {
                                    id:
                                        cause.id,
                                    slug:
                                        cause.slug,
                                    titulo:
                                        cause.titulo,
                                    resumen:
                                        cause.resumen ??
                                        null,
                                    historia:
                                        cause.historia ??
                                        null,
                                    categoria:
                                        cause.categoria,
                                    estado:
                                        normalizeStatus(
                                            cause.estado,
                                        ),
                                    meta_economica:
                                        cause.meta_economica ===
                                            null ||
                                            cause.meta_economica ===
                                            undefined
                                            ? null
                                            : Number(
                                                cause.meta_economica,
                                            ),
                                    organizador:
                                        cause.organizador ??
                                        null,
                                    beneficiario:
                                        cause.beneficiario ??
                                        null,
                                    ubicacion:
                                        cause.ubicacion ??
                                        null,
                                    fecha_inicio:
                                        cause.fecha_inicio ??
                                        null,
                                    fecha_limite:
                                        cause.fecha_limite ??
                                        null,
                                    fecha_completada:
                                        cause.fecha_completada ??
                                        null,
                                    destacada:
                                        Boolean(
                                            cause.destacada,
                                        ),
                                    orden:
                                        Number(
                                            cause.orden ??
                                            0,
                                        ),
                                    creado_por:
                                        cause.creado_por ??
                                        null,
                                    creado_en:
                                        cause.creado_en,
                                    actualizado_en:
                                        cause.actualizado_en,
                                    tipo_meta:
                                        cause.tipo_meta ===
                                            'especie'
                                            ? 'especie'
                                            : 'economica',
                                    latitud:
                                        cause.latitud ===
                                            null ||
                                            cause.latitud ===
                                            undefined
                                            ? null
                                            : Number(
                                                cause.latitud,
                                            ),
                                    longitud:
                                        cause.longitud ===
                                            null ||
                                            cause.longitud ===
                                            undefined
                                            ? null
                                            : Number(
                                                cause.longitud,
                                            ),
                                    google_place_id:
                                        cause.google_place_id ??
                                        null,
                                    imagen_url:
                                        principalImage
                                            ?.public_url ??
                                        null,
                                    imagenes:
                                        images,
                                    productos:
                                        productMap.get(
                                            cause.id,
                                        ) ??
                                        [],
                                    creador:
                                        cause.creado_por
                                            ? creatorMap.get(
                                                cause.creado_por,
                                            ) ??
                                            null
                                            : null,
                                };
                            },
                        );

                    setCauses(
                        normalized,
                    );

                    setSelectedCauseId(
                        (current) =>
                            current &&
                                normalized.some(
                                    (cause) =>
                                        cause.id ===
                                        current,
                                )
                                ? current
                                : null,
                    );
                } catch (error) {
                    showToast(
                        error instanceof Error
                            ? error.message
                            : 'No se pudieron cargar las causas.',
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
        void loadCauses();
    }, [
        loadCauses,
        refreshKey,
    ]);

    const categories =
        useMemo(() => {
            const values =
                new Set<string>();

            causes.forEach(
                (cause) => {
                    const category =
                        cause.categoria?.trim();

                    if (
                        category
                    ) {
                        values.add(
                            category,
                        );
                    }
                },
            );

            return [
                ...values,
            ].sort(
                (
                    first,
                    second,
                ) =>
                    first.localeCompare(
                        second,
                        'es-MX',
                    ),
            );
        }, [
            causes,
        ]);

    const filteredCauses =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLocaleLowerCase(
                        'es-MX',
                    );

            return causes.filter(
                (cause) => {
                    const matchesSearch =
                        !query ||
                        [
                            cause.titulo,
                            cause.slug,
                            cause.categoria,
                            cause.estado,
                            cause.organizador ??
                            '',
                            cause.beneficiario ??
                            '',
                            cause.ubicacion ??
                            '',
                            cause.creador
                                ?.nombre_completo ??
                            '',
                            cause.creador
                                ?.alias ??
                            '',
                            cause.creador
                                ?.correo ??
                            '',
                        ].some(
                            (value) =>
                                value
                                    .toLocaleLowerCase(
                                        'es-MX',
                                    )
                                    .includes(
                                        query,
                                    ),
                        );

                    const matchesCategory =
                        categoryFilter ===
                        'todas' ||
                        cause.categoria ===
                        categoryFilter;

                    const matchesStatus =
                        statusFilter ===
                        'todos' ||
                        cause.estado ===
                        statusFilter;

                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesStatus
                    );
                },
            );
        }, [
            causes,
            search,
            categoryFilter,
            statusFilter,
        ]);

    const selectedCause =
        useMemo(
            () =>
                causes.find(
                    (cause) =>
                        cause.id ===
                        selectedCauseId,
                ) ??
                null,
            [
                causes,
                selectedCauseId,
            ],
        );

    const waitingCount =
        useMemo(
            () =>
                causes.filter(
                    (cause) =>
                        cause.estado ===
                        'esperando_aprobacion',
                ).length,
            [
                causes,
            ],
        );

    const approvedCount =
        useMemo(
            () =>
                causes.filter(
                    (cause) =>
                        cause.estado ===
                        'aprobado',
                ).length,
            [
                causes,
            ],
        );

    const publishedCount =
        useMemo(
            () =>
                causes.filter(
                    (cause) =>
                        cause.estado ===
                        'publicado',
                ).length,
            [
                causes,
            ],
        );

    const draftCount =
        useMemo(
            () =>
                causes.filter(
                    (cause) =>
                        cause.estado ===
                        'borrador',
                ).length,
            [
                causes,
            ],
        );

    const hasFilters =
        Boolean(
            search.trim(),
        ) ||
        categoryFilter !==
        'todas' ||
        statusFilter !==
        'todos';

    const clearFilters =
        () => {
            setSearch('');

            setCategoryFilter(
                'todas',
            );

            setStatusFilter(
                'todos',
            );
        };

    const approveCause =
        async (
            causeId: string,
        ) => {
            if (
                approvingId
            ) {
                return;
            }

            setApprovingId(
                causeId,
            );

            const now =
                new Date().toISOString();

            try {
                const {
                    data,
                    error,
                } =
                    await supabase
                        .from(
                            'causas',
                        )
                        .update({
                            estado:
                                'aprobado',
                            actualizado_en:
                                now,
                        })
                        .eq(
                            'id',
                            causeId,
                        )
                        .eq(
                            'estado',
                            'esperando_aprobacion',
                        )
                        .select(
                            'id,estado',
                        )
                        .maybeSingle();

                if (error) {
                    throw error;
                }

                if (!data) {
                    throw new Error(
                        'La causa ya no está esperando aprobación.',
                    );
                }

                setCauses(
                    (current) =>
                        current.map(
                            (cause) =>
                                cause.id ===
                                    causeId
                                    ? {
                                        ...cause,
                                        estado:
                                            'aprobado',
                                        actualizado_en:
                                            now,
                                    }
                                    : cause,
                        ),
                );

                showToast(
                    'Causa aprobada correctamente.',
                    'success',
                );
            } catch (error) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : 'No se pudo aprobar la causa.',
                    'error',
                );
            } finally {
                setApprovingId(
                    null,
                );
            }
        };

    const requestDelete =
        (
            cause: CauseRow,
        ) => {
            if (
                deletingId
            ) {
                return;
            }

            setCauseToDelete(
                cause,
            );
        };

    const closeDeleteDialog =
        () => {
            if (
                deletingId
            ) {
                return;
            }

            setCauseToDelete(
                null,
            );
        };

    const deleteCause =
        async () => {
            const cause =
                causeToDelete;

            if (
                !cause ||
                deletingId
            ) {
                return;
            }

            setDeletingId(
                cause.id,
            );

            try {
                const storagePaths =
                    cause.imagenes
                        .map(
                            (image) =>
                                image.storage_path,
                        )
                        .filter(
                            (
                                path,
                            ): path is string =>
                                Boolean(path),
                        );

                const {
                    error,
                } =
                    await supabase
                        .from(
                            'causas',
                        )
                        .delete()
                        .eq(
                            'id',
                            cause.id,
                        );

                if (error) {
                    throw error;
                }

                if (
                    storagePaths.length
                ) {
                    const {
                        error:
                        storageError,
                    } =
                        await supabase.storage
                            .from(
                                'causas-imagenes',
                            )
                            .remove(
                                storagePaths,
                            );

                    if (
                        storageError
                    ) {
                        showToast(
                            'La causa se eliminó, pero algunos archivos no pudieron borrarse.',
                            'warning',
                        );
                    }
                }

                setCauses(
                    (current) =>
                        current.filter(
                            (item) =>
                                item.id !==
                                cause.id,
                        ),
                );

                if (
                    selectedCauseId ===
                    cause.id
                ) {
                    setSelectedCauseId(
                        null,
                    );
                }

                setCauseToDelete(
                    null,
                );

                showToast(
                    'Causa eliminada correctamente.',
                    'success',
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'No se pudo eliminar la causa.';

                showToast(
                    message
                        .toLowerCase()
                        .includes(
                            'foreign key',
                        )
                        ? 'No se puede eliminar esta causa porque tiene información relacionada.'
                        : message,
                    'error',
                );
            } finally {
                setDeletingId(
                    null,
                );
            }
        };

    return (
        <div className="w-full min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--emerald)]">
                        Gestión
                    </span>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text)] sm:text-xl">
                            Causas
                        </h2>

                        {!loading &&
                            waitingCount >
                            0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/15 bg-amber-300/10 px-2.5 py-1 text-[7px] font-semibold text-amber-200">
                                    <Clock3
                                        size={10}
                                    />

                                    {waitingCount}{' '}
                                    por revisar
                                </span>
                            )}
                    </div>

                    <p className="mt-1 text-[9px] leading-4 text-[var(--muted)] sm:text-[10px]">
                        Consulta, revisa, aprueba, crea, edita o elimina causas.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        onCreateCause
                    }
                    className="group flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400/10 px-4 text-[10px] font-semibold text-[var(--emerald-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/15 active:scale-[0.97] sm:w-auto"
                >
                    <Plus
                        size={16}
                        strokeWidth={2}
                        className="transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110 group-active:rotate-[360deg]"
                    />

                    Crear causa
                </button>
            </div>

            <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter(
                            'esperando_aprobacion',
                        )
                    }
                    className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-all duration-300 ${statusFilter ===
                            'esperando_aprobacion'
                            ? 'border-amber-300/20 bg-amber-300/[0.07]'
                            : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.035]'
                        }`}
                >
                    <div>
                        <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                            Por revisar
                        </span>

                        <strong className="mt-1 block text-lg font-bold text-amber-200">
                            {
                                waitingCount
                            }
                        </strong>
                    </div>

                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300/[0.08] text-amber-200">
                        <Clock3
                            size={15}
                        />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter(
                            'aprobado',
                        )
                    }
                    className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-all duration-300 ${statusFilter ===
                            'aprobado'
                            ? 'border-cyan-300/20 bg-cyan-300/[0.07]'
                            : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.035]'
                        }`}
                >
                    <div>
                        <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                            Aprobadas
                        </span>

                        <strong className="mt-1 block text-lg font-bold text-cyan-300">
                            {
                                approvedCount
                            }
                        </strong>
                    </div>

                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/[0.08] text-cyan-300">
                        <CheckCircle2
                            size={15}
                        />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter(
                            'publicado',
                        )
                    }
                    className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-all duration-300 ${statusFilter ===
                            'publicado'
                            ? 'border-emerald-400/20 bg-emerald-400/[0.07]'
                            : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.035]'
                        }`}
                >
                    <div>
                        <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                            Publicadas
                        </span>

                        <strong className="mt-1 block text-lg font-bold text-emerald-300">
                            {
                                publishedCount
                            }
                        </strong>
                    </div>

                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                        <HeartHandshake
                            size={15}
                        />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter(
                            'borrador',
                        )
                    }
                    className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-all duration-300 ${statusFilter ===
                            'borrador'
                            ? 'border-slate-300/15 bg-slate-300/[0.06]'
                            : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.035]'
                        }`}
                >
                    <div>
                        <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                            Borradores
                        </span>

                        <strong className="mt-1 block text-lg font-bold text-slate-300">
                            {
                                draftCount
                            }
                        </strong>
                    </div>

                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-300/[0.07] text-slate-300">
                        <Edit3
                            size={15}
                        />
                    </div>
                </button>
            </div>

            <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-3 sm:p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.08] text-[var(--emerald)]">
                            <HeartHandshake
                                size={18}
                            />
                        </div>

                        <div className="min-w-0">
                            <span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                                Registros
                            </span>

                            <span className="text-[10px] font-semibold text-[var(--text-soft)]">
                                {loading
                                    ? 'Cargando...'
                                    : `${filteredCauses.length} ${filteredCauses.length ===
                                        1
                                        ? 'causa'
                                        : 'causas'
                                    }`}
                            </span>
                        </div>
                    </div>

                    <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
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
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="Buscar causa o solicitante..."
                                className="h-11 w-full min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.025] pl-10 pr-4 text-[11px] text-[var(--text)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-emerald-400/25 focus:bg-white/[0.04]"
                            />
                        </div>

                        <div className="relative min-w-0">
                            <select
                                value={
                                    categoryFilter
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCategoryFilter(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] font-medium text-[var(--text-soft)] outline-none transition-all focus:border-emerald-400/25 focus:bg-white/[0.04]"
                                aria-label="Filtrar por categoría"
                            >
                                <option value="todas">
                                    Todas las categorías
                                </option>

                                {categories.map(
                                    (
                                        category,
                                    ) => (
                                        <option
                                            key={
                                                category
                                            }
                                            value={
                                                category
                                            }
                                        >
                                            {formatCategory(
                                                category,
                                            )}
                                        </option>
                                    ),
                                )}
                            </select>

                            <ChevronDown
                                size={14}
                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                            />
                        </div>

                        <div className="relative min-w-0">
                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setStatusFilter(
                                        event.target
                                            .value as CauseStatusFilter,
                                    )
                                }
                                className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] font-medium text-[var(--text-soft)] outline-none transition-all focus:border-emerald-400/25 focus:bg-white/[0.04]"
                                aria-label="Filtrar por estado"
                            >
                                <option value="todos">
                                    Todos los estados
                                </option>

                                <option value="esperando_aprobacion">
                                    Esperando aprobación
                                </option>

                                <option value="aprobado">
                                    Aprobado
                                </option>

                                <option value="publicado">
                                    Publicado
                                </option>

                                <option value="borrador">
                                    Borrador
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
                                className="flex h-11 w-full items-center justify-center rounded-xl bg-white/[0.04] px-4 text-[9px] font-semibold text-[var(--muted)] transition-all hover:bg-white/[0.07] hover:text-[var(--text)] lg:w-auto"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {loading ? (
                <div className="flex min-h-[280px] items-center justify-center">
                    <Loader2
                        size={25}
                        className="animate-spin text-[var(--emerald)]"
                    />
                </div>
            ) : filteredCauses.length ===
                0 ? (
                <div className="mt-4 flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.018] px-5 text-center">
                    <HeartHandshake
                        size={27}
                        className="text-[var(--emerald)]"
                    />

                    <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">
                        {hasFilters
                            ? 'No se encontraron causas'
                            : 'No hay causas registradas'}
                    </h3>

                    <p className="mt-1 max-w-[300px] text-[9px] leading-4 text-[var(--muted)]">
                        {hasFilters
                            ? 'No hay causas que coincidan con los filtros seleccionados.'
                            : 'Crea la primera causa para comenzar.'}
                    </p>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={
                                clearFilters
                            }
                            className="mt-4 flex h-9 items-center justify-center rounded-xl bg-white/[0.05] px-4 text-[9px] font-semibold text-[var(--text-soft)] transition-all hover:bg-white/[0.08]"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    {filteredCauses.map(
                        (
                            cause,
                        ) => {
                            const selected =
                                selectedCauseId ===
                                cause.id;

                            const waiting =
                                cause.estado ===
                                'esperando_aprobacion';

                            const creatorName =
                                cause.creador
                                    ?.nombre_completo?.trim() ||
                                cause.creador
                                    ?.alias?.trim() ||
                                cause.creador
                                    ?.correo?.split(
                                        '@',
                                    )[0] ||
                                null;

                            return (
                                <article
                                    key={
                                        cause.id
                                    }
                                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${selected
                                            ? 'border-amber-300/15 bg-white/[0.032] shadow-[0_16px_45px_rgba(0,0,0,.15)]'
                                            : waiting
                                                ? 'border-amber-300/[0.11] bg-amber-300/[0.018] hover:border-amber-300/[0.18]'
                                                : 'border-white/[0.055] bg-white/[0.022] hover:border-white/[0.09] hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[105px_minmax(220px,1.5fr)_150px_170px_140px_auto] lg:items-center">
                                        <CauseImagePreview
                                            src={
                                                cause.imagen_url
                                            }
                                            title={
                                                cause.titulo
                                            }
                                            featured={
                                                cause.destacada
                                            }
                                            className="h-[150px] w-full rounded-xl border border-white/[0.05] sm:h-[180px] lg:h-[70px] lg:w-[105px]"
                                        />

                                        <div className="min-w-0">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <h3 className="truncate text-[11px] font-semibold text-[var(--text)]">
                                                    {
                                                        cause.titulo
                                                    }
                                                </h3>

                                                {waiting && (
                                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-35" />
                                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-300" />
                                                    </span>
                                                )}
                                            </div>

                                            <span className="mt-1 block truncate text-[8px] text-[var(--muted)]">
                                                {
                                                    cause.slug
                                                }
                                            </span>

                                            {creatorName && (
                                                <span className="mt-1.5 block truncate text-[8px] text-amber-200/70">
                                                    Solicitante:{' '}
                                                    {
                                                        creatorName
                                                    }
                                                </span>
                                            )}

                                            {cause.ubicacion && (
                                                <span className="mt-1.5 flex min-w-0 items-center gap-1 text-[8px] text-[var(--muted)]">
                                                    <MapPin
                                                        size={10}
                                                        className="shrink-0 text-emerald-400/60"
                                                    />

                                                    <span className="truncate">
                                                        {
                                                            cause.ubicacion
                                                        }
                                                    </span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                Categoría
                                            </span>

                                            <span className="mt-1 block truncate text-[9px] text-[var(--text-soft)]">
                                                {formatCategory(
                                                    cause.categoria,
                                                )}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                Estado
                                            </span>

                                            <span
                                                className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[7px] font-semibold ${statusClass(
                                                    cause.estado,
                                                )}`}
                                            >
                                                {cause.estado ===
                                                    'esperando_aprobacion' && (
                                                        <Clock3
                                                            size={10}
                                                        />
                                                    )}

                                                {cause.estado ===
                                                    'aprobado' && (
                                                        <CheckCircle2
                                                            size={10}
                                                        />
                                                    )}

                                                {statusLabel(
                                                    cause.estado,
                                                )}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)] lg:hidden">
                                                Meta
                                            </span>

                                            <span className="mt-1 block truncate text-[9px] font-semibold text-[var(--text-soft)]">
                                                {cause.tipo_meta ===
                                                    'especie'
                                                    ? `${cause.productos.length} ${cause.productos.length ===
                                                        1
                                                        ? 'producto'
                                                        : 'productos'
                                                    }`
                                                    : formatCurrency(
                                                        cause.meta_economica,
                                                    )}
                                            </span>

                                            <span className="mt-1 block text-[7px] text-[var(--muted)]">
                                                {formatDate(
                                                    cause.creado_en,
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                                            {waiting && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedCauseId(
                                                            selected
                                                                ? null
                                                                : cause.id,
                                                        )
                                                    }
                                                    className="group flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-300/[0.09] px-3 text-[8px] font-semibold text-amber-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300/[0.15] active:scale-95"
                                                    aria-label={`Revisar ${cause.titulo}`}
                                                >
                                                    <Eye
                                                        size={13}
                                                        className="transition-transform duration-300 group-hover:scale-110"
                                                    />

                                                    {selected
                                                        ? 'Cerrar'
                                                        : 'Revisar'}
                                                </button>
                                            )}

                                            {!waiting && (
                                                <>
                                                    {(cause.estado ===
                                                        'aprobado') && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedCauseId(
                                                                        selected
                                                                            ? null
                                                                            : cause.id,
                                                                    )
                                                                }
                                                                className="group grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300/[0.13] active:scale-95"
                                                                aria-label={`Ver ${cause.titulo}`}
                                                            >
                                                                <Eye
                                                                    size={14}
                                                                    className="transition-transform duration-300 group-hover:scale-110"
                                                                />
                                                            </button>
                                                        )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onEditCause(
                                                                cause.id,
                                                            )
                                                        }
                                                        className="group grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/[0.07] text-emerald-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/[0.13] active:scale-95"
                                                        aria-label={`Editar ${cause.titulo}`}
                                                    >
                                                        <Edit3
                                                            size={14}
                                                            className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                                                        />
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                type="button"
                                                disabled={
                                                    deletingId ===
                                                    cause.id
                                                }
                                                onClick={() =>
                                                    requestDelete(
                                                        cause,
                                                    )
                                                }
                                                className="group grid h-9 w-9 place-items-center rounded-xl bg-rose-400/[0.07] text-rose-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-400/[0.13] active:scale-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
                                                aria-label={`Eliminar ${cause.titulo}`}
                                            >
                                                {deletingId ===
                                                    cause.id ? (
                                                    <Loader2
                                                        size={14}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Trash2
                                                        size={14}
                                                        className="transition-transform duration-300 group-hover:scale-110"
                                                    />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {selected &&
                                        selectedCause &&
                                        selectedCause.id ===
                                        cause.id && (
                                            <AdminCauseApprovalDetail
                                                cause={
                                                    selectedCause
                                                }
                                                approving={
                                                    approvingId ===
                                                    selectedCause.id
                                                }
                                                onClose={() =>
                                                    setSelectedCauseId(
                                                        null,
                                                    )
                                                }
                                                onApprove={() =>
                                                    approveCause(
                                                        selectedCause.id,
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

            <ConfirmDialog
                open={
                    Boolean(
                        causeToDelete,
                    )
                }
                title="Eliminar causa"
                description={
                    causeToDelete
                        ? `¿Seguro que deseas eliminar “${causeToDelete.titulo}”? La causa, sus imágenes y sus metas asociadas serán eliminadas permanentemente. Esta acción no se puede deshacer.`
                        : ''
                }
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                loading={
                    Boolean(
                        deletingId,
                    )
                }
                tone="danger"
                icon={
                    <Trash2
                        size={20}
                    />
                }
                onCancel={
                    closeDeleteDialog
                }
                onConfirm={
                    deleteCause
                }
            />
        </div>
    );
}