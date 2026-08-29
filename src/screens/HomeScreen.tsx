import { useMemo, useState } from 'react';

import { Screen, FilterCategory } from '../types';
import { CAUSES, GLOBAL_STATS } from '../data';
import CauseCard from '../components/CauseCard';

interface HomeScreenProps {
  navigate: (to: Screen, causeId?: string) => void;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
  ) => void;
}

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 0,
  }).format(amount);
}

const filters: FilterCategory[] = [
  'Todas',
  'Salud',
  'Despensas',
  'Especie',
  'Completadas',
];

const stats = [
  {
    label: 'Causas activas',
    value: GLOBAL_STATS.causasActivas,
  },
  {
    label: 'Completadas',
    value: GLOBAL_STATS.causasCompletadas,
  },
  {
    label: 'Verificadas',
    value: GLOBAL_STATS.aportacionesVerificadas,
  },
];

export default function HomeScreen({
  navigate,
}: HomeScreenProps) {
  const [activeFilter, setActiveFilter] =
    useState<FilterCategory>('Todas');

  const filtered = useMemo(() => {
    return CAUSES.filter((cause) => {
      if (activeFilter === 'Todas') {
        return true;
      }

      if (activeFilter === 'Completadas') {
        return cause.status === 'completada';
      }

      return cause.category === activeFilter;
    });
  }, [activeFilter]);

  return (
    <div className="home-screen">
      <section className="home-hero">
        <div className="home-hero-ambient home-hero-ambient-one" />
        <div className="home-hero-ambient home-hero-ambient-two" />

        <div className="home-hero-content">
          <div className="home-balance">
            <div className="home-balance-heading">
              <span className="home-balance-dot" />

              <p className="home-eyebrow">
                Fondo comunitario
              </p>
            </div>

            <div className="home-balance-value">
              <span className="home-balance-symbol">$</span>

              <span>
                {formatMXN(
                  GLOBAL_STATS.totalAcumulado,
                )}
              </span>
            </div>

            <div className="home-balance-footer">
              <span>MXN</span>

              <span className="home-balance-verified">
                Fondo verificado
              </span>
            </div>
          </div>

          <div className="home-stats">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="home-stat"
              >
                <div className="home-stat-top">
                  <span className="home-stat-index">
                    0{index + 1}
                  </span>

                  <span className="home-stat-glow" />
                </div>

                <p className="home-stat-value">
                  {stat.value}
                </p>

                <p className="home-stat-label">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="home-hero-shine" />
      </section>

      <section className="home-trust">
        <div className="home-trust-icon">
          <svg
            width="17"
            height="17"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M7 1L12 3.5V7C12 9.75 9.75 12 7 13C4.25 12 2 9.75 2 7V3.5L7 1Z"
              stroke="currentColor"
              strokeWidth="1.25"
              fill="rgba(16,185,129,0.08)"
            />

            <path
              d="M4.5 7L6 8.5L9.5 5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="home-trust-copy">
          <span className="home-trust-title">
            Transparencia verificada
          </span>

          <span className="home-trust-text">
            Cada aporte es auditado por Shitan
          </span>
        </div>

        <div className="home-trust-status">
          <span className="home-trust-status-dot" />
          Activo
        </div>
      </section>

      <section
        id="causes"
        data-section="causes"
        className="home-causes"
      >
        <div className="home-causes-heading">
          <div>
            <p className="home-section-eyebrow">
              Causas verificadas
            </p>

            <h2 className="home-section-title">
              Genera un impacto real
            </h2>
          </div>

          <span className="home-cause-count">
            {filtered.length}{' '}
            {filtered.length === 1
              ? 'causa'
              : 'causas'}
          </span>
        </div>

        <div className="home-filter-scroll">
          <div className="home-filters">
            {filters.map((filter) => {
              const isActive =
                activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() =>
                    setActiveFilter(filter)
                  }
                  className={`home-filter ${isActive
                      ? 'home-filter-active'
                      : ''
                    }`}
                >
                  <span className="home-filter-glow" />

                  <span className="home-filter-label">
                    {filter}
                  </span>

                  {isActive && (
                    <span className="home-filter-indicator" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="home-cause-list">
            {filtered.map((cause, index) => (
              <div
                key={cause.id}
                className="home-cause-entry"
                style={{
                  animationDelay: `${index * 70}ms`,
                }}
              >
                <CauseCard
                  cause={cause}
                  navigate={navigate}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="home-empty">
            <div className="home-empty-glow" />

            <div className="home-empty-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />

                <path
                  d="M8 12H16M12 8V16"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <p className="home-empty-title">
              Sin causas en esta categoría
            </p>

            <p className="home-empty-text">
              Prueba con otra categoría para
              descubrir más causas.
            </p>

            <button
              type="button"
              onClick={() =>
                setActiveFilter('Todas')
              }
              className="home-empty-button"
            >
              Ver todas las causas
            </button>
          </div>
        )}
      </section>
    </div>
  );
}