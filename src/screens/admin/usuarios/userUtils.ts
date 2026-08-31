import type {
    UserRole,
} from './userTypes';

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

export function formatShortDate(
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
        },
    ).format(date);
}

export function formatRole(
    role: UserRole,
) {
    if (
        role ===
        'adminmaster'
    ) {
        return 'Administrador principal';
    }

    if (
        role ===
        'admin'
    ) {
        return 'Administrador';
    }

    return 'Donante';
}

export function roleClass(
    role: UserRole,
) {
    if (
        role ===
        'adminmaster'
    ) {
        return 'border-amber-300/15 bg-amber-300/10 text-amber-200';
    }

    if (
        role ===
        'admin'
    ) {
        return 'border-violet-400/15 bg-violet-400/10 text-violet-300';
    }

    return 'border-cyan-300/15 bg-cyan-300/10 text-cyan-300';
}

export function statusClass(
    active: boolean,
) {
    return active
        ? 'border-emerald-400/15 bg-emerald-400/10 text-emerald-300'
        : 'border-rose-400/15 bg-rose-400/10 text-rose-300';
}

export function getUserName(
    name: string | null,
    alias: string | null,
    email: string | null,
) {
    return (
        name?.trim() ||
        alias?.trim() ||
        email?.split('@')[0] ||
        'Usuario'
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
        return 'U';
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

export function normalizeRole(
    value: string | null | undefined,
): UserRole {
    if (
        value ===
        'adminmaster'
    ) {
        return 'adminmaster';
    }

    if (
        value ===
        'admin'
    ) {
        return 'admin';
    }

    return 'donante';
}