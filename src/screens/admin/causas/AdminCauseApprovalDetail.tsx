import {
    Building2,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock3,
    ExternalLink,
    FileText,
    ImageIcon,
    Landmark,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    Target,
    UserRound,
    X,
} from 'lucide-react';

import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    supabase,
} from '../../../lib/supabase';

import type {
    CauseRow,
} from './adminCauseTypes';

interface AdminCauseApprovalDetailProps {
    cause: CauseRow;
    approving: boolean;
    onApprove: (
        fundId?: number,
    ) => void | Promise<void>;
    onClose: () => void;
}

interface CauseFile {
    id: string;
    storage_path: string;
    public_url: string;
    nombre_archivo: string | null;
    mime_type: string | null;
    size_bytes: number | null;
    orden: number;
}

interface FundOption {
    id: number;
    nombre_organizacion: string | null;
    institucion_bancaria: string | null;
    nombre_beneficiario: string | null;
    clabe: string | null;
    concepto_transferencia: string | null;
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

    return new Intl.NumberFormat(
        'es-MX',
        {
            style: 'currency',
            currency: 'MXN',
        },
    ).format(value);
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

function toLocalDateTimeValue(
    value: string | null,
) {
    if (!value) {
        return '';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return '';
    }

    const offset =
        date.getTimezoneOffset() *
        60000;

    return new Date(
        date.getTime() -
        offset,
    )
        .toISOString()
        .slice(
            0,
            16,
        );
}

function toIsoDateTime(
    value: string,
) {
    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return null;
    }

    return date.toISOString();
}

function formatBytes(
    value: number | null,
) {
    if (
        value === null ||
        value === undefined ||
        value <= 0
    ) {
        return '—';
    }

    if (
        value <
        1024 * 1024
    ) {
        return `${Math.max(
            1,
            Math.round(
                value / 1024,
            ),
        )} KB`;
    }

    return `${(
        value /
        1024 /
        1024
    ).toFixed(
        1,
    )} MB`;
}

export default function AdminCauseApprovalDetail({
    cause,
    approving,
    onApprove,
    onClose,
}: AdminCauseApprovalDetailProps) {
    const request =
        cause.estado ===
        ('solicitud' as typeof cause.estado);

    const published =
        cause.estado ===
        'publicado';

    const creatorName =
        cause.creador?.nombre_completo?.trim() ||
        cause.creador?.alias?.trim() ||
        cause.creador?.correo?.split('@')[0] ||
        'Usuario';

    const [
        files,
        setFiles,
    ] =
        useState<CauseFile[]>(
            [],
        );

    const [
        funds,
        setFunds,
    ] =
        useState<FundOption[]>(
            [],
        );

    const [
        selectedFundId,
        setSelectedFundId,
    ] =
        useState<string>(
            '',
        );

    const [
        loadingExtra,
        setLoadingExtra,
    ] =
        useState(
            true,
        );

    const [
        extraError,
        setExtraError,
    ] =
        useState<string | null>(
            null,
        );

    const [
        startDate,
        setStartDate,
    ] =
        useState(
            toLocalDateTimeValue(
                cause.fecha_inicio,
            ),
        );

    const [
        endDate,
        setEndDate,
    ] =
        useState(
            toLocalDateTimeValue(
                cause.fecha_limite,
            ),
        );

    const [
        savingDates,
        setSavingDates,
    ] =
        useState(
            false,
        );

    useEffect(
        () => {
            setStartDate(
                toLocalDateTimeValue(
                    cause.fecha_inicio,
                ),
            );

            setEndDate(
                toLocalDateTimeValue(
                    cause.fecha_limite,
                ),
            );
        },
        [
            cause.id,
            cause.fecha_inicio,
            cause.fecha_limite,
        ],
    );

    useEffect(
        () => {
            let active =
                true;

            const loadExtra =
                async () => {
                    setLoadingExtra(
                        true,
                    );

                    setExtraError(
                        null,
                    );

                    try {
                        const filesResult =
                            await supabase
                                .from(
                                    'archivos_causa',
                                )
                                .select(
                                    'id,storage_path,public_url,nombre_archivo,mime_type,size_bytes,orden',
                                )
                                .eq(
                                    'causa_id',
                                    cause.id,
                                )
                                .order(
                                    'orden',
                                    {
                                        ascending:
                                            true,
                                    },
                                );

                        if (
                            filesResult.error
                        ) {
                            throw filesResult.error;
                        }

                        if (
                            !active
                        ) {
                            return;
                        }

                        setFiles(
                            (
                                filesResult.data ??
                                []
                            ).map(
                                (
                                    item,
                                ) => ({
                                    id:
                                        item.id,
                                    storage_path:
                                        item.storage_path,
                                    public_url:
                                        item.public_url,
                                    nombre_archivo:
                                        item.nombre_archivo ??
                                        null,
                                    mime_type:
                                        item.mime_type ??
                                        null,
                                    size_bytes:
                                        item.size_bytes ===
                                            null ||
                                            item.size_bytes ===
                                            undefined
                                            ? null
                                            : Number(
                                                item.size_bytes,
                                            ),
                                    orden:
                                        Number(
                                            item.orden ??
                                            0,
                                        ),
                                }),
                            ),
                        );

                        if (
                            cause.tipo_meta ===
                            'economica'
                        ) {
                            const fundsResult =
                                await supabase
                                    .from(
                                        'configuracion_fondo',
                                    )
                                    .select(
                                        'id,nombre_organizacion,institucion_bancaria,nombre_beneficiario,clabe,concepto_transferencia',
                                    )
                                    .order(
                                        'id',
                                        {
                                            ascending:
                                                true,
                                        },
                                    );

                            if (
                                fundsResult.error
                            ) {
                                throw fundsResult.error;
                            }

                            if (
                                !active
                            ) {
                                return;
                            }

                            const loadedFunds:
                                FundOption[] =
                                (
                                    fundsResult.data ??
                                    []
                                ).map(
                                    (
                                        item,
                                    ) => ({
                                        id:
                                            Number(
                                                item.id,
                                            ),
                                        nombre_organizacion:
                                            item.nombre_organizacion ??
                                            null,
                                        institucion_bancaria:
                                            item.institucion_bancaria ??
                                            null,
                                        nombre_beneficiario:
                                            item.nombre_beneficiario ??
                                            null,
                                        clabe:
                                            item.clabe ??
                                            null,
                                        concepto_transferencia:
                                            item.concepto_transferencia ??
                                            null,
                                    }),
                                );

                            setFunds(
                                loadedFunds,
                            );

                            setSelectedFundId(
                                (
                                    current,
                                ) =>
                                    current &&
                                        loadedFunds.some(
                                            (
                                                item,
                                            ) =>
                                                String(
                                                    item.id,
                                                ) ===
                                                current,
                                        )
                                        ? current
                                        : loadedFunds.length ===
                                            1
                                            ? String(
                                                loadedFunds[0]
                                                    .id,
                                            )
                                            : '',
                            );
                        } else {
                            setFunds(
                                [],
                            );

                            setSelectedFundId(
                                '',
                            );
                        }

                    } catch (
                    error
                    ) {
                        if (
                            !active
                        ) {
                            return;
                        }

                        setExtraError(
                            error instanceof
                                Error
                                ? error.message
                                : 'No se pudieron cargar los archivos o la información bancaria.',
                        );
                    } finally {
                        if (
                            active
                        ) {
                            setLoadingExtra(
                                false,
                            );
                        }
                    }
                };

            void loadExtra();

            return () => {
                active =
                    false;
            };
        },
        [
            cause.id,
            cause.tipo_meta,
        ],
    );

    const dateRangeInvalid =
        Boolean(
            startDate &&
            endDate &&
            new Date(
                endDate,
            ).getTime() <=
            new Date(
                startDate,
            ).getTime(),
        );

    const publishCause =
        async () => {
            if (
                approving ||
                savingDates
            ) {
                return;
            }

            if (
                dateRangeInvalid
            ) {
                setExtraError(
                    'La fecha de término debe ser posterior a la fecha de inicio.',
                );

                return;
            }

            setSavingDates(
                true,
            );

            setExtraError(
                null,
            );

            try {
                const {
                    error,
                } =
                    await supabase
                        .from(
                            'causas',
                        )
                        .update({
                            fecha_inicio:
                                toIsoDateTime(
                                    startDate,
                                ),
                            fecha_limite:
                                toIsoDateTime(
                                    endDate,
                                ),
                            actualizado_en:
                                new Date().toISOString(),
                        })
                        .eq(
                            'id',
                            cause.id,
                        );

                if (
                    error
                ) {
                    throw error;
                }

                await onApprove(
                    selectedFundId
                        ? Number(
                            selectedFundId,
                        )
                        : undefined,
                );
            } catch (
            error
            ) {
                setExtraError(
                    error instanceof
                        Error
                        ? error.message
                        : 'No se pudieron guardar las fechas.',
                );
            } finally {
                setSavingDates(
                    false,
                );
            }
        };

    const selectedFund =
        useMemo(
            () =>
                funds.find(
                    (
                        item,
                    ) =>
                        String(
                            item.id,
                        ) ===
                        selectedFundId,
                ) ??
                null,
            [
                funds,
                selectedFundId,
            ],
        );

    const canPublish =
        !approving &&
        !savingDates &&
        !dateRangeInvalid &&
        (
            cause.tipo_meta !==
            'economica' ||
            Boolean(
                selectedFundId,
            )
        );

    return (
        <div className="border-t border-white/[0.05] bg-black/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                    {request ? (
                        <Clock3
                            size={15}
                            className="shrink-0 text-amber-300"
                        />
                    ) : (
                        <CheckCircle2
                            size={15}
                            className="shrink-0 text-emerald-300"
                        />
                    )}

                    <div className="min-w-0">
                        <span className="block text-[7px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Solicitud de causa
                        </span>

                        <span className="block truncate text-[10px] font-semibold text-[var(--text)]">
                            Revisión administrativa
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    disabled={
                        approving
                    }
                    className="group grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-[var(--muted)] transition-all duration-300 hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:opacity-40"
                    aria-label="Cerrar detalle"
                >
                    <X
                        size={15}
                        className="transition-transform duration-300 group-hover:rotate-90"
                    />
                </button>
            </div>

            <div className="grid gap-4 p-3 sm:p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <main className="min-w-0 space-y-4">
                    <section className="overflow-hidden rounded-2xl border border-white/[0.055] bg-white/[0.022]">
                        {cause.imagen_url ? (
                            <div className="relative h-[220px] overflow-hidden sm:h-[320px]">
                                <img
                                    src={
                                        cause.imagen_url
                                    }
                                    alt={
                                        cause.titulo
                                    }
                                    className="h-full w-full object-cover"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-[#090f1c] via-black/5 to-transparent" />

                                <div className="absolute bottom-4 left-4 right-4">
                                    <span className="inline-flex rounded-lg border border-white/[0.08] bg-black/45 px-2.5 py-1 text-[8px] font-semibold text-white/80 backdrop-blur-md">
                                        {
                                            cause.categoria
                                        }
                                    </span>

                                    <h2 className="mt-2 max-w-3xl text-lg font-bold tracking-[-0.03em] text-white sm:text-2xl">
                                        {
                                            cause.titulo
                                        }
                                    </h2>
                                </div>
                            </div>
                        ) : (
                            <div className="flex min-h-[200px] flex-col items-center justify-center bg-gradient-to-br from-emerald-400/[0.06] to-transparent">
                                <ImageIcon
                                    size={28}
                                    className="text-[var(--muted)]"
                                />

                                <span className="mt-2 text-[8px] text-[var(--muted)]">
                                    Sin imagen principal
                                </span>
                            </div>
                        )}
                    </section>

                    {cause.imagenes.length >
                        1 && (
                            <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                    {cause.imagenes.map(
                                        (image) => (
                                            <div
                                                key={
                                                    image.id
                                                }
                                                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/[0.05] bg-black/20"
                                            >
                                                <img
                                                    src={
                                                        image.public_url
                                                    }
                                                    alt={
                                                        image.nombre_archivo ??
                                                        cause.titulo
                                                    }
                                                    loading="lazy"
                                                    className="h-full w-full object-cover"
                                                />

                                                {image.es_principal && (
                                                    <span className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[7px] font-semibold text-amber-200 backdrop-blur-md">
                                                        Principal
                                                    </span>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </section>
                        )}

                    <section className="rounded-2xl border border-violet-400/[0.08] bg-violet-400/[0.015] p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/[0.08] text-violet-300">
                                    <FileText
                                        size={17}
                                    />
                                </div>

                                <div>
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                        Documentación
                                    </span>

                                    <h3 className="mt-0.5 text-[10px] font-semibold text-[var(--text)]">
                                        Archivos enviados
                                    </h3>
                                </div>
                            </div>

                            <span className="rounded-full bg-violet-400/[0.08] px-2.5 py-1 text-[8px] font-semibold text-violet-300">
                                {files.length}
                            </span>
                        </div>

                        {loadingExtra ? (
                            <div className="mt-4 flex min-h-20 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.015]">
                                <Loader2
                                    size={16}
                                    className="animate-spin text-violet-300"
                                />
                            </div>
                        ) : files.length ? (
                            <div className="mt-4 space-y-2">
                                {files.map(
                                    (
                                        file,
                                        index,
                                    ) => (
                                        <a
                                            key={
                                                file.id
                                            }
                                            href={
                                                file.public_url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-all duration-300 hover:border-violet-400/20 hover:bg-violet-400/[0.035]"
                                        >
                                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/[0.08] text-violet-300">
                                                <FileText
                                                    size={15}
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <span className="block truncate text-[9px] font-semibold text-[var(--text)]">
                                                    {file.nombre_archivo ||
                                                        `Archivo ${index + 1}`}
                                                </span>

                                                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[7px] text-[var(--muted)]">
                                                    <span>
                                                        {file.mime_type ||
                                                            'Archivo'}
                                                    </span>

                                                    <span>
                                                        {formatBytes(
                                                            file.size_bytes,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <ExternalLink
                                                size={13}
                                                className="shrink-0 text-[var(--muted)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-300"
                                            />
                                        </a>
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-white/[0.06] p-4 text-center text-[8px] text-[var(--muted)]">
                                No hay archivos registrados.
                            </div>
                        )}

                        {extraError && (
                            <div className="mt-3 rounded-xl border border-rose-400/10 bg-rose-400/[0.04] p-3 text-[8px] leading-4 text-rose-300">
                                {extraError}
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                            <Building2
                                size={16}
                                className="text-emerald-300"
                            />

                            <h3 className="text-[10px] font-semibold text-[var(--text)]">
                                Información de la causa
                            </h3>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-white/[0.025] p-3">
                                <span className="block text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                    Categoría
                                </span>

                                <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                    {
                                        cause.categoria
                                    }
                                </span>
                            </div>

                            <div className="rounded-xl bg-white/[0.025] p-3">
                                <span className="block text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                    Tipo de meta
                                </span>

                                <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                    {cause.tipo_meta ===
                                        'especie'
                                        ? 'En especie'
                                        : 'Económica'}
                                </span>
                            </div>

                            <div className="rounded-xl bg-white/[0.025] p-3">
                                <span className="block text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                    Organizador
                                </span>

                                <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                    {cause.organizador ||
                                        '—'}
                                </span>
                            </div>

                            <div className="rounded-xl bg-white/[0.025] p-3">
                                <span className="block text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                    Beneficiario
                                </span>

                                <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                    {cause.beneficiario ||
                                        '—'}
                                </span>
                            </div>

                            {cause.ubicacion && (
                                <div className="rounded-xl bg-white/[0.025] p-3 sm:col-span-2">
                                    <span className="flex items-center gap-1.5 text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                        <MapPin
                                            size={10}
                                        />

                                        Ubicación
                                    </span>

                                    <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                        {
                                            cause.ubicacion
                                        }
                                    </span>
                                </div>
                            )}

                            <label className="rounded-xl bg-white/[0.025] p-3">
                                <span className="flex items-center gap-1.5 text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                    <CalendarDays
                                        size={10}
                                    />

                                    Fecha de inicio
                                </span>

                                <input
                                    type="datetime-local"
                                    value={
                                        startDate
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setStartDate(
                                            event.target.value,
                                        )
                                    }
                                    disabled={
                                        approving ||
                                        savingDates
                                    }
                                    className="mt-2 h-10 w-full rounded-xl border border-white/[0.06] bg-black/10 px-3 text-[9px] font-semibold text-[var(--text-soft)] outline-none transition-all focus:border-emerald-400/30 disabled:opacity-50"
                                />
                            </label>

                            <label className="rounded-xl bg-white/[0.025] p-3">
                                <span className="flex items-center gap-1.5 text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                    <CalendarDays
                                        size={10}
                                    />

                                    Fecha de término
                                </span>

                                <input
                                    type="datetime-local"
                                    value={
                                        endDate
                                    }
                                    min={
                                        startDate ||
                                        undefined
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setEndDate(
                                            event.target.value,
                                        )
                                    }
                                    disabled={
                                        approving ||
                                        savingDates
                                    }
                                    className={`mt-2 h-10 w-full rounded-xl border bg-black/10 px-3 text-[9px] font-semibold text-[var(--text-soft)] outline-none transition-all disabled:opacity-50 ${dateRangeInvalid
                                        ? 'border-rose-400/35 focus:border-rose-400/50'
                                        : 'border-white/[0.06] focus:border-emerald-400/30'
                                        }`}
                                />
                            </label>

                            {dateRangeInvalid && (
                                <div className="rounded-xl border border-rose-400/10 bg-rose-400/[0.04] p-3 text-[8px] text-rose-300 sm:col-span-2">
                                    La fecha de término debe ser posterior a la fecha de inicio.
                                </div>
                            )}
                        </div>
                    </section>

                    {cause.tipo_meta ===
                        'economica' ? (
                        <section className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-400/[0.018] p-4 sm:p-5">
                            <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                                    <Target
                                        size={17}
                                    />
                                </div>

                                <div>
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                        Meta económica solicitada
                                    </span>

                                    <strong className="mt-1 block text-xl font-bold text-emerald-300">
                                        {formatCurrency(
                                            cause.meta_economica,
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-white/[0.05] pt-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <Landmark
                                        size={14}
                                        className="text-cyan-300"
                                    />

                                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                        Cuenta para recibir aportaciones
                                    </span>
                                </div>

                                {loadingExtra ? (
                                    <div className="flex h-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                        <Loader2
                                            size={15}
                                            className="animate-spin text-cyan-300"
                                        />
                                    </div>
                                ) : funds.length ? (
                                    <>
                                        <div className="relative">
                                            <select
                                                value={
                                                    selectedFundId
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setSelectedFundId(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    approving
                                                }
                                                className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[9px] font-semibold text-[var(--text-soft)] outline-none transition-all focus:border-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    Selecciona una cuenta
                                                </option>

                                                {funds.map(
                                                    (
                                                        fund,
                                                    ) => (
                                                        <option
                                                            key={
                                                                fund.id
                                                            }
                                                            value={
                                                                String(
                                                                    fund.id,
                                                                )
                                                            }
                                                        >
                                                            {[
                                                                fund.nombre_organizacion,
                                                                fund.institucion_bancaria,
                                                                fund.clabe
                                                                    ? `•••• ${fund.clabe.slice(-4)}`
                                                                    : null,
                                                            ]
                                                                .filter(
                                                                    Boolean,
                                                                )
                                                                .join(
                                                                    ' · ',
                                                                ) ||
                                                                `Cuenta ${fund.id}`}
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            <ChevronDown
                                                size={14}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                            />
                                        </div>

                                        {selectedFund && (
                                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                <div className="rounded-xl bg-white/[0.025] p-3">
                                                    <span className="block text-[7px] uppercase tracking-[0.11em] text-[var(--muted)]">
                                                        Institución
                                                    </span>

                                                    <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                        {selectedFund.institucion_bancaria ||
                                                            '—'}
                                                    </span>
                                                </div>

                                                <div className="rounded-xl bg-white/[0.025] p-3">
                                                    <span className="block text-[7px] uppercase tracking-[0.11em] text-[var(--muted)]">
                                                        Beneficiario
                                                    </span>

                                                    <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                        {selectedFund.nombre_beneficiario ||
                                                            '—'}
                                                    </span>
                                                </div>

                                                <div className="rounded-xl bg-white/[0.025] p-3 sm:col-span-2">
                                                    <span className="block text-[7px] uppercase tracking-[0.11em] text-[var(--muted)]">
                                                        CLABE
                                                    </span>

                                                    <span className="mt-1 block break-all font-mono text-[10px] font-semibold text-cyan-300">
                                                        {selectedFund.clabe ||
                                                            '—'}
                                                    </span>
                                                </div>

                                                {selectedFund.concepto_transferencia && (
                                                    <div className="rounded-xl bg-white/[0.025] p-3 sm:col-span-2">
                                                        <span className="block text-[7px] uppercase tracking-[0.11em] text-[var(--muted)]">
                                                            Concepto
                                                        </span>

                                                        <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                            {selectedFund.concepto_transferencia}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-white/[0.06] p-4 text-center text-[8px] text-[var(--muted)]">
                                        No hay cuentas configuradas.
                                    </div>
                                )}
                            </div>
                        </section>
                    ) : (
                        <section className="rounded-2xl border border-cyan-300/[0.08] bg-white/[0.022] p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Package
                                        size={16}
                                        className="text-cyan-300"
                                    />

                                    <div>
                                        <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                            Meta en especie
                                        </span>

                                        <h3 className="mt-0.5 text-[10px] font-semibold text-[var(--text)]">
                                            Productos solicitados
                                        </h3>
                                    </div>
                                </div>

                                <span className="rounded-full bg-cyan-300/[0.08] px-2.5 py-1 text-[8px] font-semibold text-cyan-300">
                                    {
                                        cause.productos.length
                                    }
                                </span>
                            </div>

                            {cause.productos.length ? (
                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    {cause.productos.map(
                                        (
                                            product,
                                        ) => (
                                            <div
                                                key={
                                                    product.id
                                                }
                                                className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <span className="block truncate text-[9px] font-semibold text-[var(--text)]">
                                                            {
                                                                product.nombre
                                                            }
                                                        </span>

                                                        {product.descripcion && (
                                                            <span className="mt-1 block text-[7px] leading-4 text-[var(--muted)]">
                                                                {
                                                                    product.descripcion
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span className="shrink-0 text-[9px] font-semibold text-cyan-300">
                                                        {
                                                            product.cantidad_objetivo
                                                        }{' '}
                                                        {
                                                            product.unidad
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl border border-dashed border-white/[0.06] p-4 text-center text-[8px] text-[var(--muted)]">
                                    No hay productos registrados.
                                </div>
                            )}
                        </section>
                    )}

                    {cause.resumen && (
                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Resumen
                            </span>

                            <p className="mt-2 whitespace-pre-wrap text-[9px] leading-5 text-[var(--text-soft)] sm:text-[10px]">
                                {
                                    cause.resumen
                                }
                            </p>
                        </section>
                    )}

                    {cause.historia && (
                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Historia
                            </span>

                            <p className="mt-2 whitespace-pre-wrap text-[9px] leading-5 text-[var(--text-soft)] sm:text-[10px]">
                                {
                                    cause.historia
                                }
                            </p>
                        </section>
                    )}
                </main>

                <aside className="min-w-0">
                    <div className="space-y-4 xl:sticky xl:top-4">
                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Solicitante
                            </span>

                            <div className="mt-4 flex items-center gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-300/[0.08] text-amber-200">
                                    <UserRound
                                        size={17}
                                    />
                                </div>

                                <div className="min-w-0">
                                    <span className="block truncate text-[10px] font-semibold text-[var(--text)]">
                                        {
                                            creatorName
                                        }
                                    </span>

                                    {cause.creador?.alias && (
                                        <span className="mt-0.5 block truncate text-[8px] text-[var(--muted)]">
                                            @
                                            {
                                                cause.creador.alias
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>

                            {cause.creador?.correo && (
                                <div className="mt-3 flex min-w-0 items-center gap-2 border-t border-white/[0.05] pt-3">
                                    <Mail
                                        size={12}
                                        className="shrink-0 text-[var(--muted)]"
                                    />

                                    <span className="truncate text-[8px] text-[var(--text-soft)]">
                                        {
                                            cause.creador.correo
                                        }
                                    </span>
                                </div>
                            )}

                            {cause.creador?.telefono && (
                                <div className="mt-2 flex min-w-0 items-center gap-2">
                                    <Phone
                                        size={12}
                                        className="shrink-0 text-[var(--muted)]"
                                    />

                                    <span className="truncate text-[8px] text-[var(--text-soft)]">
                                        {
                                            cause.creador.telefono
                                        }
                                    </span>
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Estado
                            </span>

                            <div className="mt-3">
                                {request ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/15 bg-amber-300/10 px-2.5 py-1.5 text-[8px] font-semibold text-amber-200">
                                        <Clock3
                                            size={11}
                                        />

                                        Solicitud
                                    </span>
                                ) : published ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1.5 text-[8px] font-semibold text-emerald-300">
                                        <CheckCircle2
                                            size={11}
                                        />

                                        Publicado
                                    </span>
                                ) : (
                                    <span className="inline-flex rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-1.5 text-[8px] font-semibold text-[var(--text-soft)]">
                                        {
                                            cause.estado
                                        }
                                    </span>
                                )}
                            </div>
                        </section>

                        {request && (
                            <section className="rounded-2xl border border-amber-300/[0.09] bg-amber-300/[0.02] p-4">
                                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-amber-200/60">
                                    Revisión administrativa
                                </span>

                                <p className="mt-2 text-[8px] leading-4 text-[var(--muted)]">
                                    Revisa la información, las imágenes, los archivos, el solicitante, la meta, las fechas y la cuenta antes de publicar.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void publishCause()
                                    }
                                    disabled={
                                        !canPublish
                                    }
                                    className="group mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400/10 text-[9px] font-semibold text-emerald-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
                                >
                                    {approving ||
                                        savingDates ? (
                                        <Loader2
                                            size={15}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Check
                                            size={15}
                                            className="transition-transform duration-300 group-hover:scale-110"
                                        />
                                    )}

                                    Publicar causa
                                </button>

                                {cause.tipo_meta ===
                                    'economica' &&
                                    !selectedFundId &&
                                    !loadingExtra && (
                                        <span className="mt-2 block text-[7px] leading-4 text-amber-200">
                                            Selecciona una cuenta antes de publicar la causa económica.
                                        </span>
                                    )}
                            </section>
                        )}

                        {published && (
                            <section className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2
                                        size={17}
                                        className="shrink-0 text-emerald-300"
                                    />

                                    <div>
                                        <span className="block text-[9px] font-semibold text-emerald-300">
                                            Causa publicada
                                        </span>

                                        <span className="mt-1 block text-[7px] leading-4 text-[var(--muted)]">
                                            La solicitud ya fue revisada y publicada por administración.
                                        </span>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}