import {
    FormEvent,
    useEffect,
    useState,
} from 'react';

import { supabase } from '../../lib/supabase';
import AnimatedBackButton from '../common/AnimatedBackButton';

type AuthMode = 'login' | 'register';

type FieldName =
    | 'nombreCompleto'
    | 'email'
    | 'confirmEmail'
    | 'password'
    | 'confirmPassword';

interface AuthModalProps {
    open: boolean;
    onClose: () => void;
    onAuthenticated?: () => void;
    initialMode?: AuthMode;
}

const initialTouched: Record<
    FieldName,
    boolean
> = {
    nombreCompleto: false,
    email: false,
    confirmEmail: false,
    password: false,
    confirmPassword: false,
};

function MailIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <rect
                x="3.5"
                y="5"
                width="17"
                height="14"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.6"
            />

            <path
                d="M5 7L12 12.5L19 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.6"
            />

            <path
                d="M8 10V7.5C8 5.01 9.79 3 12 3C14.21 3 16 5.01 16 7.5V10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="8"
                r="4"
                stroke="currentColor"
                strokeWidth="1.6"
            />

            <path
                d="M4.5 20C5.2 16.7 8 14.5 12 14.5C16 14.5 18.8 16.7 19.5 20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function PhoneIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M8.1 3.8L10 7.8C10.3 8.4 10.1 9.1 9.6 9.5L8.3 10.5C9.4 12.8 11.2 14.6 13.5 15.7L14.5 14.4C14.9 13.9 15.6 13.7 16.2 14L20.2 15.9C20.8 16.2 21.1 16.8 21 17.4C20.6 19.5 18.8 21 16.6 21C9.1 21 3 14.9 3 7.4C3 5.2 4.5 3.4 6.6 3C7.2 2.9 7.8 3.2 8.1 3.8Z"
                stroke="currentColor"
                strokeWidth="1.55"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function EyeIcon({
    open,
}: {
    open: boolean;
}) {
    if (open) {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M3 12C5.2 8.2 8.2 6.2 12 6.2C15.8 6.2 18.8 8.2 21 12C18.8 15.8 15.8 17.8 12 17.8C8.2 17.8 5.2 15.8 3 12Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                />

                <circle
                    cx="12"
                    cy="12"
                    r="2.7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                />
            </svg>
        );
    }

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M4 4L20 20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />

            <path
                d="M10.7 6.4C11.1 6.3 11.5 6.2 12 6.2C15.8 6.2 18.8 8.2 21 12C20.3 13.2 19.5 14.2 18.6 15.1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />

            <path
                d="M15.1 17.1C14.2 17.6 13.2 17.8 12 17.8C8.2 17.8 5.2 15.8 3 12C4 10.3 5.1 9 6.4 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M12 3L19 6V11C19 15.5 16.3 19 12 21C7.7 19 5 15.5 5 11V6L12 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <path
                d="M9 12L11 14L15.5 9.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M5 12.5L9.2 16.5L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="12"
                r="8.5"
                stroke="currentColor"
                strokeWidth="1.7"
            />

            <path
                d="M12 7.5V12.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />

            <circle
                cx="12"
                cy="16.2"
                r="1"
                fill="currentColor"
            />
        </svg>
    );
}

export default function AuthModal({
    open,
    onClose,
    onAuthenticated,
    initialMode = 'login',
}: AuthModalProps) {
    const [mode, setMode] =
        useState<AuthMode>(initialMode);

    const [
        nombreCompleto,
        setNombreCompleto,
    ] = useState('');

    const [alias, setAlias] =
        useState('');

    const [telefono, setTelefono] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [confirmEmail, setConfirmEmail] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState('');

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [touched, setTouched] =
        useState<
            Record<FieldName, boolean>
        >(initialTouched);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [
        awaitingConfirmation,
        setAwaitingConfirmation,
    ] = useState(false);

    const [
        confirmationEmail,
        setConfirmationEmail,
    ] = useState('');

    const isLogin =
        mode === 'login';

    const cleanEmail =
        email.trim().toLowerCase();

    const cleanConfirmEmail =
        confirmEmail.trim().toLowerCase();

    const cleanName =
        nombreCompleto.trim();

    const emailValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            cleanEmail,
        );

    const confirmEmailValid =
        cleanConfirmEmail.length > 0 &&
        emailValid &&
        cleanConfirmEmail === cleanEmail;

    const nameValid =
        cleanName.length > 0;

    const loginPasswordValid =
        password.length > 0;

    const registerPasswordValid =
        password.length >= 8;

    const confirmPasswordValid =
        confirmPassword.length > 0 &&
        password === confirmPassword;

    const loginFormValid =
        emailValid &&
        loginPasswordValid;

    const registerFormValid =
        nameValid &&
        emailValid &&
        confirmEmailValid &&
        registerPasswordValid &&
        confirmPasswordValid;

    const formValid =
        isLogin
            ? loginFormValid
            : registerFormValid;

    const resetMessages = () => {
        setError('');
        setSuccess('');
    };

    const resetValidation = () => {
        setTouched({
            ...initialTouched,
        });
    };

    const changeMode = (
        nextMode: AuthMode,
    ) => {
        resetMessages();
        resetValidation();
        setConfirmEmail('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setAwaitingConfirmation(false);
        setConfirmationEmail('');
        setMode(nextMode);
    };

    const handleBack = () => {
        resetMessages();

        if (awaitingConfirmation) {
            changeMode('login');
            return;
        }

        if (mode === 'register') {
            changeMode('login');
            return;
        }

        onClose();
    };

    const markTouched = (
        field: FieldName,
    ) => {
        setTouched((current) => ({
            ...current,
            [field]: true,
        }));
    };

    const clearServerMessage = () => {
        if (error) {
            setError('');
        }

        if (success) {
            setSuccess('');
        }
    };

    const getFieldClass = (
        valid: boolean,
        field: FieldName,
        hasValue: boolean,
    ) => {
        if (
            touched[field] &&
            !valid
        ) {
            return 'auth-input-shell auth-input-shell-invalid';
        }

        if (
            hasValue &&
            valid
        ) {
            return 'auth-input-shell auth-input-shell-valid';
        }

        return 'auth-input-shell';
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
            if (event.key !== 'Escape') {
                return;
            }

            if (mode === 'register') {
                changeMode('login');
                return;
            }

            onClose();
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
        mode,
        onClose,
    ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setMode(initialMode);
        setAwaitingConfirmation(false);
        setConfirmationEmail('');
        resetMessages();
        resetValidation();
    }, [
        open,
        initialMode,
    ]);

    const handleLogin = async () => {
        if (!emailValid) {
            throw new Error(
                'Ingresa un correo electrónico válido.',
            );
        }

        if (!password) {
            throw new Error(
                'Ingresa tu contraseña.',
            );
        }

        const {
            data,
            error: signInError,
        } =
            await supabase.auth
                .signInWithPassword({
                    email: cleanEmail,
                    password,
                });

        if (signInError) {
            throw signInError;
        }

        if (!data.session) {
            throw new Error(
                'No fue posible iniciar la sesión.',
            );
        }

        onAuthenticated?.();
        onClose();
    };

    const handleRegister =
        async () => {
            if (!cleanName) {
                throw new Error(
                    'Ingresa tu nombre completo.',
                );
            }

            if (!emailValid) {
                throw new Error(
                    'Ingresa un correo electrónico válido.',
                );
            }

            if (!confirmEmailValid) {
                throw new Error(
                    'Los correos electrónicos no coinciden.',
                );
            }

            if (
                password.length < 8
            ) {
                throw new Error(
                    'La contraseña debe tener al menos 8 caracteres.',
                );
            }

            if (
                password !==
                confirmPassword
            ) {
                throw new Error(
                    'Las contraseñas no coinciden.',
                );
            }

            const {
                data,
                error: signUpError,
            } =
                await supabase.auth.signUp({
                    email: cleanEmail,
                    password,
                    options: {
                        data: {
                            nombre_completo:
                                cleanName,
                            alias:
                                alias.trim() ||
                                null,
                            telefono:
                                telefono.trim() ||
                                null,
                        },
                    },
                });

            if (signUpError) {
                throw signUpError;
            }

            if (data.session) {
                onAuthenticated?.();
                onClose();
                return;
            }

            setConfirmationEmail(
                cleanEmail,
            );
            setAwaitingConfirmation(
                true,
            );
            resetMessages();
        };

    const handleSubmit = async (
        event:
            FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        if (!formValid) {
            setTouched({
                nombreCompleto:
                    !isLogin,
                email: true,
                confirmEmail:
                    !isLogin,
                password: true,
                confirmPassword:
                    !isLogin,
            });

            return;
        }

        resetMessages();
        setLoading(true);

        try {
            if (mode === 'login') {
                await handleLogin();
            } else {
                await handleRegister();
            }
        } catch (submitError) {
            if (
                submitError
                instanceof Error
            ) {
                setError(
                    translateAuthError(
                        submitError.message,
                    ),
                );
            } else {
                setError(
                    'Ocurrió un error inesperado.',
                );
            }
        } finally {
            setLoading(false);
        }
    };

    if (!open) {
        return null;
    }

    const emailError =
        touched.email &&
        !emailValid;

    const confirmEmailError =
        !isLogin &&
        touched.confirmEmail &&
        !confirmEmailValid;

    const nameError =
        touched.nombreCompleto &&
        !nameValid;

    const passwordValid =
        isLogin
            ? loginPasswordValid
            : registerPasswordValid;

    const passwordError =
        touched.password &&
        !passwordValid;

    const confirmError =
        !isLogin &&
        touched.confirmPassword &&
        !confirmPasswordValid;

    return (
        <>
            <div
                className="auth-modal-layer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
            >
                <button
                    type="button"
                    className="auth-modal-backdrop"
                    onClick={onClose}
                    aria-label="Cerrar"
                />

                <section
                    className={`auth-modal auth-modal-${mode}`}
                >
                    <div className="auth-modal-ambient auth-modal-ambient-one" />
                    <div className="auth-modal-ambient auth-modal-ambient-two" />

                    <div className="auth-modal-top">
                        <AnimatedBackButton
                            onClick={handleBack}
                            label={
                                awaitingConfirmation
                                    ? 'Iniciar sesión'
                                    : isLogin
                                        ? 'Regresar'
                                        : 'Iniciar sesión'
                            }
                        />

                        <button
                            type="button"
                            className="auth-modal-close"
                            onClick={onClose}
                            aria-label="Cerrar"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="auth-modal-brand">
                        <div className="auth-modal-logo-wrap">
                            <img
                                src="/logo.png"
                                alt="Shitan Trust"
                                className="auth-modal-logo"
                            />
                        </div>

                        <div className="auth-modal-brand-copy">
                            <span className="auth-modal-brand-name">
                                Shitan Trust
                            </span>

                            <span className="auth-modal-brand-subtitle">
                                United for Good
                            </span>
                        </div>
                    </div>

                    <div
                        key={`${mode}-${awaitingConfirmation ? 'confirm' : 'form'}`}
                        className="auth-modal-content"
                    >
                        {awaitingConfirmation ? (
                            <div className="auth-confirmation">
                                <div className="auth-confirmation-icon">
                                    <MailIcon />
                                </div>

                                <div className="auth-modal-heading">
                                    <span className="auth-modal-eyebrow">
                                        Cuenta creada
                                    </span>

                                    <h2
                                        id="auth-modal-title"
                                        className="auth-modal-title"
                                    >
                                        Confirma tu correo
                                    </h2>

                                    <p className="auth-modal-description">
                                        Te enviamos un enlace de confirmación a tu correo electrónico.
                                    </p>
                                </div>

                                <div className="auth-confirmation-email">
                                    {confirmationEmail}
                                </div>

                                <div className="auth-confirmation-notice">
                                    <AlertIcon />

                                    <span>
                                        Revisa tu bandeja de entrada. Si no encuentras el correo, revisa también Spam, Correo no deseado o Promociones.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="auth-submit auth-submit-ready"
                                    onClick={() =>
                                        changeMode(
                                            'login',
                                        )
                                    }
                                >
                                    <span className="auth-submit-glow" />
                                    <span>
                                        Ya confirmé mi correo
                                    </span>
                                </button>

                                <p className="auth-confirmation-help">
                                    Después de confirmar tu correo, vuelve aquí e inicia sesión con tu cuenta.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="auth-modal-heading">
                                    <span className="auth-modal-eyebrow">
                                        {isLogin
                                            ? 'Bienvenido de nuevo'
                                            : 'Únete a la comunidad'}
                                    </span>

                                    <h2
                                        id="auth-modal-title"
                                        className="auth-modal-title"
                                    >
                                        {isLogin
                                            ? 'Iniciar sesión'
                                            : 'Crear cuenta'}
                                    </h2>

                                    <p className="auth-modal-description">
                                        {isLogin
                                            ? 'Accede a tus aportaciones, causas y actividad dentro de Shitan Trust.'
                                            : 'Crea tu cuenta para aportar, consultar tu historial y seguir el impacto de cada causa.'}
                                    </p>
                                </div>

                                <form
                                    className="auth-form"
                                    onSubmit={handleSubmit}
                                    noValidate
                                >
                                    {!isLogin && (
                                        <div className="auth-register-fields">
                                            <label className="auth-field">
                                                <span className="auth-field-label-row">
                                                    <span className="auth-field-label">
                                                        Nombre completo
                                                    </span>

                                                    <span className="auth-required-label">
                                                        Obligatorio
                                                    </span>
                                                </span>

                                                <span
                                                    className={getFieldClass(
                                                        nameValid,
                                                        'nombreCompleto',
                                                        cleanName.length >
                                                        0,
                                                    )}
                                                >
                                                    <span className="auth-input-icon">
                                                        <UserIcon />
                                                    </span>

                                                    <input
                                                        type="text"
                                                        value={
                                                            nombreCompleto
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            setNombreCompleto(
                                                                event.target
                                                                    .value,
                                                            );
                                                            clearServerMessage();
                                                        }}
                                                        onBlur={() =>
                                                            markTouched(
                                                                'nombreCompleto',
                                                            )
                                                        }
                                                        autoComplete="name"
                                                        placeholder="Tu nombre completo"
                                                        className="auth-input"
                                                        disabled={loading}
                                                        aria-invalid={
                                                            nameError
                                                        }
                                                    />

                                                    {cleanName.length >
                                                        0 && (
                                                            <span
                                                                className={`auth-validation-icon ${nameValid
                                                                    ? 'auth-validation-success'
                                                                    : 'auth-validation-error'
                                                                    }`}
                                                            >
                                                                {nameValid ? (
                                                                    <CheckIcon />
                                                                ) : (
                                                                    <AlertIcon />
                                                                )}
                                                            </span>
                                                        )}
                                                </span>

                                                {nameError && (
                                                    <span className="auth-field-feedback auth-field-feedback-error">
                                                        <AlertIcon />
                                                        Ingresa tu nombre
                                                        completo.
                                                    </span>
                                                )}
                                            </label>

                                            <div className="auth-form-grid">
                                                <label className="auth-field">
                                                    <span className="auth-field-label-row">
                                                        <span className="auth-field-label">
                                                            Alias
                                                        </span>

                                                        <span className="auth-optional-label">
                                                            Opcional
                                                        </span>
                                                    </span>

                                                    <span className="auth-input-shell">
                                                        <span className="auth-input-icon">
                                                            <UserIcon />
                                                        </span>

                                                        <input
                                                            type="text"
                                                            value={alias}
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                setAlias(
                                                                    event.target
                                                                        .value,
                                                                );
                                                                clearServerMessage();
                                                            }}
                                                            autoComplete="nickname"
                                                            placeholder="Opcional"
                                                            className="auth-input"
                                                            disabled={loading}
                                                        />
                                                    </span>
                                                </label>

                                                <label className="auth-field">
                                                    <span className="auth-field-label-row">
                                                        <span className="auth-field-label">
                                                            Teléfono
                                                        </span>

                                                        <span className="auth-optional-label">
                                                            Opcional
                                                        </span>
                                                    </span>

                                                    <span className="auth-input-shell">
                                                        <span className="auth-input-icon">
                                                            <PhoneIcon />
                                                        </span>

                                                        <input
                                                            type="tel"
                                                            value={telefono}
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                setTelefono(
                                                                    event.target.value
                                                                        .replace(/\D/g, '')
                                                                        .slice(0, 10),
                                                                );
                                                                clearServerMessage();
                                                            }}
                                                            autoComplete="tel"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={10}
                                                            placeholder="10 dígitos"
                                                            className="auth-input"
                                                            disabled={loading}
                                                        />
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <label className="auth-field">
                                        <span className="auth-field-label-row">
                                            <span className="auth-field-label">
                                                Correo electrónico
                                            </span>

                                            <span className="auth-required-label">
                                                Obligatorio
                                            </span>
                                        </span>

                                        <span
                                            className={getFieldClass(
                                                emailValid,
                                                'email',
                                                cleanEmail.length >
                                                0,
                                            )}
                                        >
                                            <span className="auth-input-icon">
                                                <MailIcon />
                                            </span>

                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(
                                                    event,
                                                ) => {
                                                    setEmail(
                                                        event.target
                                                            .value,
                                                    );
                                                    clearServerMessage();
                                                }}
                                                onBlur={() =>
                                                    markTouched(
                                                        'email',
                                                    )
                                                }
                                                autoComplete="email"
                                                inputMode="email"
                                                placeholder="correo@ejemplo.com"
                                                className="auth-input"
                                                disabled={loading}
                                                aria-invalid={
                                                    emailError
                                                }
                                            />

                                            {cleanEmail.length >
                                                0 && (
                                                    <span
                                                        className={`auth-validation-icon ${emailValid
                                                            ? 'auth-validation-success'
                                                            : 'auth-validation-error'
                                                            }`}
                                                    >
                                                        {emailValid ? (
                                                            <CheckIcon />
                                                        ) : (
                                                            <AlertIcon />
                                                        )}
                                                    </span>
                                                )}
                                        </span>

                                        {emailError && (
                                            <span className="auth-field-feedback auth-field-feedback-error">
                                                <AlertIcon />

                                                {cleanEmail
                                                    ? 'Ingresa un correo electrónico válido.'
                                                    : 'El correo electrónico es obligatorio.'}
                                            </span>
                                        )}
                                    </label>

                                    {!isLogin && (
                                        <label className="auth-field">
                                            <span className="auth-field-label-row">
                                                <span className="auth-field-label">
                                                    Confirmar correo electrónico
                                                </span>

                                                <span className="auth-required-label">
                                                    Obligatorio
                                                </span>
                                            </span>

                                            <span
                                                className={getFieldClass(
                                                    confirmEmailValid,
                                                    'confirmEmail',
                                                    cleanConfirmEmail.length > 0,
                                                )}
                                            >
                                                <span className="auth-input-icon">
                                                    <MailIcon />
                                                </span>

                                                <input
                                                    type="email"
                                                    value={confirmEmail}
                                                    onChange={(event) => {
                                                        setConfirmEmail(
                                                            event.target.value,
                                                        );
                                                        clearServerMessage();
                                                    }}
                                                    onBlur={() =>
                                                        markTouched(
                                                            'confirmEmail',
                                                        )
                                                    }
                                                    autoComplete="email"
                                                    inputMode="email"
                                                    placeholder="Repite tu correo"
                                                    className="auth-input"
                                                    disabled={loading}
                                                    aria-invalid={
                                                        confirmEmailError
                                                    }
                                                />

                                                {cleanConfirmEmail.length > 0 && (
                                                    <span
                                                        className={`auth-validation-icon ${confirmEmailValid
                                                            ? 'auth-validation-success'
                                                            : 'auth-validation-error'
                                                            }`}
                                                    >
                                                        {confirmEmailValid ? (
                                                            <CheckIcon />
                                                        ) : (
                                                            <AlertIcon />
                                                        )}
                                                    </span>
                                                )}
                                            </span>

                                            {confirmEmailError && (
                                                <span className="auth-field-feedback auth-field-feedback-error">
                                                    <AlertIcon />

                                                    {cleanConfirmEmail
                                                        ? 'Los correos electrónicos no coinciden.'
                                                        : 'Confirma tu correo electrónico.'}
                                                </span>
                                            )}

                                            {confirmEmailValid && (
                                                <span className="auth-field-feedback auth-field-feedback-success">
                                                    <CheckIcon />
                                                    Los correos electrónicos coinciden.
                                                </span>
                                            )}
                                        </label>
                                    )}

                                    <label className="auth-field">
                                        <span className="auth-field-label-row">
                                            <span className="auth-field-label">
                                                Contraseña
                                            </span>

                                            <span className="auth-required-label">
                                                Obligatorio
                                            </span>
                                        </span>

                                        <span
                                            className={getFieldClass(
                                                passwordValid,
                                                'password',
                                                password.length > 0,
                                            )}
                                        >
                                            <span className="auth-input-icon">
                                                <LockIcon />
                                            </span>

                                            <input
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={password}
                                                onChange={(
                                                    event,
                                                ) => {
                                                    setPassword(
                                                        event.target
                                                            .value,
                                                    );
                                                    clearServerMessage();
                                                }}
                                                onBlur={() =>
                                                    markTouched(
                                                        'password',
                                                    )
                                                }
                                                autoComplete={
                                                    isLogin
                                                        ? 'current-password'
                                                        : 'new-password'
                                                }
                                                placeholder={
                                                    isLogin
                                                        ? 'Tu contraseña'
                                                        : 'Mínimo 8 caracteres'
                                                }
                                                className="auth-input auth-input-password"
                                                disabled={loading}
                                                aria-invalid={
                                                    passwordError
                                                }
                                            />

                                            <button
                                                type="button"
                                                className="auth-password-toggle"
                                                onClick={() =>
                                                    setShowPassword(
                                                        (value) =>
                                                            !value,
                                                    )
                                                }
                                                aria-label={
                                                    showPassword
                                                        ? 'Ocultar contraseña'
                                                        : 'Mostrar contraseña'
                                                }
                                            >
                                                <EyeIcon
                                                    open={
                                                        showPassword
                                                    }
                                                />
                                            </button>
                                        </span>

                                        {!isLogin &&
                                            password.length >
                                            0 && (
                                                <span
                                                    className={`auth-field-feedback ${registerPasswordValid
                                                        ? 'auth-field-feedback-success'
                                                        : passwordError
                                                            ? 'auth-field-feedback-error'
                                                            : 'auth-field-feedback-neutral'
                                                        }`}
                                                >
                                                    {registerPasswordValid ? (
                                                        <CheckIcon />
                                                    ) : (
                                                        <AlertIcon />
                                                    )}

                                                    {registerPasswordValid
                                                        ? 'La contraseña cumple el mínimo de 8 caracteres.'
                                                        : `${password.length}/8 caracteres`}
                                                </span>
                                            )}

                                        {isLogin &&
                                            passwordError && (
                                                <span className="auth-field-feedback auth-field-feedback-error">
                                                    <AlertIcon />
                                                    La contraseña es
                                                    obligatoria.
                                                </span>
                                            )}

                                        {!isLogin &&
                                            passwordError &&
                                            password.length ===
                                            0 && (
                                                <span className="auth-field-feedback auth-field-feedback-error">
                                                    <AlertIcon />
                                                    Crea una contraseña
                                                    de al menos 8
                                                    caracteres.
                                                </span>
                                            )}
                                    </label>

                                    {!isLogin && (
                                        <label className="auth-field">
                                            <span className="auth-field-label-row">
                                                <span className="auth-field-label">
                                                    Confirmar contraseña
                                                </span>

                                                <span className="auth-required-label">
                                                    Obligatorio
                                                </span>
                                            </span>

                                            <span
                                                className={getFieldClass(
                                                    confirmPasswordValid,
                                                    'confirmPassword',
                                                    confirmPassword.length >
                                                    0,
                                                )}
                                            >
                                                <span className="auth-input-icon">
                                                    <LockIcon />
                                                </span>

                                                <input
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={
                                                        confirmPassword
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) => {
                                                        setConfirmPassword(
                                                            event.target
                                                                .value,
                                                        );
                                                        clearServerMessage();
                                                    }}
                                                    onBlur={() =>
                                                        markTouched(
                                                            'confirmPassword',
                                                        )
                                                    }
                                                    autoComplete="new-password"
                                                    placeholder="Repite tu contraseña"
                                                    className="auth-input auth-input-password"
                                                    disabled={loading}
                                                    aria-invalid={
                                                        confirmError
                                                    }
                                                />

                                                {confirmPassword.length >
                                                    0 && (
                                                        <span
                                                            className={`auth-validation-icon auth-validation-icon-password ${confirmPasswordValid
                                                                ? 'auth-validation-success'
                                                                : 'auth-validation-error'
                                                                }`}
                                                        >
                                                            {confirmPasswordValid ? (
                                                                <CheckIcon />
                                                            ) : (
                                                                <AlertIcon />
                                                            )}
                                                        </span>
                                                    )}
                                            </span>

                                            {confirmError && (
                                                <span className="auth-field-feedback auth-field-feedback-error">
                                                    <AlertIcon />

                                                    {confirmPassword
                                                        ? 'Las contraseñas no coinciden.'
                                                        : 'Confirma tu contraseña.'}
                                                </span>
                                            )}

                                            {confirmPasswordValid && (
                                                <span className="auth-field-feedback auth-field-feedback-success">
                                                    <CheckIcon />
                                                    Las contraseñas
                                                    coinciden.
                                                </span>
                                            )}
                                        </label>
                                    )}

                                    {error && (
                                        <div
                                            className="auth-message auth-message-error"
                                            role="alert"
                                        >
                                            {error}
                                        </div>
                                    )}

                                    {success && (
                                        <div
                                            className="auth-message auth-message-success"
                                            role="status"
                                        >
                                            {success}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className={`auth-submit ${formValid
                                            ? 'auth-submit-ready'
                                            : 'auth-submit-disabled'
                                            }`}
                                        disabled={
                                            loading ||
                                            !formValid
                                        }
                                    >
                                        <span className="auth-submit-glow" />

                                        {loading ? (
                                            <>
                                                <span className="auth-spinner" />

                                                <span>
                                                    Procesando
                                                </span>
                                            </>
                                        ) : (
                                            <span>
                                                {isLogin
                                                    ? formValid
                                                        ? 'Entrar a Shitan Trust'
                                                        : 'Completa los campos'
                                                    : formValid
                                                        ? 'Crear mi cuenta'
                                                        : 'Completa los campos'}
                                            </span>
                                        )}
                                    </button>
                                </form>

                                <div className="auth-security">
                                    <span className="auth-security-icon">
                                        <ShieldIcon />
                                    </span>

                                    <span>
                                        Acceso protegido y sesión
                                        gestionada mediante
                                        Supabase Auth
                                    </span>
                                </div>

                                <div className="auth-switch">
                                    <span>
                                        {isLogin
                                            ? '¿Aún no tienes cuenta?'
                                            : '¿Ya tienes una cuenta?'}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeMode(
                                                isLogin
                                                    ? 'register'
                                                    : 'login',
                                            )
                                        }
                                        disabled={loading}
                                    >
                                        {isLogin
                                            ? 'Crear cuenta'
                                            : 'Iniciar sesión'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

function translateAuthError(
    message: string,
) {
    const normalized =
        message.toLowerCase();

    if (
        normalized.includes(
            'invalid login credentials',
        )
    ) {
        return 'Correo o contraseña incorrectos.';
    }

    if (
        normalized.includes(
            'email not confirmed',
        )
    ) {
        return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
    }

    if (
        normalized.includes(
            'user already registered',
        )
    ) {
        return 'Ya existe una cuenta registrada con este correo.';
    }

    if (
        normalized.includes(
            'password should be',
        )
    ) {
        return 'La contraseña no cumple con los requisitos de seguridad.';
    }

    if (
        normalized.includes(
            'rate limit',
        )
    ) {
        return 'Se realizaron demasiados intentos. Inténtalo nuevamente en unos minutos.';
    }

    return message;
}