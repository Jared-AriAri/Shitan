import type {
    ContributionStatus,
    ContributionType,
} from './contributionTypes';

export function formatCurrency(
    value: number | null | undefined,
) {
    if (
        value === null ||
        value === undefined
    ) {
        return '—';
    }

    return new Intl.NumberFormat(
        'es-MX',
        {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        },
    ).format(value);
}

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

export function formatContributionType(
    type: ContributionType,
) {
    if (
        type ===
        'especie'
    ) {
        return 'En especie';
    }

    return 'Económica';
}

export function formatContributionStatus(
    status: ContributionStatus,
) {
    if (
        status ===
        'aprobada'
    ) {
        return 'Aprobada';
    }

    if (
        status ===
        'rechazada'
    ) {
        return 'Rechazada';
    }

    if (
        status ===
        'cancelado'
    ) {
        return 'Cancelada';
    }

    return 'Pendiente';
}

export function contributionStatusClass(
    status: ContributionStatus,
) {
    if (
        status ===
        'aprobada'
    ) {
        return 'border-emerald-400/15 bg-emerald-400/10 text-emerald-300';
    }

    if (
        status ===
        'rechazada'
    ) {
        return 'border-rose-400/15 bg-rose-400/10 text-rose-300';
    }

    if (
        status ===
        'cancelado'
    ) {
        return 'border-slate-400/15 bg-slate-400/10 text-slate-300';
    }

    return 'border-amber-300/15 bg-amber-300/10 text-amber-200';
}

export function getDonorName(
    anonymous: boolean,
    name: string | null,
    alias: string | null,
    email: string | null,
) {
    if (anonymous) {
        return 'Donante anónimo';
    }

    return (
        name?.trim() ||
        alias?.trim() ||
        email?.split('@')[0] ||
        'Donante'
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
        return 'D';
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

export function formatFolio(
    folio: number | string | null | undefined,
) {
    if (
        folio === null ||
        folio === undefined
    ) {
        return '—';
    }

    return `#${String(folio).padStart(
        6,
        '0',
    )}`;
}

export function formatReference(
    value: string | null | undefined,
) {
    const reference =
        value?.trim();

    if (!reference) {
        return 'Sin referencia';
    }

    return reference;
}

export function formatDonorAlias(
    value: string | null | undefined,
) {
    const alias =
        value?.trim();

    if (!alias) {
        return '';
    }

    return alias.startsWith('@')
        ? alias
        : `@${alias}`;
}

export function formatPhone(
    value: string | null | undefined,
) {
    const phone =
        value?.trim();

    return phone || '—';
}

export function formatEmail(
    value: string | null | undefined,
) {
    const email =
        value?.trim();

    return email || '—';
}

export function formatMessage(
    value: string | null | undefined,
) {
    const message =
        value?.trim();

    return message || 'Sin mensaje';
}

export function formatRejectionReason(
    value: string | null | undefined,
) {
    const reason =
        value?.trim();

    return reason || 'Sin motivo especificado';
}

export function hasTransferReference(
    value: string | null | undefined,
) {
    return Boolean(
        value?.trim(),
    );
}

export function isPendingContribution(
    status: ContributionStatus,
) {
    return (
        status ===
        'pendiente'
    );
}

export function isConfirmedContribution(
    status: ContributionStatus,
) {
    return (
        status ===
        'aprobada'
    );
}

export function isRejectedContribution(
    status: ContributionStatus,
) {
    return (
        status ===
        'rechazada'
    );
}

export function isCancelledContribution(
    status: ContributionStatus,
) {
    return (
        status ===
        'cancelado'
    );
}

export function normalizeContributionStatus(
    value: string | null | undefined,
): ContributionStatus {
    if (
        value ===
        'aprobada'
    ) {
        return 'aprobada';
    }

    if (
        value ===
        'rechazada'
    ) {
        return 'rechazada';
    }

    if (
        value ===
        'cancelado'
    ) {
        return 'cancelado';
    }

    return 'pendiente';
}

export function normalizeContributionType(
    value: string | null | undefined,
): ContributionType {
    if (
        value ===
        'especie'
    ) {
        return 'especie';
    }

    return 'economica';
}

export function getContributionAmountLabel(
    type: ContributionType,
    amount: number | null | undefined,
    itemCount = 0,
) {
    if (
        type ===
        'especie'
    ) {
        return `${itemCount} ${itemCount === 1
                ? 'producto'
                : 'productos'
            }`;
    }

    return formatCurrency(
        amount,
    );
}