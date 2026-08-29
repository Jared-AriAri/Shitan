import { useEffect, useState } from 'react';
import { Screen, SubmissionData } from '../types';

interface SuccessScreenProps {
  data: SubmissionData | null;
  navigate: (to: Screen, causeId?: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(amount);
}

export default function SuccessScreen({ data, navigate }: SuccessScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6 py-10 overflow-y-auto z-30">
      {/* Emblem */}
      <div
        className={`transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 70%)',
            border: '1.5px solid rgba(16,185,129,0.4)',
            boxShadow: '0 0 32px rgba(16,185,129,0.25)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M8 18L14 24L28 10"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div
        className={`text-center transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <h1
          className="text-2xl font-bold text-foreground mb-2"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Aporte enviado a revisión
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          Aparecerá públicamente en el Ledger después de ser verificado por el equipo de Shitan Trust.
        </p>
      </div>

      {/* Receipt card */}
      <div
        className={`w-full max-w-sm mt-8 rounded-2xl border bg-card p-5 space-y-3 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{
          borderColor: 'rgba(196,169,107,0.25)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Comprobante de envío
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(245,158,11,0.1)',
              color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            Pendiente
          </span>
        </div>

        {[
          { label: 'Causa', value: data.causeTitle },
          {
            label: 'Aporte declarado',
            value:
              data.type === 'economica'
                ? `$${formatMXN(data.amount!)} MXN`
                : `${data.item} × ${data.quantity}`,
            mono: true,
          },
          { label: 'Aportante', value: data.donorName },
          { label: 'ID de envío', value: data.submissionId, mono: true },
          { label: 'Fecha y hora', value: formatDate(data.submittedAt) },
        ].map(({ label, value, mono }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span
              className={`text-sm text-foreground leading-snug ${mono ? 'font-financial font-medium' : 'font-medium'}`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div
        className={`w-full max-w-sm mt-6 space-y-2.5 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <button
          onClick={() => navigate('ledger')}
          className="w-full h-12 rounded-xl text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all"
          style={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
          }}
        >
          Ver estado en el Ledger
        </button>
        <button
          onClick={() => navigate('home')}
          className="w-full h-12 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all active:scale-95"
        >
          Volver a causas
        </button>
      </div>

      {/* Verification note */}
      <p
        className={`text-[10px] text-muted-foreground/60 text-center mt-6 max-w-xs transition-all duration-700 delay-400 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        El proceso de verificación toma 24–48 horas. Recibirás un correo cuando tu aporte sea validado.
      </p>
    </div>
  );
}
