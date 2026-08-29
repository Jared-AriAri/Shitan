interface AnimatedBackButtonProps {
    onClick: () => void;
    label?: string;
    className?: string;
}

function ArrowLeftIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M19 12H5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M11 6L5 12L11 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function AnimatedBackButton({
    onClick,
    label = 'Regresar',
    className = '',
}: AnimatedBackButtonProps) {
    return (
        <button
            type="button"
            className={`animated-back-button ${className}`}
            onClick={onClick}
            aria-label={label}
        >
            <span className="animated-back-button-glow" />

            <span className="animated-back-button-icon">
                <ArrowLeftIcon />
            </span>

            <span className="animated-back-button-label">
                {label}
            </span>
        </button>
    );
}