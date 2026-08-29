import { ToastMessage } from '../types';

export default function Toast({ message, type }: Omit<ToastMessage, 'id'>) {
  const config = {
    success: {
      bg: 'bg-emerald/10 border-emerald/30',
      text: 'text-emerald',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
          <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-error/10 border-error/30',
      text: 'text-error',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
          <path d="M8 5V8.5M8 10.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-azure/10 border-azure/30',
      text: 'text-azure',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
          <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-amber/10 border-amber/30',
      text: 'text-amber',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L14.5 13H1.5L8 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
          <path d="M8 6.5V9.5M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  };

  const c = config[type];

  return (
    <div
      className={[
        'animate-toast-in pointer-events-auto',
        'flex items-center gap-2.5 px-4 py-3 rounded-xl border',
        'backdrop-blur-sm shadow-lg',
        'bg-card/95',
        c.bg,
        'max-w-sm w-full',
      ].join(' ')}
      role="alert"
    >
      <span className={c.text}>{c.icon}</span>
      <span className="text-sm text-foreground font-medium flex-1">{message}</span>
    </div>
  );
}
