import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  createPortal,
} from 'react-dom';

import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  HeartHandshake,
  ImageIcon,
  Landmark,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';

import type {
  Screen,
} from '../../types';

import {
  supabase,
} from '../../lib/supabase';

interface CauseDetailScreenProps {
  open: boolean;
  causeId: string;
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
  onClose: () => void;
}

interface CauseRow {
  id: string;
  slug: string;
  titulo: string;
  resumen: string | null;
  historia: string | null;
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
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
  tipo_meta:
  | 'economica'
  | 'especie';
  latitud: number | null;
  longitud: number | null;
  google_place_id: string | null;
}

interface CauseImage {
  id: string;
  causa_id: string;
  storage_path: string;
  public_url: string;
  nombre_archivo: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  es_principal: boolean;
  orden: number;
  creado_en: string;
}

interface ContributionRow {
  id: string;
  causa_id: string;
  tipo: string;
  monto: number | string | null;
  estado: string;
}

interface MetaEspecie {
  id: string;
  causa_id: string;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  cantidad_objetivo: number;
  orden: number;
  creado_en: string;
  cantidad_aportada: number;
}

interface ContributionDetail {
  id: string;
  aportacion_id: string;
  meta_especie_id: string | null;
  nombre: string;
  cantidad: number | string;
  unidad: string;
  notas: string | null;
  creado_en: string;
}

interface CauseUpdate {
  id: string;
  causa_id: string;
  titulo: string;
  contenido: string;
  ruta_imagen: string | null;
  publica: boolean;
  publicada_en: string;
  creada_por: string | null;
  creado_en: string;
}

interface ImpactEvidence {
  id: string;
  causa_id: string;
  titulo: string;
  descripcion: string | null;
  fecha_entrega: string | null;
  monto_utilizado: number | string | null;
  publica: boolean;
  verificada: boolean;
  verificada_por: string | null;
  verificada_en: string | null;
  creada_por: string | null;
  creado_en: string;
}

interface CreatorProfile {
  id: string;
  correo: string | null;
  nombre_completo: string | null;
  alias: string | null;
  telefono: string | null;
  avatar_url: string | null;
}

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
  value:
    | string
    | null
    | undefined,
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
      month: 'short',
      year: 'numeric',
    },
  ).format(
    date,
  );
}

function normalizeStatus(
  value: unknown,
) {
  return String(
    value ?? '',
  )
    .trim()
    .toLocaleLowerCase(
      'es-MX',
    );
}

function isVerifiedContribution(
  value: unknown,
) {
  const status =
    normalizeStatus(
      value,
    );

  return (
    status ===
    'confirmada' ||
    status ===
    'confirmado' ||
    status ===
    'aprobada' ||
    status ===
    'aprobado'
  );
}

function getProfileName(
  profile:
    | CreatorProfile
    | null,
) {
  if (!profile) {
    return 'Shitan Trust';
  }

  return (
    profile.nombre_completo
      ?.trim() ||
    profile.alias
      ?.trim() ||
    profile.correo
      ?.split('@')[0] ||
    'Shitan Trust'
  );
}

function getInitials(
  value: string,
) {
  const parts =
    value
      .trim()
      .split(/\s+/)
      .filter(
        Boolean,
      );

  if (!parts.length) {
    return 'ST';
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[
    parts.length - 1
  ][0]}`.toUpperCase();
}

export default function CauseDetailScreen({
  open,
  causeId,
  navigate,
  showToast,
  onClose,
}: CauseDetailScreenProps) {
  const [
    cause,
    setCause,
  ] =
    useState<CauseRow | null>(
      null,
    );

  const [
    images,
    setImages,
  ] =
    useState<
      CauseImage[]
    >([]);

  const [
    contributions,
    setContributions,
  ] =
    useState<
      ContributionRow[]
    >([]);

  const [
    metas,
    setMetas,
  ] =
    useState<
      MetaEspecie[]
    >([]);

  const [
    updates,
    setUpdates,
  ] =
    useState<
      CauseUpdate[]
    >([]);

  const [
    evidences,
    setEvidences,
  ] =
    useState<
      ImpactEvidence[]
    >([]);

  const [
    creator,
    setCreator,
  ] =
    useState<CreatorProfile | null>(
      null,
    );

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState(0);

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

  const loadCause =
    useCallback(
      async (
        refresh = false,
      ) => {
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
          const {
            data:
            causeData,
            error:
            causeError,
          } =
            await supabase
              .from(
                'causas',
              )
              .select(
                'id,slug,titulo,resumen,historia,categoria,estado,meta_economica,organizador,beneficiario,ubicacion,fecha_inicio,fecha_limite,fecha_completada,destacada,orden,creado_por,creado_en,actualizado_en,tipo_meta,latitud,longitud,google_place_id',
              )
              .eq(
                'id',
                causeId,
              )
              .maybeSingle();

          if (
            causeError
          ) {
            throw causeError;
          }

          if (
            !causeData
          ) {
            throw new Error(
              'No se encontró la causa.',
            );
          }

          const [
            imagesResult,
            contributionsResult,
            metasResult,
            updatesResult,
            evidencesResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  'imagenes_causa',
                )
                .select(
                  'id,causa_id,storage_path,public_url,nombre_archivo,mime_type,size_bytes,es_principal,orden,creado_en',
                )
                .eq(
                  'causa_id',
                  causeId,
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
                  'aportaciones',
                )
                .select(
                  'id,causa_id,tipo,monto,estado',
                )
                .eq(
                  'causa_id',
                  causeId,
                ),

              supabase
                .from(
                  'metas_especie',
                )
                .select(
                  'id,causa_id,nombre,descripcion,unidad,cantidad_objetivo,orden,creado_en',
                )
                .eq(
                  'causa_id',
                  causeId,
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
                  'actualizaciones_causa',
                )
                .select(
                  'id,causa_id,titulo,contenido,ruta_imagen,publica,publicada_en,creada_por,creado_en',
                )
                .eq(
                  'causa_id',
                  causeId,
                )
                .eq(
                  'publica',
                  true,
                )
                .order(
                  'publicada_en',
                  {
                    ascending:
                      false,
                  },
                ),

              supabase
                .from(
                  'evidencias_impacto',
                )
                .select(
                  'id,causa_id,titulo,descripcion,fecha_entrega,monto_utilizado,publica,verificada,verificada_por,verificada_en,creada_por,creado_en',
                )
                .eq(
                  'causa_id',
                  causeId,
                )
                .eq(
                  'publica',
                  true,
                )
                .order(
                  'creado_en',
                  {
                    ascending:
                      false,
                  },
                ),
            ]);

          if (
            imagesResult.error
          ) {
            throw imagesResult.error;
          }

          if (
            contributionsResult.error
          ) {
            throw contributionsResult.error;
          }

          if (
            metasResult.error
          ) {
            throw metasResult.error;
          }

          if (
            updatesResult.error
          ) {
            throw updatesResult.error;
          }

          if (
            evidencesResult.error
          ) {
            throw evidencesResult.error;
          }

          const rawContributions =
            (
              contributionsResult.data ??
              []
            ) as ContributionRow[];

          const verifiedContributions =
            rawContributions.filter(
              (
                contribution,
              ) =>
                isVerifiedContribution(
                  contribution.estado,
                ),
            );

          const verifiedIds =
            verifiedContributions.map(
              (
                contribution,
              ) =>
                contribution.id,
            );

          let contributionDetails:
            ContributionDetail[] =
            [];

          if (
            verifiedIds.length >
            0
          ) {
            const {
              data,
              error,
            } =
              await supabase
                .from(
                  'detalle_aportaciones_especie',
                )
                .select(
                  'id,aportacion_id,meta_especie_id,nombre,cantidad,unidad,notas,creado_en',
                )
                .in(
                  'aportacion_id',
                  verifiedIds,
                );

            if (
              error
            ) {
              throw error;
            }

            contributionDetails =
              (
                data ??
                []
              ) as ContributionDetail[];
          }

          const donatedByMeta =
            new Map<
              string,
              number
            >();

          contributionDetails.forEach(
            (
              item,
            ) => {
              if (
                !item.meta_especie_id
              ) {
                return;
              }

              const amount =
                Number(
                  item.cantidad,
                );

              if (
                !Number.isFinite(
                  amount,
                )
              ) {
                return;
              }

              donatedByMeta.set(
                item.meta_especie_id,
                (
                  donatedByMeta.get(
                    item.meta_especie_id,
                  ) ??
                  0
                ) +
                amount,
              );
            },
          );

          const normalizedMetas:
            MetaEspecie[] =
            (
              metasResult.data ??
              []
            ).map(
              (
                item,
              ) => ({
                id:
                  item.id,
                causa_id:
                  item.causa_id,
                nombre:
                  item.nombre,
                descripcion:
                  item.descripcion ??
                  null,
                unidad:
                  item.unidad,
                cantidad_objetivo:
                  Number(
                    item.cantidad_objetivo,
                  ),
                orden:
                  Number(
                    item.orden ??
                    0,
                  ),
                creado_en:
                  item.creado_en,
                cantidad_aportada:
                  donatedByMeta.get(
                    item.id,
                  ) ??
                  0,
              }),
            );

          let creatorProfile:
            CreatorProfile | null =
            null;

          if (
            causeData.creado_por
          ) {
            const {
              data,
              error,
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
                  causeData.creado_por,
                )
                .maybeSingle();

            if (
              error
            ) {
              throw error;
            }

            if (
              data
            ) {
              creatorProfile =
              {
                id:
                  data.id,
                correo:
                  data.correo ??
                  null,
                nombre_completo:
                  data.nombre_completo ??
                  null,
                alias:
                  data.alias ??
                  null,
                telefono:
                  data.telefono ??
                  null,
                avatar_url:
                  data.avatar_url ??
                  null,
              };
            }
          }

          setCause({
            id:
              causeData.id,
            slug:
              causeData.slug,
            titulo:
              causeData.titulo,
            resumen:
              causeData.resumen ??
              null,
            historia:
              causeData.historia ??
              null,
            categoria:
              causeData.categoria,
            estado:
              String(
                causeData.estado,
              ),
            meta_economica:
              causeData.meta_economica ??
              null,
            organizador:
              causeData.organizador ??
              null,
            beneficiario:
              causeData.beneficiario ??
              null,
            ubicacion:
              causeData.ubicacion ??
              null,
            fecha_inicio:
              causeData.fecha_inicio ??
              null,
            fecha_limite:
              causeData.fecha_limite ??
              null,
            fecha_completada:
              causeData.fecha_completada ??
              null,
            destacada:
              Boolean(
                causeData.destacada,
              ),
            orden:
              Number(
                causeData.orden ??
                0,
              ),
            creado_por:
              causeData.creado_por ??
              null,
            creado_en:
              causeData.creado_en,
            actualizado_en:
              causeData.actualizado_en,
            tipo_meta:
              causeData.tipo_meta ===
                'especie'
                ? 'especie'
                : 'economica',
            latitud:
              causeData.latitud ??
              null,
            longitud:
              causeData.longitud ??
              null,
            google_place_id:
              causeData.google_place_id ??
              null,
          });

          setImages(
            (
              imagesResult.data ??
              []
            ) as CauseImage[],
          );

          setContributions(
            verifiedContributions,
          );

          setMetas(
            normalizedMetas,
          );

          setUpdates(
            (
              updatesResult.data ??
              []
            ) as CauseUpdate[],
          );

          setEvidences(
            (
              evidencesResult.data ??
              []
            ) as ImpactEvidence[],
          );

          setCreator(
            creatorProfile,
          );

          setSelectedImage(
            0,
          );
        } catch (
        error
        ) {
          showToast(
            error instanceof
              Error
              ? error.message
              : 'No se pudo cargar la causa.',
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
        causeId,
        showToast,
      ],
    );

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      void loadCause();
    },
    [
      open,
      loadCause,
    ],
  );

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style.overflow =
        'hidden';

      return () => {
        document.body.style.overflow =
          previousOverflow;
      };
    },
    [
      open,
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
            setSelectedImage(
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
          5000,
        );

      return () => {
        window.clearInterval(
          interval,
        );
      };
    },
    [
      images.length,
    ],
  );

  const showPreviousImage =
    () => {
      if (
        images.length <=
        1
      ) {
        return;
      }

      setSelectedImage(
        (
          current,
        ) =>
          current ===
            0
            ? images.length -
            1
            : current -
            1,
      );
    };

  const showNextImage =
    () => {
      if (
        images.length <=
        1
      ) {
        return;
      }

      setSelectedImage(
        (
          current,
        ) =>
          (
            current +
            1
          ) %
          images.length,
      );
    };

  const totalRaised =
    useMemo(
      () =>
        contributions.reduce(
          (
            total,
            contribution,
          ) => {
            if (
              contribution.tipo !==
              'economica' ||
              contribution.monto ===
              null
            ) {
              return total;
            }

            const amount =
              Number(
                contribution.monto,
              );

            return Number.isFinite(
              amount,
            )
              ? total +
              amount
              : total;
          },
          0,
        ),
      [
        contributions,
      ],
    );

  const economicContributions =
    useMemo(
      () =>
        contributions.filter(
          (
            contribution,
          ) =>
            contribution.tipo ===
            'economica',
        ).length,
      [
        contributions,
      ],
    );

  const inKindContributions =
    useMemo(
      () =>
        contributions.filter(
          (
            contribution,
          ) =>
            contribution.tipo ===
            'especie',
        ).length,
      [
        contributions,
      ],
    );

  const progress =
    useMemo(
      () => {
        if (
          !cause ||
          cause.tipo_meta !==
          'economica'
        ) {
          return 0;
        }

        const goal =
          Number(
            cause.meta_economica ??
            0,
          );

        if (
          !goal ||
          goal <=
          0
        ) {
          return 0;
        }

        return Math.min(
          100,
          Math.max(
            0,
            (
              totalRaised /
              goal
            ) *
            100,
          ),
        );
      },
      [
        cause,
        totalRaised,
      ],
    );

  const creatorName =
    getProfileName(
      creator,
    );

  if (
    !open
  ) {
    return null;
  }

  const renderModal =
    (
      content: ReactNode,
    ) =>
      createPortal(
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-[180] flex items-end justify-center overflow-hidden bg-black/70 backdrop-blur-[6px] sm:items-center sm:p-4 lg:p-6">
          <style>
            {`
              @keyframes causeDetailModalEnter {
                from {
                  opacity: 0;
                  transform: translate3d(0, 24px, 0) scale(.985);
                }

                to {
                  opacity: 1;
                  transform: translate3d(0, 0, 0) scale(1);
                }
              }

              .cause-detail-modal-scroll {
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
                scrollbar-gutter: stable;
              }

              @media (max-width: 639px) {
                .cause-detail-modal-dialog {
                  height: 100%;
                  max-height: 100%;
                  border-bottom-left-radius: 0;
                  border-bottom-right-radius: 0;
                }
              }
            `}
          </style>

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de causa"
            className="cause-detail-modal-dialog flex h-full max-h-full w-full min-w-0 flex-col overflow-hidden rounded-t-[28px] border border-white/[0.07] bg-[#080d17] shadow-[0_-20px_80px_rgba(0,0,0,.55)] animate-[causeDetailModalEnter_.3s_cubic-bezier(.22,1,.36,1)] sm:h-[min(88dvh,920px)] sm:max-w-[1320px] sm:rounded-[28px] sm:shadow-[0_30px_100px_rgba(0,0,0,.65)]"
          >
            <div className="cause-detail-modal-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              {content}
            </div>
          </div>
        </div>,
        document.body,
      );

  if (
    loading
  ) {
    return renderModal(
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.05]">
            <Loader2
              size={23}
              className="animate-spin text-emerald-300"
            />
          </div>

          <p className="mt-4 text-[9px] font-medium text-[var(--muted)]">
            Cargando causa...
          </p>
        </div>
      </div>,
    );
  }

  if (
    !cause
  ) {
    return renderModal(
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1480px] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04] text-[var(--muted)]">
            <HeartHandshake
              size={22}
            />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-[var(--text)]">
            Causa no disponible
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate(
                'home',
              )
            }
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-400/[0.09] px-4 text-[8px] font-semibold text-emerald-200"
          >
            Volver al inicio
          </button>
        </div>
      </div>,
    );
  }

  const mainImage =
    images[
      selectedImage
    ]?.public_url ??
    null;

  const completed =
    Boolean(
      cause.fecha_completada,
    );

  return renderModal(
    <div className="mx-auto w-full max-w-[1480px] px-3 pb-8 pt-3 sm:px-5 sm:pt-5 lg:px-7 lg:pt-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.055] bg-white/[0.02]">
        <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.02] sm:aspect-[16/8] lg:aspect-[16/7]">
          {mainImage ? (
            <img
              key={
                images[
                  selectedImage
                ]?.id ??
                mainImage
              }
              src={
                mainImage
              }
              alt={
                images[
                  selectedImage
                ]?.nombre_archivo ??
                cause.titulo
              }
              className="h-full w-full animate-[causeCarouselFade_.45s_ease-out] object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_center,rgba(52,211,153,.06),transparent_60%)]">
              <ImageIcon
                size={36}
                className="text-[var(--muted)]"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#070c15] via-[#070c15]/25 to-black/20" />

          {images.length >
            1 && (
              <>
                <button
                  type="button"
                  onClick={
                    showPreviousImage
                  }
                  aria-label="Imagen anterior"
                  className="group absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/[0.12] bg-black/45 text-white/80 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:bg-black/65 hover:text-white active:scale-95 sm:left-5"
                >
                  <ChevronLeft
                    size={18}
                    className="transition-transform group-hover:-translate-x-0.5"
                  />
                </button>

                <button
                  type="button"
                  onClick={
                    showNextImage
                  }
                  aria-label="Imagen siguiente"
                  className="group absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/[0.12] bg-black/45 text-white/80 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:bg-black/65 hover:text-white active:scale-95 sm:right-5"
                >
                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>

                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/35 px-2.5 py-2 backdrop-blur-xl sm:bottom-4">
                  {images.map(
                    (
                      image,
                      index,
                    ) => (
                      <button
                        key={
                          image.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            index,
                          )
                        }
                        aria-label={`Ver imagen ${index + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${selectedImage ===
                          index
                          ? 'w-5 bg-white'
                          : 'w-1.5 bg-white/35 hover:bg-white/60'
                          }`}
                      />
                    ),
                  )}
                </div>
              </>
            )}

          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3 sm:left-5 sm:right-5 sm:top-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/[0.1] bg-black/45 px-3 py-1.5 text-[7px] font-semibold text-white/80 backdrop-blur-xl">
                {formatCategory(
                  cause.categoria,
                )}
              </span>

              {cause.destacada && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-black/45 px-3 py-1.5 text-[7px] font-semibold text-amber-200 backdrop-blur-xl">
                  <Star
                    size={9}
                    className="fill-amber-300"
                  />

                  Destacada
                </span>
              )}

              {completed && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-black/45 px-3 py-1.5 text-[7px] font-semibold text-emerald-200 backdrop-blur-xl">
                  <CheckCircle2
                    size={9}
                  />

                  Completada
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadCause(
                  true,
                )
              }
              className="group grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.1] bg-black/40 text-white/70 backdrop-blur-xl transition-all hover:bg-black/60 hover:text-white disabled:opacity-40"
            >
              <RefreshCw
                size={13}
                className={
                  refreshing
                    ? 'animate-spin'
                    : 'transition-transform duration-500 group-hover:rotate-180'
                }
              />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={12}
                  className="text-emerald-300"
                />

                <span className="text-[7px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                  Causa verificada
                </span>
              </div>

              <h1 className="mt-2 max-w-3xl text-2xl font-black leading-[1.08] tracking-[-0.045em] text-white sm:text-3xl lg:text-4xl">
                {
                  cause.titulo
                }
              </h1>

              {cause.resumen && (
                <p className="mt-3 max-w-2xl text-[9px] leading-5 text-white/60 sm:text-[11px]">
                  {
                    cause.resumen
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        {images.length >
          1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-white/[0.05] bg-black/[0.1] p-3">
              {images.map(
                (
                  image,
                  index,
                ) => (
                  <button
                    key={
                      image.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedImage(
                        index,
                      )
                    }
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition-all ${selectedImage ===
                      index
                      ? 'border-emerald-300/40 opacity-100'
                      : 'border-white/[0.06] opacity-50 hover:opacity-90'
                      }`}
                  >
                    <img
                      src={
                        image.public_url
                      }
                      alt={
                        image.nombre_archivo ??
                        cause.titulo
                      }
                      className="h-full w-full object-cover"
                    />
                  </button>
                ),
              )}
            </div>
          )}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-4">
          {cause.tipo_meta ===
            'economica' ? (
            <section className="rounded-[24px] border border-emerald-400/[0.09] bg-emerald-400/[0.02] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-emerald-300/70">
                    Recaudación
                  </span>

                  <div className="mt-2 flex items-end gap-2">
                    <strong className="text-2xl font-black tracking-[-0.045em] text-emerald-200 sm:text-3xl">
                      $
                      {formatMXN(
                        totalRaised,
                      )}
                    </strong>

                    <span className="pb-1 text-[7px] font-semibold text-[var(--muted)]">
                      MXN
                    </span>
                  </div>
                </div>

                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                  <CircleDollarSign
                    size={17}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="text-[8px] text-[var(--muted)]">
                  Meta de $
                  {formatMXN(
                    Number(
                      cause.meta_economica ??
                      0,
                    ),
                  )}
                </span>

                <strong className="text-[9px] font-bold text-emerald-300">
                  {Math.round(
                    progress,
                  )}
                  %
                </strong>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.025] p-3">
                  <span className="block text-[6px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    Aportaciones
                  </span>

                  <strong className="mt-1 block text-[12px] font-bold text-[var(--text)]">
                    {
                      economicContributions
                    }
                  </strong>
                </div>

                <div className="rounded-xl bg-white/[0.025] p-3">
                  <span className="block text-[6px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    Estado
                  </span>

                  <strong className="mt-1 block text-[9px] font-semibold text-emerald-300">
                    {completed
                      ? 'Completada'
                      : 'En progreso'}
                  </strong>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[24px] border border-amber-300/[0.09] bg-amber-300/[0.02] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-amber-200/70">
                    Donaciones en especie
                  </span>

                  <strong className="mt-2 block text-xl font-black tracking-[-0.035em] text-amber-100">
                    {
                      metas.length
                    }{' '}
                    {metas.length ===
                      1
                      ? 'necesidad'
                      : 'necesidades'}
                  </strong>
                </div>

                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-300/[0.08] text-amber-200">
                  <Package
                    size={17}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {metas.map(
                  (
                    meta,
                  ) => {
                    const metaProgress =
                      meta.cantidad_objetivo >
                        0
                        ? Math.min(
                          100,
                          (
                            meta.cantidad_aportada /
                            meta.cantidad_objetivo
                          ) *
                          100,
                        )
                        : 0;

                    return (
                      <div
                        key={
                          meta.id
                        }
                        className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block text-[9px] font-semibold text-[var(--text)]">
                              {
                                meta.nombre
                              }
                            </span>

                            {meta.descripcion && (
                              <span className="mt-1 block text-[7px] leading-4 text-[var(--muted)]">
                                {
                                  meta.descripcion
                                }
                              </span>
                            )}
                          </div>

                          <span className="shrink-0 text-[8px] font-semibold text-amber-200">
                            {meta.cantidad_aportada.toLocaleString(
                              'es-MX',
                            )}
                            /
                            {meta.cantidad_objetivo.toLocaleString(
                              'es-MX',
                            )}{' '}
                            {
                              meta.unidad
                            }
                          </span>
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className="h-full rounded-full bg-amber-300"
                            style={{
                              width: `${metaProgress}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              <div className="mt-3 text-[7px] text-[var(--muted)]">
                {
                  inKindContributions
                }{' '}
                aportaciones verificadas en especie
              </div>
            </section>
          )}

          {cause.historia && (
            <section className="rounded-[24px] border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
              <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                La historia
              </span>

              <h2 className="mt-1.5 text-base font-bold tracking-[-0.025em] text-[var(--text)]">
                Conoce esta causa
              </h2>

              <p className="mt-4 whitespace-pre-line text-[9px] leading-5 text-[var(--text-soft)] sm:text-[10px]">
                {
                  cause.historia
                }
              </p>
            </section>
          )}

          {updates.length >
            0 && (
              <section className="rounded-[24px] border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
                    <Sparkles
                      size={15}
                    />
                  </div>

                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                      Seguimiento
                    </span>

                    <h2 className="mt-0.5 text-[11px] font-semibold text-[var(--text)]">
                      Actualizaciones
                    </h2>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {updates.map(
                    (
                      update,
                    ) => (
                      <article
                        key={
                          update.id
                        }
                        className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-[10px] font-semibold text-[var(--text)]">
                            {
                              update.titulo
                            }
                          </h3>

                          <span className="shrink-0 text-[6px] text-[var(--muted)]">
                            {formatDate(
                              update.publicada_en,
                            )}
                          </span>
                        </div>

                        <p className="mt-2 whitespace-pre-line text-[8px] leading-4 text-[var(--muted)]">
                          {
                            update.contenido
                          }
                        </p>

                        {update.ruta_imagen &&
                          (
                            update.ruta_imagen.startsWith(
                              'http://',
                            ) ||
                            update.ruta_imagen.startsWith(
                              'https://',
                            )
                          ) && (
                            <img
                              src={
                                update.ruta_imagen
                              }
                              alt={
                                update.titulo
                              }
                              className="mt-3 max-h-[360px] w-full rounded-2xl object-cover"
                            />
                          )}
                      </article>
                    ),
                  )}
                </div>
              </section>
            )}

          {evidences.length >
            0 && (
              <section className="rounded-[24px] border border-emerald-400/[0.08] bg-emerald-400/[0.018] p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                    <BadgeCheck
                      size={15}
                    />
                  </div>

                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                      Transparencia
                    </span>

                    <h2 className="mt-0.5 text-[11px] font-semibold text-[var(--text)]">
                      Evidencias de impacto
                    </h2>
                  </div>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {evidences.map(
                    (
                      evidence,
                    ) => (
                      <article
                        key={
                          evidence.id
                        }
                        className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-[9px] font-semibold text-[var(--text)]">
                            {
                              evidence.titulo
                            }
                          </span>

                          {evidence.verificada && (
                            <ShieldCheck
                              size={13}
                              className="shrink-0 text-emerald-300"
                            />
                          )}
                        </div>

                        {evidence.descripcion && (
                          <p className="mt-2 text-[8px] leading-4 text-[var(--muted)]">
                            {
                              evidence.descripcion
                            }
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {evidence.fecha_entrega && (
                            <span className="rounded-lg bg-white/[0.03] px-2 py-1 text-[6px] text-[var(--muted)]">
                              Entrega{' '}
                              {formatDate(
                                evidence.fecha_entrega,
                              )}
                            </span>
                          )}

                          {evidence.monto_utilizado !==
                            null &&
                            evidence.monto_utilizado !==
                            undefined && (
                              <span className="rounded-lg bg-white/[0.03] px-2 py-1 text-[6px] text-emerald-300">
                                $
                                {formatMXN(
                                  Number(
                                    evidence.monto_utilizado,
                                  ),
                                )}{' '}
                                utilizados
                              </span>
                            )}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </section>
            )}
        </main>

        <aside className="min-w-0">
          <div className="space-y-4 xl:sticky xl:top-4">
            <section className="rounded-[24px] border border-white/[0.055] bg-white/[0.022] p-4">
              <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Información
              </span>

              <div className="mt-4 space-y-3">
                {cause.organizador && (
                  <div className="flex items-start gap-3">
                    <Landmark
                      size={14}
                      className="mt-0.5 shrink-0 text-emerald-300"
                    />

                    <div className="min-w-0">
                      <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        Organizador
                      </span>

                      <span className="mt-1 block text-[8px] font-semibold text-[var(--text-soft)]">
                        {
                          cause.organizador
                        }
                      </span>
                    </div>
                  </div>
                )}

                {cause.beneficiario && (
                  <div className="flex items-start gap-3">
                    <HeartHandshake
                      size={14}
                      className="mt-0.5 shrink-0 text-rose-300"
                    />

                    <div className="min-w-0">
                      <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        Beneficiario
                      </span>

                      <span className="mt-1 block text-[8px] font-semibold text-[var(--text-soft)]">
                        {
                          cause.beneficiario
                        }
                      </span>
                    </div>
                  </div>
                )}

                {cause.ubicacion && (
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-amber-200"
                    />

                    <div className="min-w-0">
                      <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        Ubicación
                      </span>

                      <span className="mt-1 block text-[8px] font-semibold leading-4 text-[var(--text-soft)]">
                        {
                          cause.ubicacion
                        }
                      </span>
                    </div>
                  </div>
                )}

                {cause.fecha_inicio && (
                  <div className="flex items-start gap-3">
                    <CalendarDays
                      size={14}
                      className="mt-0.5 shrink-0 text-cyan-300"
                    />

                    <div>
                      <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        Inicio
                      </span>

                      <span className="mt-1 block text-[8px] font-semibold text-[var(--text-soft)]">
                        {formatDate(
                          cause.fecha_inicio,
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {cause.fecha_limite && (
                  <div className="flex items-start gap-3">
                    <Clock3
                      size={14}
                      className="mt-0.5 shrink-0 text-violet-300"
                    />

                    <div>
                      <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        Fecha límite
                      </span>

                      <span className="mt-1 block text-[8px] font-semibold text-[var(--text-soft)]">
                        {formatDate(
                          cause.fecha_limite,
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-white/[0.055] bg-white/[0.022] p-4">
              <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Creada por
              </span>

              <div className="mt-3 flex items-center gap-3">
                {creator
                  ?.avatar_url ? (
                  <img
                    src={
                      creator.avatar_url
                    }
                    alt={
                      creatorName
                    }
                    className="h-10 w-10 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-[9px] font-black text-[var(--text-soft)]">
                    {getInitials(
                      creatorName,
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <span className="block truncate text-[9px] font-semibold text-[var(--text)]">
                    {
                      creatorName
                    }
                  </span>

                  {creator
                    ?.alias && (
                      <span className="mt-0.5 block truncate text-[7px] text-[var(--muted)]">
                        @
                        {
                          creator.alias
                        }
                      </span>
                    )}
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-emerald-400/[0.08] bg-emerald-400/[0.02] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-emerald-300"
                />

                <div>
                  <span className="block text-[9px] font-semibold text-emerald-300">
                    Transparencia Shitan Trust
                  </span>

                  <p className="mt-1 text-[7px] leading-4 text-[var(--muted)]">
                    El progreso mostrado se calcula con las aportaciones verificadas registradas para esta causa.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes causeCarouselFade {
          from {
            opacity: 0.35;
            transform: scale(1.015);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {!completed && (
        <div className="sticky bottom-3 z-30 mt-4 sm:bottom-4">
          <div className="mx-auto flex w-full max-w-[640px] items-center gap-3 rounded-2xl border border-emerald-400/[0.12] bg-[#09121c]/95 p-2.5 shadow-[0_20px_70px_rgba(0,0,0,.45)] backdrop-blur-xl">
            <div className="hidden min-w-0 flex-1 pl-2 sm:block">
              <span className="block text-[8px] font-semibold text-[var(--text)]">
                Haz una diferencia
              </span>

              <span className="mt-0.5 block text-[6px] text-[var(--muted)]">
                Tu aportación se registra en esta causa.
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  'contribute',
                  cause.id,
                )
              }
              className="group flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400/[0.12] px-5 text-[9px] font-bold text-emerald-200 transition-all hover:bg-emerald-400/[0.18] active:scale-[0.98] sm:flex-none"
            >
              {cause.tipo_meta ===
                'economica' ? (
                <CircleDollarSign
                  size={15}
                />
              ) : (
                <Package
                  size={15}
                />
              )}

              Aportar ahora

              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      )}
    </div>,
  );
}