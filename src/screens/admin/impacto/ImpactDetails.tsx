import {
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    ExternalLink,
    Eye,
    EyeOff,
    File,
    FileImage,
    FileText,
    FolderOpen,
    Loader2,
    MapPin,
    ShieldCheck,
    ShieldX,
    UserRound,
} from 'lucide-react';

import type {
    ImpactFile,
    ImpactRow,
} from './impactTypes';

import {
    formatCurrency,
    formatDate,
    formatEvidenceType,
    getInitials,
    getProfileName,
    verificationClass,
    visibilityClass,
} from './impactUtils';

interface ImpactDetailsProps {
    evidence: ImpactRow;
    updating: boolean;
    onVerify: (
        verified: boolean,
    ) => void | Promise<void>;
    onVisibilityChange: (
        visible: boolean,
    ) => void | Promise<void>;
}

function EvidenceIcon({
    file,
}: {
    file: ImpactFile;
}) {
    if (
        file.tipo
            .toLowerCase()
            .includes(
                'foto',
            ) ||
        file.tipo
            .toLowerCase()
            .includes(
                'imagen',
            )
    ) {
        return (
            <FileImage
                size={16}
            />
        );
    }

    if (
        file.tipo
            .toLowerCase()
            .includes(
                'document',
            ) ||
        file.nombre_archivo
            ?.toLowerCase()
            .endsWith(
                '.pdf',
            )
    ) {
        return (
            <FileText
                size={16}
            />
        );
    }

    return (
        <File
            size={16}
        />
    );
}

export default function ImpactDetails({
    evidence,
    updating,
    onVerify,
    onVisibilityChange,
}: ImpactDetailsProps) {
    const creatorName =
        getProfileName(
            evidence.creador,
        );

    const verifierName =
        evidence.verificador
            ? getProfileName(
                evidence.verificador,
            )
            : null;

    return (
        <div className="border-t border-white/[0.05] bg-black/[0.08] p-3 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
                <main className="min-w-0 space-y-4">
                    <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <span className="block text-[7px] font-bold uppercase tracking-[0.15em] text-violet-300">
                                    Evidencia de impacto
                                </span>

                                <h3 className="mt-1.5 text-[14px] font-bold tracking-[-0.02em] text-[var(--text)] sm:text-base">
                                    {
                                        evidence.titulo
                                    }
                                </h3>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[7px] font-semibold ${verificationClass(
                                            evidence.verificada,
                                        )}`}
                                    >
                                        {evidence.verificada ? (
                                            <CheckCircle2
                                                size={10}
                                            />
                                        ) : (
                                            <ShieldX
                                                size={10}
                                            />
                                        )}

                                        {evidence.verificada
                                            ? 'Verificada'
                                            : 'Pendiente de verificar'}
                                    </span>

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
                            </div>
                        </div>

                        {evidence.descripcion && (
                            <p className="mt-4 whitespace-pre-wrap border-t border-white/[0.05] pt-4 text-[9px] leading-5 text-[var(--text-soft)] sm:text-[10px]">
                                {
                                    evidence.descripcion
                                }
                            </p>
                        )}
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/[0.08] text-violet-300">
                                    <MapPin
                                        size={17}
                                    />
                                </div>

                                <div className="min-w-0">
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                        Causa
                                    </span>

                                    <span className="mt-1 block text-[10px] font-semibold text-[var(--text)]">
                                        {evidence.causa
                                            ?.titulo ??
                                            'Causa no disponible'}
                                    </span>

                                    {evidence.causa
                                        ?.categoria && (
                                            <span className="mt-1 block text-[8px] text-[var(--muted)]">
                                                {
                                                    evidence
                                                        .causa
                                                        .categoria
                                                }
                                            </span>
                                        )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-300/[0.08] text-amber-200">
                                    <CalendarDays
                                        size={17}
                                    />
                                </div>

                                <div>
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                        Fecha de entrega
                                    </span>

                                    <span className="mt-1 block text-[10px] font-semibold text-[var(--text)]">
                                        {formatDate(
                                            evidence.fecha_entrega,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-400/[0.02] p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-emerald-300/60">
                                    Monto utilizado
                                </span>

                                <strong className="mt-2 block text-2xl font-bold tracking-[-0.04em] text-emerald-300">
                                    {formatCurrency(
                                        evidence.monto_utilizado ?? 0,
                                    )}
                                </strong>
                            </div>

                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/[0.08] text-emerald-300">
                                <CircleDollarSign
                                    size={19}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <FolderOpen
                                    size={16}
                                    className="text-cyan-300"
                                />

                                <div>
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                        Archivos
                                    </span>

                                    <h3 className="mt-0.5 text-[10px] font-semibold text-[var(--text)]">
                                        Evidencia presentada
                                    </h3>
                                </div>
                            </div>

                            <span className="rounded-full bg-cyan-300/[0.08] px-2.5 py-1 text-[8px] font-semibold text-cyan-300">
                                {
                                    evidence.archivos.length
                                }
                            </span>
                        </div>

                        {evidence.archivos.length ? (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {evidence.archivos.map(
                                    (
                                        file,
                                    ) => (
                                        <article
                                            key={
                                                file.id
                                            }
                                            className="group overflow-hidden rounded-xl border border-white/[0.055] bg-white/[0.02] transition-all hover:border-cyan-300/15 hover:bg-cyan-300/[0.025]"
                                        >
                                            {file.url &&
                                                (
                                                    file.tipo
                                                        .toLowerCase()
                                                        .includes(
                                                            'foto',
                                                        ) ||
                                                    file.tipo
                                                        .toLowerCase()
                                                        .includes(
                                                            'imagen',
                                                        )
                                                ) && (
                                                    <div className="h-36 overflow-hidden bg-black/20">
                                                        <img
                                                            src={
                                                                file.url
                                                            }
                                                            alt={
                                                                file.nombre_archivo ??
                                                                'Evidencia'
                                                            }
                                                            loading="lazy"
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                                        />
                                                    </div>
                                                )}

                                            <div className="flex min-w-0 items-center gap-3 p-3">
                                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
                                                    <EvidenceIcon
                                                        file={
                                                            file
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <span className="block truncate text-[9px] font-semibold text-[var(--text-soft)]">
                                                        {file.nombre_archivo ??
                                                            'Archivo de evidencia'}
                                                    </span>

                                                    <span className="mt-0.5 block text-[7px] text-[var(--muted)]">
                                                        {formatEvidenceType(
                                                            file.tipo,
                                                        )}
                                                    </span>
                                                </div>

                                                {file.url && (
                                                    <a
                                                        href={
                                                            file.url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-[var(--muted)] transition-all hover:bg-cyan-300/[0.08] hover:text-cyan-300"
                                                        aria-label="Abrir archivo"
                                                    >
                                                        <ExternalLink
                                                            size={13}
                                                        />
                                                    </a>
                                                )}
                                            </div>

                                            {!file.url && (
                                                <div className="border-t border-white/[0.045] px-3 py-2.5">
                                                    <span className="block break-all font-mono text-[7px] leading-4 text-[var(--muted)]">
                                                        {
                                                            file.ruta_storage
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </article>
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-white/[0.07] p-5 text-center">
                                <FileText
                                    size={20}
                                    className="mx-auto text-[var(--muted)]"
                                />

                                <span className="mt-2 block text-[8px] text-[var(--muted)]">
                                    Esta evidencia no tiene archivos asociados.
                                </span>
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/[0.08] text-violet-300">
                                {evidence.creador?.avatar_url ? (
                                    <img
                                        src={
                                            evidence.creador.avatar_url
                                        }
                                        alt={
                                            creatorName
                                        }
                                        className="h-full w-full rounded-xl object-cover"
                                    />
                                ) : (
                                    <span className="text-[10px] font-black">
                                        {getInitials(
                                            creatorName,
                                        )}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0">
                                <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                    Registrada por
                                </span>

                                <span className="mt-1 block truncate text-[10px] font-semibold text-[var(--text)]">
                                    {
                                        creatorName
                                    }
                                </span>

                                {evidence.creador
                                    ?.correo && (
                                        <span className="mt-0.5 block truncate text-[8px] text-[var(--muted)]">
                                            {
                                                evidence
                                                    .creador
                                                    .correo
                                            }
                                        </span>
                                    )}
                            </div>
                        </div>
                    </section>
                </main>

                <aside className="min-w-0">
                    <div className="space-y-4 xl:sticky xl:top-4">
                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Información
                            </span>

                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Verificación
                                    </span>

                                    <span
                                        className={`rounded-full border px-2.5 py-1 text-[7px] font-semibold ${verificationClass(
                                            evidence.verificada,
                                        )}`}
                                    >
                                        {evidence.verificada
                                            ? 'Verificada'
                                            : 'Pendiente'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Visibilidad
                                    </span>

                                    <span
                                        className={`rounded-full border px-2.5 py-1 text-[7px] font-semibold ${visibilityClass(
                                            evidence.publica,
                                        )}`}
                                    >
                                        {evidence.publica
                                            ? 'Pública'
                                            : 'Privada'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Registrada
                                    </span>

                                    <span className="text-right text-[8px] text-[var(--text-soft)]">
                                        {formatDate(
                                            evidence.creado_en,
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[8px] text-[var(--muted)]">
                                        Archivos
                                    </span>

                                    <span className="text-[8px] font-semibold text-cyan-300">
                                        {
                                            evidence.archivos.length
                                        }
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-violet-400/[0.08] bg-violet-400/[0.018] p-4">
                            <div className="flex items-start gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-400/[0.08] text-violet-300">
                                    <ShieldCheck
                                        size={16}
                                    />
                                </div>

                                <div>
                                    <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-violet-300/70">
                                        Verificación
                                    </span>

                                    <p className="mt-1 text-[8px] leading-4 text-[var(--muted)]">
                                        Revisa la información y archivos antes de verificar la evidencia.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    void onVerify(
                                        !evidence.verificada,
                                    )
                                }
                                disabled={
                                    updating
                                }
                                className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[9px] font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${evidence.verificada
                                        ? 'bg-rose-400/[0.07] text-rose-300 hover:bg-rose-400/[0.12]'
                                        : 'bg-emerald-400/[0.09] text-emerald-300 hover:bg-emerald-400/[0.15]'
                                    }`}
                            >
                                {updating ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : evidence.verificada ? (
                                    <ShieldX
                                        size={14}
                                    />
                                ) : (
                                    <CheckCircle2
                                        size={14}
                                    />
                                )}

                                {evidence.verificada
                                    ? 'Quitar verificación'
                                    : 'Verificar evidencia'}
                            </button>
                        </section>

                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Visibilidad
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    void onVisibilityChange(
                                        !evidence.publica,
                                    )
                                }
                                disabled={
                                    updating
                                }
                                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] text-[9px] font-semibold text-[var(--text-soft)] transition-all hover:bg-white/[0.07] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {evidence.publica ? (
                                    <EyeOff
                                        size={14}
                                    />
                                ) : (
                                    <Eye
                                        size={14}
                                    />
                                )}

                                {evidence.publica
                                    ? 'Hacer privada'
                                    : 'Hacer pública'}
                            </button>
                        </section>

                        {evidence.verificada &&
                            evidence.verificada_en && (
                                <section className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-400/[0.018] p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2
                                            size={16}
                                            className="mt-0.5 shrink-0 text-emerald-300"
                                        />

                                        <div className="min-w-0">
                                            <span className="block text-[8px] font-semibold text-emerald-300">
                                                Evidencia verificada
                                            </span>

                                            <span className="mt-1 block text-[7px] text-[var(--muted)]">
                                                {formatDate(
                                                    evidence.verificada_en,
                                                )}
                                            </span>

                                            {verifierName && (
                                                <span className="mt-1 block truncate text-[8px] text-[var(--text-soft)]">
                                                    Por{' '}
                                                    {
                                                        verifierName
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <UserRound
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                                />

                                <div className="min-w-0">
                                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                        ID de evidencia
                                    </span>

                                    <span className="mt-1 block break-all font-mono text-[7px] leading-4 text-[var(--muted)]">
                                        {
                                            evidence.id
                                        }
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