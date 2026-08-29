import { useState } from 'react';
import { Screen, PendingItem, ContributionStatus } from '../types';
import { PENDING_ITEMS } from '../data';
import StatusBadge from '../components/StatusBadge';

interface AdminScreenProps {
  navigate: (to: Screen, causeId?: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(amount);
}

export default function AdminScreen({ navigate, showToast }: AdminScreenProps) {
  const [items, setItems] = useState<PendingItem[]>(PENDING_ITEMS);
  const [selected, setSelected] = useState<PendingItem | null>(null);
  const [confirming, setConfirming] = useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = useState(false);

  const pending = items.filter((i) => i.status === 'pendiente' || i.status === 'correccion');

  async function handleAction(action: 'approve' | 'reject' | 'correccion') {
    if (!selected) return;
    if ((action === 'reject') && !confirming) {
      setConfirming('reject');
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 900));
    const newStatus: ContributionStatus =
      action === 'approve' ? 'validado' : action === 'reject' ? 'rechazado' : 'correccion';
    setItems((prev) =>
      prev.map((item) => (item.id === selected.id ? { ...item, status: newStatus } : item))
    );
    const msgs = {
      approve: '✓ Aporte aprobado y registrado en el Ledger',
      reject: 'Aporte rechazado',
      correccion: 'Solicitud de corrección enviada',
    };
    showToast(msgs[action], action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'warning');
    setSelected(null);
    setConfirming(null);
    setProcessing(false);
  }

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        {/* Back header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <button
            onClick={() => { setSelected(null); setConfirming(null); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface text-muted-foreground hover:text-foreground transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L6 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Revisar aporte
          </span>
          <div className="ml-auto">
            <StatusBadge variant="contribution-status" value={selected.status} size="md" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Voucher preview */}
          <div className="rounded-xl overflow-hidden border border-border/60 relative">
            <img
              src={selected.voucherThumb}
              alt="Comprobante"
              className="w-full h-48 object-cover"
              style={{ filter: 'blur(4px)', transform: 'scale(1.05)' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
              <div
                className="px-4 py-2 rounded-full text-xs font-semibold border"
                style={{
                  background: 'rgba(196,169,107,0.1)',
                  borderColor: 'rgba(196,169,107,0.4)',
                  color: '#C4A96B',
                }}
              >
                🔒 Solo visible para administradores
              </div>
            </div>
          </div>

          {/* Contributor info */}
          <div className="rounded-xl bg-card border border-border/60 p-4 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Datos del aportante</p>
            {[
              { label: 'Nombre', value: selected.donorName },
              { label: 'Correo', value: selected.email },
              { label: 'Teléfono', value: selected.phone || '—' },
              {
                label: 'Anónimo en Ledger',
                value: selected.anonymous ? 'Sí' : 'No',
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>

          {/* Contribution info */}
          <div className="rounded-xl bg-card border border-border/60 p-4 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Datos del aporte</p>
            {[
              { label: 'ID de envío', value: selected.id.toUpperCase(), mono: true },
              { label: 'Causa', value: selected.causeTitle },
              {
                label: 'Tipo',
                value: selected.type === 'economica' ? 'Aporte económico' : 'Aporte en especie',
              },
              {
                label: selected.type === 'economica' ? 'Monto declarado' : 'Artículo',
                value:
                  selected.type === 'economica'
                    ? `$${formatMXN(selected.amount!)} MXN`
                    : `${selected.item} × ${selected.quantity}`,
                mono: true,
              },
              { label: 'Enviado', value: formatDate(selected.submittedAt) },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                <span className={`text-xs font-medium text-foreground text-right ${mono ? 'font-financial' : ''}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Internal notes */}
          {selected.internalNote && (
            <div
              className="rounded-xl p-3 border"
              style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.25)' }}
            >
              <p className="text-[10px] text-amber uppercase tracking-widest mb-1.5">Nota interna</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{selected.internalNote}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex-none px-4 py-3 border-t border-border/50 bg-background space-y-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          {confirming === 'reject' ? (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                ¿Confirmar rechazo de este aporte?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(null)}
                  className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={processing}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: '#EF4444' }}
                >
                  {processing ? 'Rechazando...' : 'Confirmar rechazo'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleAction('approve')}
                disabled={processing || selected.status === 'validado'}
                className="w-full h-12 rounded-xl text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                }}
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </div>
                ) : (
                  'Aprobar y registrar en Ledger'
                )}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('correccion')}
                  disabled={processing}
                  className="flex-1 h-10 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  Solicitar corrección
                </button>
                <button
                  onClick={() => setConfirming('reject')}
                  disabled={processing || selected.status === 'rechazado'}
                  className="flex-1 h-10 rounded-xl border text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    borderColor: 'rgba(239,68,68,0.35)',
                    color: '#EF4444',
                    background: 'rgba(239,68,68,0.05)',
                  }}
                >
                  Rechazar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pendientes', value: pending.length, color: '#F59E0B' },
          { label: 'Aprobados', value: items.filter((i) => i.status === 'validado').length, color: '#10B981' },
          { label: 'Rechazados', value: items.filter((i) => i.status === 'rechazado').length, color: '#EF4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-card border border-border/60 p-3 text-center">
            <p className="font-financial text-2xl font-bold leading-none" style={{ color }}>
              {value}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Queue */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
          Cola de revisión
        </p>
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 11L9 15L17 7" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Sin aportes pendientes</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full text-left rounded-xl border bg-card p-4 hover:border-foreground/20 active:scale-[0.99] transition-all"
                style={{
                  borderColor:
                    item.status === 'validado'
                      ? 'rgba(16,185,129,0.3)'
                      : item.status === 'rechazado'
                      ? 'rgba(239,68,68,0.25)'
                      : item.status === 'correccion'
                      ? 'rgba(56,189,248,0.25)'
                      : 'rgba(51,65,85,0.6)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Voucher thumb */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={item.voucherThumb}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: 'blur(2px)' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">
                        {item.donorName}
                      </p>
                      <StatusBadge variant="contribution-status" value={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.causeTitle}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {item.type === 'economica' ? (
                        <span className="font-financial text-xs font-bold" style={{ color: '#10B981' }}>
                          ${formatMXN(item.amount!)} MXN
                        </span>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: '#38BDF8' }}>
                          {item.item} ×{item.quantity}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatDate(item.submittedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
