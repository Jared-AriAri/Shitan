import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';

import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  HeartHandshake,
  ImageIcon,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';

import type {
  Screen,
} from '../../types';

import {
  supabase,
} from '../../lib/supabase';

interface HomeScreenProps {
  navigate: (
    to: Screen,
    causeId?: string,
  ) => void;
  onLoginClick: () => void;
  showToast: (
    message: string,
    type?:
      | 'success'
      | 'error'
      | 'info'
      | 'warning',
  ) => void;
}

type HomeFilter =
  | 'Todas'
  | 'Destacadas'
  | 'Salud'
  | 'Despensas'
  | 'Especie'
  | 'Completadas';

interface CauseImageRow {
  id: string;
  causa_id: string;
  public_url: string;
  es_principal: boolean;
  orden: number;
}

interface CauseSummaryRow {
  causa_id: string;
  recaudado: number | string | null;
  aportaciones: number | string | null;
}

interface SpeciesProgressRow {
  meta_especie_id: string;
  cantidad_objetivo: number | string | null;
  cantidad_aprobada: number | string | null;
  cantidad_restante: number | string | null;
}

interface HomeCause {
  id: string;
  slug: string;
  titulo: string;
  resumen: string | null;
  categoria: string;
  estado: string;
  meta_economica: number | null;
  organizador: string | null;
  beneficiario: string | null;
  ubicacion: string | null;
  fecha_inicio: string | null;
  fecha_limite: string | null;
  fecha_completada: string | null;
  destacada: boolean;
  orden: number;
  tipo_meta:
  | 'economica'
  | 'especie';
  creado_en: string;
  imagen_url: string | null;
  imagenes: string[];
  recaudado: number;
  aportaciones: number;
  especie_objetivo: number;
  especie_aprobada: number;
  especie_restante: number;
  especie_total: number;
  especie_completadas: number;
}

interface HomeStats {
  totalAcumulado: number;
  causasActivas: number;
  causasCompletadas: number;
  aportacionesVerificadas: number;
}

const FILTERS: HomeFilter[] = [
  'Todas',
  'Destacadas',
  'Salud',
  'Despensas',
  'Especie',
  'Completadas',
];

const INITIAL_STATS: HomeStats = {
  totalAcumulado: 0,
  causasActivas: 0,
  causasCompletadas: 0,
  aportacionesVerificadas: 0,
};

function formatMXN(
  amount: number,
) {
  return new Intl.NumberFormat(
    'es-MX',
    {
      maximumFractionDigits: 0,
    },
  ).format(
    amount,
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

function formatDate(
  value: string | null,
) {
  if (!value) {
    return null;
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
    return null;
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    date,
  );
}

function progressForCause(
  cause: HomeCause,
) {
  if (
    cause.tipo_meta ===
    'especie'
  ) {
    if (
      cause.especie_objetivo <=
      0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (
          cause.especie_aprobada /
          cause.especie_objetivo
        ) *
        100,
      ),
    );
  }

  if (
    !cause.meta_economica ||
    cause.meta_economica <=
    0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (
        cause.recaudado /
        cause.meta_economica
      ) *
      100,
    ),
  );
}

function formatQuantity(
  amount: number,
) {
  return new Intl.NumberFormat(
    'es-MX',
    {
      maximumFractionDigits: 2,
    },
  ).format(
    amount,
  );
}

function canUseWebDynamics() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches
  );
}

function handleDynamicMouseMove(
  event: MouseEvent<HTMLElement>,
) {
  if (!canUseWebDynamics()) {
    return;
  }

  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateY = ((x - centerX) / centerX) * 3.4;
  const rotateX = -((y - centerY) / centerY) * 2.6;
  const imageX = ((x - centerX) / centerX) * -7;
  const imageY = ((y - centerY) / centerY) * -5;

  element.style.setProperty(
    '--mouse-x',
    `${x}px`,
  );

  element.style.setProperty(
    '--mouse-y',
    `${y}px`,
  );

  element.style.setProperty(
    '--image-x',
    `${imageX}px`,
  );

  element.style.setProperty(
    '--image-y',
    `${imageY}px`,
  );

  element.style.transform =
    `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-7px) scale(1.008)`;
}

function handleDynamicMouseEnter(
  event: MouseEvent<HTMLElement>,
) {
  if (!canUseWebDynamics()) {
    return;
  }

  event.currentTarget.style.willChange =
    'transform';
}

function handleDynamicMouseLeave(
  event: MouseEvent<HTMLElement>,
) {
  if (!canUseWebDynamics()) {
    return;
  }

  const element = event.currentTarget;

  element.style.transform = '';
  element.style.willChange = '';
  element.style.setProperty(
    '--mouse-x',
    '50%',
  );
  element.style.setProperty(
    '--mouse-y',
    '50%',
  );
  element.style.setProperty(
    '--image-x',
    '0px',
  );
  element.style.setProperty(
    '--image-y',
    '0px',
  );
}

function CauseImageCarousel({
  images,
  title,
  className = '',
}: {
  images: string[];
  title: string;
  className?: string;
}) {
  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  useEffect(
    () => {
      setActiveIndex(0);
    },
    [
      images,
    ],
  );

  useEffect(
    () => {
      if (
        images.length <=
        1
      ) {
        return;
      }

      const interval =
        window.setInterval(
          () => {
            setActiveIndex(
              (
                current,
              ) =>
                (
                  current +
                  1
                ) %
                images.length,
            );
          },
          4500,
        );

      return () =>
        window.clearInterval(
          interval,
        );
    },
    [
      images.length,
    ],
  );

  if (
    !images.length
  ) {
    return (
      <div className={`grid h-full w-full place-items-center ${className}`}>
        <ImageIcon
          size={25}
          className="text-[var(--muted)]"
        />
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {images.map(
        (
          image,
          index,
        ) => (
          <img
            key={`${image}-${index}`}
            src={
              image
            }
            alt={
              title
            }
            loading={
              index ===
                0
                ? 'eager'
                : 'lazy'
            }
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${activeIndex ===
              index
              ? 'scale-100 opacity-100'
              : 'scale-[1.025] opacity-0'
              }`}
          />
        ),
      )}

      {images.length >
        1 && (
          <>
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/45 px-2 py-1.5 backdrop-blur-md">
              {images.map(
                (
                  _,
                  index,
                ) => (
                  <span
                    key={
                      index
                    }
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex ===
                      index
                      ? 'w-4 bg-white'
                      : 'w-1.5 bg-white/35'
                      }`}
                  />
                ),
              )}
            </div>

            <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-white/[0.08] bg-black/45 px-2 py-1 text-[6px] font-semibold text-white/75 backdrop-blur-md">
              {activeIndex +
                1}
              /
              {
                images.length
              }
            </span>
          </>
        )}
    </div>
  );
}

export default function HomeScreen({
  navigate,
  onLoginClick,
  showToast,
}: HomeScreenProps) {
  const [
    causes,
    setCauses,
  ] =
    useState<
      HomeCause[]
    >([]);

  const [
    stats,
    setStats,
  ] =
    useState<HomeStats>(
      INITIAL_STATS,
    );

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<HomeFilter>(
      'Todas',
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    authenticated,
    setAuthenticated,
  ] =
    useState<boolean | null>(
      null,
    );

  const openDetail =
    useCallback(
      (
        causeId: string,
      ) => {
        navigate(
          'cause-detail',
          causeId,
        );
      },
      [
        navigate,
      ],
    );

  const openContribution =
    useCallback(
      (
        causeId: string,
      ) => {
        navigate(
          'contribute',
          causeId,
        );
      },
      [
        navigate,
      ],
    );

  useEffect(
    () => {
      let active =
        true;

      void supabase.auth
        .getSession()
        .then(
          ({
            data,
          }) => {
            if (
              !active
            ) {
              return;
            }

            setAuthenticated(
              Boolean(
                data.session,
              ),
            );
          },
        );

      const {
        data:
        {
          subscription,
        },
      } =
        supabase.auth.onAuthStateChange(
          (
            _event,
            session,
          ) => {
            setAuthenticated(
              Boolean(
                session,
              ),
            );
          },
        );

      return () => {
        active =
          false;

        subscription.unsubscribe();
      };
    },
    [],
  );

  const loadHome =
    useCallback(
      async (
        refresh = false,
      ) => {
        if (
          authenticated !==
          true
        ) {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );

          return;
        }

        if (
          refresh
        ) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        try {
          const [
            causesResult,
            contributionsResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  'causas',
                )
                .select(
                  'id,slug,titulo,resumen,categoria,estado,meta_economica,organizador,beneficiario,ubicacion,fecha_inicio,fecha_limite,fecha_completada,destacada,orden,tipo_meta,creado_en',
                )
                .in(
                  'estado',
                  [
                    'activa',
                    'meta_alcanzada',
                    'completada',
                  ],
                )
                .order(
                  'destacada',
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
                )
                .order(
                  'creado_en',
                  {
                    ascending:
                      false,
                  },
                ),

              supabase.rpc(
                'obtener_resumen_causas',
              ),
            ]);

          if (
            causesResult.error
          ) {
            throw causesResult.error;
          }

          if (
            contributionsResult.error
          ) {
            throw contributionsResult.error;
          }

          const rawCauses =
            causesResult.data ??
            [];

          const contributionSummaries =
            (
              contributionsResult.data ??
              []
            ) as CauseSummaryRow[];

          const causeIds =
            rawCauses.map(
              (
                cause,
              ) =>
                cause.id,
            );

          let images:
            CauseImageRow[] =
            [];

          if (
            causeIds.length >
            0
          ) {
            const {
              data,
              error,
            } =
              await supabase
                .from(
                  'imagenes_causa',
                )
                .select(
                  'id,causa_id,public_url,es_principal,orden',
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
                );

            if (
              error
            ) {
              throw error;
            }

            images =
              (
                data ??
                []
              ).map(
                (
                  image,
                ) => ({
                  id:
                    image.id,
                  causa_id:
                    image.causa_id,
                  public_url:
                    image.public_url,
                  es_principal:
                    Boolean(
                      image.es_principal,
                    ),
                  orden:
                    Number(
                      image.orden ??
                      0,
                    ),
                }),
              );
          }

          const imageMap =
            new Map<
              string,
              string[]
            >();

          images.forEach(
            (
              image,
            ) => {
              if (
                !image.public_url
              ) {
                return;
              }

              const current =
                imageMap.get(
                  image.causa_id,
                ) ??
                [];

              current.push(
                image.public_url,
              );

              imageMap.set(
                image.causa_id,
                current,
              );
            },
          );

          const raisedMap =
            new Map<
              string,
              number
            >();

          const contributionsMap =
            new Map<
              string,
              number
            >();

          contributionSummaries.forEach(
            (
              summary,
            ) => {
              if (
                !summary.causa_id
              ) {
                return;
              }

              const raised =
                Number(
                  summary.recaudado ??
                  0,
                );

              const count =
                Number(
                  summary.aportaciones ??
                  0,
                );

              raisedMap.set(
                summary.causa_id,
                Number.isFinite(
                  raised,
                )
                  ? raised
                  : 0,
              );

              contributionsMap.set(
                summary.causa_id,
                Number.isFinite(
                  count,
                )
                  ? count
                  : 0,
              );
            },
          );

          const normalized:
            HomeCause[] =
            await Promise.all(
              rawCauses.map(
                async (
                  cause,
                ) => {
                  let especieObjetivo =
                    0;
                  let especieAprobada =
                    0;
                  let especieRestante =
                    0;
                  let especieTotal =
                    0;
                  let especieCompletadas =
                    0;

                  if (
                    cause.tipo_meta ===
                    'especie'
                  ) {
                    const {
                      data:
                      speciesProgressData,
                      error:
                      speciesProgressError,
                    } =
                      await supabase.rpc(
                        'obtener_restante_meta_especie',
                        {
                          p_causa_id:
                            cause.id,
                        },
                      );

                    if (
                      speciesProgressError
                    ) {
                      throw speciesProgressError;
                    }

                    const speciesProgressRows =
                      (
                        speciesProgressData ??
                        []
                      ) as SpeciesProgressRow[];

                    especieTotal =
                      speciesProgressRows.length;

                    speciesProgressRows.forEach(
                      (
                        item,
                      ) => {
                        const goal =
                          Math.max(
                            0,
                            Number(
                              item.cantidad_objetivo ??
                              0,
                            ),
                          );

                        const approved =
                          Math.max(
                            0,
                            Number(
                              item.cantidad_aprobada ??
                              0,
                            ),
                          );

                        const remaining =
                          Math.max(
                            0,
                            Number(
                              item.cantidad_restante ??
                              0,
                            ),
                          );

                        especieObjetivo +=
                          goal;

                        especieAprobada +=
                          Math.min(
                            approved,
                            goal,
                          );

                        especieRestante +=
                          remaining;

                        if (
                          remaining <=
                          0 &&
                          goal >
                          0
                        ) {
                          especieCompletadas +=
                            1;
                        }
                      },
                    );
                  }

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
                    categoria:
                      cause.categoria,
                    estado:
                      String(
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
                    tipo_meta:
                      cause.tipo_meta ===
                        'especie'
                        ? 'especie'
                        : 'economica',
                    creado_en:
                      cause.creado_en,
                    imagen_url:
                      imageMap.get(
                        cause.id,
                      )?.[0] ??
                      null,
                    imagenes:
                      imageMap.get(
                        cause.id,
                      ) ??
                      [],
                    recaudado:
                      raisedMap.get(
                        cause.id,
                      ) ??
                      0,
                    aportaciones:
                      contributionsMap.get(
                        cause.id,
                      ) ??
                      0,
                    especie_objetivo:
                      especieObjetivo,
                    especie_aprobada:
                      especieAprobada,
                    especie_restante:
                      especieRestante,
                    especie_total:
                      especieTotal,
                    especie_completadas:
                      especieCompletadas,
                  };
                },
              ),
            );

          const totalAccumulated =
            contributionSummaries.reduce(
              (
                total,
                summary,
              ) => {
                const amount =
                  Number(
                    summary.recaudado ??
                    0,
                  );

                return (
                  total +
                  (
                    Number.isFinite(
                      amount,
                    )
                      ? amount
                      : 0
                  )
                );
              },
              0,
            );

          const verifiedContributionsCount =
            contributionSummaries.reduce(
              (
                total,
                summary,
              ) => {
                const count =
                  Number(
                    summary.aportaciones ??
                    0,
                  );

                return (
                  total +
                  (
                    Number.isFinite(
                      count,
                    )
                      ? count
                      : 0
                  )
                );
              },
              0,
            );

          setCauses(
            normalized,
          );

          setStats({
            totalAcumulado:
              totalAccumulated,
            causasActivas:
              normalized.filter(
                (
                  cause,
                ) =>
                  !cause.fecha_completada,
              ).length,
            causasCompletadas:
              normalized.filter(
                (
                  cause,
                ) =>
                  Boolean(
                    cause.fecha_completada,
                  ),
              ).length,
            aportacionesVerificadas:
              verifiedContributionsCount,
          });
        } catch (
        error
        ) {
          showToast(
            error instanceof
              Error
              ? error.message
              : 'No se pudo cargar la información del inicio.',
            'error',
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        authenticated,
        showToast,
      ],
    );

  useEffect(
    () => {
      void loadHome();
    },
    [
      loadHome,
    ],
  );

  const featured =
    useMemo(
      () =>
        causes.filter(
          (
            cause,
          ) =>
            cause.destacada,
        ),
      [
        causes,
      ],
    );

  const filtered =
    useMemo(
      () =>
        causes.filter(
          (
            cause,
          ) => {
            if (
              activeFilter ===
              'Todas'
            ) {
              return true;
            }

            if (
              activeFilter ===
              'Destacadas'
            ) {
              return cause.destacada;
            }

            if (
              activeFilter ===
              'Completadas'
            ) {
              return Boolean(
                cause.fecha_completada,
              );
            }

            if (
              activeFilter ===
              'Especie'
            ) {
              return (
                cause.tipo_meta ===
                'especie'
              );
            }

            return (
              cause.categoria
                .trim()
                .toLocaleLowerCase(
                  'es-MX',
                ) ===
              activeFilter.toLocaleLowerCase(
                'es-MX',
              )
            );
          },
        ),
      [
        causes,
        activeFilter,
      ],
    );

  const statsCards = [
    {
      label: 'Causas activas',
      value: stats.causasActivas,
      icon: HeartHandshake,
      cardClass:
        'border-emerald-400/[0.12] bg-emerald-400/[0.045]',
      glowClass:
        'bg-emerald-400/[0.12]',
      iconBoxClass:
        'bg-emerald-400/[0.1] text-emerald-300',
      valueClass:
        'text-emerald-200',
      labelClass:
        'text-emerald-300/60',
    },
    {
      label: 'Completadas',
      value: stats.causasCompletadas,
      icon: CheckCircle2,
      cardClass:
        'border-cyan-300/[0.12] bg-cyan-300/[0.04]',
      glowClass:
        'bg-cyan-300/[0.1]',
      iconBoxClass:
        'bg-cyan-300/[0.1] text-cyan-300',
      valueClass:
        'text-cyan-200',
      labelClass:
        'text-cyan-300/60',
    },
    {
      label: 'Aportaciones verificadas',
      value: stats.aportacionesVerificadas,
      icon: BadgeCheck,
      cardClass:
        'border-amber-300/[0.12] bg-amber-300/[0.04]',
      glowClass:
        'bg-amber-300/[0.1]',
      iconBoxClass:
        'bg-amber-300/[0.1] text-amber-200',
      valueClass:
        'text-amber-100',
      labelClass:
        'text-amber-200/60',
    },
  ];

  if (
    authenticated ===
    null
  ) {
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
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  if (
    authenticated ===
    false
  ) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-[760px] items-center justify-center px-4 py-10">
        <section className="relative w-full overflow-hidden rounded-[30px] border border-white/[0.06] bg-[linear-gradient(145deg,rgba(16,185,129,.08),rgba(255,255,255,.025)_45%,rgba(196,169,107,.05))] p-6 text-center sm:p-9">
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/[0.09] blur-[85px]" />
          <div className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-amber-300/[0.06] blur-[95px]" />

          <div className="relative z-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/[0.12] bg-emerald-400/[0.07] text-emerald-300">
              <HeartHandshake
                size={26}
              />
            </div>

            <span className="mt-5 block text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              Shitan Trust
            </span>

            <h1 className="mx-auto mt-3 max-w-[520px] text-2xl font-black tracking-[-0.045em] text-[var(--text)] sm:text-3xl">
              Inicia sesión
            </h1>

            <p className="mx-auto mt-3 max-w-[500px] text-[9px] leading-5 text-[var(--muted)] sm:text-[10px]">
              Accede a las causas, consulta su progreso y realiza aportaciones desde tu cuenta.
            </p>

            <div className="mx-auto mt-7 max-w-[280px]">
              <button
                type="button"
                onClick={
                  onLoginClick
                }
                className="web-dynamic-primary flex h-11 w-full items-center justify-center rounded-xl bg-emerald-400/[0.12] px-4 text-[9px] font-bold text-emerald-200 transition-all active:scale-[0.98]"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (
    loading
  ) {
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
    <>
      <div className="mx-auto w-full max-w-[1480px] px-3 pb-8 sm:px-5 lg:px-7">
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.055] bg-[linear-gradient(145deg,rgba(16,185,129,.075),rgba(255,255,255,.025)_42%,rgba(196,169,107,.035))] p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/[0.08] blur-[80px]" />

          <div className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-amber-300/[0.05] blur-[90px]" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/[0.025] blur-[90px]" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.8)]" />

                  <span className="text-[8px] font-bold uppercase tracking-[0.19em] text-emerald-300">
                    Fondo comunitario
                  </span>
                </div>

                <p className="mt-3 text-[9px] text-[var(--muted)]">
                  Total de aportaciones económicas verificadas
                </p>
              </div>

              <button
                type="button"
                disabled={refreshing}
                onClick={() =>
                  void loadHome(
                    true,
                  )
                }
                className="web-dynamic-button group grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-400/[0.1] bg-emerald-400/[0.05] text-emerald-300 transition-all disabled:opacity-40"
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

            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="pb-1 text-xl font-light text-emerald-300 sm:text-2xl">
                $
              </span>

              <strong className="text-[38px] font-black leading-none tracking-[-0.06em] text-[var(--text)] sm:text-[52px] lg:text-[64px]">
                {formatMXN(
                  stats.totalAcumulado,
                )}
              </strong>

              <span className="pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300/60">
                MXN
              </span>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/[0.1] bg-emerald-400/[0.045] px-3 py-1.5">
              <ShieldCheck
                size={12}
                className="text-emerald-300"
              />

              <span className="text-[7px] font-semibold text-emerald-200">
                Información verificada
              </span>
            </div>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
              {statsCards.map(
                (
                  stat,
                  index,
                ) => {
                  const Icon =
                    stat.icon;

                  return (
                    <div
                      key={
                        stat.label
                      }
                      className={`group/stat relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm transition-all duration-500 ${stat.cardClass}`}
                    >
                      <div
                        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-[42px] transition-all duration-500 group-hover/stat:scale-125 ${stat.glowClass}`}
                      />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`grid h-9 w-9 place-items-center rounded-xl transition-transform duration-500 group-hover/stat:-translate-y-0.5 group-hover/stat:scale-105 ${stat.iconBoxClass}`}
                          >
                            <Icon
                              size={15}
                            />
                          </div>

                          <span className={`text-[7px] font-bold tracking-[0.14em] ${stat.labelClass}`}>
                            0
                            {index +
                              1}
                          </span>
                        </div>

                        <strong className={`mt-5 block text-2xl font-black tracking-[-0.045em] ${stat.valueClass}`}>
                          {
                            stat.value
                          }
                        </strong>

                        <span className={`mt-1 block text-[8px] font-medium leading-4 ${stat.labelClass}`}>
                          {
                            stat.label
                          }
                        </span>
                      </div>

                      <div
                        className={`absolute bottom-0 left-0 h-[2px] w-full opacity-50 ${stat.iconBoxClass}`}
                      />
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        <section className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-400/[0.07] bg-emerald-400/[0.018] px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
            <ShieldCheck
              size={16}
            />
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-[9px] font-semibold text-[var(--text)]">
              Transparencia verificada
            </span>

            <span className="mt-0.5 block text-[7px] leading-4 text-[var(--muted)]">
              Cada aportación verificada forma parte del registro de Shitan Trust.
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />

            <span className="hidden text-[7px] font-semibold text-emerald-300 sm:block">
              Activo
            </span>
          </div>
        </section>

        {featured.length >
          0 && (
            <section className="mt-7">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Star
                      size={13}
                      className="fill-amber-300 text-amber-300"
                    />

                    <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-amber-200">
                      Destacadas
                    </span>
                  </div>

                  <h2 className="mt-1.5 text-lg font-bold tracking-[-0.04em] text-[var(--text)] sm:text-xl">
                    Causas que necesitan impulso
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter(
                      'Destacadas',
                    );

                    window.setTimeout(
                      () => {
                        document
                          .getElementById(
                            'causes',
                          )
                          ?.scrollIntoView({
                            behavior:
                              'smooth',
                            block:
                              'start',
                          });
                      },
                      50,
                    );
                  }}
                  className="web-dynamic-link flex items-center gap-1 text-[8px] font-semibold text-amber-200 transition-colors"
                >
                  Ver todas

                  <ChevronRight
                    size={12}
                  />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {featured
                  .slice(
                    0,
                    3,
                  )
                  .map(
                    (
                      cause,
                      index,
                    ) => {
                      const progress =
                        progressForCause(
                          cause,
                        );

                      const completed =
                        Boolean(
                          cause.fecha_completada,
                        );

                      return (
                        <article
                          key={
                            cause.id
                          }
                          className="web-dynamic-card group relative min-w-0 overflow-hidden rounded-[24px] border border-amber-300/[0.1] bg-white/[0.022] transition-all duration-300"
                          style={{
                            animationDelay: `${index * 70}ms`,
                          }}
                          onMouseEnter={
                            handleDynamicMouseEnter
                          }
                          onMouseMove={
                            handleDynamicMouseMove
                          }
                          onMouseLeave={
                            handleDynamicMouseLeave
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openDetail(
                                cause.id,
                              )
                            }
                            className="block w-full text-left"
                          >
                            <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.025]">
                              <CauseImageCarousel
                                images={
                                  cause.imagenes
                                }
                                title={
                                  cause.titulo
                                }
                                className="web-dynamic-image transition-transform duration-700"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-[#080d17] via-transparent to-black/20" />

                              <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-[#0a0f18]/80 px-2.5 py-1.5 backdrop-blur-md">
                                <Star
                                  size={10}
                                  className="fill-amber-300 text-amber-300"
                                />

                                <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-amber-100">
                                  Destacada
                                </span>
                              </div>

                              <span className="absolute bottom-3 left-3 rounded-full border border-white/[0.08] bg-black/45 px-2.5 py-1 text-[7px] font-semibold text-white/80 backdrop-blur-md">
                                {formatCategory(
                                  cause.categoria,
                                )}
                              </span>
                            </div>

                            <div className="p-4 pb-3">
                              <h3 className="line-clamp-2 text-[13px] font-bold leading-5 tracking-[-0.02em] text-[var(--text)]">
                                {
                                  cause.titulo
                                }
                              </h3>

                              {cause.resumen && (
                                <p className="mt-2 line-clamp-2 text-[8px] leading-4 text-[var(--muted)]">
                                  {
                                    cause.resumen
                                  }
                                </p>
                              )}

                              {cause.ubicacion && (
                                <div className="mt-3 flex min-w-0 items-center gap-1.5">
                                  <MapPin
                                    size={11}
                                    className="shrink-0 text-amber-200"
                                  />

                                  <span className="truncate text-[7px] text-[var(--muted)]">
                                    {
                                      cause.ubicacion
                                    }
                                  </span>
                                </div>
                              )}

                              {cause.tipo_meta ===
                                'economica' ? (
                                <div className="mt-4">
                                  <div className="flex items-end justify-between gap-3">
                                    <div>
                                      <span className="block text-[6px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">
                                        Recaudado
                                      </span>

                                      <strong className="mt-1 block text-[11px] font-bold text-emerald-300">
                                        $
                                        {formatMXN(
                                          cause.recaudado,
                                        )}
                                      </strong>
                                    </div>

                                    <div className="text-right">
                                      <span className="block text-[6px] text-[var(--muted)]">
                                        Meta
                                      </span>

                                      <span className="mt-1 block text-[8px] font-semibold text-[var(--text-soft)]">
                                        $
                                        {formatMXN(
                                          cause.meta_economica ??
                                          0,
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700"
                                      style={{
                                        width: `${progress}%`,
                                      }}
                                    />
                                  </div>

                                  <div className="mt-2 flex justify-between gap-2">
                                    <span className="text-[7px] text-[var(--muted)]">
                                      {
                                        cause.aportaciones
                                      }{' '}
                                      aportaciones
                                    </span>

                                    <span className="text-[7px] font-semibold text-emerald-300">
                                      {Math.round(
                                        progress,
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4">
                                  <div className="flex items-end justify-between gap-3">
                                    <div>
                                      <span className="block text-[6px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">
                                        Necesidades cubiertas
                                      </span>

                                      <strong className="mt-1 block text-[11px] font-black text-amber-200">
                                        {cause.especie_completadas}
                                        /
                                        {cause.especie_total}
                                      </strong>
                                    </div>

                                    <div className="text-right">
                                      <span className="block text-[6px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">
                                        Progreso
                                      </span>

                                      <strong className="mt-1 block text-[11px] font-black text-amber-200">
                                        {Math.round(
                                          progress,
                                        )}
                                        %
                                      </strong>
                                    </div>
                                  </div>

                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-yellow-200 transition-all duration-700"
                                      style={{
                                        width: `${progress}%`,
                                      }}
                                    />
                                  </div>

                                  <div className="mt-2 text-[7px] text-[var(--muted)]">
                                    Faltan{' '}
                                    {formatQuantity(
                                      cause.especie_restante,
                                    )}{' '}
                                    unidades acumuladas
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>

                          <div className="web-dynamic-actions flex gap-2 border-t border-white/[0.05] p-3">
                            <button
                              type="button"
                              onClick={() =>
                                openDetail(
                                  cause.id,
                                )
                              }
                              className="web-dynamic-secondary group/detail flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-3 text-[8px] font-semibold text-[var(--text-soft)] transition-all active:scale-[0.98]"
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
                                  openContribution(
                                    cause.id,
                                  )
                                }
                                className="web-dynamic-primary group/contribute flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400/[0.11] px-3 text-[8px] font-bold text-emerald-200 transition-all active:scale-[0.98]"
                              >
                                {cause.tipo_meta ===
                                  'economica' ? (
                                  <CircleDollarSign
                                    size={13}
                                  />
                                ) : (
                                  <Package
                                    size={13}
                                  />
                                )}

                                Aportar ahora

                                <ArrowRight
                                  size={12}
                                  className="web-dynamic-arrow transition-transform duration-300"
                                />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    },
                  )}
              </div>
            </section>
          )}

        <section
          id="causes"
          data-section="causes"
          className="mt-8 scroll-mt-24"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                Causas verificadas
              </span>

              <h2 className="mt-1.5 text-xl font-bold tracking-[-0.045em] text-[var(--text)] sm:text-2xl">
                Genera un impacto real
              </h2>

              <p className="mt-1 max-w-xl text-[8px] leading-4 text-[var(--muted)]">
                Explora las causas publicadas, conoce su historia y realiza una aportación.
              </p>
            </div>

            <span className="text-[8px] font-semibold text-[var(--muted)]">
              {filtered.length}{' '}
              {filtered.length ===
                1
                ? 'causa'
                : 'causas'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap">
            {FILTERS.map(
              (
                filter,
              ) => {
                const active =
                  activeFilter ===
                  filter;

                return (
                  <button
                    key={
                      filter
                    }
                    type="button"
                    onClick={() =>
                      setActiveFilter(
                        filter,
                      )
                    }
                    className={`relative min-w-0 overflow-hidden rounded-xl px-2 py-2.5 text-[7px] font-semibold transition-all sm:px-4 sm:text-[8px] ${active
                      ? 'bg-emerald-400/[0.1] text-emerald-200 shadow-[inset_0_0_0_1px_rgba(52,211,153,.12)]'
                      : 'web-dynamic-filter bg-white/[0.025] text-[var(--muted)]'
                      }`}
                  >
                    <span className="block truncate">
                      {
                        filter
                      }
                    </span>

                    {active && (
                      <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              },
            )}
          </div>

          {filtered.length >
            0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(
                (
                  cause,
                  index,
                ) => {
                  const progress =
                    progressForCause(
                      cause,
                    );

                  const completed =
                    Boolean(
                      cause.fecha_completada,
                    );

                  return (
                    <article
                      key={
                        cause.id
                      }
                      className={`web-dynamic-card group min-w-0 overflow-hidden rounded-[22px] border bg-white/[0.022] transition-all duration-300 ${cause.destacada
                        ? 'web-dynamic-card-featured border-amber-300/[0.12]'
                        : 'border-white/[0.055]'
                        }`}
                      onMouseEnter={
                        handleDynamicMouseEnter
                      }
                      onMouseMove={
                        handleDynamicMouseMove
                      }
                      onMouseLeave={
                        handleDynamicMouseLeave
                      }
                      style={{
                        animationDelay: `${index * 60}ms`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openDetail(
                            cause.id,
                          )
                        }
                        className="block w-full text-left"
                      >
                        <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.025]">
                          <CauseImageCarousel
                            images={
                              cause.imagenes
                            }
                            title={
                              cause.titulo
                            }
                            className="web-dynamic-image transition-transform duration-700"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-[#080d17] via-transparent to-transparent" />

                          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                            {cause.destacada && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-black/55 px-2 py-1 text-[6px] font-bold uppercase tracking-[0.08em] text-amber-200 backdrop-blur-md">
                                <Star
                                  size={8}
                                  className="fill-amber-300"
                                />

                                Destacada
                              </span>
                            )}

                            {completed && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-black/55 px-2 py-1 text-[6px] font-bold uppercase tracking-[0.08em] text-emerald-200 backdrop-blur-md">
                                <CheckCircle2
                                  size={8}
                                />

                                Completada
                              </span>
                            )}
                          </div>

                          <span className="absolute bottom-3 left-3 rounded-full border border-white/[0.08] bg-black/45 px-2.5 py-1 text-[7px] font-semibold text-white/80 backdrop-blur-md">
                            {formatCategory(
                              cause.categoria,
                            )}
                          </span>
                        </div>

                        <div className="p-4 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="line-clamp-2 text-[12px] font-bold leading-5 text-[var(--text)]">
                                {
                                  cause.titulo
                                }
                              </h3>

                              {cause.organizador && (
                                <span className="mt-1 block truncate text-[7px] text-[var(--muted)]">
                                  Por{' '}
                                  {
                                    cause.organizador
                                  }
                                </span>
                              )}
                            </div>

                            {cause.tipo_meta ===
                              'economica' ? (
                              <CircleDollarSign
                                size={15}
                                className="shrink-0 text-emerald-300"
                              />
                            ) : (
                              <Package
                                size={15}
                                className="shrink-0 text-amber-200"
                              />
                            )}
                          </div>

                          {cause.resumen && (
                            <p className="mt-2 line-clamp-2 text-[8px] leading-4 text-[var(--muted)]">
                              {
                                cause.resumen
                              }
                            </p>
                          )}

                          {cause.ubicacion && (
                            <div className="mt-3 flex min-w-0 items-center gap-1.5">
                              <MapPin
                                size={10}
                                className="shrink-0 text-[var(--muted)]"
                              />

                              <span className="truncate text-[7px] text-[var(--muted)]">
                                {
                                  cause.ubicacion
                                }
                              </span>
                            </div>
                          )}

                          {cause.tipo_meta ===
                            'economica' ? (
                            <div className="mt-4">
                              <div className="flex items-end justify-between gap-3">
                                <div>
                                  <strong className="block text-[11px] font-bold text-emerald-300">
                                    $
                                    {formatMXN(
                                      cause.recaudado,
                                    )}
                                  </strong>

                                  <span className="mt-0.5 block text-[6px] text-[var(--muted)]">
                                    recaudados
                                  </span>
                                </div>

                                <span className="text-[7px] text-[var(--muted)]">
                                  de $
                                  {formatMXN(
                                    cause.meta_economica ??
                                    0,
                                  )}
                                </span>
                              </div>

                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                                <div
                                  className="h-full rounded-full bg-emerald-400"
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>

                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[7px] text-[var(--muted)]">
                                  {
                                    cause.aportaciones
                                  }{' '}
                                  aportaciones
                                </span>

                                <span className="text-[7px] font-semibold text-emerald-300">
                                  {Math.round(
                                    progress,
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4">
                              <div className="flex items-end justify-between gap-3">
                                <div>
                                  <span className="block text-[6px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">
                                    Necesidades cubiertas
                                  </span>

                                  <strong className="mt-1 block text-[11px] font-black text-amber-200">
                                    {cause.especie_completadas}
                                    /
                                    {cause.especie_total}
                                  </strong>
                                </div>

                                <div className="text-right">
                                  <span className="block text-[6px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">
                                    Progreso
                                  </span>

                                  <strong className="mt-1 block text-[11px] font-black text-amber-200">
                                    {Math.round(
                                      progress,
                                    )}
                                    %
                                  </strong>
                                </div>
                              </div>

                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-yellow-200 transition-all duration-700"
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>

                              <div className="mt-2 text-[7px] text-[var(--muted)]">
                                Faltan{' '}
                                {formatQuantity(
                                  cause.especie_restante,
                                )}{' '}
                                unidades acumuladas
                              </div>
                            </div>
                          )}

                          {cause.fecha_limite && (
                            <div className="mt-3 text-[7px] text-[var(--muted)]">
                              Hasta{' '}
                              {formatDate(
                                cause.fecha_limite,
                              )}
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="web-dynamic-actions grid grid-cols-2 gap-2 border-t border-white/[0.05] p-3">
                        <button
                          type="button"
                          onClick={() =>
                            openDetail(
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
                              openContribution(
                                cause.id,
                              )
                            }
                            className="web-dynamic-primary group/contribute flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400/[0.11] px-3 text-[8px] font-bold text-emerald-200 transition-all active:scale-[0.98]"
                          >
                            {cause.tipo_meta ===
                              'economica' ? (
                              <CircleDollarSign
                                size={13}
                              />
                            ) : (
                              <Package
                                size={13}
                              />
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
                },
              )}
            </div>
          ) : (
            <div className="mt-4 flex min-h-[250px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[0.07] bg-white/[0.015] px-5 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/[0.06] text-emerald-300">
                <Sparkles
                  size={20}
                />
              </div>

              <h3 className="mt-4 text-[11px] font-semibold text-[var(--text)]">
                Sin causas en esta categoría
              </h3>

              <p className="mt-1 max-w-[310px] text-[8px] leading-4 text-[var(--muted)]">
                Selecciona otra categoría para descubrir más causas publicadas.
              </p>

              <button
                type="button"
                onClick={() =>
                  setActiveFilter(
                    'Todas',
                  )
                }
                className="web-dynamic-primary mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-400/[0.08] px-4 text-[8px] font-semibold text-emerald-200 transition-all"
              >
                Ver todas las causas

                <ArrowRight
                  size={12}
                />
              </button>
            </div>
          )}
        </section>

        <section className="mt-7 overflow-hidden rounded-[24px] border border-white/[0.055] bg-white/[0.02] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.07] text-emerald-300">
              <TrendingUp
                size={16}
              />
            </div>

            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                Impacto transparente
              </span>

              <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">
                Los montos se calculan directamente con las aportaciones verificadas registradas en Shitan Trust.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}