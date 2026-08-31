import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';

import {
  BadgeCheck,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  HandHeart,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

import {
  supabase,
} from '../../lib/supabase';

interface LedgerScreenProps {
  showToast: (
    message: string,
    type?:
      | 'success'
      | 'error'
      | 'info'
      | 'warning',
  ) => void;
}

type LedgerFilter =
  | 'todos'
  | 'economica'
  | 'especie';

interface LedgerRow {
  id: string;
  folio: number | string;
  causa_id: string;
  causa_titulo: string;
  tipo: 'economica' | 'especie';
  monto: number | string | null;
  nombre_publico: string;
  anonima: boolean;
  estado: string;
  creada_en: string;
  revisada_en: string | null;
  especie_resumen: string | null;
  especie_cantidad: number | string | null;
}

interface LedgerEntry {
  id: string;
  folio: number;
  causaId: string;
  causaTitle: string;
  type: 'economica' | 'especie';
  amount: number | null;
  donorName: string;
  anonymous: boolean;
  status: string;
  createdAt: string;
  validatedAt: string | null;
  speciesSummary: string | null;
  speciesQuantity: number;
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

function formatDate(
  iso: string | null,
) {
  if (
    !iso
  ) {
    return '—';
  }

  const date =
    new Date(
      iso,
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
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    date,
  );
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
    2.3;

  const rotateX =
    -(
      (
        y -
        centerY
      ) /
      centerY
    ) *
    1.7;

  element.style.setProperty(
    '--ledger-x',
    `${x}px`,
  );

  element.style.setProperty(
    '--ledger-y',
    `${y}px`,
  );

  element.style.transform =
    `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
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
    '--ledger-x',
    '50%',
  );

  element.style.setProperty(
    '--ledger-y',
    '50%',
  );
}

function EntryCard({
  entry,
}: {
  entry: LedgerEntry;
}) {
  const [
    expanded,
    setExpanded,
  ] =
    useState(
      false,
    );

  const isEconomic =
    entry.type ===
    'economica';

  return (
    <article
      className={`ledger-entry group relative overflow-hidden rounded-[22px] border bg-white/[0.022] transition-all duration-300 ${isEconomic
          ? 'border-emerald-400/[0.08]'
          : 'border-cyan-300/[0.08]'
        }`}
      onMouseMove={
        handleDynamicMouseMove
      }
      onMouseLeave={
        handleDynamicMouseLeave
      }
    >
      <div className="ledger-pointer-glow pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300" />

      <button
        type="button"
        onClick={() =>
          setExpanded(
            (
              current,
            ) =>
              !current,
          )
        }
        className="relative z-10 block w-full p-4 text-left sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isEconomic
                ? 'border-emerald-400/[0.12] bg-emerald-400/[0.07] text-emerald-300'
                : 'border-cyan-300/[0.12] bg-cyan-300/[0.07] text-cyan-300'
              }`}
          >
            {isEconomic ? (
              <CircleDollarSign
                size={17}
              />
            ) : (
              <Package
                size={17}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {entry.anonymous ? (
                    <UserRound
                      size={12}
                      className="shrink-0 text-[var(--muted)]"
                    />
                  ) : (
                    <BadgeCheck
                      size={12}
                      className="shrink-0 text-emerald-300"
                    />
                  )}

                  <p className="truncate text-[11px] font-bold text-[var(--text)] sm:text-[12px]">
                    {
                      entry.donorName
                    }
                  </p>
                </div>

                <p className="mt-1 truncate text-[8px] text-[var(--muted)]">
                  {
                    entry.causaTitle
                  }
                </p>
              </div>

              <div className="shrink-0 text-right">
                {isEconomic ? (
                  <strong className="block text-[12px] font-black text-emerald-300 sm:text-[13px]">
                    +$
                    {formatMXN(
                      entry.amount ??
                      0,
                    )}
                  </strong>
                ) : (
                  <strong className="block max-w-[155px] truncate text-[9px] font-bold text-cyan-200 sm:max-w-[210px]">
                    {
                      entry.speciesSummary ??
                      'Aportación en especie'
                    }
                  </strong>
                )}

                <span className="mt-1 block text-[7px] text-[var(--muted)]">
                  {
                    formatDate(
                      entry.createdAt,
                    )
                  }
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/[0.1] bg-emerald-400/[0.045] px-2.5 py-1 text-[6px] font-bold uppercase tracking-[0.1em] text-emerald-200">
                <ShieldCheck
                  size={9}
                />
                Verificada
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[6px] font-bold uppercase tracking-[0.1em] ${isEconomic
                    ? 'border-emerald-400/[0.1] bg-emerald-400/[0.035] text-emerald-200'
                    : 'border-cyan-300/[0.1] bg-cyan-300/[0.035] text-cyan-200'
                  }`}
              >
                {isEconomic ? (
                  <CircleDollarSign
                    size={9}
                  />
                ) : (
                  <Package
                    size={9}
                  />
                )}

                {isEconomic
                  ? 'Económica'
                  : 'En especie'}
              </span>

              <span className="ml-auto inline-flex items-center gap-1.5 text-[7px] font-semibold text-[var(--muted)]">
                Folio #
                {
                  entry.folio
                }

                <ChevronDown
                  size={12}
                  className={`transition-transform duration-300 ${expanded
                      ? 'rotate-180'
                      : ''
                    }`}
                />
              </span>
            </div>
          </div>
        </div>
      </button>

      <div
        className={`relative z-10 grid transition-all duration-300 ${expanded
            ? 'grid-rows-[1fr] border-t border-white/[0.05]'
            : 'grid-rows-[0fr]'
          }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.045] bg-white/[0.02] p-3">
                <span className="block text-[6px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  ID de transacción
                </span>

                <span className="mt-1.5 block truncate font-mono text-[8px] font-semibold text-[var(--text-soft)]">
                  {
                    entry.id.toUpperCase()
                  }
                </span>
              </div>

              <div className="rounded-xl border border-white/[0.045] bg-white/[0.02] p-3">
                <span className="block text-[6px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Validada
                </span>

                <span className="mt-1.5 block text-[8px] font-semibold text-[var(--text-soft)]">
                  {
                    formatDate(
                      entry.validatedAt,
                    )
                  }
                </span>
              </div>
            </div>

            {!isEconomic &&
              entry.speciesSummary && (
                <div className="mt-2 rounded-xl border border-cyan-300/[0.08] bg-cyan-300/[0.025] p-3">
                  <div className="flex items-center gap-2">
                    <Package
                      size={12}
                      className="text-cyan-300"
                    />

                    <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-cyan-200">
                      Artículos registrados
                    </span>
                  </div>

                  <p className="mt-2 text-[8px] leading-4 text-[var(--text-soft)]">
                    {
                      entry.speciesSummary
                    }
                  </p>
                </div>
              )}

            <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-400/[0.09] bg-emerald-400/[0.03] p-3">
              <ShieldCheck
                size={13}
                className="shrink-0 text-emerald-300"
              />

              <div>
                <span className="block text-[8px] font-semibold text-emerald-200">
                  Validado por Shitan Trust
                </span>

                <span className="mt-0.5 block text-[7px] text-[var(--muted)]">
                  Solo se muestran aportaciones aprobadas.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function LedgerScreen({
  showToast,
}: LedgerScreenProps) {
  const [
    entries,
    setEntries,
  ] =
    useState<
      LedgerEntry[]
    >([]);

  const [
    filter,
    setFilter,
  ] =
    useState<LedgerFilter>(
      'todos',
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

  const loadLedger =
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
            data,
            error,
          } =
            await supabase.rpc(
              'obtener_ledger_publico',
            );

          if (
            error
          ) {
            throw error;
          }

          const normalized =
            (
              (
                data ??
                []
              ) as LedgerRow[]
            ).map(
              (
                row,
              ): LedgerEntry => ({
                id:
                  row.id,
                folio:
                  Number(
                    row.folio ??
                    0,
                  ),
                causaId:
                  row.causa_id,
                causaTitle:
                  row.causa_titulo,
                type:
                  row.tipo ===
                    'especie'
                    ? 'especie'
                    : 'economica',
                amount:
                  row.monto ===
                    null ||
                    row.monto ===
                    undefined
                    ? null
                    : Number(
                      row.monto,
                    ),
                donorName:
                  row.anonima
                    ? 'Aportador Anónimo'
                    : row.nombre_publico ||
                    'Aportador',
                anonymous:
                  Boolean(
                    row.anonima,
                  ),
                status:
                  row.estado,
                createdAt:
                  row.creada_en,
                validatedAt:
                  row.revisada_en,
                speciesSummary:
                  row.especie_resumen ??
                  null,
                speciesQuantity:
                  Number(
                    row.especie_cantidad ??
                    0,
                  ),
              }),
            );

          setEntries(
            normalized,
          );
        } catch (
        error
        ) {
          showToast(
            error instanceof
              Error
              ? error.message
              : 'No se pudo cargar el registro de transparencia.',
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
        showToast,
      ],
    );

  useEffect(
    () => {
      void loadLedger();
    },
    [
      loadLedger,
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

        return entries.filter(
          (
            entry,
          ) => {
            if (
              filter !==
              'todos' &&
              entry.type !==
              filter
            ) {
              return false;
            }

            if (
              !term
            ) {
              return true;
            }

            return (
              entry.causaTitle
                .toLocaleLowerCase(
                  'es-MX',
                )
                .includes(
                  term,
                ) ||
              entry.donorName
                .toLocaleLowerCase(
                  'es-MX',
                )
                .includes(
                  term,
                ) ||
              String(
                entry.folio,
              ).includes(
                term,
              ) ||
              (
                entry.speciesSummary ??
                ''
              )
                .toLocaleLowerCase(
                  'es-MX',
                )
                .includes(
                  term,
                )
            );
          },
        );
      },
      [
        entries,
        filter,
        search,
      ],
    );

  const totalValidated =
    useMemo(
      () =>
        entries.reduce(
          (
            total,
            entry,
          ) =>
            entry.type ===
              'economica'
              ? total +
              (
                entry.amount ??
                0
              )
              : total,
          0,
        ),
      [
        entries,
      ],
    );

  const economicCount =
    useMemo(
      () =>
        entries.filter(
          (
            entry,
          ) =>
            entry.type ===
            'economica',
        ).length,
      [
        entries,
      ],
    );

  const speciesCount =
    entries.length -
    economicCount;

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.05]">
            <Loader2
              size={23}
              className="animate-spin text-cyan-300"
            />
          </div>

          <p className="mt-4 text-[9px] font-medium text-[var(--muted)]">
            Cargando transparencia...
          </p>
        </div>
      </div>
    );
  }

  const filters: Array<{
    id: LedgerFilter;
    label: string;
  }> = [
      {
        id:
          'todos',
        label:
          'Todos',
      },
      {
        id:
          'economica',
        label:
          'Económicas',
      },
      {
        id:
          'especie',
        label:
          'En especie',
      },
    ];

  return (
    <>
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .ledger-entry:hover {
            border-color: rgba(103,232,249,.16);
            box-shadow: 0 22px 55px rgba(0,0,0,.28);
          }

          .ledger-entry:hover .ledger-pointer-glow {
            opacity: 1;
          }

          .ledger-pointer-glow {
            background:
              radial-gradient(
                420px circle at var(--ledger-x, 50%) var(--ledger-y, 50%),
                rgba(103,232,249,.065),
                transparent 46%
              );
          }

          .ledger-refresh:hover {
            transform: translateY(-2px);
            border-color: rgba(103,232,249,.18);
            background: rgba(103,232,249,.08);
            color: #67e8f9;
          }

          .ledger-refresh:hover .ledger-refresh-icon {
            transform: rotate(180deg);
          }

          .ledger-filter:hover {
            transform: translateY(-1px);
            color: #cffafe;
            background: rgba(103,232,249,.055);
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1480px] px-3 pb-8 sm:px-5 lg:px-7">
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.055] bg-[linear-gradient(145deg,rgba(34,211,238,.07),rgba(255,255,255,.025)_42%,rgba(59,130,246,.035))] p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/[0.07] blur-[80px]" />

          <div className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-blue-400/[0.05] blur-[90px]" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.75)]" />

                  <span className="text-[8px] font-bold uppercase tracking-[0.19em] text-cyan-300">
                    Registro público
                  </span>
                </div>

                <h1 className="mt-3 text-xl font-black tracking-[-0.045em] text-[var(--text)] sm:text-2xl lg:text-[28px]">
                  Transparencia verificable
                </h1>

                <p className="mt-2 max-w-xl text-[8px] leading-4 text-[var(--muted)] sm:text-[9px]">
                  Consulta las aportaciones aprobadas registradas en Shitan Trust sin exponer información privada.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  refreshing
                }
                onClick={() =>
                  void loadLedger(
                    true,
                  )
                }
                className="ledger-refresh group grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/[0.1] bg-cyan-300/[0.05] text-cyan-300 transition-all disabled:opacity-40"
                aria-label="Actualizar transparencia"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : 'ledger-refresh-icon transition-transform duration-500'
                  }
                />
              </button>
            </div>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-400/[0.1] bg-emerald-400/[0.035] p-4">
                <CircleDollarSign
                  size={15}
                  className="text-emerald-300"
                />

                <strong className="mt-5 block text-2xl font-black tracking-[-0.045em] text-emerald-200">
                  $
                  {formatMXN(
                    totalValidated,
                  )}
                </strong>

                <span className="mt-1 block text-[8px] text-emerald-300/60">
                  MXN verificados
                </span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-cyan-300/[0.1] bg-cyan-300/[0.035] p-4">
                <HandHeart
                  size={15}
                  className="text-cyan-300"
                />

                <strong className="mt-5 block text-2xl font-black tracking-[-0.045em] text-cyan-200">
                  {
                    economicCount
                  }
                </strong>

                <span className="mt-1 block text-[8px] text-cyan-300/60">
                  Aportaciones económicas
                </span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-amber-300/[0.1] bg-amber-300/[0.035] p-4">
                <Package
                  size={15}
                  className="text-amber-200"
                />

                <strong className="mt-5 block text-2xl font-black tracking-[-0.045em] text-amber-100">
                  {
                    speciesCount
                  }
                </strong>

                <span className="mt-1 block text-[8px] text-amber-200/60">
                  Aportaciones en especie
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 flex items-center gap-3 rounded-2xl border border-cyan-300/[0.07] bg-cyan-300/[0.018] px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
            <ShieldCheck
              size={16}
            />
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-[9px] font-semibold text-[var(--text)]">
              Solo aportaciones verificadas
            </span>

            <span className="mt-0.5 block text-[7px] leading-4 text-[var(--muted)]">
              El registro público oculta correo, teléfono, comprobantes y datos bancarios.
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,.7)]" />

            <span className="hidden text-[7px] font-semibold text-cyan-300 sm:block">
              Verificado
            </span>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                Libro mayor
              </span>

              <h2 className="mt-1.5 text-xl font-bold tracking-[-0.045em] text-[var(--text)] sm:text-2xl">
                Registro de aportaciones
              </h2>

              <p className="mt-1 max-w-xl text-[8px] leading-4 text-[var(--muted)]">
                Cada entrada corresponde a una aportación aprobada dentro de la plataforma.
              </p>
            </div>

            <span className="text-[8px] font-semibold text-[var(--muted)]">
              {
                filtered.length
              }{' '}
              {filtered.length ===
                1
                ? 'registro'
                : 'registros'}
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
                placeholder="Buscar por causa, aportador o folio..."
                className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] pl-9 pr-3 text-[8px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-cyan-300/[0.16]"
              />
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap">
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
                      className={`ledger-filter relative min-w-0 overflow-hidden rounded-xl px-3 py-2.5 text-[7px] font-semibold transition-all sm:px-4 sm:text-[8px] ${active
                          ? 'bg-cyan-300/[0.1] text-cyan-200 shadow-[inset_0_0_0_1px_rgba(103,232,249,.12)]'
                          : 'bg-white/[0.025] text-[var(--muted)]'
                        }`}
                    >
                      {
                        item.label
                      }

                      {active && (
                        <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-cyan-300" />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {filtered.length >
            0 ? (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {filtered.map(
                (
                  entry,
                ) => (
                  <EntryCard
                    key={
                      entry.id
                    }
                    entry={
                      entry
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <div className="mt-4 flex min-h-[250px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[0.07] bg-white/[0.015] px-5 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/[0.06] text-cyan-300">
                <Sparkles
                  size={20}
                />
              </div>

              <h3 className="mt-4 text-[11px] font-semibold text-[var(--text)]">
                Sin registros
              </h3>

              <p className="mt-1 max-w-[310px] text-[8px] leading-4 text-[var(--muted)]">
                No hay aportaciones que coincidan con los filtros seleccionados.
              </p>

              <button
                type="button"
                onClick={() => {
                  setFilter(
                    'todos',
                  );
                  setSearch(
                    '',
                  );
                }}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-cyan-300/[0.08] px-4 text-[8px] font-semibold text-cyan-200 transition-all"
              >
                Ver todos los registros
              </button>
            </div>
          )}
        </section>

        <section className="mt-7 overflow-hidden rounded-[24px] border border-white/[0.055] bg-white/[0.02] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
              <Clock3
                size={16}
              />
            </div>

            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-cyan-300">
                Historial verificable
              </span>

              <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">
                La fecha mostrada corresponde al registro de la aportación y la validación corresponde a la revisión realizada dentro de Shitan Trust.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
