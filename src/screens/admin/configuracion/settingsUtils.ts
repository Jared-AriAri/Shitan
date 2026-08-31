import type {
    SettingsUpdater,
} from './settingsTypes';

export function formatDate(
    value: string | null | undefined,
) {
    if (!value) {
        return '—';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return '—';
    }

    return new Intl.DateTimeFormat(
        'es-MX',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        },
    ).format(date);
}

export function getUpdaterName(
    profile:
        | SettingsUpdater
        | null
        | undefined,
) {
    return (
        profile
            ?.nombre_completo
            ?.trim() ||
        profile
            ?.alias
            ?.trim() ||
        profile
            ?.correo
            ?.split('@')[0] ||
        'Administrador'
    );
}

export function getInitials(
    value: string,
) {
    const parts =
        value
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return 'ST';
    }

    if (
        parts.length === 1
    ) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function cleanText(
    value: string,
) {
    const clean =
        value.trim();

    return clean ||
        null;
}

export function maskClabe(
    value: string | null | undefined,
) {
    if (!value) {
        return 'Sin configurar';
    }

    const clean =
        value.replace(
            /\D/g,
            '',
        );

    if (
        clean.length !==
        18
    ) {
        return value;
    }

    return `${clean.slice(
        0,
        3,
    )} ${clean.slice(
        3,
        6,
    )} ${clean.slice(
        6,
        17,
    )} ${clean.slice(
        17,
    )}`;
}