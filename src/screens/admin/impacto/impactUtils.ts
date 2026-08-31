import {
    supabase,
} from '../../../lib/supabase';

import type {
    ImpactProfile,
} from './impactTypes';

export const IMPACT_FILES_BUCKET =
    'evidencias-impacto';

export function formatCurrency(
    value: number,
) {
    return new Intl.NumberFormat(
        'es-MX',
        {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 2,
        },
    ).format(
        value,
    );
}

export function formatShortDate(
    value:
        | string
        | null
        | undefined,
) {
    if (!value) {
        return '—';
    }

    const date =
        new Date(
            value,
        );

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
    ).format(
        date,
    );
}

export function getProfileName(
    profile:
        | ImpactProfile
        | null
        | undefined,
) {
    return (
        profile?.nombre_completo
            ?.trim() ||
        profile?.alias
            ?.trim() ||
        profile?.correo
            ?.trim() ||
        'Shitan Trust'
    );
}

export function getInitials(
    value: string,
) {
    const parts =
        value
            .trim()
            .split(
                /\s+/,
            )
            .filter(
                Boolean,
            );

    if (
        !parts.length
    ) {
        return 'ST';
    }

    if (
        parts.length ===
        1
    ) {
        return parts[0]
            .slice(
                0,
                2,
            )
            .toUpperCase();
    }

    return `${parts[0][0]}${parts[
        parts.length - 1
    ][0]}`.toUpperCase();
}

export function getStorageUrl(
    path:
        | string
        | null
        | undefined,
) {
    if (!path) {
        return null;
    }

    if (
        path.startsWith(
            'http://',
        ) ||
        path.startsWith(
            'https://',
        )
    ) {
        return path;
    }

    return (
        supabase.storage
            .from(
                IMPACT_FILES_BUCKET,
            )
            .getPublicUrl(
                path,
            )
            .data
            .publicUrl ||
        null
    );
}

export function verificationClass(
    verified: boolean,
) {
    return verified
        ? 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300'
        : 'border-amber-300/15 bg-amber-300/[0.07] text-amber-200';
}

export function visibilityClass(
    visible: boolean,
) {
    return visible
        ? 'border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-300'
        : 'border-white/[0.07] bg-white/[0.035] text-[var(--muted)]';
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

export function formatEvidenceType(
    tipo: string | null | undefined,
) {
    if (!tipo) {
        return 'Archivo';
    }

    const t = tipo.toLowerCase();
    
    if (
        t.includes('foto') ||
        t.includes('imagen') ||
        t.includes('image')
    ) {
        return 'Imagen';
    }

    if (
        t.includes('pdf') ||
        t.includes('document')
    ) {
        return 'Documento';
    }

    return 'Archivo';
}
