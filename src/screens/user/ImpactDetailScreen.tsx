import {
    useEffect,
    useState,
} from 'react';

import {
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    ExternalLink,
    FileText,
    ImageIcon,
    Images,
    ShieldCheck,
} from 'lucide-react';

import {
    createPortal,
} from 'react-dom';

export interface ImpactDetailFile {
    id: string;
    type:
    | 'imagen'
    | 'documento';
    name: string;
    storagePath: string;
    url: string;
    order: number;
}

export interface ImpactDetailItem {
    id: string;
    causeId: string;
    causeTitle: string;
    causeSummary: string | null;
    category: string;
    location: string | null;
    completedAt: string | null;
    title: string;
    description: string | null;
    deliveryDate: string | null;
    amountUsed: number;
    verifiedAt: string | null;
    createdAt: string;
    images: string[];
    files: ImpactDetailFile[];
    updates: number;
}

interface ImpactDetailProps {
    item: ImpactDetailItem | null;
    open: boolean;
    onClose: () => void;
    onViewCause?: () => void;
}

function formatMXN(
    amount: number,
) {
    return new Intl.NumberFormat(
        'es-MX',
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        },
    ).format(
        amount,
    );
}

function formatDate(
    value: string | null,
) {
    if (!value) {
        return '—';
    }

    const date =
        new Date(
            value,
        );

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
            month: 'long',
            year: 'numeric',
        },
    ).format(
        date,
    );
}

function formatCategory(
    value: string,
) {
    if (!value) {
        return 'Otra';
    }

    const clean =
        value
            .replace(
                /_/g,
                ' ',
            )
            .trim();

    return (
        clean
            .charAt(0)
            .toLocaleUpperCase(
                'es-MX',
            ) +
        clean.slice(1)
    );
}

export default function ImpactDetail({
    item,
    open,
    onClose,
    onViewCause,
}: ImpactDetailProps) {
    const [
        activeImage,
        setActiveImage,
    ] =
        useState(
            0,
        );

    useEffect(
        () => {
            if (
                !open
            ) {
                return;
            }

            setActiveImage(
                0,
            );

            const previousOverflow =
                document.body.style
                    .overflow;

            document.body.style.overflow =
                'hidden';

            const handleKeyDown =
                (
                    event:
                        KeyboardEvent,
                ) => {
                    if (
                        event.key ===
                        'Escape'
                    ) {
                        onClose();

                        return;
                    }

                    if (
                        !item?.images.length
                    ) {
                        return;
                    }

                    if (
                        event.key ===
                        'ArrowRight'
                    ) {
                        setActiveImage(
                            (
                                current,
                            ) =>
                                (
                                    current +
                                    1
                                ) %
                                item.images.length,
                        );
                    }

                    if (
                        event.key ===
                        'ArrowLeft'
                    ) {
                        setActiveImage(
                            (
                                current,
                            ) =>
                                current ===
                                    0
                                    ? item.images.length -
                                    1
                                    : current -
                                    1,
                        );
                    }
                };

            window.addEventListener(
                'keydown',
                handleKeyDown,
            );

            return () => {
                document.body.style.overflow =
                    previousOverflow;

                window.removeEventListener(
                    'keydown',
                    handleKeyDown,
                );
            };
        },
        [
            open,
            item,
            onClose,
        ],
    );

    if (
        !open ||
        !item
    ) {
        return null;
    }

    const imageFiles =
        item.files.filter(
            (
                file,
            ) =>
                file.type ===
                'imagen',
        );

    const documentFiles =
        item.files.filter(
            (
                file,
            ) =>
                file.type ===
                'documento',
        );

    const currentImage =
        item.images[
        activeImage
        ] ??
        null;

    return createPortal(
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-[190] overflow-hidden bg-black/80 backdrop-blur-[8px]">
            <style>
                {`
          @keyframes impactDetailEnter {
            from {
              opacity: 0;
              transform: translate3d(0, 18px, 0) scale(.99);
            }

            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          .impact-detail-scroll {
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-gutter: stable;
          }

          @media (hover: hover) and (pointer: fine) {
            .impact-detail-file {
              transition:
                transform .28s cubic-bezier(.22,1,.36,1),
                border-color .28s ease,
                background-color .28s ease;
            }

            .impact-detail-file:hover {
              transform: translateY(-2px);
              border-color: rgba(167,139,250,.16);
              background: rgba(167,139,250,.045);
            }

            .impact-detail-thumb {
              transition:
                transform .28s cubic-bezier(.22,1,.36,1),
                border-color .28s ease;
            }

            .impact-detail-thumb:hover {
              transform: translateY(-2px);
              border-color: rgba(255,255,255,.16);
            }
          }
        `}
            </style>

            <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col animate-[impactDetailEnter_.28s_cubic-bezier(.22,1,.36,1)] bg-[#080d17] sm:my-4 sm:h-[calc(100%-2rem)] sm:max-w-[1320px] sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-white/[0.07] sm:shadow-[0_30px_100px_rgba(0,0,0,.7)]">
                <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#080d17]/95 px-4 py-3.5 backdrop-blur-xl sm:px-5 lg:px-6">
                    <div className="min-w-0 flex-1">
                        <span className="block truncate text-[8px] font-bold uppercase tracking-[0.18em] text-violet-300">
                            Evidencia de impacto
                        </span>

                        <h1 className="mt-0.5 truncate text-base font-bold tracking-[-0.03em] text-[var(--text)] sm:text-lg">
                            {
                                item.title
                            }
                        </h1>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2 py-1.5 text-[6px] font-semibold text-emerald-300 sm:px-2.5 sm:text-[7px]">
                            <CheckCircle2
                                size={9}
                            />

                            Verificada
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/15 bg-violet-400/[0.08] px-2 py-1.5 text-[6px] font-semibold text-violet-300 sm:px-2.5 sm:text-[7px]">
                            Pública
                        </span>
                    </div>
                </header>

                <div className="impact-detail-scroll min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto grid w-full max-w-[1260px] gap-4 p-3 pb-8 sm:p-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-6">
                        <div className="min-w-0 space-y-4">
                            <section className="overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.02]">
                                <div className="relative aspect-[16/10] overflow-hidden bg-black/30 sm:aspect-[16/9]">
                                    {currentImage ? (
                                        <a
                                            href={
                                                currentImage
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group absolute inset-0"
                                        >
                                            <img
                                                src={
                                                    currentImage
                                                }
                                                alt={
                                                    item.title
                                                }
                                                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.015]"
                                            />

                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />

                                            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-black/55 px-2.5 py-1.5 text-[7px] font-semibold text-white/85 backdrop-blur-md">
                                                <ExternalLink
                                                    size={9}
                                                />

                                                Abrir imagen
                                            </span>
                                        </a>
                                    ) : (
                                        <div className="grid h-full w-full place-items-center">
                                            <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
                                                <ImageIcon
                                                    size={30}
                                                />

                                                <span className="text-[8px]">
                                                    Sin imágenes
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {item.images.length >
                                        1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveImage(
                                                            (
                                                                current,
                                                            ) =>
                                                                current ===
                                                                    0
                                                                    ? item.images.length -
                                                                    1
                                                                    : current -
                                                                    1,
                                                        )
                                                    }
                                                    className="absolute left-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/[0.1] bg-black/55 text-lg text-white/90 backdrop-blur-md transition hover:bg-black/75"
                                                    aria-label="Imagen anterior"
                                                >
                                                    ‹
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveImage(
                                                            (
                                                                current,
                                                            ) =>
                                                                (
                                                                    current +
                                                                    1
                                                                ) %
                                                                item.images.length,
                                                        )
                                                    }
                                                    className="absolute right-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/[0.1] bg-black/55 text-lg text-white/90 backdrop-blur-md transition hover:bg-black/75"
                                                    aria-label="Imagen siguiente"
                                                >
                                                    ›
                                                </button>

                                                <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-full border border-white/[0.1] bg-black/55 px-2.5 py-1.5 text-[7px] font-semibold text-white/85 backdrop-blur-md">
                                                    {activeImage +
                                                        1}
                                                    /
                                                    {
                                                        item.images.length
                                                    }
                                                </span>
                                            </>
                                        )}
                                </div>

                                {item.images.length >
                                    1 && (
                                        <div className="flex gap-2 overflow-x-auto border-t border-white/[0.05] p-3">
                                            {item.images.map(
                                                (
                                                    image,
                                                    index,
                                                ) => (
                                                    <button
                                                        key={`${image}-${index}`}
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveImage(
                                                                index,
                                                            )
                                                        }
                                                        className={`impact-detail-thumb relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border ${activeImage ===
                                                                index
                                                                ? 'border-violet-400/45 shadow-[0_0_0_1px_rgba(167,139,250,.14)]'
                                                                : 'border-white/[0.06]'
                                                            }`}
                                                    >
                                                        <img
                                                            src={
                                                                image
                                                            }
                                                            alt={`Evidencia ${index + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />

                                                        {activeImage ===
                                                            index && (
                                                                <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-violet-400" />
                                                            )}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </section>

                            <section className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck
                                        size={15}
                                        className="text-violet-300"
                                    />

                                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-violet-300">
                                        Resultado documentado
                                    </span>
                                </div>

                                <h2 className="mt-3 text-lg font-bold tracking-[-0.035em] text-[var(--text)]">
                                    {
                                        item.title
                                    }
                                </h2>

                                {item.description ? (
                                    <p className="mt-3 whitespace-pre-line text-[10px] leading-5 text-[var(--text-soft)]">
                                        {
                                            item.description
                                        }
                                    </p>
                                ) : (
                                    <p className="mt-3 text-[9px] text-[var(--muted)]">
                                        Sin descripción adicional.
                                    </p>
                                )}
                            </section>

                            <section className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <FileText
                                            size={15}
                                            className="text-cyan-300"
                                        />

                                        <div>
                                            <span className="block text-[8px] font-bold uppercase tracking-[0.15em] text-cyan-300">
                                                Archivos de evidencia
                                            </span>

                                            <span className="mt-0.5 block text-[7px] text-[var(--muted)]">
                                                Presiona cualquier archivo para abrirlo
                                            </span>
                                        </div>
                                    </div>

                                    <span className="rounded-full bg-cyan-300/[0.07] px-2.5 py-1 text-[7px] font-semibold text-cyan-300">
                                        {
                                            item.files.length
                                        }
                                    </span>
                                </div>

                                {!item.files.length ? (
                                    <div className="mt-4 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.015] p-5 text-center">
                                        <FileText
                                            size={24}
                                            className="mx-auto text-[var(--muted)]"
                                        />

                                        <span className="mt-2 block text-[8px] text-[var(--muted)]">
                                            No hay archivos asociados
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                        {item.files.map(
                                            (
                                                file,
                                            ) => (
                                                <a
                                                    key={
                                                        file.id
                                                    }
                                                    href={
                                                        file.url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="impact-detail-file group flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
                                                >
                                                    <div
                                                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${file.type ===
                                                                'imagen'
                                                                ? 'bg-cyan-300/[0.08] text-cyan-300'
                                                                : 'bg-violet-400/[0.08] text-violet-300'
                                                            }`}
                                                    >
                                                        {file.type ===
                                                            'imagen' ? (
                                                            <Images
                                                                size={16}
                                                            />
                                                        ) : (
                                                            <FileText
                                                                size={16}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <span className="block truncate text-[9px] font-semibold text-[var(--text-soft)]">
                                                            {
                                                                file.name
                                                            }
                                                        </span>

                                                        <span className="mt-1 block text-[7px] text-[var(--muted)]">
                                                            {file.type ===
                                                                'imagen'
                                                                ? 'Imagen'
                                                                : 'Documento'}
                                                        </span>
                                                    </div>

                                                    <ExternalLink
                                                        size={13}
                                                        className="shrink-0 text-[var(--muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                                                    />
                                                </a>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>

                        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
                            <section className="rounded-[24px] border border-emerald-400/[0.08] bg-emerald-400/[0.025] p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-300"
                                    />

                                    <span className="text-[9px] font-semibold text-emerald-200">
                                        Evidencia verificada
                                    </span>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <CalendarDays
                                            size={13}
                                            className="mt-0.5 shrink-0 text-emerald-300"
                                        />

                                        <div>
                                            <span className="block text-[7px] text-[var(--muted)]">
                                                Fecha de entrega
                                            </span>

                                            <span className="mt-0.5 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                {formatDate(
                                                    item.deliveryDate,
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <ShieldCheck
                                            size={13}
                                            className="mt-0.5 shrink-0 text-violet-300"
                                        />

                                        <div>
                                            <span className="block text-[7px] text-[var(--muted)]">
                                                Verificada
                                            </span>

                                            <span className="mt-0.5 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                {formatDate(
                                                    item.verifiedAt,
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {item.amountUsed >
                                        0 && (
                                            <div className="flex items-start gap-3">
                                                <CircleDollarSign
                                                    size={13}
                                                    className="mt-0.5 shrink-0 text-amber-200"
                                                />

                                                <div>
                                                    <span className="block text-[7px] text-[var(--muted)]">
                                                        Monto utilizado
                                                    </span>

                                                    <span className="mt-0.5 block text-[9px] font-semibold text-amber-100">
                                                        $
                                                        {formatMXN(
                                                            item.amountUsed,
                                                        )}{' '}
                                                        MXN
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </section>

                            <section className="rounded-[24px] border border-violet-400/[0.08] bg-violet-400/[0.025] p-4">
                                <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-violet-300">
                                    Causa relacionada
                                </span>

                                <h3 className="mt-3 text-[11px] font-semibold leading-5 text-[var(--text)]">
                                    {
                                        item.causeTitle
                                    }
                                </h3>

                                {item.causeSummary && (
                                    <p className="mt-2 line-clamp-4 text-[8px] leading-4 text-[var(--muted)]">
                                        {
                                            item.causeSummary
                                        }
                                    </p>
                                )}

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[7px] text-[var(--muted)]">
                                            Categoría
                                        </span>

                                        <span className="text-[8px] font-semibold text-[var(--text-soft)]">
                                            {formatCategory(
                                                item.category,
                                            )}
                                        </span>
                                    </div>

                                    {item.location && (
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="text-[7px] text-[var(--muted)]">
                                                Ubicación
                                            </span>

                                            <span className="max-w-[180px] text-right text-[8px] font-semibold text-[var(--text-soft)]">
                                                {
                                                    item.location
                                                }
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[7px] text-[var(--muted)]">
                                            Completada
                                        </span>

                                        <span className="text-[8px] font-semibold text-emerald-200">
                                            {formatDate(
                                                item.completedAt,
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {onViewCause && (
                                    <button
                                        type="button"
                                        onClick={
                                            onViewCause
                                        }
                                        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-400/[0.08] text-[8px] font-semibold text-violet-200 transition-all hover:bg-violet-400/[0.13] active:scale-[0.98]"
                                    >
                                        Ver causa

                                        <ExternalLink
                                            size={11}
                                        />
                                    </button>
                                )}
                            </section>

                            <section className="rounded-[24px] border border-cyan-300/[0.08] bg-cyan-300/[0.02] p-4">
                                <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                                    Resumen de archivos
                                </span>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="rounded-xl bg-cyan-300/[0.04] p-3">
                                        <Images
                                            size={13}
                                            className="text-cyan-300"
                                        />

                                        <strong className="mt-2 block text-base font-bold text-cyan-100">
                                            {
                                                imageFiles.length
                                            }
                                        </strong>

                                        <span className="text-[6px] text-[var(--muted)]">
                                            Imágenes
                                        </span>
                                    </div>

                                    <div className="rounded-xl bg-violet-400/[0.04] p-3">
                                        <FileText
                                            size={13}
                                            className="text-violet-300"
                                        />

                                        <strong className="mt-2 block text-base font-bold text-violet-100">
                                            {
                                                documentFiles.length
                                            }
                                        </strong>

                                        <span className="text-[6px] text-[var(--muted)]">
                                            Documentos
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}