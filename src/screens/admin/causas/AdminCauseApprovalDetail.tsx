import {
    Building2,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock3,
    ImageIcon,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    Target,
    UserRound,
    X,
} from 'lucide-react';

import type {
    CauseRow,
} from './adminCauseTypes';

interface AdminCauseApprovalDetailProps {
    cause: CauseRow;
    approving: boolean;
    onApprove: () => void | Promise<void>;
    onClose: () => void;
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

export default function AdminCauseApprovalDetail({
    cause,
    approving,
    onApprove,
    onClose,
}: AdminCauseApprovalDetailProps) {
    const waiting =
        cause.estado ===
        'esperando_aprobacion';

    const approved =
        cause.estado ===
        'aprobado';

    const creatorName =
        cause.creador?.nombre_completo?.trim() ||
        cause.creador?.alias?.trim() ||
        cause.creador?.correo?.split('@')[0] ||
        'Usuario';

    return (
        <div className="border-t border-white/[0.05] bg-black/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                    {waiting ? (
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

                            <div className="rounded-xl bg-white/[0.025] p-3">
                                <span className="flex items-center gap-1.5 text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                    <CalendarDays
                                        size={10}
                                    />

                                    Inicio
                                </span>

                                <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                    {formatDate(
                                        cause.fecha_inicio,
                                    )}
                                </span>
                            </div>

                            <div className="rounded-xl bg-white/[0.025] p-3">
                                <span className="flex items-center gap-1.5 text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                    <CalendarDays
                                        size={10}
                                    />

                                    Fecha límite
                                </span>

                                <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                    {formatDate(
                                        cause.fecha_limite,
                                    )}
                                </span>
                            </div>
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
                                {waiting ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/15 bg-amber-300/10 px-2.5 py-1.5 text-[8px] font-semibold text-amber-200">
                                        <Clock3
                                            size={11}
                                        />

                                        Esperando aprobación
                                    </span>
                                ) : approved ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1.5 text-[8px] font-semibold text-emerald-300">
                                        <CheckCircle2
                                            size={11}
                                        />

                                        Aprobado
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

                        {waiting && (
                            <section className="rounded-2xl border border-amber-300/[0.09] bg-amber-300/[0.02] p-4">
                                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-amber-200/60">
                                    Revisión administrativa
                                </span>

                                <p className="mt-2 text-[8px] leading-4 text-[var(--muted)]">
                                    Revisa la información, las imágenes, el solicitante y la meta antes de aprobar.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void onApprove()
                                    }
                                    disabled={
                                        approving
                                    }
                                    className="group mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400/10 text-[9px] font-semibold text-emerald-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
                                >
                                    {approving ? (
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

                                    Aprobar causa
                                </button>
                            </section>
                        )}

                        {approved && (
                            <section className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2
                                        size={17}
                                        className="shrink-0 text-emerald-300"
                                    />

                                    <div>
                                        <span className="block text-[9px] font-semibold text-emerald-300">
                                            Causa aprobada
                                        </span>

                                        <span className="mt-1 block text-[7px] leading-4 text-[var(--muted)]">
                                            La solicitud ya fue revisada por administración.
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