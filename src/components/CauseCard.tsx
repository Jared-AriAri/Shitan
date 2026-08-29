import { Cause, Screen } from '../types';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';

interface CauseCardProps {
  cause: Cause;
  navigate: (to: Screen, causeId?: string) => void;
}

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(amount);
}

function formatDeadline(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Finalizada';
  if (days === 0) return 'Hoy';
  if (days === 1) return '1 día restante';
  return `${days} días restantes`;
}

export default function CauseCard({ cause, navigate }: CauseCardProps) {
  const pct = Math.round((cause.currentAmount / cause.goalAmount) * 100);
  const isComplete = cause.status === 'completada';

  return (
    <div
      className="rounded-xl overflow-hidden border border-border/60 bg-card animate-slide-up"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.3)' }}
    >
      {/* Cover Image */}
      <div className="relative h-44 bg-surface overflow-hidden">
        <img
          src={cause.coverImage}
          alt={cause.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <StatusBadge variant="category" value={cause.category} />
          <StatusBadge variant="cause-status" value={cause.status} />
        </div>

        {/* Deadline */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] text-foreground/80 bg-background/60 backdrop-blur-sm rounded-full px-2 py-0.5 font-medium">
            {formatDeadline(cause.deadline)}
          </span>
        </div>

        {/* Completed badge */}
        {isComplete && (
          <div className="absolute bottom-3 right-3">
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              Ciclo completado
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3
          className="text-[15px] font-semibold text-foreground leading-snug mb-1.5 line-clamp-2"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {cause.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {cause.story.split('\n')[0]}
        </p>

        {/* Financial progress */}
        <div className="mb-2">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-financial text-sm font-semibold text-foreground">
              ${formatMXN(cause.currentAmount)}
              <span className="text-muted-foreground font-normal text-xs"> / ${formatMXN(cause.goalAmount)} MXN</span>
            </span>
            <span className="font-financial text-sm font-semibold" style={{ color: '#10B981' }}>
              {pct}%
            </span>
          </div>
          <ProgressBar value={pct} color={isComplete ? 'emerald' : 'emerald'} height={5} />
        </div>

        {/* In-kind goals */}
        {cause.inKindGoals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
            {cause.inKindGoals.map((goal) => {
              const done = goal.current >= goal.target;
              return (
                <div
                  key={goal.item}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border"
                  style={
                    done
                      ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#10B981' }
                      : { background: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.25)', color: '#38BDF8' }
                  }
                >
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {goal.item} {goal.current}/{goal.target}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          {!isComplete && (
            <button
              onClick={() => navigate('contribute', cause.id)}
              className="flex-1 h-10 rounded-lg text-sm font-semibold text-primary-foreground transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
              }}
            >
              Aportar
            </button>
          )}
          <button
            onClick={() => navigate('cause-detail', cause.id)}
            className={[
              'h-10 rounded-lg text-sm font-medium text-muted-foreground border border-border hover:border-foreground/30 hover:text-foreground transition-all active:scale-95',
              isComplete ? 'flex-1' : 'px-4',
            ].join(' ')}
          >
            Ver causa
          </button>
        </div>
      </div>
    </div>
  );
}
