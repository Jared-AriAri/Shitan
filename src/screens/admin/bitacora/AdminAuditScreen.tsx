import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clipboard,
    FileClock,
    FileSearch,
    Fingerprint,
    History,
    Loader2,
    RefreshCw,
    Search,
    ShieldCheck,
    UserRound,
} from 'lucide-react';

import {
    supabase,
} from '../../../lib/supabase';

type AuditValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | Record<string, unknown>
    | unknown[];

interface AuditRow {
    [key: string]: AuditValue;
}

interface AuditProfile {
    id: string;
    correo: string | null;
    nombre_completo: string | null;
    alias: string | null;
    avatar_url: string | null;
}

interface AdminAuditScreenProps {
    showToast: (
        message: string,
        type?:
            | 'success'
            | 'error'
            | 'info'
            | 'warning',
    ) => void;
    refreshKey?: number;
}

const COLUMN_TRANSLATIONS:
    Record<
        string,
        string
    > = {
    accion:
        'Acción realizada',
    action:
        'Acción realizada',
    tipo_accion:
        'Tipo de acción',
    evento:
        'Evento',
    event:
        'Evento',
    operacion:
        'Operación',
    operation:
        'Operación',
    tabla:
        'Tabla afectada',
    table_name:
        'Tabla afectada',
    entidad:
        'Entidad',
    entity:
        'Entidad',
    tipo_entidad:
        'Tipo de entidad',
    registro_id:
        'Registro afectado',
    record_id:
        'Registro afectado',
    entidad_id:
        'Registro afectado',
    usuario_id:
        'Usuario responsable',
    user_id:
        'Usuario responsable',
    actor_id:
        'Usuario responsable',
    realizado_por:
        'Realizado por',
    creado_por:
        'Realizado por',
    created_by:
        'Realizado por',
    actualizado_por:
        'Actualizado por',
    updated_by:
        'Actualizado por',
    eliminado_por:
        'Eliminado por',
    deleted_by:
        'Eliminado por',
    administrador_id:
        'Administrador',
    admin_id:
        'Administrador',
    perfil_id:
        'Perfil',
    fecha:
        'Fecha y hora',
    fecha_evento:
        'Fecha y hora',
    fecha_accion:
        'Fecha y hora',
    ocurrido_en:
        'Fecha y hora',
    creado_en:
        'Fecha y hora',
    created_at:
        'Fecha y hora',
    actualizado_en:
        'Fecha de actualización',
    updated_at:
        'Fecha de actualización',
    datos_anteriores:
        'Información anterior',
    valores_anteriores:
        'Información anterior',
    old_data:
        'Información anterior',
    old_values:
        'Información anterior',
    anterior:
        'Información anterior',
    datos_nuevos:
        'Información nueva',
    valores_nuevos:
        'Información nueva',
    new_data:
        'Información nueva',
    new_values:
        'Información nueva',
    nuevo:
        'Información nueva',
    cambios:
        'Cambios realizados',
    changes:
        'Cambios realizados',
    detalle:
        'Detalle',
    detalles:
        'Detalles',
    descripcion:
        'Descripción',
    description:
        'Descripción',
    motivo:
        'Motivo',
    razon:
        'Razón',
    ip:
        'Dirección IP',
    ip_address:
        'Dirección IP',
    direccion_ip:
        'Dirección IP',
    user_agent:
        'Navegador o dispositivo',
    navegador:
        'Navegador',
    dispositivo:
        'Dispositivo',
    metadata:
        'Información adicional',
    metadatos:
        'Información adicional',
    origen:
        'Origen',
    source:
        'Origen',
    estado:
        'Estado',
    status:
        'Estado',
    exito:
        'Resultado',
    success:
        'Resultado',
    error:
        'Error',
};

const ACTION_TRANSLATIONS:
    Record<
        string,
        string
    > = {
    insert:
        'Creó un registro',
    inserted:
        'Creó un registro',
    create:
        'Creó un registro',
    created:
        'Creó un registro',
    crear:
        'Creó un registro',
    creado:
        'Creó un registro',
    update:
        'Actualizó un registro',
    updated:
        'Actualizó un registro',
    actualizar:
        'Actualizó un registro',
    actualizado:
        'Actualizó un registro',
    delete:
        'Eliminó un registro',
    deleted:
        'Eliminó un registro',
    eliminar:
        'Eliminó un registro',
    eliminado:
        'Eliminó un registro',
    approve:
        'Aprobó un registro',
    approved:
        'Aprobó un registro',
    aprobar:
        'Aprobó un registro',
    aprobado:
        'Aprobó un registro',
    reject:
        'Rechazó un registro',
    rejected:
        'Rechazó un registro',
    rechazar:
        'Rechazó un registro',
    rechazado:
        'Rechazó un registro',
    login:
        'Inició sesión',
    logout:
        'Cerró sesión',
    publish:
        'Publicó un registro',
    published:
        'Publicó un registro',
    publicar:
        'Publicó un registro',
    verify:
        'Verificó un registro',
    verified:
        'Verificó un registro',
    verificar:
        'Verificó un registro',
};

const ENTITY_TRANSLATIONS:
    Record<
        string,
        string
    > = {
    perfiles:
        'Usuarios',
    perfil:
        'Usuario',
    causas:
        'Causas',
    causa:
        'Causa',
    aportaciones:
        'Aportaciones',
    aportacion:
        'Aportación',
    evidencias_impacto:
        'Evidencias de impacto',
    evidencia_impacto:
        'Evidencia de impacto',
    archivos_evidencia:
        'Archivos de evidencia',
    comprobantes:
        'Comprobantes',
    configuracion_fondo:
        'Configuración del fondo',
    metas_especie:
        'Metas en especie',
    detalle_aportaciones_especie:
        'Detalle de aportaciones en especie',
    actualizaciones_causa:
        'Actualizaciones de causa',
    imagenes_causa:
        'Imágenes de causa',
    bitacora_auditoria:
        'Bitácora de auditoría',
};

const ACTOR_FIELDS = [
    'realizado_por',
    'usuario_id',
    'user_id',
    'actor_id',
    'administrador_id',
    'admin_id',
    'creado_por',
    'created_by',
    'actualizado_por',
    'updated_by',
    'eliminado_por',
    'deleted_by',
    'perfil_id',
];

const DATE_FIELDS = [
    'fecha',
    'fecha_evento',
    'fecha_accion',
    'ocurrido_en',
    'creado_en',
    'created_at',
    'actualizado_en',
    'updated_at',
];

const ACTION_FIELDS = [
    'accion',
    'action',
    'tipo_accion',
    'evento',
    'event',
    'operacion',
    'operation',
];

const ENTITY_FIELDS = [
    'tabla',
    'table_name',
    'entidad',
    'entity',
    'tipo_entidad',
];

function isUuid(
    value: string,
) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

function stringifyValue(
    value: AuditValue,
) {
    if (
        value === null ||
        value === undefined
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

function formatColumnName(
    value: string,
) {
    const translated =
        COLUMN_TRANSLATIONS[
        value
        ];

    if (
        translated
    ) {
        return translated;
    }

    const clean =
        value
            .replace(
                /_/g,
                ' ',
            )
            .trim();

    return clean
        .replace(
            /\b\w/g,
            (
                letter,
            ) =>
                letter.toUpperCase(),
        );
}

function formatDate(
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

function isDateString(
    value: string,
) {
    if (
        !value.includes(
            '-',
        ) &&
        !value.includes(
            'T',
        )
    ) {
        return false;
    }

    return !Number.isNaN(
        Date.parse(
            value,
        ),
    );
}

function translateSimpleValue(
    value: string,
) {
    const normalized =
        value
            .trim()
            .toLocaleLowerCase(
                'es-MX',
            );

    if (
        ACTION_TRANSLATIONS[
        normalized
        ]
    ) {
        return ACTION_TRANSLATIONS[
            normalized
        ];
    }

    if (
        ENTITY_TRANSLATIONS[
        normalized
        ]
    ) {
        return ENTITY_TRANSLATIONS[
            normalized
        ];
    }

    if (
        normalized ===
        'true'
    ) {
        return 'Sí';
    }

    if (
        normalized ===
        'false'
    ) {
        return 'No';
    }

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

function formatAuditValue(
    value: AuditValue,
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return 'Sin información';
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
            isDateString(
                value,
            )
        ) {
            return formatDate(
                value,
            );
        }

        return translateSimpleValue(
            value,
        );
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

function getProfileName(
    profile:
        | AuditProfile
        | null
        | undefined,
) {
    if (
        !profile
    ) {
        return null;
    }

    return (
        profile.nombre_completo
            ?.trim() ||
        profile.alias
            ?.trim() ||
        profile.correo
            ?.trim() ||
        null
    );
}

function getInitials(
    value: string,
) {
    const parts =
        value
            .trim()
            .split(/\s+/)
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

function getFirstField(
    row: AuditRow,
    fields: string[],
) {
    for (
        const field of
        fields
    ) {
        const value =
            row[
            field
            ];

        if (
            value !==
            null &&
            value !==
            undefined &&
            value !==
            ''
        ) {
            return {
                field,
                value,
            };
        }
    }

    return null;
}

function getActorValue(
    row: AuditRow,
) {
    return getFirstField(
        row,
        ACTOR_FIELDS,
    );
}

function getDateValue(
    row: AuditRow,
) {
    const preferred =
        getFirstField(
            row,
            DATE_FIELDS,
        );

    if (
        preferred
    ) {
        return preferred;
    }

    for (
        const [
            field,
            value,
        ] of Object.entries(
            row,
        )
    ) {
        if (
            field ===
            'id'
        ) {
            continue;
        }

        if (
            typeof value !==
            'string'
        ) {
            continue;
        }

        if (
            isDateString(
                value,
            )
        ) {
            return {
                field,
                value,
            };
        }
    }

    return null;
}

function getActionValue(
    row: AuditRow,
) {
    return getFirstField(
        row,
        ACTION_FIELDS,
    );
}

function getEntityValue(
    row: AuditRow,
) {
    return getFirstField(
        row,
        ENTITY_FIELDS,
    );
}

function getActorName(
    row: AuditRow,
    profiles:
        Map<
            string,
            AuditProfile
        >,
) {
    const actor =
        getActorValue(
            row,
        );

    if (
        !actor
    ) {
        return 'Sistema';
    }

    const rawValue =
        stringifyValue(
            actor.value,
        );

    if (
        !rawValue
    ) {
        return 'Sistema';
    }

    if (
        isUuid(
            rawValue,
        )
    ) {
        const profile =
            profiles.get(
                rawValue,
            );

        return (
            getProfileName(
                profile,
            ) ||
            'Usuario registrado'
        );
    }

    return rawValue;
}

function getActorProfile(
    row: AuditRow,
    profiles:
        Map<
            string,
            AuditProfile
        >,
) {
    const actor =
        getActorValue(
            row,
        );

    if (
        !actor
    ) {
        return null;
    }

    const value =
        stringifyValue(
            actor.value,
        );

    if (
        !isUuid(
            value,
        )
    ) {
        return null;
    }

    return (
        profiles.get(
            value,
        ) ??
        null
    );
}

function getActionLabel(
    row: AuditRow,
) {
    const action =
        getActionValue(
            row,
        );

    if (
        !action
    ) {
        return 'Movimiento registrado';
    }

    return formatAuditValue(
        action.value,
    );
}

function getEntityLabel(
    row: AuditRow,
) {
    const entity =
        getEntityValue(
            row,
        );

    if (
        !entity
    ) {
        return 'Sistema';
    }

    return formatAuditValue(
        entity.value,
    );
}

function getDateLabel(
    row: AuditRow,
) {
    const date =
        getDateValue(
            row,
        );

    if (
        !date
    ) {
        return 'Fecha no disponible';
    }

    return formatAuditValue(
        date.value,
    );
}

function getTimestamp(
    row: AuditRow,
) {
    const date =
        getDateValue(
            row,
        );

    if (
        !date ||
        typeof date.value !==
        'string'
    ) {
        return 0;
    }

    const timestamp =
        Date.parse(
            date.value,
        );

    return Number.isNaN(
        timestamp,
    )
        ? 0
        : timestamp;
}

function searchRow(
    row: AuditRow,
    query: string,
    profiles:
        Map<
            string,
            AuditProfile
        >,
) {
    const normalized =
        query
            .trim()
            .toLocaleLowerCase(
                'es-MX',
            );

    if (
        !normalized
    ) {
        return true;
    }

    const actor =
        getActorName(
            row,
            profiles,
        );

    const action =
        String(
            getActionLabel(
                row,
            ),
        );

    const entity =
        String(
            getEntityLabel(
                row,
            ),
        );

    const values = [
        actor,
        action,
        entity,
        ...Object.entries(
            row,
        )
            .filter(
                ([
                    field,
                ]) =>
                    field !==
                    'id',
            )
            .flatMap(
                ([
                    field,
                    value,
                ]) => [
                        formatColumnName(
                            field,
                        ),
                        stringifyValue(
                            value,
                        ),
                        String(
                            formatAuditValue(
                                value,
                            ),
                        ),
                    ],
            ),
    ];

    return values.some(
        (
            value,
        ) =>
            value
                .toLocaleLowerCase(
                    'es-MX',
                )
                .includes(
                    normalized,
                ),
    );
}

function DetailValue({
    value,
}: {
    value: AuditValue;
}) {
    const complex =
        value !==
        null &&
        typeof value ===
        'object';

    if (
        complex
    ) {
        return (
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.04] bg-black/20 p-3 font-mono text-[8px] leading-4 text-[var(--text-soft)]">
                {formatAuditValue(
                    value,
                )}
            </pre>
        );
    }

    return (
        <span className="break-words text-[9px] leading-4 text-[var(--text-soft)]">
            {formatAuditValue(
                value,
            )}
        </span>
    );
}

export default function AdminAuditScreen({
    showToast,
    refreshKey = 0,
}: AdminAuditScreenProps) {
    const [
        rows,
        setRows,
    ] =
        useState<
            AuditRow[]
        >([]);

    const [
        profiles,
        setProfiles,
    ] =
        useState<
            Map<
                string,
                AuditProfile
            >
        >(
            new Map(),
        );

    const [
        search,
        setSearch,
    ] =
        useState('');

    const [
        loading,
        setLoading,
    ] =
        useState(
            true,
        );

    const [
        refreshing,
        setRefreshing,
    ] =
        useState(
            false,
        );

    const [
        selectedKey,
        setSelectedKey,
    ] =
        useState<
            string | null
        >(
            null,
        );

    const [
        copiedField,
        setCopiedField,
    ] =
        useState<
            string | null
        >(
            null,
        );

    const loadAudit =
        useCallback(
            async (
                refresh =
                    false,
            ) => {
                if (
                    refresh
                ) {
                    setRefreshing(
                        true,
                    );
                } else {
                    setLoading(
                        true,
                    );
                }

                try {
                    const {
                        data,
                        error,
                    } =
                        await supabase
                            .from(
                                'bitacora_auditoria',
                            )
                            .select(
                                '*',
                            );

                    if (
                        error
                    ) {
                        throw error;
                    }

                    const loadedRows =
                        (
                            data ??
                            []
                        ) as AuditRow[];

                    const userIds =
                        new Set<string>();

                    loadedRows.forEach(
                        (
                            row,
                        ) => {
                            ACTOR_FIELDS.forEach(
                                (
                                    field,
                                ) => {
                                    const value =
                                        row[
                                        field
                                        ];

                                    if (
                                        typeof value ===
                                        'string' &&
                                        isUuid(
                                            value,
                                        )
                                    ) {
                                        userIds.add(
                                            value,
                                        );
                                    }
                                },
                            );
                        },
                    );

                    const profileMap =
                        new Map<
                            string,
                            AuditProfile
                        >();

                    if (
                        userIds.size
                    ) {
                        const {
                            data:
                            profileData,
                            error:
                            profileError,
                        } =
                            await supabase
                                .from(
                                    'perfiles',
                                )
                                .select(
                                    'id,correo,nombre_completo,alias,avatar_url',
                                )
                                .in(
                                    'id',
                                    [
                                        ...userIds,
                                    ],
                                );

                        if (
                            profileError
                        ) {
                            throw profileError;
                        }

                        (
                            profileData ??
                            []
                        ).forEach(
                            (
                                profile,
                            ) => {
                                profileMap.set(
                                    profile.id,
                                    {
                                        id:
                                            profile.id,
                                        correo:
                                            profile.correo ??
                                            null,
                                        nombre_completo:
                                            profile.nombre_completo ??
                                            null,
                                        alias:
                                            profile.alias ??
                                            null,
                                        avatar_url:
                                            profile.avatar_url ??
                                            null,
                                    },
                                );
                            },
                        );
                    }

                    const sorted =
                        [
                            ...loadedRows,
                        ].sort(
                            (
                                first,
                                second,
                            ) =>
                                getTimestamp(
                                    second,
                                ) -
                                getTimestamp(
                                    first,
                                ),
                        );

                    setProfiles(
                        profileMap,
                    );

                    setRows(
                        sorted,
                    );

                    setSelectedKey(
                        null,
                    );
                } catch (
                error
                ) {
                    showToast(
                        error instanceof
                            Error
                            ? error.message
                            : 'No se pudo cargar la bitácora de auditoría.',
                        'error',
                    );
                } finally {
                    setLoading(
                        false,
                    );

                    setRefreshing(
                        false,
                    );
                }
            },
            [
                showToast,
            ],
        );

    useEffect(
        () => {
            void loadAudit();
        },
        [
            loadAudit,
            refreshKey,
        ],
    );

    const visibleColumns =
        useMemo(
            () => {
                const set =
                    new Set<string>();

                rows.forEach(
                    (
                        row,
                    ) => {
                        Object.keys(
                            row,
                        ).forEach(
                            (
                                field,
                            ) => {
                                if (
                                    field !==
                                    'id'
                                ) {
                                    set.add(
                                        field,
                                    );
                                }
                            },
                        );
                    },
                );

                return [
                    ...set,
                ];
            },
            [
                rows,
            ],
        );

    const filtered =
        useMemo(
            () =>
                rows.filter(
                    (
                        row,
                    ) =>
                        searchRow(
                            row,
                            search,
                            profiles,
                        ),
                ),
            [
                rows,
                search,
                profiles,
            ],
        );

    const uniqueActors =
        useMemo(
            () => {
                const actors =
                    new Set<string>();

                rows.forEach(
                    (
                        row,
                    ) => {
                        actors.add(
                            getActorName(
                                row,
                                profiles,
                            ),
                        );
                    },
                );

                return actors.size;
            },
            [
                rows,
                profiles,
            ],
        );

    const copyValue =
        async (
            key: string,
            value: AuditValue,
        ) => {
            const text =
                stringifyValue(
                    value,
                );

            if (
                !text
            ) {
                return;
            }

            try {
                await navigator.clipboard
                    .writeText(
                        text,
                    );

                setCopiedField(
                    key,
                );

                window.setTimeout(
                    () => {
                        setCopiedField(
                            null,
                        );
                    },
                    1300,
                );
            } catch {
                showToast(
                    'No se pudo copiar el valor.',
                    'error',
                );
            }
        };

    if (
        loading
    ) {
        return (
            <div className="flex min-h-[360px] items-center justify-center">
                <Loader2
                    size={25}
                    className="animate-spin text-rose-300"
                />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-rose-300">
                        Seguridad
                    </span>

                    <div className="mt-1 flex items-baseline gap-2">
                        <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text)] sm:text-xl">
                            Bitácora de auditoría
                        </h2>

                        <span className="text-[9px] text-[var(--muted)]">
                            {
                                rows.length
                            }
                        </span>
                    </div>

                    <p className="mt-1 max-w-3xl text-[9px] leading-4 text-[var(--muted)] sm:text-[10px]">
                        Consulta quién realizó cada acción, cuándo ocurrió y toda la información registrada por el sistema.
                    </p>
                </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Movimientos
                            </span>

                            <strong className="mt-2 block text-xl font-bold text-[var(--text)]">
                                {
                                    rows.length
                                }
                            </strong>
                        </div>

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-400/[0.07] text-rose-300">
                            <History
                                size={16}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Responsables
                            </span>

                            <strong className="mt-2 block text-xl font-bold text-cyan-300">
                                {
                                    uniqueActors
                                }
                            </strong>
                        </div>

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
                            <UserRound
                                size={16}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Resultados
                            </span>

                            <strong className="mt-2 block text-xl font-bold text-rose-300">
                                {
                                    filtered.length
                                }
                            </strong>
                        </div>

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-400/[0.07] text-rose-300">
                            <FileSearch
                                size={16}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Datos utilizados
                            </span>

                            <strong className="mt-2 block text-xl font-bold text-amber-200">
                                {
                                    visibleColumns.length
                                }
                            </strong>
                        </div>

                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300/[0.07] text-amber-200">
                            <Fingerprint
                                size={16}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <section className="mt-3 rounded-2xl border border-white/[0.055] bg-white/[0.022] p-3 sm:p-4">
                <div className="relative">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                    />

                    <input
                        type="search"
                        value={
                            search
                        }
                        onChange={(
                            event,
                        ) => {
                            setSearch(
                                event.target
                                    .value,
                            );

                            setSelectedKey(
                                null,
                            );
                        }}
                        placeholder="Buscar por usuario, acción, fecha, tabla o cualquier dato..."
                        className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] pl-10 pr-4 text-[10px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-rose-400/25"
                    />
                </div>
            </section>

            {!filtered.length ? (
                <div className="mt-4 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.018] px-5 text-center">
                    <FileSearch
                        size={29}
                        className="text-rose-300"
                    />

                    <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">
                        {search
                            ? 'No encontramos resultados'
                            : 'Aún no hay movimientos'}
                    </h3>

                    <p className="mt-1 max-w-[360px] text-[9px] leading-4 text-[var(--muted)]">
                        {search
                            ? 'Prueba con otro usuario, acción, fecha o información registrada.'
                            : 'Los movimientos registrados por el sistema aparecerán aquí.'}
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-2.5">
                    {filtered.map(
                        (
                            row,
                            index,
                        ) => {
                            const rowKey =
                                stringifyValue(
                                    row.id,
                                ) ||
                                `${getTimestamp(
                                    row,
                                )}-${index}`;

                            const expanded =
                                selectedKey ===
                                rowKey;

                            const actorName =
                                getActorName(
                                    row,
                                    profiles,
                                );

                            const actorProfile =
                                getActorProfile(
                                    row,
                                    profiles,
                                );

                            const action =
                                getActionLabel(
                                    row,
                                );

                            const entity =
                                getEntityLabel(
                                    row,
                                );

                            const date =
                                getDateLabel(
                                    row,
                                );

                            const detailEntries =
                                Object.entries(
                                    row,
                                ).filter(
                                    ([
                                        field,
                                    ]) =>
                                        field !==
                                        'id',
                                );

                            return (
                                <article
                                    key={
                                        rowKey
                                    }
                                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${expanded
                                        ? 'border-rose-400/15 bg-white/[0.032]'
                                        : 'border-white/[0.055] bg-white/[0.022] hover:border-white/[0.09] hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedKey(
                                                (
                                                    current,
                                                ) =>
                                                    current ===
                                                        rowKey
                                                        ? null
                                                        : rowKey,
                                            )
                                        }
                                        className="w-full p-3 text-left sm:p-4"
                                    >
                                        <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.25fr)_minmax(190px,1fr)_minmax(160px,.8fr)_minmax(170px,.8fr)_26px] lg:items-center">
                                            <div className="flex min-w-0 items-center gap-3">
                                                {actorProfile
                                                    ?.avatar_url ? (
                                                    <img
                                                        src={
                                                            actorProfile.avatar_url
                                                        }
                                                        alt={
                                                            actorName
                                                        }
                                                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                                    />
                                                ) : (
                                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-400/[0.07] text-[9px] font-black text-rose-300">
                                                        {getInitials(
                                                            actorName,
                                                        )}
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <span className="block text-[6px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                                        Quién lo hizo
                                                    </span>

                                                    <span className="mt-1 block truncate text-[9px] font-semibold text-[var(--text)]">
                                                        {
                                                            actorName
                                                        }
                                                    </span>

                                                    {actorProfile
                                                        ?.correo && (
                                                            <span className="mt-0.5 block truncate text-[7px] text-[var(--muted)]">
                                                                {
                                                                    actorProfile.correo
                                                                }
                                                            </span>
                                                        )}
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <span className="block text-[6px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                                    Qué hizo
                                                </span>

                                                <span className="mt-1 block truncate text-[9px] font-semibold text-rose-200">
                                                    {
                                                        action
                                                    }
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <span className="block text-[6px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                                    Dónde
                                                </span>

                                                <span className="mt-1 block truncate text-[9px] text-[var(--text-soft)]">
                                                    {
                                                        entity
                                                    }
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <span className="block text-[6px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                                    Cuándo
                                                </span>

                                                <span className="mt-1 flex items-center gap-1.5 text-[8px] text-[var(--text-soft)]">
                                                    <CalendarClock
                                                        size={11}
                                                        className="shrink-0 text-amber-200"
                                                    />

                                                    {
                                                        date
                                                    }
                                                </span>
                                            </div>

                                            <div className="hidden justify-end lg:flex">
                                                {expanded ? (
                                                    <ChevronUp
                                                        size={15}
                                                        className="text-rose-300"
                                                    />
                                                ) : (
                                                    <ChevronDown
                                                        size={15}
                                                        className="text-[var(--muted)]"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {expanded && (
                                        <div className="border-t border-white/[0.05] bg-black/[0.08] p-3 sm:p-5">
                                            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-rose-400/[0.08] bg-rose-400/[0.018] p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-400/[0.08] text-rose-300">
                                                        <ShieldCheck
                                                            size={16}
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                                            Resumen del movimiento
                                                        </span>

                                                        <span className="mt-1 block text-[10px] font-semibold text-[var(--text)]">
                                                            {actorName}{' '}
                                                            ·{' '}
                                                            {action}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-[8px] text-[var(--muted)]">
                                                    <FileClock
                                                        size={13}
                                                        className="text-amber-200"
                                                    />

                                                    {
                                                        date
                                                    }
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                                    Toda la información registrada
                                                </span>

                                                <p className="mt-1 text-[8px] leading-4 text-[var(--muted)]">
                                                    Se muestran todos los campos guardados en la bitácora excepto el identificador interno.
                                                </p>
                                            </div>

                                            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                                                {detailEntries.map(
                                                    ([
                                                        field,
                                                        value,
                                                    ]) => {
                                                        const actorField =
                                                            ACTOR_FIELDS.includes(
                                                                field,
                                                            );

                                                        let displayValue:
                                                            AuditValue =
                                                            value;

                                                        if (
                                                            actorField &&
                                                            typeof value ===
                                                            'string' &&
                                                            isUuid(
                                                                value,
                                                            )
                                                        ) {
                                                            const profile =
                                                                profiles.get(
                                                                    value,
                                                                );

                                                            if (
                                                                profile
                                                            ) {
                                                                displayValue =
                                                                    `${getProfileName(
                                                                        profile,
                                                                    ) ?? 'Usuario'}${profile.correo
                                                                        ? ` · ${profile.correo}`
                                                                        : ''
                                                                    }`;
                                                            }
                                                        }

                                                        const copyKey =
                                                            `${rowKey}-${field}`;

                                                        return (
                                                            <section
                                                                key={
                                                                    field
                                                                }
                                                                className="min-w-0 rounded-xl border border-white/[0.05] bg-white/[0.018] p-3"
                                                            >
                                                                <div className="mb-2 flex items-start justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <span className="block text-[6px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">
                                                                            {formatColumnName(
                                                                                field,
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    {value !==
                                                                        null &&
                                                                        value !==
                                                                        undefined && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    void copyValue(
                                                                                        copyKey,
                                                                                        value,
                                                                                    )
                                                                                }
                                                                                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-[var(--muted)] transition-all hover:bg-white/[0.07] hover:text-white"
                                                                            >
                                                                                {copiedField ===
                                                                                    copyKey ? (
                                                                                    <CheckCircle2
                                                                                        size={11}
                                                                                        className="text-emerald-300"
                                                                                    />
                                                                                ) : (
                                                                                    <Clipboard
                                                                                        size={11}
                                                                                    />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                </div>

                                                                <DetailValue
                                                                    value={
                                                                        displayValue
                                                                    }
                                                                />
                                                            </section>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        },
                    )}
                </div>
            )}
        </div>
    );
}