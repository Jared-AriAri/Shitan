import { CauseCategory, CauseStatus, ContributionStatus, ContributionType } from '../types';

interface StatusBadgeProps {
  variant: 'category' | 'cause-status' | 'contribution-status' | 'contribution-type';
  value: CauseCategory | CauseStatus | ContributionStatus | ContributionType | string;
  size?: 'sm' | 'md';
}

const categoryStyles: Record<string, string> = {
  Salud: 'bg-azure/10 text-azure border-azure/25',
  Despensas: 'bg-emerald/10 text-emerald border-emerald/25',
  Especie: 'bg-amber/10 text-amber border-amber/25',
};

const causeStatusStyles: Record<string, string> = {
  activa: 'bg-emerald/10 text-emerald border-emerald/25',
  completada: 'bg-surface text-muted-foreground border-border',
  pausada: 'bg-amber/10 text-amber border-amber/25',
};

const causeStatusLabels: Record<string, string> = {
  activa: 'Activa',
  completada: 'Completada',
  pausada: 'Pausada',
};

const contributionStatusStyles: Record<string, string> = {
  pendiente: 'bg-amber/10 text-amber border-amber/25',
  validado: 'bg-emerald/10 text-emerald border-emerald/25',
  rechazado: 'bg-error/10 text-error border-error/25',
  correccion: 'bg-azure/10 text-azure border-azure/25',
};

const contributionStatusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  validado: 'Validado',
  rechazado: 'Rechazado',
  correccion: 'Corrección',
};

const typeStyles: Record<string, string> = {
  economica: 'bg-emerald/10 text-emerald border-emerald/25',
  especie: 'bg-azure/10 text-azure border-azure/25',
};

const typeLabels: Record<string, string> = {
  economica: 'Económico',
  especie: 'En especie',
};

export default function StatusBadge({ variant, value, size = 'sm' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  let styleClass = '';
  let label = '';

  if (variant === 'category') {
    styleClass = categoryStyles[value] || 'bg-surface text-muted-foreground border-border';
    label = value as string;
  } else if (variant === 'cause-status') {
    styleClass = causeStatusStyles[value] || '';
    label = causeStatusLabels[value] || value as string;
  } else if (variant === 'contribution-status') {
    styleClass = contributionStatusStyles[value] || '';
    label = contributionStatusLabels[value] || value as string;
  } else if (variant === 'contribution-type') {
    styleClass = typeStyles[value] || '';
    label = typeLabels[value] || value as string;
  }

  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full border',
        'font-body tracking-wide leading-none',
        sizeClass,
        styleClass,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
