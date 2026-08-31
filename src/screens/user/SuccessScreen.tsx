import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Hash,
  HeartHandshake,
  Home,
  Package,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import type {
  Screen,
  SubmissionData,
} from '../../types';

interface SuccessScreenProps {
  data: SubmissionData | null;
  navigate: (
    to: Screen,
    causeId?: string,
  ) => void;
}

interface ExtendedSubmissionData {
  id?: string;
  contributionId?: string;
  submissionId?: string;
  folio?: string | number | null;
  causeId?: string;
  causeTitle?: string;
  type?: string;
  tipo?: string;
  amount?: number | null;
  monto?: number | null;
  item?: string | null;
  quantity?: number | null;
  donorName?: string | null;
  status?: string | null;
  estado?: string | null;
  reference?: string | null;
  referencia?: string | null;
  createdAt?: string | null;
  creada_en?: string | null;
  submittedAt?: string | null;
}

function formatDate(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return 'Fecha no disponible';
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
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day:
        'numeric',
      month:
        'long',
      year:
        'numeric',
      hour:
        '2-digit',
      minute:
        '2-digit',
    },
  ).format(
    date,
  );
}

function formatMXN(
  amount: number,
) {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style:
        'currency',
      currency:
        'MXN',
      minimumFractionDigits:
        0,
      maximumFractionDigits:
        2,
    },
  ).format(
    amount,
  );
}

function formatFolio(
  value:
    | string
    | number
    | null
    | undefined,
) {
  if (
    value ===
    null ||
    value ===
    undefined ||
    value ===
    ''
  ) {
    return null;
  }

  const text =
    String(
      value,
    );

  if (
    /^\d+$/.test(
      text,
    )
  ) {
    return `#${text.padStart(
      6,
      '0',
    )}`;
  }

  return `#${text}`;
}

function shortenId(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return 'No disponible';
  }

  if (
    value.length <=
    18
  ) {
    return value;
  }

  return `${value.slice(
    0,
    8,
  )}…${value.slice(
    -6,
  )}`;
}

export default function SuccessScreen({
  data,
  navigate,
}: SuccessScreenProps) {
  const [
    visible,
    setVisible,
  ] =
    useState(
      false,
    );

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setVisible(
              true,
            );
          },
          80,
        );

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [],
  );

  const submission =
    data as
    | (
      SubmissionData &
      ExtendedSubmissionData
    )
    | null;

  const normalized =
    useMemo(
      () => {
        if (
          !submission
        ) {
          return null;
        }

        const type =
          submission.tipo ??
          submission.type ??
          'economica';

        const contributionId =
          submission.contributionId ??
          submission.submissionId ??
          submission.id ??
          '';

        const amount =
          submission.monto ??
          submission.amount ??
          null;

        const createdAt =
          submission.createdAt ??
          submission.creada_en ??
          submission.submittedAt ??
          null;

        const status =
          submission.estado ??
          submission.status ??
          'pendiente';

        const reference =
          submission.referencia ??
          submission.reference ??
          null;

        return {
          type,
          contributionId,
          amount,
          createdAt,
          status,
          reference,
          folio:
            submission.folio ??
            null,
          causeId:
            submission.causeId ??
            null,
          causeTitle:
            submission.causeTitle ??
            'Causa seleccionada',
          donorName:
            submission.donorName ??
            null,
          item:
            submission.item ??
            null,
          quantity:
            submission.quantity ??
            null,
        };
      },
      [
        submission,
      ],
    );

  if (
    !normalized
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-[26px] border border-white/[0.06] bg-white/[0.022] p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-300/[0.07] text-amber-200">
            <ReceiptText
              size={22}
            />
          </div>

          <h1 className="mt-4 text-base font-bold text-[var(--text)]">
            No hay una aportación para mostrar
          </h1>

          <p className="mt-2 text-[9px] leading-4 text-[var(--muted)]">
            Regresa a las causas para realizar una nueva aportación.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                'home',
              )
            }
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400/[0.12] text-[9px] font-bold text-emerald-200 transition-all hover:bg-emerald-400/[0.18] active:scale-[0.98]"
          >
            <Home
              size={14}
            />

            Ir a causas
          </button>
        </div>
      </div>
    );
  }

  const economic =
    normalized.type ===
    'economica';

  const status =
    String(
      normalized.status,
    )
      .trim()
      .toLocaleLowerCase(
        'es-MX',
      );

  const pending =
    status ===
    'pendiente';

  const folio =
    formatFolio(
      normalized.folio,
    );

  const contributionText =
    economic
      ? normalized.amount !==
        null &&
        normalized.amount !==
        undefined
        ? formatMXN(
          Number(
            normalized.amount,
          ),
        )
        : 'Aportación económica'
      : normalized.item
        ? `${normalized.item}${normalized.quantity
          ? ` × ${normalized.quantity}`
          : ''
        }`
        : 'Aportación en especie';

  return (
    <div className="relative flex min-h-[calc(100vh-72px)] w-full items-center justify-center overflow-hidden px-3 py-8 sm:px-5">
      <div className="pointer-events-none absolute left-1/2 top-[12%] h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-emerald-400/[0.055] blur-[110px]" />

      <div className="relative z-10 mx-auto w-full max-w-[520px]">
        <div
          className={`transition-all duration-700 ${visible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-3 scale-95 opacity-0'
            }`}
        >
          <div className="mx-auto relative grid h-20 w-20 place-items-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-400/[0.08] blur-xl" />

            <div className="relative grid h-16 w-16 place-items-center rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] shadow-[0_0_40px_rgba(16,185,129,.12)]">
              <Check
                size={28}
                strokeWidth={2}
                className="text-emerald-300"
              />
            </div>

            <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-4 border-[var(--bg)] bg-amber-300 text-[#101510]">
              <Clock3
                size={11}
                strokeWidth={2.5}
              />
            </span>
          </div>
        </div>

        <div
          className={`mt-5 text-center transition-all delay-100 duration-700 ${visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
            }`}
        >
          <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-emerald-300">
            Aportación registrada
          </span>

          <h1 className="mt-2 text-xl font-black tracking-[-0.035em] text-[var(--text)] sm:text-2xl">
            Aporte enviado a revisión
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-[9px] leading-5 text-[var(--muted)]">
            Recibimos tu aportación correctamente. El equipo de Shitan Trust revisará la evidencia antes de confirmarla.
          </p>
        </div>

        <section
          className={`mt-7 overflow-hidden rounded-[26px] border border-white/[0.065] bg-white/[0.025] shadow-[0_24px_70px_rgba(0,0,0,.25)] transition-all delay-200 duration-700 ${visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
            }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2">
              <ReceiptText
                size={13}
                className="text-[var(--muted)]"
              />

              <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Comprobante de envío
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[6px] font-bold uppercase tracking-[0.08em] ${pending
                ? 'border-amber-300/15 bg-amber-300/[0.06] text-amber-200'
                : 'border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300'
                }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${pending
                  ? 'bg-amber-300'
                  : 'bg-emerald-400'
                  }`}
              />

              {pending
                ? 'Pendiente'
                : 'Registrada'}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <div className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-400/[0.025] p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                  {economic ? (
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
                  <span className="block text-[6px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Aporte declarado
                  </span>

                  <strong className="mt-1 block break-words text-base font-black tracking-[-0.025em] text-[var(--text)]">
                    {
                      contributionText
                    }
                  </strong>

                  <span className="mt-1 block text-[7px] text-[var(--muted)]">
                    {economic
                      ? 'Aportación económica'
                      : 'Aportación en especie'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-emerald-300">
                  <HeartHandshake
                    size={13}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                    Causa
                  </span>

                  <span className="mt-1 block text-[9px] font-semibold leading-4 text-[var(--text-soft)]">
                    {
                      normalized.causeTitle
                    }
                  </span>
                </div>
              </div>

              {normalized.donorName && (
                <div className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-cyan-300">
                    <UserRound
                      size={13}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                      Aportante
                    </span>

                    <span className="mt-1 block truncate text-[9px] font-semibold text-[var(--text-soft)]">
                      {
                        normalized.donorName
                      }
                    </span>
                  </div>
                </div>
              )}

              {folio && (
                <div className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-amber-200">
                    <Hash
                      size={13}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                      Folio
                    </span>

                    <span className="mt-1 block font-mono text-[9px] font-semibold text-amber-200">
                      {
                        folio
                      }
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-violet-300">
                  <FileCheck2
                    size={13}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                    ID de aportación
                  </span>

                  <span
                    title={
                      normalized.contributionId
                    }
                    className="mt-1 block break-all font-mono text-[8px] font-semibold text-[var(--text-soft)]"
                  >
                    {shortenId(
                      normalized.contributionId,
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-[var(--text-soft)]">
                  <Clock3
                    size={13}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                    Fecha y hora
                  </span>

                  <span className="mt-1 block text-[8px] font-medium leading-4 text-[var(--text-soft)]">
                    {formatDate(
                      normalized.createdAt,
                    )}
                  </span>
                </div>
              </div>

              {economic &&
                normalized.reference && (
                  <div className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-cyan-300">
                      <ReceiptText
                        size={13}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        Referencia de transferencia
                      </span>

                      <span className="mt-1 block break-all font-mono text-[8px] font-semibold text-[var(--text-soft)]">
                        {
                          normalized.reference
                        }
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </section>

        <section
          className={`mt-3 rounded-[22px] border border-amber-300/[0.09] bg-amber-300/[0.025] p-4 transition-all delay-300 duration-700 ${visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
            }`}
        >
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-300/[0.08] text-amber-200">
              <Clock3
                size={15}
              />
            </div>

            <div>
              <span className="block text-[8px] font-semibold text-amber-100">
                Pendiente de validación
              </span>

              <p className="mt-1 text-[7px] leading-4 text-[var(--muted)]">
                {economic
                  ? 'El administrador revisará el comprobante de pago que adjuntaste. El monto no se contabilizará como confirmado hasta que sea validado.'
                  : 'El administrador revisará la fotografía de entrega y los artículos declarados. La aportación no se contabilizará como confirmada hasta que sea validada.'}
              </p>
            </div>
          </div>
        </section>

        <section
          className={`mt-3 rounded-[22px] border border-emerald-400/[0.08] bg-emerald-400/[0.018] p-4 transition-all delay-300 duration-700 ${visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
            }`}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={15}
              className="mt-0.5 shrink-0 text-emerald-300"
            />

            <div>
              <span className="block text-[8px] font-semibold text-emerald-300">
                Proceso transparente
              </span>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-white/[0.02] p-3">
                  <span className="text-[6px] font-bold text-emerald-300">
                    01
                  </span>

                  <span className="mt-1 block text-[7px] font-semibold text-[var(--text-soft)]">
                    Enviada
                  </span>
                </div>

                <div className="rounded-xl bg-amber-300/[0.025] p-3">
                  <span className="text-[6px] font-bold text-amber-200">
                    02
                  </span>

                  <span className="mt-1 block text-[7px] font-semibold text-[var(--text-soft)]">
                    En revisión
                  </span>
                </div>

                <div className="rounded-xl bg-white/[0.02] p-3">
                  <span className="text-[6px] font-bold text-[var(--muted)]">
                    03
                  </span>

                  <span className="mt-1 block text-[7px] font-semibold text-[var(--text-soft)]">
                    Validada
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className={`mt-5 grid gap-2.5 transition-all delay-[400ms] duration-700 sm:grid-cols-2 ${visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
            }`}
        >
          <button
            type="button"
            onClick={() =>
              navigate(
                'ledger',
              )
            }
            className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400/[0.12] px-4 text-[9px] font-bold text-emerald-200 transition-all hover:bg-emerald-400/[0.18] active:scale-[0.98]"
          >
            <FileCheck2
              size={14}
            />

            Ver registro

            <ArrowRight
              size={13}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                'home',
              )
            }
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 text-[9px] font-semibold text-[var(--text-soft)] transition-all hover:bg-white/[0.05] hover:text-white active:scale-[0.98]"
          >
            <Home
              size={14}
            />

            Volver a causas
          </button>
        </div>

        <div
          className={`mt-5 flex items-center justify-center gap-2 text-center transition-all delay-500 duration-700 ${visible
            ? 'opacity-100'
            : 'opacity-0'
            }`}
        >
          <CheckCircle2
            size={11}
            className="text-emerald-300"
          />

          <span className="text-[7px] leading-4 text-[var(--muted)]">
            Tu solicitud quedó registrada correctamente en Shitan Trust.
          </span>
        </div>
      </div>
    </div>
  );
}