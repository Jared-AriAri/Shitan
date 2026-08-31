import {
    CheckCircle2,
    ExternalLink,
    FileImage,
    FileText,
    Gift,
    Mail,
    MapPin,
    Package,
    Phone,
    Receipt,
    UserRound,
    XCircle,
} from 'lucide-react';

import type {
    ContributionRow,
    ContributionStatus,
} from './contributionTypes';

import {
    contributionStatusClass,
    formatContributionStatus,
    formatContributionType,
    formatCurrency,
    formatDate,
    formatDonorAlias,
    formatEmail,
    formatFolio,
    formatPhone,
    formatReference,
    getDonorName,
    getInitials,
} from './contributionUtils';

interface ContributionDetailsProps {
    contribution: ContributionRow;
    updating: boolean;
    onUpdateStatus: (
        status: ContributionStatus,
    ) => void | Promise<void>;
}

function ReceiptIcon({
    mimeType,
}: {
    mimeType: string | null;
}) {
    if (
        mimeType?.startsWith(
            'image/',
        )
    ) {
        return (
            <FileImage
                size={15}
            />
        );
    }

    return (
        <FileText
            size={15}
        />
    );
}

export default function ContributionDetails({
    contribution,
    updating,
    onUpdateStatus,
}: ContributionDetailsProps) {
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

    const email =
        contribution.correo_donante ??
        contribution.perfil
            ?.correo ??
        null;

    const phone =
        contribution.telefono_donante ??
        contribution.perfil
            ?.telefono ??
        null;

    const alias =
        contribution.alias_donante ??
        contribution.perfil
            ?.alias ??
        null;

    const reviewerName =
        contribution.revisor
            ?.nombre_completo?.trim() ||
        contribution.revisor
            ?.alias?.trim() ||
        contribution.revisor
            ?.correo?.split('@')[0] ||
        null;

    return (
        <div className="border-t border-white/[0.05] bg-black/[0.08] p-3 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-4">
                    <section className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 text-[12px] font-black text-amber-200">
                                {getInitials(
                                    donorName,
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Donante
                                </span>

                                <h3 className="mt-0.5 truncate text-[12px] font-semibold text-[var(--text)]">
                                    {
                                        donorName
                                    }
                                </h3>

                                {alias &&
                                    !contribution.anonima && (
                                        <span className="mt-1 block truncate text-[8px] font-medium text-amber-200/70">
                                            {formatDonorAlias(
                                                alias,
                                            )}
                                        </span>
                                    )}

                                {email &&
                                    !contribution.anonima && (
                                        <span className="mt-2 flex min-w-0 items-center gap-1.5 text-[8px] text-[var(--muted)]">
                                            <Mail
                                                size={11}
                                                className="shrink-0"
                                            />

                                            <span className="truncate">
                                                {formatEmail(
                                                    email,
                                                )}
                                            </span>
                                        </span>
                                    )}

                                {phone &&
                                    !contribution.anonima && (
                                        <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[8px] text-[var(--muted)]">
                                            <Phone
                                                size={11}
                                                className="shrink-0"
                                            />

                                            <span className="truncate">
                                                {formatPhone(
                                                    phone,
                                                )}
                                            </span>
                                        </span>
                                    )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                        <div className="flex items-start gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                                <Gift
                                    size={16}
                                />
                            </div>

                            <div className="min-w-0">
                                <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                    Causa
                                </span>

                                <span className="mt-1 block text-[11px] font-semibold text-[var(--text)]">
                                    {contribution.causa
                                        ?.titulo ??
                                        'Causa no disponible'}
                                </span>

                                {contribution.causa
                                    ?.categoria && (
                                        <span className="mt-1 block text-[8px] text-[var(--muted)]">
                                            {
                                                contribution
                                                    .causa
                                                    .categoria
                                            }
                                        </span>
                                    )}
                            </div>
                        </div>
                    </section>

                    {contribution.tipo ===
                        'especie' ? (
                        <section className="rounded-2xl border border-cyan-300/[0.07] bg-white/[0.018] p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Package
                                        size={15}
                                        className="text-cyan-300"
                                    />

                                    <h3 className="text-[10px] font-semibold text-[var(--text)]">
                                        Productos aportados
                                    </h3>
                                </div>

                                <span className="rounded-full bg-cyan-300/[0.08] px-2.5 py-1 text-[8px] font-semibold text-cyan-300">
                                    {
                                        contribution
                                            .detalles
                                            .length
                                    }
                                </span>
                            </div>

                            {contribution
                                .detalles
                                .length ? (
                                <div className="space-y-2">
                                    {contribution.detalles.map(
                                        (
                                            item,
                                            index,
                                        ) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="rounded-xl border border-white/[0.045] bg-white/[0.025] px-3 py-3"
                                            >
                                                <div className="flex min-w-0 items-center justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-300/[0.07] text-[8px] font-bold text-cyan-300">
                                                            {index +
                                                                1}
                                                        </span>

                                                        <span className="min-w-0 truncate text-[9px] font-medium text-[var(--text-soft)]">
                                                            {
                                                                item.nombre
                                                            }
                                                        </span>
                                                    </div>

                                                    <span className="shrink-0 text-[9px] font-semibold text-[var(--text)]">
                                                        {
                                                            item.cantidad
                                                        }{' '}
                                                        {
                                                            item.unidad
                                                        }
                                                    </span>
                                                </div>

                                                {item.notas && (
                                                    <p className="ml-10 mt-2 text-[8px] leading-4 text-[var(--muted)]">
                                                        {
                                                            item.notas
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-white/[0.06] p-4 text-center text-[8px] text-[var(--muted)]">
                                    No hay productos registrados.
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="rounded-2xl border border-amber-300/[0.08] bg-amber-300/[0.025] p-4">
                            <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-amber-200/60">
                                Monto aportado
                            </span>

                            <strong className="mt-2 block text-2xl font-bold tracking-[-0.04em] text-amber-100">
                                {formatCurrency(
                                    contribution.monto,
                                )}
                            </strong>

                            <span className="mt-1 block text-[8px] text-[var(--muted)]">
                                Pesos mexicanos
                            </span>
                        </section>
                    )}

                    {contribution.mensaje && (
                        <section className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                            <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Mensaje del donante
                            </span>

                            <p className="mt-2 whitespace-pre-wrap text-[9px] leading-5 text-[var(--text-soft)]">
                                {
                                    contribution.mensaje
                                }
                            </p>
                        </section>
                    )}

                    <section className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Receipt
                                    size={15}
                                    className="text-cyan-300"
                                />

                                <h3 className="text-[10px] font-semibold text-[var(--text)]">
                                    {contribution.tipo ===
                                        'especie'
                                        ? 'Evidencia de entrega'
                                        : 'Comprobante de pago'}
                                </h3>
                            </div>

                            <span className="rounded-full bg-cyan-300/[0.08] px-2.5 py-1 text-[8px] font-semibold text-cyan-300">
                                {
                                    contribution
                                        .comprobantes
                                        .length
                                }
                            </span>
                        </div>

                        {contribution
                            .comprobantes
                            .length ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {contribution.comprobantes.map(
                                    (
                                        receipt,
                                    ) => {
                                        const isImage =
                                            receipt.tipo_mime
                                                ?.toLowerCase()
                                                .startsWith(
                                                    'image/',
                                                ) ??
                                            false;

                                        return (
                                            <div
                                                key={
                                                    receipt.id
                                                }
                                                className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]"
                                            >
                                                {isImage &&
                                                    receipt.url ? (
                                                    <a
                                                        href={
                                                            receipt.url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="group/image relative block aspect-[4/3] overflow-hidden bg-black/30"
                                                    >
                                                        <img
                                                            src={
                                                                receipt.url
                                                            }
                                                            alt={
                                                                receipt.nombre_archivo ??
                                                                'Evidencia de aportación'
                                                            }
                                                            loading="lazy"
                                                            className="h-full w-full object-contain transition-transform duration-500 group-hover/image:scale-[1.02]"
                                                        />

                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity group-hover/image:opacity-100" />

                                                        <div className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity group-hover/image:opacity-100">
                                                            <ExternalLink
                                                                size={13}
                                                            />
                                                        </div>
                                                    </a>
                                                ) : receipt.url ? (
                                                    <a
                                                        href={
                                                            receipt.url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex min-h-[150px] items-center justify-center bg-black/20"
                                                    >
                                                        <div className="text-center">
                                                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/[0.08] text-cyan-300">
                                                                <FileText
                                                                    size={20}
                                                                />
                                                            </div>

                                                            <span className="mt-3 flex items-center justify-center gap-1.5 text-[8px] font-semibold text-cyan-300">
                                                                Abrir comprobante

                                                                <ExternalLink
                                                                    size={11}
                                                                />
                                                            </span>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <div className="flex min-h-[150px] items-center justify-center bg-black/20">
                                                        <div className="text-center">
                                                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-[var(--muted)]">
                                                                <ReceiptIcon
                                                                    mimeType={
                                                                        receipt.tipo_mime
                                                                    }
                                                                />
                                                            </div>

                                                            <span className="mt-3 block text-[8px] text-[var(--muted)]">
                                                                No se pudo generar la vista previa
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="p-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
                                                            <ReceiptIcon
                                                                mimeType={
                                                                    receipt.tipo_mime
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <span className="block truncate text-[9px] font-medium text-[var(--text-soft)]">
                                                                {receipt.nombre_archivo ??
                                                                    'Comprobante'}
                                                            </span>

                                                            <span className="mt-0.5 block truncate text-[7px] text-[var(--muted)]">
                                                                {receipt.tipo_mime ??
                                                                    'Archivo'}
                                                            </span>

                                                            {receipt.tamano_bytes !==
                                                                null && (
                                                                    <span className="mt-0.5 block text-[7px] text-[var(--muted)]">
                                                                        {(
                                                                            receipt.tamano_bytes /
                                                                            1024 /
                                                                            1024
                                                                        ).toFixed(
                                                                            2,
                                                                        )}{' '}
                                                                        MB
                                                                    </span>
                                                                )}
                                                        </div>

                                                        {receipt.url && (
                                                            <a
                                                                href={
                                                                    receipt.url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-[var(--muted)] transition-all hover:bg-cyan-300/[0.08] hover:text-cyan-300"
                                                            >
                                                                <ExternalLink
                                                                    size={13}
                                                                />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-white/[0.06] p-4 text-center text-[8px] text-[var(--muted)]">
                                Esta aportación no tiene comprobantes.
                            </div>
                        )}
                    </section>

                    {contribution.estado ===
                        'rechazada' &&
                        contribution.motivo_rechazo && (
                            <section className="rounded-2xl border border-rose-400/[0.1] bg-rose-400/[0.035] p-4">
                                <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-rose-300/70">
                                    Motivo del rechazo
                                </span>

                                <p className="mt-2 whitespace-pre-wrap text-[9px] leading-5 text-rose-100/80">
                                    {
                                        contribution.motivo_rechazo
                                    }
                                </p>
                            </section>
                        )}
                </div>

                <aside className="min-w-0">
                    <div className="space-y-4 xl:sticky xl:top-4">
                        <section className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                            <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Información
                            </span>

                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Folio
                                    </span>

                                    <span className="font-mono text-[9px] font-semibold text-amber-200">
                                        {formatFolio(
                                            contribution.folio,
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Tipo
                                    </span>

                                    <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                        {formatContributionType(
                                            contribution.tipo,
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Estado
                                    </span>

                                    <span
                                        className={`rounded-full border px-2.5 py-1 text-[7px] font-semibold ${contributionStatusClass(
                                            contribution.estado,
                                        )}`}
                                    >
                                        {formatContributionStatus(
                                            contribution.estado,
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Fecha
                                    </span>

                                    <span className="text-right text-[8px] text-[var(--text-soft)]">
                                        {formatDate(
                                            contribution.creada_en,
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Privacidad
                                    </span>

                                    <span className="text-[8px] text-[var(--text-soft)]">
                                        {contribution.anonima
                                            ? 'Anónima'
                                            : 'Pública'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Referencia
                                    </span>

                                    <span className="max-w-[170px] truncate text-right font-mono text-[8px] text-[var(--text-soft)]">
                                        {formatReference(
                                            contribution.referencia_transferencia,
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Comprobantes
                                    </span>

                                    <span className="text-[8px] font-semibold text-cyan-300">
                                        {
                                            contribution
                                                .comprobantes
                                                .length
                                        }
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                            <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Revisión
                            </span>

                            <div className="mt-3">
                                <span
                                    className={`inline-flex rounded-full border px-3 py-1.5 text-[8px] font-semibold ${contributionStatusClass(
                                        contribution.estado,
                                    )}`}
                                >
                                    {formatContributionStatus(
                                        contribution.estado,
                                    )}
                                </span>

                                <div className="mt-3 grid gap-2">
                                    {contribution.estado !==
                                        'aprobada' && (
                                            <button
                                                type="button"
                                                disabled={
                                                    updating
                                                }
                                                onClick={() =>
                                                    void onUpdateStatus(
                                                        'aprobada',
                                                    )
                                                }
                                                className="group flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400/[0.08] text-[9px] font-semibold text-emerald-300 transition-all hover:bg-emerald-400/[0.14] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                                            >
                                                <CheckCircle2
                                                    size={14}
                                                    className="transition-transform group-hover:scale-110"
                                                />

                                                {contribution.estado ===
                                                    'rechazada'
                                                    ? 'Cambiar a aprobada'
                                                    : 'Aprobar aportación'}
                                            </button>
                                        )}

                                    {contribution.estado !==
                                        'rechazada' && (
                                            <button
                                                type="button"
                                                disabled={
                                                    updating
                                                }
                                                onClick={() =>
                                                    void onUpdateStatus(
                                                        'rechazada',
                                                    )
                                                }
                                                className="group flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-400/[0.07] text-[9px] font-semibold text-rose-300 transition-all hover:bg-rose-400/[0.13] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                                            >
                                                <XCircle
                                                    size={14}
                                                    className="transition-transform group-hover:scale-110"
                                                />

                                                {contribution.estado ===
                                                    'aprobada'
                                                    ? 'Cambiar a rechazada'
                                                    : 'Rechazar aportación'}
                                            </button>
                                        )}
                                </div>
                            </div>

                            {contribution.revisada_en && (
                                <div className="mt-4 border-t border-white/[0.05] pt-3">
                                    <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)]">
                                        Revisada
                                    </span>

                                    <span className="mt-1 block text-[8px] text-[var(--text-soft)]">
                                        {formatDate(
                                            contribution.revisada_en,
                                        )}
                                    </span>
                                </div>
                            )}

                            {reviewerName && (
                                <div className="mt-3">
                                    <span className="block text-[7px] uppercase tracking-[0.1em] text-[var(--muted)]">
                                        Revisada por
                                    </span>

                                    <span className="mt-1 block truncate text-[8px] font-semibold text-[var(--text-soft)]">
                                        {
                                            reviewerName
                                        }
                                    </span>
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                            <div className="flex items-start gap-3">
                                <UserRound
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                                />

                                <div className="min-w-0">
                                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                        ID de aportación
                                    </span>

                                    <span className="mt-1 block break-all font-mono text-[7px] leading-4 text-[var(--muted)]">
                                        {
                                            contribution.id
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-start gap-3 border-t border-white/[0.05] pt-3">
                                <UserRound
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                                />

                                <div className="min-w-0">
                                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                        ID del donante
                                    </span>

                                    <span className="mt-1 block break-all font-mono text-[7px] leading-4 text-[var(--muted)]">
                                        {
                                            contribution.donante_id
                                        }
                                    </span>
                                </div>
                            </div>

                            {contribution.causa
                                ?.slug && (
                                    <div className="mt-3 flex items-start gap-3 border-t border-white/[0.05] pt-3">
                                        <MapPin
                                            size={15}
                                            className="mt-0.5 shrink-0 text-[var(--muted)]"
                                        />

                                        <div className="min-w-0">
                                            <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                                Slug de causa
                                            </span>

                                            <span className="mt-1 block truncate text-[7px] text-[var(--muted)]">
                                                {
                                                    contribution
                                                        .causa
                                                        .slug
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}
                        </section>
                    </div>
                </aside>
            </div>
        </div>
    );
}