import { useState } from 'react';
import { Screen } from '../types';
import { CAUSES } from '../data';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';

interface CauseDetailScreenProps {
  causeId: string;
  navigate: (to: Screen, causeId?: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CauseDetailScreen({ causeId, navigate, showToast }: CauseDetailScreenProps) {
  const cause = CAUSES.find((c) => c.id === causeId);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  if (!cause) return null;

  const pct = Math.round((cause.currentAmount / cause.goalAmount) * 100);
  const isComplete = cause.status === 'completada';

  async function handleCopyClabe() {
    try {
      await navigator.clipboard.writeText(cause!.bankInfo.clabe.replace(/\s/g, ''));
      setCopiedClabe(true);
      showToast('CLABE copiada al portapapeles', 'success');
      setTimeout(() => setCopiedClabe(false), 3000);
    } catch {
      showToast('No se pudo copiar la CLABE', 'error');
    }
  }

  const storyParagraphs = cause.story.split('\n').filter(Boolean);

  return (
    <div className="pb-28">
      {/* Gallery hero */}
      <div className="relative h-56 bg-surface overflow-hidden">
        <img
          src={cause.gallery[galleryIndex]}
          alt={cause.title}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Gallery dots */}
        {cause.gallery.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {cause.gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setGalleryIndex(i)}
                className={`rounded-full transition-all ${i === galleryIndex ? 'w-4 h-1.5 bg-foreground' : 'w-1.5 h-1.5 bg-foreground/40'}`}
                aria-label={`Imagen ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 relative z-10 space-y-5">
        {/* Title row */}
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <StatusBadge variant="category" value={cause.category} size="md" />
            <StatusBadge variant="cause-status" value={cause.status} size="md" />
          </div>
          <h1
            className="text-xl font-bold text-foreground leading-snug"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            {cause.title}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M2 10C2 8 3.8 7 6 7C8.2 7 10 8 10 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
              {cause.organizer}
            </span>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2" width="9" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M1.5 5H10.5M4 1V3M8 1V3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
              {formatDate(cause.deadline)}
            </span>
          </div>
        </div>

        {/* Financial progress */}
        <div
          className="rounded-xl p-4 border border-border bg-card"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            Meta económica
          </p>
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-financial text-xl font-bold text-foreground">
              ${formatMXN(cause.currentAmount)}
            </span>
            <span className="font-financial text-sm text-muted-foreground">
              ${formatMXN(cause.goalAmount)} MXN
            </span>
          </div>
          <ProgressBar value={pct} color="emerald" height={6} />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">Recaudado</span>
            <span className="font-financial text-sm font-bold" style={{ color: '#10B981' }}>
              {pct}%
            </span>
          </div>
        </div>

        {/* In-kind goals */}
        {cause.inKindGoals.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Metas en especie
            </p>
            {cause.inKindGoals.map((goal) => {
              const gPct = Math.min(100, Math.round((goal.current / goal.target) * 100));
              const done = goal.current >= goal.target;
              return (
                <div key={goal.item} className="rounded-lg p-3 bg-card border border-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{goal.item}</span>
                    <span
                      className="font-financial text-sm font-semibold"
                      style={{ color: done ? '#10B981' : '#38BDF8' }}
                    >
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <ProgressBar value={gPct} color={done ? 'emerald' : 'azure'} height={4} />
                </div>
              );
            })}
          </div>
        )}

        {/* Story */}
        <div className="rounded-xl p-4 border border-border/60 bg-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
            Historia
          </p>
          <div className="space-y-3">
            {storyParagraphs.slice(0, storyExpanded ? undefined : 1).map((p, i) => (
              <p key={i} className="text-sm text-secondary-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </div>
          {storyParagraphs.length > 1 && (
            <button
              onClick={() => setStoryExpanded((v) => !v)}
              className="mt-3 text-xs text-primary font-medium flex items-center gap-1"
            >
              {storyExpanded ? 'Leer menos' : 'Leer más'}
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={`transition-transform ${storyExpanded ? 'rotate-180' : ''}`}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Beneficiary */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/60">
          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="5" r="2.5" stroke="#C4A96B" strokeWidth="1.25" />
              <path d="M2 12C2 9.8 4.3 8 7 8C9.7 8 12 9.8 12 12" stroke="#C4A96B" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Beneficiario</p>
            <p className="text-sm font-medium text-foreground">{cause.beneficiary}</p>
          </div>
        </div>

        {/* Bank info */}
        {!isComplete && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'rgba(196,169,107,0.3)' }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between border-b"
              style={{
                background: 'rgba(196,169,107,0.05)',
                borderBottomColor: 'rgba(196,169,107,0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="#C4A96B" strokeWidth="1.25" />
                  <path d="M4 4V3C4 1.9 4.9 1 6 1H8C9.1 1 10 1.9 10 3V4" stroke="#C4A96B" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
                <span className="text-xs font-semibold" style={{ color: '#C4A96B' }}>
                  Datos bancarios
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">{cause.bankInfo.bank}</span>
            </div>
            <div className="px-4 py-3 space-y-2 bg-card">
              {[
                { label: 'Beneficiario', value: cause.bankInfo.beneficiary },
                { label: 'Concepto', value: cause.bankInfo.concept },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-foreground">{value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">CLABE interbancaria</span>
                </div>
                <div className="flex items-center gap-2">
                  <code
                    className="font-financial text-sm text-foreground flex-1 tracking-widest"
                    style={{ letterSpacing: '0.12em' }}
                  >
                    {cause.bankInfo.clabe}
                  </code>
                  <button
                    onClick={handleCopyClabe}
                    className={[
                      'h-8 px-3 rounded-lg text-xs font-semibold border transition-all active:scale-95',
                      copiedClabe
                        ? 'bg-emerald/10 text-emerald border-emerald/30'
                        : 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/15',
                    ].join(' ')}
                  >
                    {copiedClabe ? '✓ Copiada' : 'Copiar CLABE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {!isComplete && (
        <div
          className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t border-border/50 bg-background/95 backdrop-blur-sm"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', zIndex: 20 }}
        >
          <div className="flex gap-3 max-w-lg mx-auto">
            <button
              onClick={() => navigate('contribute', cause.id)}
              className="flex-1 h-12 rounded-xl text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
              }}
            >
              Aportar a esta causa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
