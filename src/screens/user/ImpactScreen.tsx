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
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Images,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import type {
  Screen,
} from '../../types';

import {
  supabase,
} from '../../lib/supabase';

import ImpactDetail, {
  type ImpactDetailFile,
  type ImpactDetailItem,
} from './ImpactDetailScreen';

interface ImpactScreenProps {
  navigate: (
    to: Screen,
    causeId?: string,
  ) => void;
  onDetailChange?: (
    open: boolean,
    closeHandler?: () => void,
  ) => void;
}

type ImpactFilter =
  | 'todas'
  | 'completadas'
  | 'con_monto'
  | 'sin_monto';

type ImpactAccent =
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'cyan';

interface EvidenceRow {
  id: string;
  causa_id: string;
  titulo: string;
  descripcion: string | null;
  fecha_entrega: string | null;
  monto_utilizado: number | string | null;
  publica: boolean;
  verificada: boolean;
  verificada_en: string | null;
  creado_en: string;
}

interface CauseRow {
  id: string;
  titulo: string;
  resumen: string | null;
  categoria: string;
  ubicacion: string | null;
  fecha_completada: string | null;
  estado: string;
}

interface CauseImageRow {
  id: string;
  causa_id: string;
  public_url: string;
  es_principal: boolean;
  orden: number;
}

interface EvidenceFileRow {
  id: string;
  evidencia_id: string;
  tipo: string;
  ruta_storage: string;
  nombre_archivo: string | null;
  orden: number;
  creado_en: string;
}

interface UpdateRow {
  id: string;
  causa_id: string;
  titulo: string;
  contenido: string;
  ruta_imagen: string | null;
  publica: boolean;
  publicada_en: string | null;
  creado_en: string;
}

interface ImpactItem
  extends ImpactDetailItem {
  accent: ImpactAccent;
}

const EVIDENCE_BUCKET =
  'evidencias-impacto';

const ACCENTS: Record<
  ImpactAccent,
  {
    border: string;
    background: string;
    text: string;
    softText: string;
    badge: string;
    line: string;
    glow: string;
  }
> = {
  violet: {
    border:
      'border-violet-400/[0.13]',
    background:
      'bg-violet-400/[0.035]',
    text:
      'text-violet-200',
    softText:
      'text-violet-300',
    badge:
      'border-violet-300/20 bg-violet-400/[0.1] text-violet-200',
    line:
      'bg-violet-400',
    glow:
      'rgba(167,139,250,.09)',
  },
  emerald: {
    border:
      'border-emerald-400/[0.13]',
    background:
      'bg-emerald-400/[0.035]',
    text:
      'text-emerald-200',
    softText:
      'text-emerald-300',
    badge:
      'border-emerald-300/20 bg-emerald-400/[0.1] text-emerald-200',
    line:
      'bg-emerald-400',
    glow:
      'rgba(52,211,153,.085)',
  },
  amber: {
    border:
      'border-amber-300/[0.13]',
    background:
      'bg-amber-300/[0.035]',
    text:
      'text-amber-100',
    softText:
      'text-amber-200',
    badge:
      'border-amber-200/20 bg-amber-300/[0.1] text-amber-100',
    line:
      'bg-amber-300',
    glow:
      'rgba(252,211,77,.08)',
  },
  cyan: {
    border:
      'border-cyan-300/[0.13]',
    background:
      'bg-cyan-300/[0.035]',
    text:
      'text-cyan-100',
    softText:
      'text-cyan-300',
    badge:
      'border-cyan-200/20 bg-cyan-300/[0.1] text-cyan-100',
    line:
      'bg-cyan-300',
    glow:
      'rgba(103,232,249,.08)',
  },
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

function isHttpUrl(
  value: string | null,
) {
  return Boolean(
    value &&
    (
      value.startsWith(
        'http://',
      ) ||
      value.startsWith(
        'https://',
      )
    ),
  );
}

function isImageFile(
  file: EvidenceFileRow,
) {
  const name =
    file.nombre_archivo
      ?.toLocaleLowerCase(
        'es-MX',
      ) ??
    '';

  return (
    file.tipo ===
    'imagen' ||
    /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(
      name,
    )
  );
}

function getEvidenceFileUrl(
  path: string,
) {
  if (
    path.startsWith(
      'http://',
    ) ||
    path.startsWith(
      'https://',
    )
  ) {
    return path;
  }

  return (
    supabase.storage
      .from(
        EVIDENCE_BUCKET,
      )
      .getPublicUrl(
        path,
      )
      .data
      .publicUrl
  );
}

function accentForItem(
  completedAt: string | null,
  amountUsed: number,
  evidenceFiles: number,
): ImpactAccent {
  if (
    completedAt
  ) {
    return 'emerald';
  }

  if (
    amountUsed >
    0
  ) {
    return 'amber';
  }

  if (
    evidenceFiles >
    0
  ) {
    return 'cyan';
  }

  return 'violet';
}

function canUseWebDynamics() {
  return (
    typeof window !==
    'undefined' &&
    window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches
  );
}

function handleDynamicMouseMove(
  event: MouseEvent<HTMLElement>,
) {
  if (
    !canUseWebDynamics()
  ) {
    return;
  }

  const element =
    event.currentTarget;

  const rect =
    element.getBoundingClientRect();

  const x =
    event.clientX -
    rect.left;

  const y =
    event.clientY -
    rect.top;

  const centerX =
    rect.width /
    2;

  const centerY =
    rect.height /
    2;

  const rotateY =
    (
      (
        x -
        centerX
      ) /
      centerX
    ) *
    3;

  const rotateX =
    -(
      (
        y -
        centerY
      ) /
      centerY
    ) *
    2.2;

  element.style.setProperty(
    '--impact-x',
    `${x}px`,
  );

  element.style.setProperty(
    '--impact-y',
    `${y}px`,
  );

  element.style.transform =
    `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.006)`;
}

function handleDynamicMouseLeave(
  event: MouseEvent<HTMLElement>,
) {
  if (
    !canUseWebDynamics()
  ) {
    return;
  }

  const element =
    event.currentTarget;

  element.style.transform =
    '';

  element.style.setProperty(
    '--impact-x',
    '50%',
  );

  element.style.setProperty(
    '--impact-y',
    '50%',
  );
}

function CardCarousel({
  images,
  title,
  accent,
}: {
  images: string[];
  title: string;
  accent: ImpactAccent;
}) {
  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(
      0,
    );

  useEffect(
    () => {
      setActiveIndex(
        0,
      );
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
      <div
        className={`grid h-full w-full place-items-center ${ACCENTS[accent].background}`}
      >
        <Images
          size={27}
          className={
            ACCENTS[
              accent
            ].softText
          }
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
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
            alt={`${title} ${index + 1}`}
            loading={
              index ===
                0
                ? 'eager'
                : 'lazy'
            }
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${activeIndex ===
              index
              ? 'scale-100 opacity-100'
              : 'scale-[1.035] opacity-0'
              }`}
          />
        ),
      )}

      {images.length >
        1 && (
          <>
            <button
              type="button"
              onClick={(
                event,
              ) => {
                event.stopPropagation();

                setActiveIndex(
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
              }}
              className="absolute left-3 top-1/2 z-30 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/[0.08] bg-black/50 text-base text-white/85 backdrop-blur-md"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={(
                event,
              ) => {
                event.stopPropagation();

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
              }}
              className="absolute right-3 top-1/2 z-30 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/[0.08] bg-black/50 text-base text-white/85 backdrop-blur-md"
            >
              ›
            </button>

            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/50 px-2 py-1.5 backdrop-blur-md">
              {images.map(
                (
                  _,
                  index,
                ) => (
                  <button
                    key={
                      index
                    }
                    type="button"
                    onClick={(
                      event,
                    ) => {
                      event.stopPropagation();

                      setActiveIndex(
                        index,
                      );
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex ===
                      index
                      ? `w-4 ${ACCENTS[accent].line}`
                      : 'w-1.5 bg-white/35'
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

export default function ImpactScreen({
  navigate,
  onDetailChange,
}: ImpactScreenProps) {
  const [
    items,
    setItems,
  ] =
    useState<
      ImpactItem[]
    >([]);

  const [
    selectedImpact,
    setSelectedImpact,
  ] =
    useState<ImpactItem | null>(
      null,
    );

  const closeImpactDetail =
    useCallback(
      () => {
        setSelectedImpact(
          null,
        );

        onDetailChange?.(
          false,
        );
      },
      [
        onDetailChange,
      ],
    );

  const openImpactDetail =
    useCallback(
      (
        item: ImpactItem,
      ) => {
        setSelectedImpact(
          item,
        );

        onDetailChange?.(
          true,
          closeImpactDetail,
        );
      },
      [
        closeImpactDetail,
        onDetailChange,
      ],
    );

  useEffect(
    () => {
      return () => {
        onDetailChange?.(
          false,
        );
      };
    },
    [
      onDetailChange,
    ],
  );

  const [
    filter,
    setFilter,
  ] =
    useState<ImpactFilter>(
      'todas',
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      '',
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
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  const loadImpact =
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

        setErrorMessage(
          null,
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
                'id,causa_id,titulo,descripcion,fecha_entrega,monto_utilizado,publica,verificada,verificada_en,creado_en',
              )
              .eq(
                'publica',
                true,
              )
              .eq(
                'verificada',
                true,
              )
              .order(
                'fecha_entrega',
                {
                  ascending:
                    false,
                  nullsFirst:
                    false,
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
            evidenceError
          ) {
            throw evidenceError;
          }

          const evidences =
            (
              evidenceData ??
              []
            ) as EvidenceRow[];

          if (
            !evidences.length
          ) {
            setItems(
              [],
            );

            setSelectedImpact(
              null,
            );

            return;
          }

          const causeIds =
            [
              ...new Set(
                evidences.map(
                  (
                    evidence,
                  ) =>
                    evidence.causa_id,
                ),
              ),
            ];

          const evidenceIds =
            evidences.map(
              (
                evidence,
              ) =>
                evidence.id,
            );

          const [
            causesResult,
            imagesResult,
            filesResult,
            updatesResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  'causas',
                )
                .select(
                  'id,titulo,resumen,categoria,ubicacion,fecha_completada,estado',
                )
                .in(
                  'id',
                  causeIds,
                ),

              supabase
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

              supabase
                .from(
                  'actualizaciones_causa',
                )
                .select(
                  'id,causa_id,titulo,contenido,ruta_imagen,publica,publicada_en,creado_en',
                )
                .in(
                  'causa_id',
                  causeIds,
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
                    nullsFirst:
                      false,
                  },
                ),
            ]);

          if (
            causesResult.error
          ) {
            throw causesResult.error;
          }

          if (
            imagesResult.error
          ) {
            throw imagesResult.error;
          }

          if (
            filesResult.error
          ) {
            throw filesResult.error;
          }

          if (
            updatesResult.error
          ) {
            throw updatesResult.error;
          }

          const causes =
            (
              causesResult.data ??
              []
            ) as CauseRow[];

          const causeImages =
            (
              imagesResult.data ??
              []
            ) as CauseImageRow[];

          const evidenceFiles =
            (
              filesResult.data ??
              []
            ) as EvidenceFileRow[];

          const updates =
            (
              updatesResult.data ??
              []
            ) as UpdateRow[];

          const causeMap =
            new Map(
              causes.map(
                (
                  cause,
                ) => [
                    cause.id,
                    cause,
                  ],
              ),
            );

          const causeImageMap =
            new Map<
              string,
              string[]
            >();

          causeImages.forEach(
            (
              image,
            ) => {
              if (
                !image.public_url
              ) {
                return;
              }

              const current =
                causeImageMap.get(
                  image.causa_id,
                ) ??
                [];

              current.push(
                image.public_url,
              );

              causeImageMap.set(
                image.causa_id,
                current,
              );
            },
          );

          const updateImageMap =
            new Map<
              string,
              string[]
            >();

          updates.forEach(
            (
              update,
            ) => {
              if (
                !isHttpUrl(
                  update.ruta_imagen,
                )
              ) {
                return;
              }

              const current =
                updateImageMap.get(
                  update.causa_id,
                ) ??
                [];

              current.push(
                update.ruta_imagen as string,
              );

              updateImageMap.set(
                update.causa_id,
                current,
              );
            },
          );

          const fileMap =
            new Map<
              string,
              ImpactDetailFile[]
            >();

          evidenceFiles.forEach(
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
                type:
                  isImageFile(
                    file,
                  )
                    ? 'imagen'
                    : 'documento',
                name:
                  file.nombre_archivo ??
                  'Archivo de evidencia',
                storagePath:
                  file.ruta_storage,
                url:
                  getEvidenceFileUrl(
                    file.ruta_storage,
                  ),
                order:
                  Number(
                    file.orden ??
                    current.length,
                  ),
              });

              fileMap.set(
                file.evidencia_id,
                current,
              );
            },
          );

          const updateCountMap =
            new Map<
              string,
              number
            >();

          updates.forEach(
            (
              update,
            ) => {
              updateCountMap.set(
                update.causa_id,
                (
                  updateCountMap.get(
                    update.causa_id,
                  ) ??
                  0
                ) +
                1,
              );
            },
          );

          const normalized =
            evidences.flatMap(
              (
                evidence,
              ) => {
                const cause =
                  causeMap.get(
                    evidence.causa_id,
                  );

                if (
                  !cause
                ) {
                  return [];
                }

                const files =
                  (
                    fileMap.get(
                      evidence.id,
                    ) ??
                    []
                  ).sort(
                    (
                      a,
                      b,
                    ) =>
                      a.order -
                      b.order,
                  );

                const evidenceImages =
                  files
                    .filter(
                      (
                        file,
                      ) =>
                        file.type ===
                        'imagen',
                    )
                    .map(
                      (
                        file,
                      ) =>
                        file.url,
                    );

                const combinedImages =
                  [
                    ...evidenceImages,
                    ...(
                      updateImageMap.get(
                        evidence.causa_id,
                      ) ??
                      []
                    ),
                    ...(
                      causeImageMap.get(
                        evidence.causa_id,
                      ) ??
                      []
                    ),
                  ].filter(
                    (
                      image,
                      index,
                      collection,
                    ) =>
                      Boolean(
                        image,
                      ) &&
                      collection.indexOf(
                        image,
                      ) ===
                      index,
                  );

                const amountUsed =
                  Number(
                    evidence.monto_utilizado ??
                    0,
                  );

                return [
                  {
                    id:
                      evidence.id,
                    causeId:
                      evidence.causa_id,
                    causeTitle:
                      cause.titulo,
                    causeSummary:
                      cause.resumen ??
                      null,
                    category:
                      cause.categoria,
                    location:
                      cause.ubicacion ??
                      null,
                    completedAt:
                      cause.fecha_completada ??
                      null,
                    title:
                      evidence.titulo,
                    description:
                      evidence.descripcion ??
                      null,
                    deliveryDate:
                      evidence.fecha_entrega ??
                      null,
                    amountUsed,
                    verifiedAt:
                      evidence.verificada_en ??
                      null,
                    createdAt:
                      evidence.creado_en,
                    images:
                      combinedImages,
                    files,
                    updates:
                      updateCountMap.get(
                        evidence.causa_id,
                      ) ??
                      0,
                    accent:
                      accentForItem(
                        cause.fecha_completada ??
                        null,
                        amountUsed,
                        files.length,
                      ),
                  },
                ];
              },
            );

          setItems(
            normalized,
          );

          setSelectedImpact(
            (
              current,
            ) =>
              current
                ? normalized.find(
                  (
                    item,
                  ) =>
                    item.id ===
                    current.id,
                ) ??
                null
                : null,
          );
        } catch (
        error
        ) {
          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : 'No se pudo cargar la información de impacto.',
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
      [],
    );

  useEffect(
    () => {
      void loadImpact();
    },
    [
      loadImpact,
    ],
  );

  const filtered =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLocaleLowerCase(
              'es-MX',
            );

        return items.filter(
          (
            item,
          ) => {
            if (
              filter ===
              'completadas' &&
              !item.completedAt
            ) {
              return false;
            }

            if (
              filter ===
              'con_monto' &&
              item.amountUsed <=
              0
            ) {
              return false;
            }

            if (
              filter ===
              'sin_monto' &&
              item.amountUsed >
              0
            ) {
              return false;
            }

            if (
              !term
            ) {
              return true;
            }

            return (
              item.title
                .toLocaleLowerCase(
                  'es-MX',
                )
                .includes(
                  term,
                ) ||
              item.causeTitle
                .toLocaleLowerCase(
                  'es-MX',
                )
                .includes(
                  term,
                ) ||
              (
                item.description ??
                ''
              )
                .toLocaleLowerCase(
                  'es-MX',
                )
                .includes(
                  term,
                ) ||
              item.category
                .toLocaleLowerCase(
                  'es-MX',
                )
                .includes(
                  term,
                ) ||
              item.files.some(
                (
                  file,
                ) =>
                  file.name
                    .toLocaleLowerCase(
                      'es-MX',
                    )
                    .includes(
                      term,
                    ),
              )
            );
          },
        );
      },
      [
        items,
        filter,
        search,
      ],
    );

  const totalUsed =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.amountUsed,
          0,
        ),
      [
        items,
      ],
    );

  const completedCauses =
    useMemo(
      () =>
        new Set(
          items
            .filter(
              (
                item,
              ) =>
                Boolean(
                  item.completedAt,
                ),
            )
            .map(
              (
                item,
              ) =>
                item.causeId,
            ),
        ).size,
      [
        items,
      ],
    );

  const totalFiles =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.files.length,
          0,
        ),
      [
        items,
      ],
    );

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-400/10 bg-violet-400/[0.05]">
            <Loader2
              size={23}
              className="animate-spin text-violet-300"
            />
          </div>

          <p className="mt-4 text-[9px] font-medium text-[var(--muted)]">
            Cargando impacto verificado...
          </p>
        </div>
      </div>
    );
  }

  const filters: Array<{
    id: ImpactFilter;
    label: string;
  }> = [
      {
        id:
          'todas',
        label:
          'Todas',
      },
      {
        id:
          'completadas',
        label:
          'Completadas',
      },
      {
        id:
          'con_monto',
        label:
          'Con monto',
      },
      {
        id:
          'sin_monto',
        label:
          'Sin monto',
      },
    ];

  return (
    <>
      <style>
        {`
          @media (hover: hover) and (pointer: fine) {
            .impact-dynamic-card {
              transform-style: preserve-3d;
              will-change: transform;
            }

            .impact-dynamic-card:hover {
              box-shadow: 0 24px 60px rgba(0,0,0,.31);
            }

            .impact-dynamic-card:hover .impact-pointer-glow {
              opacity: 1;
            }

            .impact-refresh:hover {
              transform: translateY(-2px);
              border-color: rgba(167,139,250,.2);
              background: rgba(167,139,250,.09);
              color: #c4b5fd;
            }

            .impact-refresh:hover .impact-refresh-icon {
              transform: rotate(180deg);
            }

            .impact-filter:hover {
              transform: translateY(-1px);
              color: #ddd6fe;
              background: rgba(167,139,250,.06);
            }

            .impact-detail-button:hover {
              transform: translateY(-1px);
              background: rgba(167,139,250,.12);
              color: #ddd6fe;
            }

            .impact-detail-button:hover .impact-arrow {
              transform: translateX(4px);
            }

            .impact-hover-reveal {
              display: grid;
              grid-template-rows: 0fr;
              opacity: 0;
              transform: translateY(12px);
              pointer-events: none;
              transition:
                grid-template-rows .5s cubic-bezier(.22,1,.36,1),
                opacity .3s ease,
                transform .45s cubic-bezier(.22,1,.36,1);
            }

            .impact-hover-reveal-inner {
              min-height: 0;
              overflow: hidden;
            }

            .impact-dynamic-card:hover .impact-hover-reveal,
            .impact-dynamic-card:focus-within .impact-hover-reveal {
              grid-template-rows: 1fr;
              opacity: 1;
              transform: translateY(0);
              pointer-events: auto;
            }

            .impact-card-image {
              transition: transform .55s cubic-bezier(.22,1,.36,1);
            }

            .impact-dynamic-card:hover .impact-card-image,
            .impact-dynamic-card:focus-within .impact-card-image {
              transform: scale(1.03);
            }

            .impact-dynamic-card:hover .impact-card-title,
            .impact-dynamic-card:focus-within .impact-card-title {
              color: #f5f3ff;
            }

            .impact-hover-action {
              transform: translateY(8px);
              opacity: 0;
              transition:
                transform .38s cubic-bezier(.22,1,.36,1),
                opacity .28s ease,
                background-color .28s ease,
                color .28s ease;
            }

            .impact-dynamic-card:hover .impact-hover-action,
            .impact-dynamic-card:focus-within .impact-hover-action {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @media (hover: none), (pointer: coarse) {
            .impact-hover-reveal {
              display: block;
              opacity: 1;
              transform: none;
              pointer-events: auto;
            }

            .impact-hover-reveal-inner {
              overflow: visible;
            }

            .impact-hover-action {
              opacity: 1;
              transform: none;
            }
          }

          .impact-pointer-glow {
            background:
              radial-gradient(
                430px circle at var(--impact-x, 50%) var(--impact-y, 50%),
                var(--impact-glow, rgba(167,139,250,.08)),
                transparent 48%
              );
          }
        `}
      </style>

      <div className="mx-auto w-full max-w-[1480px] px-3 pb-8 sm:px-5 lg:px-7">
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.055] bg-[linear-gradient(145deg,rgba(139,92,246,.075),rgba(255,255,255,.025)_42%,rgba(34,211,238,.03))] p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-violet-400/[0.08] blur-[80px]" />

          <div className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-cyan-300/[0.04] blur-[90px]" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,.8)]" />

                  <span className="text-[8px] font-bold uppercase tracking-[0.19em] text-violet-300">
                    Resultados verificados
                  </span>
                </div>

                <h1 className="mt-3 text-xl font-black tracking-[-0.045em] text-[var(--text)] sm:text-2xl lg:text-[28px]">
                  Impacto que puedes comprobar
                </h1>

                <p className="mt-2 max-w-xl text-[8px] leading-4 text-[var(--muted)] sm:text-[9px]">
                  Abre cada evidencia para consultar sus fotografías y documentos originales.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  refreshing
                }
                onClick={() =>
                  void loadImpact(
                    true,
                  )
                }
                className="impact-refresh group grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-400/[0.1] bg-violet-400/[0.05] text-violet-300 transition-all disabled:opacity-40"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : 'impact-refresh-icon transition-transform duration-500'
                  }
                />
              </button>
            </div>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-4">
              <div className="rounded-2xl border border-violet-400/[0.12] bg-violet-400/[0.04] p-4">
                <BadgeCheck
                  size={15}
                  className="text-violet-300"
                />

                <strong className="mt-5 block text-2xl font-black text-violet-200">
                  {
                    items.length
                  }
                </strong>

                <span className="mt-1 block text-[8px] text-violet-300/60">
                  Evidencias verificadas
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-400/[0.12] bg-emerald-400/[0.04] p-4">
                <CheckCircle2
                  size={15}
                  className="text-emerald-300"
                />

                <strong className="mt-5 block text-2xl font-black text-emerald-200">
                  {
                    completedCauses
                  }
                </strong>

                <span className="mt-1 block text-[8px] text-emerald-300/60">
                  Causas completadas
                </span>
              </div>

              <div className="rounded-2xl border border-amber-300/[0.12] bg-amber-300/[0.04] p-4">
                <CircleDollarSign
                  size={15}
                  className="text-amber-200"
                />

                <strong className="mt-5 block text-2xl font-black text-amber-100">
                  $
                  {formatMXN(
                    totalUsed,
                  )}
                </strong>

                <span className="mt-1 block text-[8px] text-amber-200/60">
                  Monto utilizado
                </span>
              </div>

              <div className="rounded-2xl border border-cyan-300/[0.12] bg-cyan-300/[0.04] p-4">
                <FileCheck2
                  size={15}
                  className="text-cyan-300"
                />

                <strong className="mt-5 block text-2xl font-black text-cyan-100">
                  {
                    totalFiles
                  }
                </strong>

                <span className="mt-1 block text-[8px] text-cyan-300/60">
                  Archivos de evidencia
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 flex items-center gap-3 rounded-2xl border border-violet-400/[0.07] bg-violet-400/[0.018] px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-400/[0.07] text-violet-300">
            <ShieldCheck
              size={16}
            />
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-[9px] font-semibold text-[var(--text)]">
              Evidencia pública verificada
            </span>

            <span className="mt-0.5 block text-[7px] leading-4 text-[var(--muted)]">
              Las imágenes y documentos se abren desde el detalle de cada evidencia.
            </span>
          </div>
        </section>

        {errorMessage && (
          <section className="mt-4 rounded-2xl border border-rose-400/[0.12] bg-rose-400/[0.035] p-4">
            <span className="text-[9px] font-semibold text-rose-200">
              {
                errorMessage
              }
            </span>
          </section>
        )}

        <section className="mt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-violet-300">
                Evidencias de impacto
              </span>

              <h2 className="mt-1.5 text-xl font-bold tracking-[-0.045em] text-[var(--text)] sm:text-2xl">
                Resultados de las causas
              </h2>
            </div>

            <span className="text-[8px] font-semibold text-[var(--muted)]">
              {
                filtered.length
              }{' '}
              {filtered.length ===
                1
                ? 'evidencia'
                : 'evidencias'}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.055] bg-white/[0.018] p-3">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
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
                    event.target.value,
                  )
                }
                placeholder="Buscar por causa, evidencia, categoría o archivo..."
                className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] pl-9 pr-3 text-[8px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-violet-400/[0.18]"
              />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
              {filters.map(
                (
                  item,
                ) => {
                  const active =
                    filter ===
                    item.id;

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        setFilter(
                          item.id,
                        )
                      }
                      className={`impact-filter relative rounded-xl px-3 py-2.5 text-[7px] font-semibold transition-all sm:px-4 sm:text-[8px] ${active
                        ? 'bg-violet-400/[0.1] text-violet-200'
                        : 'bg-white/[0.025] text-[var(--muted)]'
                        }`}
                    >
                      {
                        item.label
                      }

                      {active && (
                        <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-violet-400" />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {filtered.length >
            0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(
                (
                  item,
                ) => {
                  const accent =
                    ACCENTS[
                    item.accent
                    ];

                  const imageCount =
                    item.files.filter(
                      (
                        file,
                      ) =>
                        file.type ===
                        'imagen',
                    ).length;

                  return (
                    <article
                      key={
                        item.id
                      }
                      className={`impact-dynamic-card group relative min-w-0 overflow-hidden rounded-[22px] border bg-white/[0.022] transition-all duration-300 ${accent.border}`}
                      onMouseMove={
                        handleDynamicMouseMove
                      }
                      onMouseLeave={
                        handleDynamicMouseLeave
                      }
                      style={
                        {
                          '--impact-glow':
                            accent.glow,
                        } as {
                          [key: string]:
                          string;
                        }
                      }
                    >
                      <div className="impact-pointer-glow pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300" />

                      <div className="relative z-10">
                        <div className="impact-card-image relative aspect-[16/9] overflow-hidden bg-white/[0.025]">
                          <CardCarousel
                            images={
                              item.images
                            }
                            title={
                              item.title
                            }
                            accent={
                              item.accent
                            }
                          />

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d17] via-transparent to-black/20" />

                          <div className="absolute left-3 top-3 z-20">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[6px] font-bold uppercase tracking-[0.08em] backdrop-blur-md ${accent.badge}`}>
                              <BadgeCheck
                                size={8}
                              />

                              Verificada
                            </span>
                          </div>

                          <span className="absolute bottom-3 left-3 z-20 rounded-full border border-white/[0.08] bg-black/50 px-2.5 py-1 text-[7px] font-semibold text-white/80 backdrop-blur-md">
                            {formatCategory(
                              item.category,
                            )}
                          </span>
                        </div>

                        <div className="p-4 pb-3">
                          <span className={`text-[7px] font-bold uppercase tracking-[0.13em] ${accent.softText}`}>
                            {
                              item.causeTitle
                            }
                          </span>

                          <h3 className="impact-card-title mt-1.5 line-clamp-2 text-[12px] font-bold leading-5 text-[var(--text)] transition-colors duration-300">
                            {
                              item.title
                            }
                          </h3>

                          <div className="impact-hover-reveal">
                            <div className="impact-hover-reveal-inner">
                              {item.description && (
                                <p className="mt-2 line-clamp-3 text-[8px] leading-4 text-[var(--muted)]">
                                  {
                                    item.description
                                  }
                                </p>
                              )}

                              {item.location && (
                                <div className="mt-3 flex items-center gap-1.5">
                                  <MapPin
                                    size={10}
                                    className={
                                      accent.softText
                                    }
                                  />

                                  <span className="truncate text-[7px] text-[var(--muted)]">
                                    {
                                      item.location
                                    }
                                  </span>
                                </div>
                              )}

                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <div className={`rounded-xl border p-3 ${accent.border} ${accent.background}`}>
                                  <span className="block text-[6px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">
                                    Entrega
                                  </span>

                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <CalendarDays
                                      size={10}
                                      className={
                                        accent.softText
                                      }
                                    />

                                    <span className="text-[7px] font-semibold text-[var(--text-soft)]">
                                      {formatDate(
                                        item.deliveryDate,
                                      ) ??
                                        'Sin fecha'}
                                    </span>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-cyan-300/[0.08] bg-cyan-300/[0.025] p-3">
                                  <span className="block text-[6px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">
                                    Evidencia
                                  </span>

                                  <div className="mt-1.5 flex items-center gap-2">
                                    <Images
                                      size={10}
                                      className="text-cyan-300"
                                    />

                                    <span className="text-[7px] font-bold text-cyan-100">
                                      {
                                        imageCount
                                      } img · {
                                        item.files.length
                                      } arch
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {item.amountUsed >
                                0 && (
                                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/[0.08] bg-emerald-400/[0.025] px-3 py-2.5">
                                    <span className="text-[7px] text-[var(--muted)]">
                                      Monto utilizado
                                    </span>

                                    <strong className="text-[8px] text-emerald-200">
                                      $
                                      {formatMXN(
                                        item.amountUsed,
                                      )}
                                    </strong>
                                  </div>
                                )}

                              <div className={`mt-3 h-0.5 w-full rounded-full opacity-60 ${accent.line}`} />

                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImpactDetail(
                                      item,
                                    )
                                  }
                                  className="impact-hover-action impact-detail-button flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-400/[0.07] px-3 text-[8px] font-semibold text-violet-200 active:scale-[0.98]"
                                >
                                  Ver evidencia

                                  <FileCheck2
                                    size={12}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      'cause-detail',
                                      item.causeId,
                                    )
                                  }
                                  className="impact-hover-action impact-detail-button group/detail flex h-10 items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-3 text-[8px] font-semibold text-[var(--text-soft)] active:scale-[0.98]"
                                >
                                  Ver causa

                                  <ArrowRight
                                    size={12}
                                    className="impact-arrow transition-transform duration-300"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="mt-4 flex min-h-[250px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[0.07] bg-white/[0.015] px-5 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-400/[0.06] text-violet-300">
                <Sparkles
                  size={20}
                />
              </div>

              <h3 className="mt-4 text-[11px] font-semibold text-[var(--text)]">
                Sin evidencias para mostrar
              </h3>
            </div>
          )}
        </section>
      </div>

      <ImpactDetail
        open={
          Boolean(
            selectedImpact,
          )
        }
        item={
          selectedImpact
        }
        onClose={
          closeImpactDetail
        }
        onViewCause={
          selectedImpact
            ? () => {
              const causeId =
                selectedImpact.causeId;

              closeImpactDetail();

              navigate(
                'cause-detail',
                causeId,
              );
            }
            : undefined
        }
      />
    </>
  );
}