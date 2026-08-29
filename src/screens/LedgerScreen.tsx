import { useState } from 'react';
import { LedgerEntry } from '../types';
import { LEDGER_ENTRIES } from '../data';
import StatusBadge from '../components/StatusBadge';

interface LedgerScreenProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EntryCard({ entry }: { entry: LedgerEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start gap-3">
          {/* Type indicator */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={
              entry.type === 'economica'
                ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }
                : { background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }
            }
          >
            {entry.type === 'economica' ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4.5" width="12" height="8" rx="1.5" stroke={entry.type === 'economica' ? '#10B981' : '#38BDF8'} strokeWidth="1.25" />
                <path d="M5.5 4.5V3.5C5.5 2.7 6.2 2 7 2H9C9.8 2 10.5 2.7 10.5 3.5V4.5" stroke={entry.type === 'economica' ? '#10B981' : '#38BDF8'} strokeWidth="1.25" strokeLinecap="round" />
                <circle cx="8" cy="9" r="1.5" fill={entry.type === 'economica' ? '#10B981' : '#38BDF8'} />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 12L5 5H11L13 12H3Z" stroke="#38BDF8" strokeWidth="1.25" strokeLinejoin="round" />
                <path d="M6 5V4C6 3.45 6.45 3 7 3H9C9.55 3 10 3.45 10 4V5" stroke="#38BDF8" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {entry.anonymous ? (
                    <span className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="4.5" r="2" stroke="#94A3B8" strokeWidth="1.1" />
                        <path d="M2 10C2 8 3.8 7 6 7C8.2 7 10 8 10 10" stroke="#94A3B8" strokeWidth="1.1" strokeLinecap="round" />
                      </svg>
                      Aportador Anónimo
                    </span>
                  ) : entry.donorName}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {entry.causeTitle}
                </p>
              </div>
              <div className="text-right shrink-0">
                {entry.type === 'economica' ? (
                  <span
                    className="font-financial text-sm font-bold"
                    style={{ color: '#10B981' }}
                  >
                    +${formatMXN(entry.amount!)}
                  </span>
                ) : (
                  <span
                    className="font-financial text-xs font-semibold"
                    style={{ color: '#38BDF8' }}
                  >
                    {entry.item} ×{entry.quantity}
                  </span>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(entry.date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-3 ml-12">
          <StatusBadge variant="contribution-status" value={entry.status} />
          <StatusBadge variant="contribution-type" value={entry.type} />
          {/* Expand indicator */}
          <span className="ml-auto">
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className={`text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/50 animate-slide-up space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-surface">
              <p className="text-muted-foreground mb-0.5">ID de transacción</p>
              <p className="font-financial font-medium text-foreground">{entry.id.toUpperCase()}</p>
            </div>
            <div className="p-2 rounded-lg bg-surface">
              <p className="text-muted-foreground mb-0.5">Validado</p>
              <p className="font-medium text-foreground">{formatDate(entry.validatedAt)}</p>
            </div>
          </div>
          {/* Verified by */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald/5 border border-emerald/20">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1L11 3.25V6.5C11 9.1 9.1 11.5 6.5 12C3.9 11.5 2 9.1 2 6.5V3.25L6.5 1Z" stroke="#10B981" strokeWidth="1.1" fill="rgba(16,185,129,0.08)" />
              <path d="M4 6.5L5.5 8L9 5" stroke="#10B981" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] text-emerald font-medium">Validado por Shitan</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LedgerScreen({ showToast }: LedgerScreenProps) {
  const [filter, setFilter] = useState<'todos' | 'economica' | 'especie'>('todos');

  const filtered = LEDGER_ENTRIES.filter((e) => {
    if (filter === 'todos') return true;
    return e.type === filter;
  });

  const totalValidated = LEDGER_ENTRIES.filter((e) => e.type === 'economica' && e.status === 'validado')
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="px-4 pt-4 pb-4 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Libro Mayor
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          de Transparencia
        </p>
      </div>

      {/* Trust badge */}
      <div
        className="flex items-center justify-between p-4 rounded-xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.9) 100%)',
          borderColor: 'rgba(16,185,129,0.25)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L16 4.5V9C16 12.9 12.9 16.5 9 17.5C5.1 16.5 2 12.9 2 9V4.5L9 1Z" stroke="#10B981" strokeWidth="1.5" fill="rgba(16,185,129,0.08)" />
              <path d="M5.5 9L7.5 11L12.5 6.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Solo aportaciones verificadas</p>
            <p className="text-[11px] text-muted-foreground">Cada entrada fue revisada por el equipo Shitan</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-financial text-sm font-bold" style={{ color: '#10B981' }}>
            ${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(totalValidated)}
          </p>
          <p className="text-[10px] text-muted-foreground">MXN verificados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'economica', label: 'Económico' },
          { id: 'especie', label: 'En especie' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id as typeof filter)}
            className={[
              'h-8 px-3.5 rounded-full text-xs font-medium border transition-all active:scale-95',
              filter === id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-foreground/30',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>

      <div className="pb-2" />
    </div>
  );
}
