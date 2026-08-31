import {
    useEffect,
    type ReactNode,
} from 'react';

import {
    AlertTriangle,
    Loader2,
    X,
} from 'lucide-react';

import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    icon?: ReactNode;
    tone?: 'danger' | 'warning' | 'default';
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    loading = false,
    icon,
    tone = 'danger',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
            if (
                event.key === 'Escape' &&
                !loading
            ) {
                onCancel();
            }
        };

        window.addEventListener(
            'keydown',
            handleKeyDown,
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown,
            );
        };
    }, [
        open,
        loading,
        onCancel,
    ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            'hidden';

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [open]);

    if (!open) {
        return null;
    }

    const toneClasses = {
        danger: {
            icon: 'bg-rose-400/10 text-rose-300 ring-rose-400/10',
            button:
                'bg-rose-500 text-white shadow-[0_12px_30px_rgba(244,63,94,.18)] hover:bg-rose-400',
        },
        warning: {
            icon: 'bg-amber-300/10 text-amber-300 ring-amber-300/10',
            button:
                'bg-amber-400 text-[#160f02] shadow-[0_12px_30px_rgba(251,191,36,.15)] hover:bg-amber-300',
        },
        default: {
            icon: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/10',
            button:
                'bg-emerald-400 text-[#03130d] shadow-[0_12px_30px_rgba(16,185,129,.15)] hover:bg-emerald-300',
        },
    };

    const colors =
        toneClasses[tone];

    return createPortal(
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
            role="presentation"
            onMouseDown={(
                event,
            ) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !loading
                ) {
                    onCancel();
                }
            }}
        >
            <style>
                {`
          @keyframes confirmBackdropIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes confirmDialogIn {
            from {
              opacity: 0;
              transform: translate3d(0, 18px, 0) scale(.97);
            }

            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          .confirm-dialog-backdrop {
            animation: confirmBackdropIn .2s ease-out both;
          }

          .confirm-dialog-panel {
            animation: confirmDialogIn .28s cubic-bezier(.22,1,.36,1) both;
          }
        `}
            </style>

            <div className="confirm-dialog-backdrop absolute inset-0 bg-black/75 backdrop-blur-[7px]" />

            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby={
                    description
                        ? 'confirm-dialog-description'
                        : undefined
                }
                onMouseDown={(
                    event,
                ) =>
                    event.stopPropagation()
                }
                className="confirm-dialog-panel relative z-10 w-full max-w-[430px] overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#090e19] shadow-[0_35px_100px_rgba(0,0,0,.75)]"
            >
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.025] to-transparent" />

                <button
                    type="button"
                    onClick={
                        onCancel
                    }
                    disabled={
                        loading
                    }
                    className="group absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-xl bg-white/[0.035] text-[var(--muted)] transition-all duration-300 hover:bg-white/[0.07] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Cerrar"
                >
                    <X
                        size={16}
                        className="transition-transform duration-300 group-hover:rotate-90"
                    />
                </button>

                <div className="relative p-5 sm:p-6">
                    <div
                        className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ${colors.icon}`}
                    >
                        {icon ?? (
                            <AlertTriangle
                                size={21}
                            />
                        )}
                    </div>

                    <h2
                        id="confirm-dialog-title"
                        className="mt-5 pr-10 text-[17px] font-bold tracking-[-0.035em] text-[var(--text)] sm:text-lg"
                    >
                        {title}
                    </h2>

                    {description && (
                        <p
                            id="confirm-dialog-description"
                            className="mt-2 text-[10px] leading-[1.7] text-[var(--muted)] sm:text-[11px]"
                        >
                            {
                                description
                            }
                        </p>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            onClick={
                                onCancel
                            }
                            disabled={
                                loading
                            }
                            className="flex h-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 text-[10px] font-semibold text-[var(--text-soft)] transition-all duration-300 hover:bg-white/[0.06] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {
                                cancelLabel
                            }
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void onConfirm()
                            }
                            disabled={
                                loading
                            }
                            className={`flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 ${colors.button}`}
                        >
                            {loading && (
                                <Loader2
                                    size={15}
                                    className="animate-spin"
                                />
                            )}

                            {loading
                                ? 'Procesando...'
                                : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}