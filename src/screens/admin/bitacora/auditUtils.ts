import type {
    AuditRow,
    AuditValue,
} from './auditTypes';

export function formatColumnName(
    value: string,
) {
    return value
        .replace(
            /_/g,
            ' ',
        )
        .replace(
            /\b\w/g,
            (
                letter,
            ) =>
                letter.toUpperCase(),
        );
}

export function isUuid(
    value: string,
) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

export function shortenUuid(
    value: string,
) {
    if (
        !isUuid(
            value,
        )
    ) {
        return value;
    }

    return `${value.slice(
        0,
        8,
    )}…${value.slice(
        -4,
    )}`;
}

export function isDateValue(
    value: string,
) {
    if (
        !value.includes(
            '-',
        )
    ) {
        return false;
    }

    const timestamp =
        Date.parse(
            value,
        );

    return !Number.isNaN(
        timestamp,
    );
}

export function formatDate(
    value: string,
) {
    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        'es-MX',
        {
            day:
                '2-digit',
            month:
                'short',
            year:
                'numeric',
            hour:
                '2-digit',
            minute:
                '2-digit',
            second:
                '2-digit',
        },
    ).format(
        date,
    );
}

export function stringifyAuditValue(
    value: AuditValue,
) {
    if (
        value ===
        null ||
        value ===
        undefined
    ) {
        return '';
    }

    if (
        typeof value ===
        'string'
    ) {
        return value;
    }

    if (
        typeof value ===
        'number' ||
        typeof value ===
        'boolean'
    ) {
        return String(
            value,
        );
    }

    try {
        return JSON.stringify(
            value,
        );
    } catch {
        return String(
            value,
        );
    }
}

export function formatAuditValue(
    value: AuditValue,
) {
    if (
        value ===
        null ||
        value ===
        undefined ||
        value ===
        ''
    ) {
        return '—';
    }

    if (
        typeof value ===
        'boolean'
    ) {
        return value
            ? 'Sí'
            : 'No';
    }

    if (
        typeof value ===
        'number'
    ) {
        return value.toLocaleString(
            'es-MX',
        );
    }

    if (
        typeof value ===
        'string'
    ) {
        if (
            isDateValue(
                value,
            )
        ) {
            return formatDate(
                value,
            );
        }

        if (
            isUuid(
                value,
            )
        ) {
            return shortenUuid(
                value,
            );
        }

        return value;
    }

    try {
        return JSON.stringify(
            value,
            null,
            2,
        );
    } catch {
        return String(
            value,
        );
    }
}

export function getAuditColumns(
    rows: AuditRow[],
) {
    const columns =
        new Set<string>();

    rows.forEach(
        (
            row,
        ) => {
            Object.keys(
                row,
            ).forEach(
                (
                    key,
                ) => {
                    columns.add(
                        key,
                    );
                },
            );
        },
    );

    return [
        ...columns,
    ];
}

export function searchAuditRow(
    row: AuditRow,
    query: string,
) {
    const normalizedQuery =
        query
            .trim()
            .toLocaleLowerCase(
                'es-MX',
            );

    if (
        !normalizedQuery
    ) {
        return true;
    }

    return Object.entries(
        row,
    ).some(
        ([
            key,
            value,
        ]) => {
            const keyMatch =
                key
                    .toLocaleLowerCase(
                        'es-MX',
                    )
                    .includes(
                        normalizedQuery,
                    );

            const valueMatch =
                stringifyAuditValue(
                    value,
                )
                    .toLocaleLowerCase(
                        'es-MX',
                    )
                    .includes(
                        normalizedQuery,
                    );

            return (
                keyMatch ||
                valueMatch
            );
        },
    );
}