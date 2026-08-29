import { Screen } from '../types';
import { IMPACT_ITEMS, CAUSES } from '../data';

interface ImpactScreenProps {
  navigate: (to: Screen, causeId?: string) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ImpactScreen({
  navigate,
}: ImpactScreenProps) {
  const completedCause = CAUSES.find(
    (cause) => cause.status === 'completada',
  );

  return (
    <div className="w-full px-4 pt-5 pb-8 sm:px-6 lg:px-8 lg:pt-7 lg:pb-14">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-6 lg:mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: '#8B5CF6',
                boxShadow: '0 0 14px rgba(139,92,246,0.7)',
              }}
            />

            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-400/70">
              Resultados verificados
            </span>
          </div>

          <h2
            className="text-[22px] font-bold tracking-[-0.035em] text-foreground sm:text-2xl lg:text-[28px]"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Evidencia de Impacto
          </h2>

          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Documentación verificada de cómo los recursos llegaron a quienes
            más lo necesitaban.
          </p>
        </div>

        {completedCause && (
          <section className="mb-8 lg:mb-10">
            <div
              className="group relative overflow-hidden rounded-[22px] bg-card transition-all duration-500 hover:-translate-y-1"
              style={{
                background:
                  'linear-gradient(145deg, rgba(13,23,38,0.98) 0%, rgba(6,13,25,0.99) 100%)',
                boxShadow:
                  '0 24px 70px rgba(0,0,0,0.28), 0 0 55px rgba(16,185,129,0.035), inset 0 1px 0 rgba(255,255,255,0.025)',
              }}
            >
              <div
                className="pointer-events-none absolute -left-20 -top-24 z-10 h-64 w-64 rounded-full opacity-60 blur-[80px]"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                }}
              />

              <div className="relative h-[190px] overflow-hidden sm:h-[240px] lg:h-[300px]">
                <img
                  src={completedCause.coverImage}
                  alt={completedCause.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#07101d] via-[#07101d]/20 to-transparent" />

                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />

                <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold sm:text-xs"
                    style={{
                      background: 'rgba(6,30,27,0.75)',
                      color: '#34D399',
                      boxShadow:
                        '0 8px 28px rgba(0,0,0,0.22), 0 0 18px rgba(16,185,129,0.06)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: '#10B981',
                        boxShadow: '0 0 8px rgba(16,185,129,0.8)',
                      }}
                    />
                    Ciclo completado
                  </span>
                </div>
              </div>

              <div className="relative p-4 sm:p-5 lg:p-6">
                <div
                  className="pointer-events-none absolute -bottom-28 right-0 h-56 w-56 rounded-full blur-[90px]"
                  style={{
                    background: 'rgba(16,185,129,0.045)',
                  }}
                />

                <p className="relative text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-400/65">
                  Causa completada
                </p>

                <h3
                  className="relative mt-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-foreground sm:text-lg"
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {completedCause.title}
                </h3>

                <div className="relative mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
                      Beneficiario
                    </p>

                    <p className="mt-1 text-xs font-medium text-foreground/80 sm:text-sm">
                      {completedCause.beneficiary}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('cause-detail', completedCause.id)
                    }
                    className="group/button inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-all duration-300 active:scale-95"
                    style={{
                      background: 'rgba(16,185,129,0.07)',
                      boxShadow: 'inset 0 1px 0 rgba(16,185,129,0.05)',
                    }}
                  >
                    Ver detalles

                    <span className="transition-transform duration-300 group-hover/button:translate-x-1">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-400/70">
                Evidencias publicadas
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Registro visual del impacto generado
              </p>
            </div>

            <div
              className="hidden rounded-full px-3 py-1.5 text-[9px] font-semibold text-violet-300 sm:block"
              style={{
                background: 'rgba(139,92,246,0.07)',
              }}
            >
              {IMPACT_ITEMS.length}{' '}
              {IMPACT_ITEMS.length === 1 ? 'evidencia' : 'evidencias'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {IMPACT_ITEMS.map((item, index) => (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-[22px] transition-all duration-500 hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 70}ms`,
                  background:
                    'linear-gradient(145deg, rgba(14,21,37,0.97) 0%, rgba(6,11,23,0.99) 100%)',
                  boxShadow:
                    '0 22px 60px rgba(0,0,0,0.26), 0 8px 25px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.022)',
                }}
              >
                <div
                  className="pointer-events-none absolute -bottom-24 -right-20 z-0 h-56 w-56 rounded-full opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: 'rgba(139,92,246,0.07)',
                  }}
                />

                <div className="relative h-[180px] overflow-hidden sm:h-[220px] lg:h-[240px]">
                  <img
                    src={item.image}
                    alt={item.description}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a]/80 via-transparent to-black/5" />

                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(139,92,246,0.035), transparent 60%)',
                    }}
                  />

                  {item.type === 'completada' && (
                    <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-semibold sm:text-[10px]"
                        style={{
                          background: 'rgba(5,28,25,0.76)',
                          color: '#34D399',
                          boxShadow:
                            '0 8px 25px rgba(0,0,0,0.24), 0 0 16px rgba(16,185,129,0.04)',
                          backdropFilter: 'blur(14px)',
                          WebkitBackdropFilter: 'blur(14px)',
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background: '#10B981',
                            boxShadow: '0 0 7px rgba(16,185,129,0.75)',
                          }}
                        />

                        Ciclo completado
                      </span>
                    </div>
                  )}
                </div>

                <div className="relative z-10 p-4 sm:p-5">
                  <p className="truncate text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
                    {item.causeTitle}
                  </p>

                  <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/90 sm:text-[15px]">
                    {item.description}
                  </p>

                  <div
                    className="mt-5 h-px w-full"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(148,163,184,0.07), transparent)',
                    }}
                  />

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="grid h-7 w-7 place-items-center rounded-lg"
                        style={{
                          background: 'rgba(16,185,129,0.07)',
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M6 1L10 3V6C10 8.2 8.2 10.5 6 11C3.8 10.5 2 8.2 2 6V3L6 1Z"
                            stroke="#10B981"
                            strokeWidth="1.1"
                            fill="rgba(16,185,129,0.08)"
                          />

                          <path
                            d="M3.5 6L5 7.5L8.5 4.5"
                            stroke="#10B981"
                            strokeWidth="1.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground/50">
                          Verificado por
                        </span>

                        <span className="mt-0.5 text-[10px] font-semibold text-emerald-400">
                          {item.verifiedBy}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{
                          background: 'rgba(139,92,246,0.65)',
                          boxShadow: '0 0 6px rgba(139,92,246,0.45)',
                        }}
                      />

                      <span className="text-[9px] text-muted-foreground/70 sm:text-[10px]">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 lg:mt-10">
          <div
            className="relative overflow-hidden rounded-[22px] px-5 py-7 text-center sm:px-8 sm:py-9"
            style={{
              background:
                'radial-gradient(circle at 50% -30%, rgba(16,185,129,0.10), transparent 48%), linear-gradient(145deg, rgba(13,22,37,0.92), rgba(6,11,22,0.98))',
              boxShadow:
                '0 25px 70px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.02)',
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full blur-[60px]"
              style={{
                background: 'rgba(16,185,129,0.055)',
              }}
            />

            <div className="relative">
              <span
                className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-xl"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  boxShadow: '0 0 30px rgba(16,185,129,0.04)',
                }}
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 21C12 21 4 16.5 4 9.5C4 6.5 6 4 9 4C10.7 4 11.7 4.9 12 5.4C12.3 4.9 13.3 4 15 4C18 4 20 6.5 20 9.5C20 16.5 12 21 12 21Z"
                    stroke="#34D399"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <p
                className="text-base font-bold tracking-[-0.02em] text-foreground sm:text-lg"
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                ¿Quieres hacer la diferencia?
              </p>

              <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                Únete a la comunidad y contribuye a una causa activa.
              </p>

              <button
                type="button"
                onClick={() => navigate('home')}
                className="mt-5 h-11 rounded-xl px-7 text-xs font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] sm:text-sm"
                style={{
                  background:
                    'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow:
                    '0 12px 35px rgba(16,185,129,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
              >
                Ver causas activas
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}