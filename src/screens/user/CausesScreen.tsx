import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent,
} from 'react';

import {
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    FilePlus2,
    ImageIcon,
    Loader2,
    MapPin,
    Package,
    RefreshCw,
    Search,
    Sparkles,
    Star,
    TrendingUp,
    X,
} from 'lucide-react';

import type {
    Screen,
} from '../../types';

import {
    supabase,
} from '../../lib/supabase';

import {
    useAuth,
} from '../../contexts/AuthContext';

import CauseRequestForm from './CauseRequestForm';

interface CausesScreenProps {
    navigate: (
        to: Screen,
        causeId?: string,
    ) => void;
    showToast: (
        message: string,
        type?:
            | 'success'
            | 'error'
            | 'info'
            | 'warning',
    ) => void;
}

interface CauseImageRow {
    id: string;
    causa_id: string;
    public_url: string;
    es_principal: boolean;
    orden: number;
}

interface CauseRow {
    id: string;
    slug: string;
    titulo: string;
    resumen: string | null;
    categoria: string;
    estado: string;
    meta_economica: number | string | null;
    organizador: string | null;
    beneficiario: string | null;
    ubicacion: string | null;
    fecha_inicio: string | null;
    fecha_limite: string | null;
    fecha_completada: string | null;
    destacada: boolean;
    orden: number;
    tipo_meta: 'economica' | 'especie';
    creado_en: string;
}

interface EconomicProgressRow {
    meta_economica: number | string | null;
    monto_aprobado: number | string | null;
    monto_restante: number | string | null;
}

interface SpeciesProgressRow {
    meta_especie_id: string;
    cantidad_objetivo: number | string | null;
    cantidad_aprobada: number | string | null;
    cantidad_restante: number | string | null;
}

interface CauseCardData {
    id: string;
    slug: string;
    titulo: string;
    resumen: string | null;
    categoria: string;
    organizador: string | null;
    beneficiario: string | null;
    ubicacion: string | null;
    fecha_inicio: string | null;
    fecha_limite: string | null;
    fecha_completada: string | null;
    destacada: boolean;
    tipo_meta: 'economica' | 'especie';
    creado_en: string;
    imagenes: string[];
    economicGoal: number;
    economicApproved: number;
    economicRemaining: number;
    speciesGoal: number;
    speciesApproved: number;
    speciesRemaining: number;
    speciesTotal: number;
    speciesCompleted: number;
}

type MainFilter =
    | 'todas'
    | 'economicas'
    | 'especie'
    | 'destacadas'
    | 'cerca'
    | 'completadas';

type SortMode =
    | 'prioridad'
    | 'progreso'
    | 'recientes'
    | 'alfabetico';

const FILTERS: Array<{
    id: MainFilter;
    label: string;
}> = [
        {
            id: 'todas',
            label: 'Todas',
        },
        {
            id: 'economicas',
            label: 'Económicas',
        },
        {
            id: 'especie',
            label: 'Especie',
        },
        {
            id: 'destacadas',
            label: 'Destacadas',
        },
        {
            id: 'cerca',
            label: 'Cerca de completar',
        },
        {
            id: 'completadas',
            label: 'Completadas',
        },
    ];

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-MX')
        .trim();
}

function formatCategory(value: string) {
    const clean = value
        .replace(/_/g, ' ')
        .trim();

    if (!clean) {
        return 'Otra';
    }

    return `${clean.charAt(0).toLocaleUpperCase('es-MX')}${clean.slice(1)}`;
}

function formatMXN(value: number) {
    return new Intl.NumberFormat(
        'es-MX',
        {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0,
        },
    ).format(value);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat(
        'es-MX',
        {
            maximumFractionDigits: 2,
        },
    ).format(value);
}

function isCauseVisibleByDate(
    cause: {
        fecha_inicio: string | null;
        fecha_limite: string | null;
    },
) {
    const now = Date.now();

    if (cause.fecha_inicio) {
        const start = new Date(cause.fecha_inicio).getTime();

        if (
            Number.isFinite(start) &&
            now < start
        ) {
            return false;
        }
    }

    if (cause.fecha_limite) {
        const end = new Date(cause.fecha_limite).getTime();

        if (
            Number.isFinite(end) &&
            now > end
        ) {
            return false;
        }
    }

    return true;
}

function getProgress(cause: CauseCardData) {
    if (cause.fecha_completada) {
        return 100;
    }

    if (cause.tipo_meta === 'economica') {
        if (cause.economicGoal <= 0) {
            return 0;
        }

        return Math.min(
            100,
            Math.max(
                0,
                (cause.economicApproved / cause.economicGoal) * 100,
            ),
        );
    }

    if (cause.speciesGoal <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(
            0,
            (cause.speciesApproved / cause.speciesGoal) * 100,
        ),
    );
}

function CauseImageCarousel({
    images,
    title,
}: {
    images: string[];
    title: string;
}) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        setActiveIndex(0);
    }, [images]);

    useEffect(() => {
        if (images.length <= 1) {
            return;
        }

        const interval = window.setInterval(
            () => {
                setActiveIndex(
                    (current) =>
                        (current + 1) % images.length,
                );
            },
            4300,
        );

        return () => {
            window.clearInterval(interval);
        };
    }, [images.length]);

    if (!images.length) {
        return (
            <div className="causes-empty-image">
                <ImageIcon size={28} />
            </div>
        );
    }

    return (
        <div className="causes-carousel">
            {images.map(
                (image, index) => (
                    <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={title}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        className={`causes-carousel-image ${activeIndex === index
                            ? 'is-active'
                            : ''
                            }`}
                    />
                ),
            )}

            {images.length > 1 && (
                <>
                    <div className="causes-carousel-count">
                        {activeIndex + 1}/{images.length}
                    </div>

                    <div className="causes-carousel-dots">
                        {images.map(
                            (_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    aria-label={`Imagen ${index + 1}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setActiveIndex(index);
                                    }}
                                    className={`causes-carousel-dot ${activeIndex === index
                                        ? 'is-active'
                                        : ''
                                        }`}
                                />
                            ),
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function DynamicCauseCard({
    cause,
    navigate,
}: {
    cause: CauseCardData;
    navigate: (
        to: Screen,
        causeId?: string,
    ) => void;
}) {
    const cardRef = useRef<HTMLElement | null>(null);
    const progress = getProgress(cause);
    const completed = Boolean(cause.fecha_completada);
    const nearCompletion = !completed && progress >= 75;

    const handlePointerMove = (
        event: PointerEvent<HTMLElement>,
    ) => {
        if (
            !window.matchMedia(
                '(hover: hover) and (pointer: fine)',
            ).matches
        ) {
            return;
        }

        const card = cardRef.current;

        if (!card) {
            return;
        }

        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const percentX = x / rect.width;
        const percentY = y / rect.height;
        const rotateY = (percentX - 0.5) * 7;
        const rotateX = (0.5 - percentY) * 6;

        card.style.setProperty('--card-x', `${percentX * 100}%`);
        card.style.setProperty('--card-y', `${percentY * 100}%`);
        card.style.setProperty('--rotate-x', `${rotateX}deg`);
        card.style.setProperty('--rotate-y', `${rotateY}deg`);
    };

    const handlePointerLeave = () => {
        const card = cardRef.current;

        if (!card) {
            return;
        }

        card.style.setProperty('--rotate-x', '0deg');
        card.style.setProperty('--rotate-y', '0deg');
    };

    return (
        <article
            ref={cardRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className={`causes-card ${cause.destacada
                ? 'is-featured'
                : ''
                } ${completed ? 'is-completed' : ''}`}
        >
            <div className="causes-card-glow" />

            <div
                role="button"
                tabIndex={0}
                onClick={() =>
                    navigate(
                        'cause-detail',
                        cause.id,
                    )
                }
                onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) {
                        return;
                    }

                    if (
                        event.key === 'Enter' ||
                        event.key === ' '
                    ) {
                        event.preventDefault();
                        navigate(
                            'cause-detail',
                            cause.id,
                        );
                    }
                }}
                className="causes-card-main"
            >
                <div className="causes-card-media">
                    <CauseImageCarousel
                        images={cause.imagenes}
                        title={cause.titulo}
                    />

                    <div className="causes-card-media-overlay" />

                    <div className="causes-card-badges">
                        {cause.destacada && (
                            <span className="causes-badge causes-badge-featured">
                                <Star size={9} />
                                Destacada
                            </span>
                        )}

                        {completed && (
                            <span className="causes-badge causes-badge-completed">
                                <CheckCircle2 size={9} />
                                Completada
                            </span>
                        )}

                        {nearCompletion && (
                            <span className="causes-badge causes-badge-near">
                                <TrendingUp size={9} />
                                Cerca de completar
                            </span>
                        )}
                    </div>

                    <span className="causes-category-pill">
                        {formatCategory(cause.categoria)}
                    </span>
                </div>

                <div className="causes-card-body">
                    <div className="causes-card-heading">
                        <div className="causes-card-heading-copy">
                            <h3>{cause.titulo}</h3>

                            {cause.organizador && (
                                <span className="causes-organizer">
                                    Por {cause.organizador}
                                </span>
                            )}
                        </div>

                        <div
                            className={`causes-type-icon ${cause.tipo_meta === 'economica'
                                ? 'is-economic'
                                : 'is-species'
                                }`}
                        >
                            {cause.tipo_meta === 'economica' ? (
                                <CircleDollarSign size={16} />
                            ) : (
                                <Package size={16} />
                            )}
                        </div>
                    </div>

                    {cause.resumen && (
                        <p className="causes-summary">
                            {cause.resumen}
                        </p>
                    )}

                    {cause.ubicacion && (
                        <div className="causes-location">
                            <MapPin size={11} />
                            <span>{cause.ubicacion}</span>
                        </div>
                    )}

                    {cause.tipo_meta === 'economica' ? (
                        <div className="causes-progress-block">
                            <div className="causes-progress-values">
                                <div>
                                    <span className="causes-progress-label">
                                        Recaudado
                                    </span>
                                    <strong className="causes-progress-main-value">
                                        {formatMXN(cause.economicApproved)}
                                    </strong>
                                </div>

                                <div className="causes-progress-right">
                                    <span className="causes-progress-label">
                                        {completed ? 'Meta alcanzada' : 'Faltan'}
                                    </span>
                                    <strong>
                                        {completed
                                            ? formatMXN(cause.economicGoal)
                                            : formatMXN(cause.economicRemaining)}
                                    </strong>
                                </div>
                            </div>

                            <div className="causes-progress-track">
                                <div
                                    className="causes-progress-fill is-economic"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>

                            <div className="causes-progress-footer">
                                <span>
                                    Meta {formatMXN(cause.economicGoal)}
                                </span>
                                <strong>{Math.round(progress)}%</strong>
                            </div>
                        </div>
                    ) : (
                        <div className="causes-progress-block">
                            <div className="causes-progress-values">
                                <div>
                                    <span className="causes-progress-label">
                                        Necesidades cubiertas
                                    </span>
                                    <strong className="causes-progress-main-value is-species">
                                        {cause.speciesCompleted}/{cause.speciesTotal}
                                    </strong>
                                </div>

                                <div className="causes-progress-right">
                                    <span className="causes-progress-label">
                                        {completed ? 'Completada' : 'Progreso'}
                                    </span>
                                    <strong className="is-species-text">
                                        {Math.round(progress)}%
                                    </strong>
                                </div>
                            </div>

                            <div className="causes-progress-track">
                                <div
                                    className="causes-progress-fill is-species"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>

                            <div className="causes-progress-footer">
                                <span>
                                    {completed
                                        ? 'Todas las necesidades fueron cubiertas'
                                        : `Faltan ${formatNumber(cause.speciesRemaining)} unidades acumuladas`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="web-dynamic-actions grid grid-cols-2 gap-2 border-t border-white/[0.05] p-3">
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            'cause-detail',
                            cause.id,
                        )
                    }
                    className={`web-dynamic-secondary group/detail flex h-10 items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-3 text-[8px] font-semibold text-[var(--text-soft)] transition-all active:scale-[0.98] ${completed
                        ? 'col-span-2'
                        : ''
                        }`}
                >
                    Ver detalle

                    <ArrowRight
                        size={12}
                        className="web-dynamic-arrow transition-transform duration-300"
                    />
                </button>

                {!completed && (
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                'contribute',
                                cause.id,
                            )
                        }
                        className="web-dynamic-primary group/contribute flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400/[0.11] px-3 text-[8px] font-bold text-emerald-200 transition-all active:scale-[0.98]"
                    >
                        {cause.tipo_meta === 'economica' ? (
                            <CircleDollarSign size={13} />
                        ) : (
                            <Package size={13} />
                        )}

                        Aportar

                        <ArrowRight
                            size={12}
                            className="web-dynamic-arrow transition-transform duration-300"
                        />
                    </button>
                )}
            </div>
        </article>
    );
}

export default function CausesScreen({
    navigate,
    showToast,
}: CausesScreenProps) {
    const {
        profile,
        role,
    } = useAuth();

    const [causes, setCauses] = useState<CauseCardData[]>([]);
    const [requestFormOpen, setRequestFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<MainFilter>('todas');
    const [category, setCategory] = useState('todas');
    const [sortMode, setSortMode] = useState<SortMode>('prioridad');

    const loadCauses = useCallback(
        async (refresh = false) => {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const { data, error } = await supabase
                    .from('causas')
                    .select(
                        'id,slug,titulo,resumen,categoria,estado,meta_economica,organizador,beneficiario,ubicacion,fecha_inicio,fecha_limite,fecha_completada,destacada,orden,tipo_meta,creado_en',
                    )
                    .in('estado', [
                        'publicado',
                        'activa',
                        'meta_alcanzada',
                        'completada',
                    ])
                    .order('destacada', { ascending: false })
                    .order('orden', { ascending: true })
                    .order('creado_en', { ascending: false });

                if (error) {
                    throw error;
                }

                const rows = ((data ?? []) as CauseRow[]).filter(
                    (cause) =>
                        isCauseVisibleByDate(cause),
                );

                const causeIds = rows.map((cause) => cause.id);

                let images: CauseImageRow[] = [];

                if (causeIds.length > 0) {
                    const imageResult = await supabase
                        .from('imagenes_causa')
                        .select('id,causa_id,public_url,es_principal,orden')
                        .in('causa_id', causeIds)
                        .order('es_principal', { ascending: false })
                        .order('orden', { ascending: true });

                    if (imageResult.error) {
                        throw imageResult.error;
                    }

                    images = (imageResult.data ?? []).map(
                        (image) => ({
                            id: image.id,
                            causa_id: image.causa_id,
                            public_url: image.public_url,
                            es_principal: Boolean(image.es_principal),
                            orden: Number(image.orden ?? 0),
                        }),
                    );
                }

                const imageMap = new Map<string, string[]>();

                images.forEach((image) => {
                    if (!image.public_url) {
                        return;
                    }

                    const current = imageMap.get(image.causa_id) ?? [];
                    current.push(image.public_url);
                    imageMap.set(image.causa_id, current);
                });

                const normalized = await Promise.all(
                    rows.map(
                        async (cause): Promise<CauseCardData> => {
                            let economicGoal = Number(cause.meta_economica ?? 0);
                            let economicApproved = 0;
                            let economicRemaining = economicGoal;
                            let speciesGoal = 0;
                            let speciesApproved = 0;
                            let speciesRemaining = 0;
                            let speciesTotal = 0;
                            let speciesCompleted = 0;

                            if (cause.tipo_meta === 'economica') {
                                const progressResult = await supabase.rpc(
                                    'obtener_restante_meta_economica',
                                    {
                                        p_causa_id: cause.id,
                                    },
                                );

                                if (progressResult.error) {
                                    throw progressResult.error;
                                }

                                const rowsProgress = (
                                    progressResult.data ?? []
                                ) as unknown as EconomicProgressRow[];

                                const progress = rowsProgress[0];

                                if (progress) {
                                    economicGoal = Math.max(
                                        0,
                                        Number(progress.meta_economica ?? economicGoal),
                                    );
                                    economicApproved = Math.max(
                                        0,
                                        Number(progress.monto_aprobado ?? 0),
                                    );
                                    economicRemaining = Math.max(
                                        0,
                                        Number(progress.monto_restante ?? economicGoal),
                                    );
                                }
                            } else {
                                const progressResult = await supabase.rpc(
                                    'obtener_restante_meta_especie',
                                    {
                                        p_causa_id: cause.id,
                                    },
                                );

                                if (progressResult.error) {
                                    throw progressResult.error;
                                }

                                const progressRows = (
                                    progressResult.data ?? []
                                ) as unknown as SpeciesProgressRow[];

                                speciesTotal = progressRows.length;

                                progressRows.forEach((item) => {
                                    const goal = Math.max(
                                        0,
                                        Number(item.cantidad_objetivo ?? 0),
                                    );
                                    const approved = Math.max(
                                        0,
                                        Number(item.cantidad_aprobada ?? 0),
                                    );
                                    const remaining = Math.max(
                                        0,
                                        Number(item.cantidad_restante ?? 0),
                                    );

                                    speciesGoal += goal;
                                    speciesApproved += Math.min(approved, goal);
                                    speciesRemaining += remaining;

                                    if (remaining <= 0 && goal > 0) {
                                        speciesCompleted += 1;
                                    }
                                });
                            }

                            return {
                                id: cause.id,
                                slug: cause.slug,
                                titulo: cause.titulo,
                                resumen: cause.resumen ?? null,
                                categoria: cause.categoria,
                                organizador: cause.organizador ?? null,
                                beneficiario: cause.beneficiario ?? null,
                                ubicacion: cause.ubicacion ?? null,
                                fecha_inicio: cause.fecha_inicio ?? null,
                                fecha_limite: cause.fecha_limite ?? null,
                                fecha_completada: cause.fecha_completada ?? null,
                                destacada: Boolean(cause.destacada),
                                tipo_meta:
                                    cause.tipo_meta === 'especie'
                                        ? 'especie'
                                        : 'economica',
                                creado_en: cause.creado_en,
                                imagenes: imageMap.get(cause.id) ?? [],
                                economicGoal,
                                economicApproved,
                                economicRemaining,
                                speciesGoal,
                                speciesApproved,
                                speciesRemaining,
                                speciesTotal,
                                speciesCompleted,
                            };
                        },
                    ),
                );

                setCauses(normalized);
            } catch (error) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : 'No se pudieron cargar las causas.',
                    'error',
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [showToast],
    );

    useEffect(() => {
        void loadCauses();
    }, [loadCauses]);

    const categories = useMemo(
        () =>
            [...new Set(
                causes
                    .map((cause) => cause.categoria.trim())
                    .filter(Boolean),
            )].sort((a, b) => a.localeCompare(b, 'es-MX')),
        [causes],
    );

    const filteredCauses = useMemo(() => {
        const query = normalize(search);

        const filtered = causes.filter((cause) => {
            const progress = getProgress(cause);
            const completed = Boolean(cause.fecha_completada);

            const matchesSearch =
                !query ||
                [
                    cause.titulo,
                    cause.resumen ?? '',
                    cause.categoria,
                    cause.organizador ?? '',
                    cause.beneficiario ?? '',
                    cause.ubicacion ?? '',
                ].some((value) => normalize(value).includes(query));

            const matchesCategory =
                category === 'todas' ||
                cause.categoria === category;

            let matchesFilter = true;

            if (filter === 'economicas') {
                matchesFilter = cause.tipo_meta === 'economica';
            }

            if (filter === 'especie') {
                matchesFilter = cause.tipo_meta === 'especie';
            }

            if (filter === 'destacadas') {
                matchesFilter = cause.destacada;
            }

            if (filter === 'cerca') {
                matchesFilter = !completed && progress >= 75;
            }

            if (filter === 'completadas') {
                matchesFilter = completed;
            }

            return matchesSearch && matchesCategory && matchesFilter;
        });

        return [...filtered].sort((a, b) => {
            const progressA = getProgress(a);
            const progressB = getProgress(b);

            if (sortMode === 'progreso') {
                return progressB - progressA;
            }

            if (sortMode === 'recientes') {
                return (
                    new Date(b.creado_en).getTime() -
                    new Date(a.creado_en).getTime()
                );
            }

            if (sortMode === 'alfabetico') {
                return a.titulo.localeCompare(b.titulo, 'es-MX');
            }

            if (a.fecha_completada && !b.fecha_completada) {
                return 1;
            }

            if (!a.fecha_completada && b.fecha_completada) {
                return -1;
            }

            if (a.destacada !== b.destacada) {
                return a.destacada ? -1 : 1;
            }

            return progressB - progressA;
        });
    }, [causes, search, category, filter, sortMode]);

    const stats = useMemo(() => {
        const active = causes.filter((cause) => !cause.fecha_completada);
        const completed = causes.length - active.length;
        const near = active.filter((cause) => getProgress(cause) >= 75).length;
        const featured = causes.filter((cause) => cause.destacada).length;

        return {
            active: active.length,
            completed,
            near,
            featured,
        };
    }, [causes]);

    const clearFilters = () => {
        setSearch('');
        setFilter('todas');
        setCategory('todas');
        setSortMode('prioridad');
    };

    const hasFilters =
        Boolean(search.trim()) ||
        filter !== 'todas' ||
        category !== 'todas' ||
        sortMode !== 'prioridad';

    const canRequestCause =
        (
            profile?.role ??
            role ??
            'donante'
        ) ===
        'donante';

    if (loading) {
        return (
            <div className="flex min-h-[65vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.05]">
                        <Loader2
                            size={23}
                            className="animate-spin text-emerald-300"
                        />
                    </div>
                    <p className="mt-4 text-[9px] font-medium text-[var(--muted)]">
                        Cargando causas verificadas...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="causes-screen">
            <style>{`
        .causes-screen {
          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
          padding: 0 12px 32px;
        }

        .causes-hero {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 28px;
          padding: 16px;
          background:
            radial-gradient(circle at 12% 0%, rgba(251,113,133,.08), transparent 34%),
            radial-gradient(circle at 90% 100%, rgba(52,211,153,.055), transparent 35%),
            linear-gradient(145deg, rgba(251,113,133,.055), rgba(255,255,255,.025) 42%, rgba(196,169,107,.03));
        }

        .causes-hero-grid {
          position: absolute;
          inset: 0;
          opacity: .18;
          background-image:
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: linear-gradient(to bottom, black, transparent 84%);
          pointer-events: none;
        }

        .causes-hero-content {
          position: relative;
          z-index: 2;
        }

        .causes-hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .causes-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #fda4af;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .18em;
        }

        .causes-kicker-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #fb7185;
          box-shadow: 0 0 16px rgba(251,113,133,.8);
        }

        .causes-hero h1 {
          margin: 8px 0 0;
          color: var(--text);
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -.04em;
          line-height: 1.15;
        }

        .causes-hero p {
          max-width: 650px;
          margin: 11px 0 0;
          color: var(--muted);
          font-size: 9px;
          line-height: 1.75;
        }

        .causes-refresh {
          display: grid;
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid rgba(251,113,133,.12);
          border-radius: 14px;
          color: #fda4af;
          background: rgba(251,113,133,.055);
          transition: transform .3s ease, background .3s ease, border-color .3s ease;
        }

        .causes-refresh svg {
          transition: transform .55s ease;
        }

        .causes-refresh.is-loading svg {
          animation: causes-spin .8s linear infinite;
        }

        .causes-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .causes-stat {
          position: relative;
          overflow: hidden;
          min-width: 0;
          padding: 16px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 16px;
          background: rgba(0,0,0,.12);
          backdrop-filter: blur(12px);
        }

        .causes-stat::after {
          content: '';
          position: absolute;
          right: -22px;
          top: -28px;
          width: 70px;
          height: 70px;
          border-radius: 999px;
          background: var(--stat-color);
          filter: blur(28px);
          opacity: .16;
        }

        .causes-stat span {
          display: block;
          color: var(--muted);
          font-size: 7px;
          line-height: 1.4;
        }

        .causes-stat strong {
          display: block;
          margin-top: 5px;
          color: var(--stat-text);
          font-size: 20px;
          font-weight: 900;
        }

        .causes-stat.is-active {
          --stat-color: #34d399;
          --stat-text: #a7f3d0;
        }

        .causes-stat.is-near {
          --stat-color: #fbbf24;
          --stat-text: #fde68a;
        }

        .causes-stat.is-featured {
          --stat-color: #fb7185;
          --stat-text: #fecdd3;
        }

        .causes-stat.is-completed {
          --stat-color: #67e8f9;
          --stat-text: #a5f3fc;
        }

        .causes-request-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 12px;
          padding: 14px 16px;
          border: 1px solid rgba(251,113,133,.08);
          border-radius: 20px;
          background: rgba(255,255,255,.018);
        }

        .causes-request-cta-copy {
          min-width: 0;
        }

        .causes-request-cta-kicker {
          display: block;
          color: #fda4af;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .causes-request-cta strong {
          display: block;
          margin-top: 4px;
          color: var(--text);
          font-size: 12px;
          font-weight: 800;
        }

        .causes-request-cta p {
          max-width: 680px;
          margin: 4px 0 0;
          color: var(--muted);
          font-size: 8px;
          line-height: 1.65;
        }

        .causes-request-button {
          display: inline-flex;
          min-height: 42px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 14px;
          border: 1px solid rgba(251,113,133,.13);
          border-radius: 13px;
          color: #fecdd3;
          background: rgba(251,113,133,.08);
          font-size: 8px;
          font-weight: 800;
        }

        .causes-toolbar {
          margin-top: 12px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 20px;
          background: rgba(255,255,255,.018);
        }

        .causes-search-row {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 190px 190px auto;
          gap: 9px;
        }

        .causes-search-box,
        .causes-select-box {
          position: relative;
          min-width: 0;
        }

        .causes-search-box svg,
        .causes-select-box svg {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }

        .causes-search-box svg {
          left: 13px;
        }

        .causes-select-box svg {
          right: 12px;
        }

        .causes-search-input,
        .causes-select {
          width: 100%;
          height: 40px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          outline: none;
          color: var(--text);
          background: rgba(255,255,255,.025);
          transition: border-color .25s ease, background .25s ease;
        }

        .causes-search-input {
          padding: 0 40px;
          font-size: 10px;
        }

        .causes-search-input::placeholder {
          color: var(--muted);
        }

        .causes-select {
          appearance: none;
          padding: 0 35px 0 13px;
          font-size: 9px;
          font-weight: 600;
        }

        .causes-search-input:focus,
        .causes-select:focus {
          border-color: rgba(251,113,133,.25);
          background: rgba(255,255,255,.04);
        }

        .causes-clear {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 44px;
          padding: 0 14px;
          border-radius: 13px;
          color: var(--text-soft);
          background: rgba(255,255,255,.045);
          font-size: 8px;
          font-weight: 700;
        }

        .causes-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 10px;
        }

        .causes-filter-button {
          position: relative;
          overflow: hidden;
          min-height: 34px;
          padding: 0 12px;
          border: 1px solid transparent;
          border-radius: 12px;
          color: var(--muted);
          background: rgba(255,255,255,.025);
          font-size: 8px;
          font-weight: 700;
          transition: color .25s ease, background .25s ease, border-color .25s ease, transform .25s ease;
        }

        .causes-filter-button.is-active {
          color: #fecdd3;
          border-color: rgba(251,113,133,.14);
          background: rgba(251,113,133,.08);
          box-shadow: inset 0 -2px 0 rgba(251,113,133,.55);
        }

        .causes-results-header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          margin-top: 28px;
          margin-bottom: 12px;
        }

        .causes-results-header span {
          color: #fda4af;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .causes-results-header h2 {
          margin: 4px 0 0;
          color: var(--text);
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -.04em;
        }

        .causes-results-count {
          color: var(--muted) !important;
          font-size: 8px !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
        }

        .causes-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .causes-card {
          --card-x: 50%;
          --card-y: 50%;
          --rotate-x: 0deg;
          --rotate-y: 0deg;
          position: relative;
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 22px;
          background: rgba(255,255,255,.022);
          transform-style: preserve-3d;
          transition: transform .18s ease-out, border-color .3s ease, background .3s ease, box-shadow .3s ease;
        }

        .causes-card.is-featured {
          border-color: rgba(251,191,36,.14);
        }

        .causes-card.is-completed {
          border-color: rgba(103,232,249,.1);
        }

        .causes-card-glow {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0;
          pointer-events: none;
          background: radial-gradient(circle at var(--card-x) var(--card-y), rgba(251,113,133,.15), transparent 34%);
          transition: opacity .3s ease;
        }

        .causes-card-main {
          position: relative;
          z-index: 1;
          display: block;
          width: 100%;
          text-align: left;
        }

        .causes-card-media {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: rgba(255,255,255,.025);
        }

        .causes-carousel,
        .causes-empty-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .causes-empty-image {
          display: grid;
          place-items: center;
          color: var(--muted);
          background: radial-gradient(circle at center, rgba(251,113,133,.055), transparent 65%);
        }

        .causes-carousel-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1.035);
          transition: opacity .8s ease, transform 1.1s ease;
        }

        .causes-carousel-image.is-active {
          opacity: 1;
          transform: scale(1);
        }

        .causes-carousel-count {
          position: absolute;
          top: 11px;
          right: 11px;
          z-index: 5;
          padding: 5px 8px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 999px;
          color: rgba(255,255,255,.76);
          background: rgba(0,0,0,.44);
          backdrop-filter: blur(10px);
          font-size: 6px;
          font-weight: 700;
        }

        .causes-carousel-dots {
          position: absolute;
          right: 11px;
          bottom: 11px;
          z-index: 6;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          background: rgba(0,0,0,.42);
          backdrop-filter: blur(10px);
        }

        .causes-carousel-dot {
          width: 5px;
          height: 5px;
          padding: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.34);
          transition: width .25s ease, background .25s ease;
        }

        .causes-carousel-dot.is-active {
          width: 15px;
          background: white;
        }

        .causes-card-media-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: linear-gradient(to top, rgba(7,12,21,.92), transparent 58%, rgba(0,0,0,.17));
        }

        .causes-card-badges {
          position: absolute;
          left: 11px;
          top: 11px;
          z-index: 4;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .causes-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border: 1px solid;
          border-radius: 999px;
          backdrop-filter: blur(10px);
          font-size: 6px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .causes-badge-featured {
          color: #fde68a;
          border-color: rgba(251,191,36,.18);
          background: rgba(0,0,0,.52);
        }

        .causes-badge-completed {
          color: #a5f3fc;
          border-color: rgba(103,232,249,.18);
          background: rgba(0,0,0,.52);
        }

        .causes-badge-near {
          color: #fda4af;
          border-color: rgba(251,113,133,.2);
          background: rgba(0,0,0,.52);
        }

        .causes-category-pill {
          position: absolute;
          left: 11px;
          bottom: 11px;
          z-index: 4;
          padding: 5px 9px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          color: rgba(255,255,255,.82);
          background: rgba(0,0,0,.42);
          backdrop-filter: blur(10px);
          font-size: 7px;
          font-weight: 700;
        }

        .causes-card-body {
          padding: 16px 16px 12px;
        }

        .causes-card-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .causes-card-heading-copy {
          min-width: 0;
        }

        .causes-card-heading h3 {
          display: -webkit-box;
          overflow: hidden;
          margin: 0;
          color: var(--text);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.65;
          letter-spacing: -.02em;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .causes-organizer {
          display: block;
          overflow: hidden;
          margin-top: 4px;
          color: var(--muted);
          font-size: 7px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .causes-type-icon {
          display: grid;
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 11px;
        }

        .causes-type-icon.is-economic {
          color: #6ee7b7;
          background: rgba(52,211,153,.075);
        }

        .causes-type-icon.is-species {
          color: #fde68a;
          background: rgba(251,191,36,.075);
        }

        .causes-summary {
          display: -webkit-box;
          overflow: hidden;
          margin: 9px 0 0;
          color: var(--muted);
          font-size: 8px;
          line-height: 1.7;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .causes-location {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 6px;
          margin-top: 10px;
          color: var(--muted);
          font-size: 7px;
        }

        .causes-location svg {
          flex: 0 0 auto;
          color: #fda4af;
        }

        .causes-location span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .causes-progress-block {
          margin-top: 14px;
        }

        .causes-progress-values {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
        }

        .causes-progress-label {
          display: block;
          color: var(--muted);
          font-size: 6px;
          text-transform: uppercase;
          letter-spacing: .09em;
        }

        .causes-progress-main-value {
          display: block;
          margin-top: 4px;
          color: #6ee7b7;
          font-size: 11px;
          font-weight: 850;
        }

        .causes-progress-main-value.is-species,
        .is-species-text {
          color: #fde68a !important;
        }

        .causes-progress-right {
          text-align: right;
        }

        .causes-progress-right strong {
          display: block;
          margin-top: 4px;
          color: var(--text-soft);
          font-size: 9px;
        }

        .causes-progress-track {
          overflow: hidden;
          height: 6px;
          margin-top: 9px;
          border-radius: 999px;
          background: rgba(255,255,255,.05);
        }

        .causes-progress-fill {
          height: 100%;
          border-radius: inherit;
          transition: width .7s ease;
        }

        .causes-progress-fill.is-economic {
          background: linear-gradient(90deg, #10b981, #6ee7b7);
        }

        .causes-progress-fill.is-species {
          background: linear-gradient(90deg, #f59e0b, #fde68a);
        }

        .causes-progress-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 6px;
          color: var(--muted);
          font-size: 7px;
        }

        .causes-progress-footer strong {
          color: #6ee7b7;
        }

        .causes-card-actions {
          position: relative;
          z-index: 3;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,.05);
        }

        .causes-action {
          display: flex;
          min-width: 0;
          height: 40px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 12px;
          font-size: 8px;
          font-weight: 700;
          transition: transform .25s ease, background .25s ease, color .25s ease;
        }

        .causes-action-secondary {
          color: var(--text-soft);
          background: rgba(255,255,255,.04);
        }

        .causes-action-primary {
          color: #fecdd3;
          background: rgba(251,113,133,.095);
        }

        .causes-action-completed {
          color: #a5f3fc;
          background: rgba(103,232,249,.06);
        }

        .causes-empty-results {
          display: flex;
          min-height: 300px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          border: 1px dashed rgba(255,255,255,.07);
          border-radius: 24px;
          color: var(--muted);
          background: rgba(255,255,255,.014);
          text-align: center;
        }

        .causes-empty-results-icon {
          display: grid;
          width: 52px;
          height: 52px;
          place-items: center;
          border-radius: 17px;
          color: #fda4af;
          background: rgba(251,113,133,.07);
        }

        .causes-empty-results h3 {
          margin: 14px 0 0;
          color: var(--text);
          font-size: 12px;
        }

        .causes-empty-results p {
          max-width: 340px;
          margin: 6px 0 0;
          font-size: 8px;
          line-height: 1.7;
        }

        .causes-empty-results button {
          margin-top: 14px;
          padding: 9px 14px;
          border-radius: 11px;
          color: #fecdd3;
          background: rgba(251,113,133,.08);
          font-size: 8px;
          font-weight: 800;
        }

        .causes-loading-shell {
          display: flex;
          min-height: 65vh;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--muted);
          font-size: 9px;
        }

        .causes-loader {
          display: grid;
          width: 56px;
          height: 56px;
          place-items: center;
          border: 1px solid rgba(52,211,153,.1);
          border-radius: 16px;
          color: #6ee7b7;
          background: rgba(52,211,153,.05);
        }

        .causes-loader svg {
          animation: causes-spin .8s linear infinite;
        }

        @keyframes causes-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (hover: hover) and (pointer: fine) {
          .causes-refresh:hover {
            transform: translateY(-2px);
            border-color: rgba(251,113,133,.22);
            background: rgba(251,113,133,.1);
          }

          .causes-refresh:hover svg {
            transform: rotate(180deg);
          }

          .causes-filter-button:hover {
            transform: translateY(-1px);
            color: var(--text-soft);
            background: rgba(255,255,255,.05);
          }

          .causes-card:hover {
            z-index: 5;
            border-color: rgba(251,113,133,.19);
            background: rgba(255,255,255,.035);
            box-shadow: 0 24px 60px rgba(0,0,0,.28);
            transform: perspective(1100px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y)) translateY(-4px);
          }

          .causes-card:hover .causes-card-glow {
            opacity: 1;
          }

          .causes-card:hover .causes-carousel-image.is-active {
            transform: scale(1.045);
          }

          .causes-card .web-dynamic-actions {
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
            border-color: transparent;
            opacity: 0;
            overflow: hidden;
            pointer-events: none;
            transform: translateY(14px);
            transition:
              max-height .34s cubic-bezier(.22,.61,.36,1),
              padding .34s cubic-bezier(.22,.61,.36,1),
              opacity .22s ease,
              transform .34s cubic-bezier(.22,.61,.36,1),
              border-color .34s ease;
          }

          .causes-card:hover .web-dynamic-actions,
          .causes-card:focus-within .web-dynamic-actions {
            max-height: 76px;
            padding-top: 12px;
            padding-bottom: 12px;
            border-color: rgba(255,255,255,.05);
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
          }

          .web-dynamic-secondary:hover {
            transform: translateY(-1px);
            color: white;
            background: rgba(255,255,255,.075);
          }

          .web-dynamic-primary:hover {
            transform: translateY(-1px);
            background: rgba(52,211,153,.18);
            box-shadow: 0 10px 26px rgba(16,185,129,.1);
          }

          .web-dynamic-secondary:hover .web-dynamic-arrow,
          .web-dynamic-primary:hover .web-dynamic-arrow {
            transform: translateX(4px);
          }

          .web-dynamic-button:hover {
            transform: translateY(-2px);
            border-color: rgba(52,211,153,.18);
            background: rgba(52,211,153,.08);
            color: #6ee7b7;
          }

          .web-dynamic-button:hover .web-dynamic-refresh {
            transform: rotate(180deg);
          }

          .causes-action-primary:hover {
            transform: translateY(-1px);
            background: rgba(251,113,133,.16);
          }
        }

        @media (max-width: 1050px) {
          .causes-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .causes-search-row {
            grid-template-columns: minmax(200px, 1fr) 1fr 1fr;
          }

          .causes-clear {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 760px) {
          .causes-screen {
            padding-left: 11px;
            padding-right: 11px;
          }

          .causes-hero {
            padding: 17px;
            border-radius: 24px;
          }

          .causes-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .causes-search-row {
            grid-template-columns: 1fr;
          }

          .causes-clear {
            grid-column: auto;
          }

          .causes-filter-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .causes-grid {
            grid-template-columns: 1fr;
          }

          .causes-results-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

            <section className="causes-hero">
                <div className="causes-hero-grid" />

                <div className="causes-hero-content">
                    <div className="causes-hero-top">
                        <div>
                            <div className="causes-kicker">
                                <span className="causes-kicker-dot" />
                                Causas verificadas
                            </div>

                            <h1>Elige dónde generar impacto</h1>

                            <p>
                                Explora las causas publicadas, revisa cuánto falta para alcanzar cada meta y apoya directamente donde más se necesita.
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={refreshing}
                            onClick={() =>
                                void loadCauses(
                                    true,
                                )
                            }
                            className="web-dynamic-button group grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.05] bg-white/[0.035] text-[var(--muted)] transition-all disabled:opacity-40"
                            aria-label="Actualizar causas"
                        >
                            <RefreshCw
                                size={14}
                                className={
                                    refreshing
                                        ? 'animate-spin'
                                        : 'web-dynamic-refresh transition-transform duration-500'
                                }
                            />
                        </button>
                    </div>

                    <div className="causes-stats">
                        <div className="causes-stat is-active">
                            <span>Causas activas</span>
                            <strong>{stats.active}</strong>
                        </div>

                        <div className="causes-stat is-near">
                            <span>Cerca de completar</span>
                            <strong>{stats.near}</strong>
                        </div>

                        <div className="causes-stat is-featured">
                            <span>Destacadas</span>
                            <strong>{stats.featured}</strong>
                        </div>

                        <div className="causes-stat is-completed">
                            <span>Completadas</span>
                            <strong>{stats.completed}</strong>
                        </div>
                    </div>
                </div>
            </section>

            {canRequestCause && (
                <section className="causes-request-cta">
                    <div className="causes-request-cta-copy">
                        <span className="causes-request-cta-kicker">
                            ¿Conoces una necesidad?
                        </span>

                        <strong>
                            Propón una nueva causa
                        </strong>

                        <p>
                            Envía la información para que el equipo de Shitan Trust pueda revisarla antes de publicarla.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setRequestFormOpen(
                                true,
                            )
                        }
                        className="causes-request-button"
                    >
                        <FilePlus2 size={15} />
                        Proponer una causa
                    </button>
                </section>
            )}

            <section className="causes-toolbar">
                <div className="causes-search-row">
                    <div className="causes-search-box">
                        <Search size={14} />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por causa, categoría, ubicación..."
                            className="causes-search-input"
                        />
                    </div>

                    <div className="causes-select-box">
                        <select
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            className="causes-select"
                            aria-label="Filtrar por categoría"
                        >
                            <option value="todas">
                                Todas las categorías
                            </option>

                            {categories.map((item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {formatCategory(item)}
                                </option>
                            ))}
                        </select>

                        <ChevronDown size={13} />
                    </div>

                    <div className="causes-select-box">
                        <select
                            value={sortMode}
                            onChange={(event) =>
                                setSortMode(event.target.value as SortMode)
                            }
                            className="causes-select"
                            aria-label="Ordenar causas"
                        >
                            <option value="prioridad">
                                Ordenar por prioridad
                            </option>
                            <option value="progreso">
                                Mayor progreso
                            </option>
                            <option value="recientes">
                                Más recientes
                            </option>
                            <option value="alfabetico">
                                A-Z
                            </option>
                        </select>

                        <ChevronDown size={13} />
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="causes-clear"
                        >
                            <X size={13} />
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="causes-filter-row">
                    {FILTERS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setFilter(item.id)}
                            className={`causes-filter-button ${filter === item.id
                                ? 'is-active'
                                : ''
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </section>

            <div className="causes-results-header">
                <div>
                    <span>Explorar</span>
                    <h2>Causas disponibles</h2>
                </div>

                <span className="causes-results-count">
                    {filteredCauses.length}{' '}
                    {filteredCauses.length === 1
                        ? 'causa encontrada'
                        : 'causas encontradas'}
                </span>
            </div>

            {filteredCauses.length > 0 ? (
                <div className="causes-grid">
                    {filteredCauses.map((cause) => (
                        <DynamicCauseCard
                            key={cause.id}
                            cause={cause}
                            navigate={navigate}
                        />
                    ))}
                </div>
            ) : (
                <div className="causes-empty-results">
                    <div className="causes-empty-results-icon">
                        <Sparkles size={21} />
                    </div>

                    <h3>No encontramos causas</h3>

                    <p>
                        Cambia los filtros o limpia la búsqueda para descubrir otras causas disponibles.
                    </p>

                    <button
                        type="button"
                        onClick={clearFilters}
                    >
                        Mostrar todas
                    </button>
                </div>
            )}

            <CauseRequestForm
                open={
                    requestFormOpen
                }
                onClose={() =>
                    setRequestFormOpen(
                        false,
                    )
                }
                showToast={
                    showToast
                }
            />
        </div>
    );
}