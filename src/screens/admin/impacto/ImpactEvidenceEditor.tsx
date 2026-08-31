import {
    type ChangeEvent,
    type DragEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { createPortal } from 'react-dom';

import {
    AlertCircle,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    FileEdit,
    FileText,
    ImagePlus,
    Loader2,
    Save,
    Trash2,
    UploadCloud,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase';

import type {
    ImpactRow,
} from './impactTypes';

interface Props {
    open: boolean;
    evidence:
    | ImpactRow
    | null;
    onClose: () => void;
    onSaved: () => void | Promise<void>;
    showToast: (
        message: string,
        type?:
            | 'success'
            | 'error'
            | 'info'
            | 'warning',
    ) => void;
}

interface CompletedCause {
    id: string;
    titulo: string;
    slug: string;
    categoria: string;
    fecha_completada: string;
}

interface PendingFile {
    key: string;
    file: File;
    previewUrl: string | null;
}

interface UploadedFile {
    storagePath: string;
    rowId?: string;
}

interface EvidenceSnapshot {
    causa_id: string;
    titulo: string;
    descripcion: string | null;
    fecha_entrega: string | null;
    monto_utilizado: number | null;
    publica: boolean;
    verificada: boolean;
    verificada_por: string | null;
    verificada_en: string | null;
}

const FILE_BUCKET =
    'evidencias-impacto';

const MAX_FILES =
    12;

const MAX_FILE_SIZE =
    15 * 1024 * 1024;

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'application/pdf',
];

const inputClass =
    'h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 text-[11px] text-[var(--text)] outline-none transition-all duration-300 placeholder:text-[var(--muted)] focus:border-violet-400/30 focus:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50';

const textareaClass =
    'w-full resize-y rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 text-[11px] leading-5 text-[var(--text)] outline-none transition-all duration-300 placeholder:text-[var(--muted)] focus:border-violet-400/30 focus:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50';

function createKey() {
    if (
        typeof crypto !==
        'undefined' &&
        crypto.randomUUID
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

function toInputDate(
    value:
        | string
        | null
        | undefined,
) {
    if (!value) {
        return '';
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
        return '';
    }

    const offset =
        date.getTimezoneOffset() *
        60000;

    return new Date(
        date.getTime() -
        offset,
    )
        .toISOString()
        .slice(
            0,
            10,
        );
}

function formatDate(
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

function formatCategory(
    value: string,
) {
    if (!value) {
        return '—';
    }

    const clean =
        value.replace(
            /_/g,
            ' ',
        );

    return (
        clean
            .charAt(0)
            .toUpperCase() +
        clean.slice(1)
    );
}

function formatBytes(
    bytes: number,
) {
    if (
        !bytes
    ) {
        return '0 KB';
    }

    if (
        bytes <
        1024 *
        1024
    ) {
        return `${Math.max(
            1,
            Math.round(
                bytes /
                1024,
            ),
        )} KB`;
    }

    return `${(
        bytes /
        1024 /
        1024
    ).toFixed(
        1,
    )} MB`;
}

function getPublicUrl(
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
                FILE_BUCKET,
            )
            .getPublicUrl(
                path,
            )
            .data
            .publicUrl ||
        null
    );
}

function getExtension(
    file: File,
) {
    return (
        file.name
            .split(
                '.',
            )
            .pop()
            ?.toLowerCase() ||
        file.type
            .split(
                '/',
            )
            .pop()
            ?.toLowerCase() ||
        'bin'
    );
}

function getFileType(
    file: File,
) {
    return file.type.startsWith(
        'image/',
    )
        ? 'imagen'
        : 'documento';
}

export default function ImpactEvidenceEditor({
    open,
    evidence,
    onClose,
    onSaved,
    showToast,
}: Props) {
    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const editing =
        Boolean(
            evidence,
        );

    const [
        causes,
        setCauses,
    ] =
        useState<
            CompletedCause[]
        >([]);

    const [
        causeId,
        setCauseId,
    ] =
        useState(
            '',
        );

    const [
        title,
        setTitle,
    ] =
        useState(
            '',
        );

    const [
        description,
        setDescription,
    ] =
        useState(
            '',
        );

    const [
        deliveryDate,
        setDeliveryDate,
    ] =
        useState(
            '',
        );

    const [
        amountUsed,
        setAmountUsed,
    ] =
        useState(
            '',
        );

    const [
        pendingFiles,
        setPendingFiles,
    ] =
        useState<
            PendingFile[]
        >([]);

    const [
        removedFileIds,
        setRemovedFileIds,
    ] =
        useState<
            string[]
        >([]);

    const [
        loading,
        setLoading,
    ] =
        useState(
            true,
        );

    const [
        saving,
        setSaving,
    ] =
        useState(
            false,
        );

    const [
        attempted,
        setAttempted,
    ] =
        useState(
            false,
        );

    const [
        dragging,
        setDragging,
    ] =
        useState(
            false,
        );

    const existingFiles =
        useMemo(
            () =>
                (
                    evidence?.archivos ??
                    []
                ).filter(
                    (
                        file,
                    ) =>
                        !removedFileIds.includes(
                            file.id,
                        ),
                ),
            [
                evidence,
                removedFileIds,
            ],
        );

    const totalFiles =
        existingFiles.length +
        pendingFiles.length;

    const selectedCause =
        useMemo(
            () =>
                causes.find(
                    (
                        cause,
                    ) =>
                        cause.id ===
                        causeId,
                ) ??
                null,
            [
                causes,
                causeId,
            ],
        );

    const numericAmount =
        amountUsed
            .trim()
            ? Number(
                amountUsed,
            )
            : null;

    const validAmount =
        numericAmount ===
        null ||
        (
            Number.isFinite(
                numericAmount,
            ) &&
            numericAmount >=
            0
        );

    const valid =
        Boolean(
            causeId &&
            title.trim() &&
            deliveryDate &&
            totalFiles >
            0 &&
            validAmount,
        );

    const completion =
        useMemo(
            () => {
                const values = [
                    Boolean(
                        causeId,
                    ),
                    Boolean(
                        title.trim(),
                    ),
                    Boolean(
                        description.trim(),
                    ),
                    Boolean(
                        deliveryDate,
                    ),
                    totalFiles >
                    0,
                ];

                return Math.round(
                    (
                        values.filter(
                            Boolean,
                        ).length /
                        values.length
                    ) *
                    100,
                );
            },
            [
                causeId,
                title,
                description,
                deliveryDate,
                totalFiles,
            ],
        );

    const load =
        useCallback(
            async () => {
                setLoading(
                    true,
                );

                try {
                    const [
                        causesResult,
                        evidenceResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from(
                                    'causas',
                                )
                                .select(
                                    'id,titulo,slug,categoria,fecha_completada',
                                )
                                .not(
                                    'fecha_completada',
                                    'is',
                                    null,
                                )
                                .order(
                                    'fecha_completada',
                                    {
                                        ascending:
                                            false,
                                    },
                                ),
                            supabase
                                .from(
                                    'evidencias_impacto',
                                )
                                .select(
                                    'id,causa_id',
                                ),
                        ]);

                    if (
                        causesResult.error
                    ) {
                        throw causesResult.error;
                    }

                    if (
                        evidenceResult.error
                    ) {
                        throw evidenceResult.error;
                    }

                    const assignedCauseIds =
                        new Set(
                            (
                                evidenceResult.data ??
                                []
                            )
                                .filter(
                                    (
                                        item,
                                    ) =>
                                        !editing ||
                                        item.id !==
                                        evidence?.id,
                                )
                                .map(
                                    (
                                        item,
                                    ) =>
                                        item.causa_id,
                                )
                                .filter(
                                    Boolean,
                                ),
                        );

                    setCauses(
                        (
                            causesResult.data ??
                            []
                        )
                            .filter(
                                (
                                    cause,
                                ) =>
                                    !assignedCauseIds.has(
                                        cause.id,
                                    ),
                            )
                            .map(
                                (
                                    cause,
                                ) => ({
                                    id:
                                        cause.id,
                                    titulo:
                                        cause.titulo,
                                    slug:
                                        cause.slug,
                                    categoria:
                                        cause.categoria,
                                    fecha_completada:
                                        cause.fecha_completada,
                                }),
                            ),
                    );

                    setCauseId(
                        evidence?.causa_id ??
                        '',
                    );

                    setTitle(
                        evidence?.titulo ??
                        '',
                    );

                    setDescription(
                        evidence?.descripcion ??
                        '',
                    );

                    setDeliveryDate(
                        toInputDate(
                            evidence?.fecha_entrega,
                        ),
                    );

                    setAmountUsed(
                        evidence?.monto_utilizado ===
                            null ||
                            evidence?.monto_utilizado ===
                            undefined
                            ? ''
                            : String(
                                evidence.monto_utilizado,
                            ),
                    );

                    setRemovedFileIds(
                        [],
                    );

                    setPendingFiles(
                        (
                            current,
                        ) => {
                            current.forEach(
                                (
                                    item,
                                ) => {
                                    if (
                                        item.previewUrl
                                    ) {
                                        URL.revokeObjectURL(
                                            item.previewUrl,
                                        );
                                    }
                                },
                            );

                            return [];
                        },
                    );
                } catch (
                error
                ) {
                    showToast(
                        error instanceof
                            Error
                            ? error.message
                            : 'No se pudo cargar el editor de impacto.',
                        'error',
                    );
                } finally {
                    setLoading(
                        false,
                    );
                }
            },
            [
                evidence,
                showToast,
            ],
        );

    useEffect(
        () => {
            if (
                !open
            ) {
                return;
            }

            setAttempted(
                false,
            );

            void load();
        },
        [
            open,
            load,
        ],
    );

    useEffect(
        () => {
            if (
                !open
            ) {
                return;
            }

            const previousOverflow =
                document.body.style
                    .overflow;

            document.body.style.overflow =
                'hidden';

            return () => {
                document.body.style.overflow =
                    previousOverflow;
            };
        },
        [
            open,
        ],
    );

    const addFiles =
        (
            selected:
                File[],
        ) => {
            if (
                !selected.length
            ) {
                return;
            }

            const available =
                MAX_FILES -
                totalFiles;

            if (
                available <=
                0
            ) {
                showToast(
                    `Puedes agregar máximo ${MAX_FILES} archivos.`,
                    'warning',
                );

                return;
            }

            const accepted:
                File[] =
                [];

            for (
                const file of
                selected
            ) {
                if (
                    !ALLOWED_TYPES.includes(
                        file.type,
                    )
                ) {
                    showToast(
                        `${file.name}: formato no permitido.`,
                        'warning',
                    );

                    continue;
                }

                if (
                    file.size >
                    MAX_FILE_SIZE
                ) {
                    showToast(
                        `${file.name}: supera el límite de 15 MB.`,
                        'warning',
                    );

                    continue;
                }

                const duplicated =
                    pendingFiles.some(
                        (
                            item,
                        ) =>
                            item.file
                                .name ===
                            file.name &&
                            item.file
                                .size ===
                            file.size,
                    ) ||
                    accepted.some(
                        (
                            item,
                        ) =>
                            item.name ===
                            file.name &&
                            item.size ===
                            file.size,
                    );

                if (
                    duplicated
                ) {
                    continue;
                }

                accepted.push(
                    file,
                );
            }

            const limited =
                accepted.slice(
                    0,
                    available,
                );

            if (
                accepted.length >
                available
            ) {
                showToast(
                    `Solo se agregaron ${available} archivos.`,
                    'warning',
                );
            }

            setPendingFiles(
                (
                    current,
                ) => [
                        ...current,
                        ...limited.map(
                            (
                                file,
                            ) => ({
                                key:
                                    createKey(),
                                file,
                                previewUrl:
                                    file.type.startsWith(
                                        'image/',
                                    )
                                        ? URL.createObjectURL(
                                            file,
                                        )
                                        : null,
                            }),
                        ),
                    ],
            );
        };

    const handleInputFiles =
        (
            event:
                ChangeEvent<HTMLInputElement>,
        ) => {
            addFiles(
                Array.from(
                    event.target
                        .files ??
                    [],
                ),
            );

            event.target.value =
                '';
        };

    const handleDrop =
        (
            event:
                DragEvent<HTMLDivElement>,
        ) => {
            event.preventDefault();
            event.stopPropagation();

            setDragging(
                false,
            );

            if (
                saving
            ) {
                return;
            }

            addFiles(
                Array.from(
                    event.dataTransfer
                        .files,
                ),
            );
        };

    const removePending =
        (
            key: string,
        ) => {
            setPendingFiles(
                (
                    current,
                ) =>
                    current.filter(
                        (
                            item,
                        ) => {
                            if (
                                item.key ===
                                key &&
                                item.previewUrl
                            ) {
                                URL.revokeObjectURL(
                                    item.previewUrl,
                                );
                            }

                            return (
                                item.key !==
                                key
                            );
                        },
                    ),
            );
        };

    const uploadNewFiles =
        async (
            evidenceId:
                string,
            baseOrder:
                number,
        ) => {
            const uploaded:
                UploadedFile[] =
                [];

            try {
                for (
                    let index = 0;
                    index <
                    pendingFiles.length;
                    index +=
                    1
                ) {
                    const item =
                        pendingFiles[
                        index
                        ];

                    const storagePath =
                        `${evidenceId}/${Date.now()}-${item.key}.${getExtension(
                            item.file,
                        )}`;

                    const {
                        error:
                        uploadError,
                    } =
                        await supabase.storage
                            .from(
                                FILE_BUCKET,
                            )
                            .upload(
                                storagePath,
                                item.file,
                                {
                                    cacheControl:
                                        '3600',
                                    upsert:
                                        false,
                                    contentType:
                                        item.file
                                            .type,
                                },
                            );

                    if (
                        uploadError
                    ) {
                        throw uploadError;
                    }

                    uploaded.push({
                        storagePath,
                    });

                    const {
                        data:
                        insertedFile,
                        error:
                        insertError,
                    } =
                        await supabase
                            .from(
                                'archivos_evidencia',
                            )
                            .insert({
                                evidencia_id:
                                    evidenceId,
                                tipo:
                                    getFileType(
                                        item.file,
                                    ),
                                ruta_storage:
                                    storagePath,
                                nombre_archivo:
                                    item.file
                                        .name,
                                orden:
                                    baseOrder +
                                    index,
                            })
                            .select(
                                'id',
                            )
                            .single();

                    if (
                        insertError
                    ) {
                        throw insertError;
                    }

                    uploaded[
                        uploaded.length -
                        1
                    ].rowId =
                        insertedFile.id;
                }

                return uploaded;
            } catch (
            error
            ) {
                const storagePaths =
                    uploaded.map(
                        (
                            item,
                        ) =>
                            item.storagePath,
                    );

                const rowIds =
                    uploaded.flatMap(
                        (
                            item,
                        ) =>
                            item.rowId
                                ? [
                                    item.rowId,
                                ]
                                : [],
                    );

                if (
                    rowIds.length
                ) {
                    await supabase
                        .from(
                            'archivos_evidencia',
                        )
                        .delete()
                        .in(
                            'id',
                            rowIds,
                        );
                }

                if (
                    storagePaths.length
                ) {
                    await supabase.storage
                        .from(
                            FILE_BUCKET,
                        )
                        .remove(
                            storagePaths,
                        );
                }

                throw error;
            }
        };

    const removeMarkedFiles =
        async () => {
            const removed =
                (
                    evidence?.archivos ??
                    []
                ).filter(
                    (
                        file,
                    ) =>
                        removedFileIds.includes(
                            file.id,
                        ),
                );

            if (
                !removed.length
            ) {
                return;
            }

            const paths =
                removed
                    .map(
                        (
                            file,
                        ) =>
                            file.ruta_storage,
                    )
                    .filter(
                        Boolean,
                    );

            if (
                paths.length
            ) {
                const {
                    error,
                } =
                    await supabase.storage
                        .from(
                            FILE_BUCKET,
                        )
                        .remove(
                            paths,
                        );

                if (
                    error
                ) {
                    throw error;
                }
            }

            const {
                error,
            } =
                await supabase
                    .from(
                        'archivos_evidencia',
                    )
                    .delete()
                    .in(
                        'id',
                        removed.map(
                            (
                                file,
                            ) =>
                                file.id,
                        ),
                    );

            if (
                error
            ) {
                throw error;
            }
        };

    const updateExistingOrder =
        async () => {
            for (
                let index = 0;
                index <
                existingFiles.length;
                index +=
                1
            ) {
                const file =
                    existingFiles[
                    index
                    ];

                const {
                    error,
                } =
                    await supabase
                        .from(
                            'archivos_evidencia',
                        )
                        .update({
                            orden:
                                index,
                        })
                        .eq(
                            'id',
                            file.id,
                        );

                if (
                    error
                ) {
                    throw error;
                }
            }
        };

    const deleteNewEvidence =
        async (
            evidenceId:
                string,
        ) => {
            const {
                data:
                createdFiles,
            } =
                await supabase
                    .from(
                        'archivos_evidencia',
                    )
                    .select(
                        'id,ruta_storage',
                    )
                    .eq(
                        'evidencia_id',
                        evidenceId,
                    );

            const paths =
                (
                    createdFiles ??
                    []
                )
                    .map(
                        (
                            file,
                        ) =>
                            file.ruta_storage,
                    )
                    .filter(
                        Boolean,
                    );

            if (
                paths.length
            ) {
                await supabase.storage
                    .from(
                        FILE_BUCKET,
                    )
                    .remove(
                        paths,
                    );
            }

            await supabase
                .from(
                    'evidencias_impacto',
                )
                .delete()
                .eq(
                    'id',
                    evidenceId,
                );
        };

    const restoreEvidence =
        async (
            snapshot:
                EvidenceSnapshot,
        ) => {
            if (
                !evidence
            ) {
                return;
            }

            await supabase
                .from(
                    'evidencias_impacto',
                )
                .update(
                    snapshot,
                )
                .eq(
                    'id',
                    evidence.id,
                );
        };

    const submit =
        async () => {
            setAttempted(
                true,
            );

            if (
                !causeId
            ) {
                showToast(
                    'Selecciona una causa completada.',
                    'warning',
                );

                return;
            }

            if (
                !title.trim()
            ) {
                showToast(
                    'Agrega un título para la evidencia.',
                    'warning',
                );

                return;
            }

            if (
                !deliveryDate
            ) {
                showToast(
                    'Selecciona la fecha de entrega.',
                    'warning',
                );

                return;
            }

            if (
                totalFiles ===
                0
            ) {
                showToast(
                    'Debes agregar al menos una fotografía o documento.',
                    'warning',
                );

                return;
            }

            if (
                !validAmount
            ) {
                showToast(
                    'El monto utilizado no es válido.',
                    'warning',
                );

                return;
            }

            if (
                !selectedCause
            ) {
                showToast(
                    'La causa seleccionada debe estar completada.',
                    'warning',
                );

                return;
            }

            if (
                saving
            ) {
                return;
            }

            setSaving(
                true,
            );

            let createdEvidenceId:
                string | null =
                null;

            let snapshot:
                EvidenceSnapshot | null =
                null;

            try {
                const {
                    data:
                    authData,
                    error:
                    authError,
                } =
                    await supabase.auth
                        .getUser();

                if (
                    authError
                ) {
                    throw authError;
                }

                if (
                    !authData.user
                ) {
                    throw new Error(
                        'No se encontró la sesión del administrador.',
                    );
                }

                let targetId:
                    string;

                if (
                    editing &&
                    evidence
                ) {
                    snapshot = {
                        causa_id:
                            evidence.causa_id,
                        titulo:
                            evidence.titulo,
                        descripcion:
                            evidence.descripcion ??
                            null,
                        fecha_entrega:
                            evidence.fecha_entrega ??
                            null,
                        monto_utilizado:
                            evidence.monto_utilizado ===
                                null ||
                                evidence.monto_utilizado ===
                                undefined
                                ? null
                                : Number(
                                    evidence.monto_utilizado,
                                ),
                        publica:
                            Boolean(
                                evidence.publica,
                            ),
                        verificada:
                            Boolean(
                                evidence.verificada,
                            ),
                        verificada_por:
                            evidence.verificada_por ??
                            null,
                        verificada_en:
                            evidence.verificada_en ??
                            null,
                    };

                    const {
                        error,
                    } =
                        await supabase
                            .from(
                                'evidencias_impacto',
                            )
                            .update({
                                causa_id:
                                    causeId,
                                titulo:
                                    title.trim(),
                                descripcion:
                                    description
                                        .trim() ||
                                    null,
                                fecha_entrega:
                                    deliveryDate,
                                monto_utilizado:
                                    numericAmount,
                                publica:
                                    false,
                                verificada:
                                    false,
                                verificada_por:
                                    null,
                                verificada_en:
                                    null,
                            })
                            .eq(
                                'id',
                                evidence.id,
                            );

                    if (
                        error
                    ) {
                        throw error;
                    }

                    targetId =
                        evidence.id;
                } else {
                    const {
                        data,
                        error,
                    } =
                        await supabase
                            .from(
                                'evidencias_impacto',
                            )
                            .insert({
                                causa_id:
                                    causeId,
                                titulo:
                                    title.trim(),
                                descripcion:
                                    description
                                        .trim() ||
                                    null,
                                fecha_entrega:
                                    deliveryDate,
                                monto_utilizado:
                                    numericAmount,
                                publica:
                                    false,
                                verificada:
                                    false,
                                creada_por:
                                    authData.user
                                        .id,
                            })
                            .select(
                                'id',
                            )
                            .single();

                    if (
                        error
                    ) {
                        throw error;
                    }

                    if (
                        !data?.id
                    ) {
                        throw new Error(
                            'No se pudo obtener el ID de la evidencia.',
                        );
                    }

                    targetId =
                        data.id;

                    createdEvidenceId =
                        data.id;
                }

                try {
                    await uploadNewFiles(
                        targetId,
                        existingFiles.length,
                    );

                    await updateExistingOrder();

                    await removeMarkedFiles();
                } catch (
                fileError
                ) {
                    if (
                        createdEvidenceId
                    ) {
                        await deleteNewEvidence(
                            createdEvidenceId,
                        );
                    } else if (
                        snapshot
                    ) {
                        await restoreEvidence(
                            snapshot,
                        );
                    }

                    throw fileError;
                }

                const {
                    error:
                    verificationError,
                } =
                    await supabase
                        .from(
                            'evidencias_impacto',
                        )
                        .update({
                            publica:
                                true,
                            verificada:
                                true,
                            verificada_por:
                                authData.user.id,
                            verificada_en:
                                new Date().toISOString(),
                        })
                        .eq(
                            'id',
                            targetId,
                        );

                if (
                    verificationError
                ) {
                    throw verificationError;
                }

                showToast(
                    editing
                        ? 'Evidencia actualizada correctamente.'
                        : 'Evidencia creada correctamente.',
                    'success',
                );

                await onSaved();

                onClose();
            } catch (
            error
            ) {
                if (
                    createdEvidenceId
                ) {
                    await deleteNewEvidence(
                        createdEvidenceId,
                    );
                }

                if (
                    editing &&
                    snapshot
                ) {
                    await restoreEvidence(
                        snapshot,
                    );
                }

                showToast(
                    error instanceof
                        Error
                        ? error.message
                        : 'No se pudo guardar la evidencia.',
                    'error',
                );
            } finally {
                setSaving(
                    false,
                );
            }
        };

    if (
        !open
    ) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-[150] flex items-end justify-center overflow-hidden bg-black/70 backdrop-blur-[6px] sm:items-center sm:p-4 lg:p-6">
            <style>
                {`
                    @keyframes impactModalEnter {
                        from {
                            opacity: 0;
                            transform: translate3d(0, 24px, 0) scale(.985);
                        }

                        to {
                            opacity: 1;
                            transform: translate3d(0, 0, 0) scale(1);
                        }
                    }

                    .impact-editor-scroll {
                        overscroll-behavior: contain;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-gutter: stable;
                    }

                    @media (max-width: 639px) {
                        .impact-editor-dialog {
                            height: 100%;
                            max-height: 100%;
                            border-bottom-left-radius: 0;
                            border-bottom-right-radius: 0;
                        }

                        .impact-editor-scroll {
                            height: 100%;
                            max-height: 100%;
                        }
                    }
                `}
            </style>

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="impact-editor-title"
                className="impact-editor-dialog flex h-full max-h-full w-full min-w-0 flex-col overflow-hidden rounded-t-[28px] border border-white/[0.07] bg-[var(--bg)] shadow-[0_-20px_80px_rgba(0,0,0,.55)] animate-[impactModalEnter_.3s_cubic-bezier(.22,1,.36,1)] sm:h-[min(88dvh,900px)] sm:max-w-[1220px] sm:rounded-[28px] sm:shadow-[0_30px_100px_rgba(0,0,0,.65)]"
            >
                <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[var(--bg)]/95 px-4 py-3.5 backdrop-blur-xl sm:px-5 lg:px-6">
                    <div className="min-w-0 flex-1">
                        <span className="block truncate text-[8px] font-bold uppercase tracking-[0.18em] text-violet-300 sm:text-[9px]">
                            Administración · Impacto
                        </span>

                        <h1
                            id="impact-editor-title"
                            className="mt-0.5 truncate text-lg font-bold tracking-[-0.03em] text-[var(--text)] sm:text-xl"
                        >
                            {editing
                                ? 'Editar evidencia'
                                : 'Nueva evidencia'}
                        </h1>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1.5 text-[8px] font-semibold text-emerald-300">
                            <CheckCircle2
                                size={10}
                            />

                            Verificada
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/15 bg-cyan-300/[0.08] px-2.5 py-1.5 text-[8px] font-semibold text-cyan-300">
                            Pública
                        </span>
                    </div>
                </header>

                <div className="impact-editor-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                    {loading ? (
                        <div className="flex min-h-[450px] items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2
                                    size={26}
                                    strokeWidth={
                                        1.8
                                    }
                                    className="animate-spin text-violet-300"
                                />

                                <span className="text-[9px] text-[var(--muted)]">
                                    {editing
                                        ? 'Cargando evidencia...'
                                        : 'Preparando evidencia...'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto grid w-full max-w-[1180px] gap-4 p-3 pb-8 sm:p-5 lg:grid-cols-[minmax(0,1fr)_310px] lg:p-6">
                            <div className="min-w-0 space-y-4">
                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
                                            <FileEdit
                                                size={18}
                                            />
                                        </div>

                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                                                Información
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Datos de la evidencia
                                            </h2>

                                            <span className="text-[8px] text-[var(--muted)]">
                                                Los campos con * son obligatorios
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="sm:col-span-2">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                    Causa completada

                                                    <span className="ml-1 text-rose-300">
                                                        *
                                                    </span>
                                                </span>

                                                {attempted &&
                                                    !causeId && (
                                                        <span className="flex items-center gap-1 text-[8px] text-rose-300">
                                                            <AlertCircle
                                                                size={11}
                                                            />

                                                            Obligatorio
                                                        </span>
                                                    )}
                                            </div>

                                            <div className="relative">
                                                <select
                                                    value={
                                                        causeId
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setCauseId(
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    className={`${inputClass} appearance-none pr-10 ${attempted &&
                                                        !causeId
                                                        ? 'border-rose-400/40'
                                                        : ''
                                                        }`}
                                                >
                                                    <option value="">
                                                        Selecciona una causa completada
                                                    </option>

                                                    {causes.map(
                                                        (
                                                            cause,
                                                        ) => (
                                                            <option
                                                                key={
                                                                    cause.id
                                                                }
                                                                value={
                                                                    cause.id
                                                                }
                                                            >
                                                                {
                                                                    cause.titulo
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                </select>

                                                <ChevronDown
                                                    size={14}
                                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                                />
                                            </div>
                                        </label>

                                        <label className="sm:col-span-2">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                    Título

                                                    <span className="ml-1 text-rose-300">
                                                        *
                                                    </span>
                                                </span>

                                                {attempted &&
                                                    !title.trim() && (
                                                        <span className="flex items-center gap-1 text-[8px] text-rose-300">
                                                            <AlertCircle
                                                                size={11}
                                                            />

                                                            Obligatorio
                                                        </span>
                                                    )}
                                            </div>

                                            <input
                                                value={
                                                    title
                                                }
                                                maxLength={180}
                                                disabled={
                                                    saving
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setTitle(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ej. Entrega final de despensas a las familias"
                                                className={`${inputClass} ${attempted &&
                                                    !title.trim()
                                                    ? 'border-rose-400/40'
                                                    : ''
                                                    }`}
                                            />

                                            <div className="mt-1 flex justify-end">
                                                <span className="text-[8px] text-[var(--muted)]">
                                                    {
                                                        title.length
                                                    }
                                                    /180
                                                </span>
                                            </div>
                                        </label>

                                        <label className="sm:col-span-2">
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Descripción
                                            </span>

                                            <textarea
                                                rows={6}
                                                value={
                                                    description
                                                }
                                                disabled={
                                                    saving
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setDescription(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Describe qué se entregó, cómo se utilizaron los recursos, quiénes fueron beneficiados y cuál fue el resultado obtenido..."
                                                className={
                                                    textareaClass
                                                }
                                            />

                                            <span className="mt-1.5 block text-[8px] text-[var(--muted)]">
                                                Esta descripción será visible cuando la evidencia sea verificada y publicada.
                                            </span>
                                        </label>

                                        <label>
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                    Fecha de entrega

                                                    <span className="ml-1 text-rose-300">
                                                        *
                                                    </span>
                                                </span>

                                                {attempted &&
                                                    !deliveryDate && (
                                                        <span className="text-[8px] text-rose-300">
                                                            Obligatorio
                                                        </span>
                                                    )}
                                            </div>

                                            <input
                                                type="date"
                                                value={
                                                    deliveryDate
                                                }
                                                disabled={
                                                    saving
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setDeliveryDate(
                                                        event.target.value,
                                                    )
                                                }
                                                className={`${inputClass} ${attempted &&
                                                    !deliveryDate
                                                    ? 'border-rose-400/40'
                                                    : ''
                                                    }`}
                                            />
                                        </label>

                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Monto utilizado
                                            </span>

                                            <div className="relative">
                                                <CircleDollarSign
                                                    size={14}
                                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300"
                                                />

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        amountUsed
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setAmountUsed(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    className={`${inputClass} pl-9 ${attempted &&
                                                        !validAmount
                                                        ? 'border-rose-400/40'
                                                        : ''
                                                        }`}
                                                />
                                            </div>

                                            <span className="mt-1.5 block text-[8px] text-[var(--muted)]">
                                                Opcional. Indica cuánto se utilizó específicamente en esta entrega.
                                            </span>
                                        </label>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/[0.08] text-cyan-300">
                                            <ImagePlus
                                                size={18}
                                            />
                                        </div>

                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                                                Evidencia
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Fotografías y documentos
                                            </h2>

                                            <span className="text-[8px] text-[var(--muted)]">
                                                Obligatorio · hasta 12 archivos · imágenes o PDF · máximo 15 MB
                                            </span>
                                        </div>
                                    </div>

                                    <input
                                        ref={
                                            fileInputRef
                                        }
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
                                        className="hidden"
                                        onChange={
                                            handleInputFiles
                                        }
                                    />

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            if (
                                                !saving &&
                                                totalFiles <
                                                MAX_FILES
                                            ) {
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                        onKeyDown={(
                                            event,
                                        ) => {
                                            if (
                                                event.key ===
                                                'Enter' ||
                                                event.key ===
                                                ' '
                                            ) {
                                                event.preventDefault();

                                                if (
                                                    !saving &&
                                                    totalFiles <
                                                    MAX_FILES
                                                ) {
                                                    fileInputRef.current?.click();
                                                }
                                            }
                                        }}
                                        onDragEnter={(
                                            event,
                                        ) => {
                                            event.preventDefault();
                                            event.stopPropagation();

                                            if (
                                                !saving
                                            ) {
                                                setDragging(
                                                    true,
                                                );
                                            }
                                        }}
                                        onDragOver={(
                                            event,
                                        ) => {
                                            event.preventDefault();
                                            event.stopPropagation();

                                            if (
                                                !saving
                                            ) {
                                                event.dataTransfer.dropEffect =
                                                    'copy';

                                                setDragging(
                                                    true,
                                                );
                                            }
                                        }}
                                        onDragLeave={(
                                            event,
                                        ) => {
                                            event.preventDefault();
                                            event.stopPropagation();

                                            setDragging(
                                                false,
                                            );
                                        }}
                                        onDrop={
                                            handleDrop
                                        }
                                        className={`group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center outline-none transition-all duration-300 ${dragging
                                            ? 'border-violet-400/45 bg-violet-400/[0.08]'
                                            : attempted &&
                                                totalFiles ===
                                                0
                                                ? 'border-rose-400/35 bg-rose-400/[0.025]'
                                                : 'border-white/[0.09] bg-white/[0.015] hover:border-violet-400/25 hover:bg-violet-400/[0.025]'
                                            } ${saving ||
                                                totalFiles >=
                                                MAX_FILES
                                                ? 'cursor-not-allowed opacity-60'
                                                : ''
                                            }`}
                                    >
                                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-[var(--muted)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-violet-400/10 group-hover:text-violet-300">
                                            <UploadCloud
                                                size={22}
                                            />
                                        </div>

                                        <span className="mt-3 text-[10px] font-semibold text-[var(--text-soft)]">
                                            {dragging
                                                ? 'Suelta los archivos aquí'
                                                : totalFiles >=
                                                    MAX_FILES
                                                    ? 'Límite de archivos alcanzado'
                                                    : 'Arrastra fotografías o documentos aquí'}
                                        </span>

                                        <span className="mt-1 text-[8px] text-[var(--muted)]">
                                            {totalFiles >=
                                                MAX_FILES
                                                ? `${totalFiles}/${MAX_FILES} archivos`
                                                : 'o haz clic para seleccionar desde tu dispositivo'}
                                        </span>
                                    </div>

                                    {attempted &&
                                        totalFiles ===
                                        0 && (
                                            <div className="mt-2 flex items-center gap-1.5 text-[8px] text-rose-300">
                                                <AlertCircle
                                                    size={11}
                                                />

                                                Debes agregar al menos una fotografía o documento.
                                            </div>
                                        )}

                                    {totalFiles >
                                        0 && (
                                            <div className="mt-4">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                                        Evidencias seleccionadas
                                                    </span>

                                                    <span className="text-[8px] font-semibold text-cyan-300">
                                                        {
                                                            totalFiles
                                                        }
                                                        /
                                                        {
                                                            MAX_FILES
                                                        }
                                                    </span>
                                                </div>

                                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                                    {existingFiles.map(
                                                        (
                                                            file,
                                                        ) => {
                                                            const image =
                                                                file.tipo ===
                                                                'imagen';

                                                            const url =
                                                                image
                                                                    ? file.url ??
                                                                    getPublicUrl(
                                                                        file.ruta_storage,
                                                                    )
                                                                    : null;

                                                            return (
                                                                <div
                                                                    key={
                                                                        file.id
                                                                    }
                                                                    className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]"
                                                                >
                                                                    <div className="aspect-[16/10] overflow-hidden bg-black/20">
                                                                        {image &&
                                                                            url ? (
                                                                            <img
                                                                                src={
                                                                                    url
                                                                                }
                                                                                alt={
                                                                                    file.nombre_archivo ??
                                                                                    'Evidencia'
                                                                                }
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="grid h-full w-full place-items-center text-violet-300">
                                                                                <FileText
                                                                                    size={27}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-2 p-3">
                                                                        <span className="min-w-0 flex-1 truncate text-[8px] text-[var(--text-soft)]">
                                                                            {file.nombre_archivo ??
                                                                                'Archivo'}
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                saving
                                                                            }
                                                                            onClick={() =>
                                                                                setRemovedFileIds(
                                                                                    (
                                                                                        current,
                                                                                    ) => [
                                                                                            ...current,
                                                                                            file.id,
                                                                                        ],
                                                                                )
                                                                            }
                                                                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-400/[0.07] text-rose-300 transition-all hover:bg-rose-400/[0.13] disabled:opacity-40"
                                                                        >
                                                                            <Trash2
                                                                                size={13}
                                                                            />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}

                                                    {pendingFiles.map(
                                                        (
                                                            item,
                                                        ) => (
                                                            <div
                                                                key={
                                                                    item.key
                                                                }
                                                                className="overflow-hidden rounded-2xl border border-cyan-300/[0.08] bg-cyan-300/[0.02]"
                                                            >
                                                                <div className="aspect-[16/10] overflow-hidden bg-black/20">
                                                                    {item.previewUrl ? (
                                                                        <img
                                                                            src={
                                                                                item.previewUrl
                                                                            }
                                                                            alt={
                                                                                item.file.name
                                                                            }
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="grid h-full w-full place-items-center text-cyan-300">
                                                                            <FileText
                                                                                size={27}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2 p-3">
                                                                    <div className="min-w-0 flex-1">
                                                                        <span className="block truncate text-[8px] text-[var(--text-soft)]">
                                                                            {
                                                                                item.file.name
                                                                            }
                                                                        </span>

                                                                        <span className="text-[7px] text-[var(--muted)]">
                                                                            {formatBytes(
                                                                                item.file.size,
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                        onClick={() =>
                                                                            removePending(
                                                                                item.key,
                                                                            )
                                                                        }
                                                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-400/[0.07] text-rose-300 transition-all hover:bg-rose-400/[0.13] disabled:opacity-40"
                                                                    >
                                                                        <Trash2
                                                                            size={13}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </section>
                            </div>

                            <aside className="min-w-0 space-y-4">
                                <section className="rounded-2xl border border-violet-400/[0.08] bg-violet-400/[0.025] p-4 sm:rounded-3xl">
                                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-violet-300">
                                        Estado
                                    </span>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                Información completa
                                            </span>

                                            <strong className="text-[11px] text-violet-200">
                                                {
                                                    completion
                                                }
                                                %
                                            </strong>
                                        </div>

                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                            <div
                                                className="h-full rounded-full bg-violet-400 transition-all duration-500"
                                                style={{
                                                    width: `${completion}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {[
                                            {
                                                label:
                                                    'Causa completada',
                                                ready:
                                                    Boolean(
                                                        causeId,
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Título de evidencia',
                                                ready:
                                                    Boolean(
                                                        title.trim(),
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Descripción',
                                                ready:
                                                    Boolean(
                                                        description.trim(),
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Fecha de entrega',
                                                ready:
                                                    Boolean(
                                                        deliveryDate,
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Fotografías o documentos',
                                                ready:
                                                    totalFiles >
                                                    0,
                                            },
                                        ].map(
                                            (
                                                item,
                                            ) => (
                                                <div
                                                    key={
                                                        item.label
                                                    }
                                                    className="flex items-center gap-2 rounded-xl bg-white/[0.025] px-3 py-2.5"
                                                >
                                                    <div
                                                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${item.ready
                                                            ? 'bg-emerald-400/10 text-emerald-300'
                                                            : 'bg-white/[0.04] text-[var(--muted)]'
                                                            }`}
                                                    >
                                                        <Check
                                                            size={10}
                                                        />
                                                    </div>

                                                    <span className="text-[8px] text-[var(--text-soft)]">
                                                        {
                                                            item.label
                                                        }
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </section>

                                {selectedCause && (
                                    <section className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-400/[0.025] p-4 sm:rounded-3xl">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2
                                                size={14}
                                                className="text-emerald-300"
                                            />

                                            <span className="text-[9px] font-semibold text-emerald-200">
                                                Causa completada
                                            </span>
                                        </div>

                                        <h3 className="mt-3 text-[11px] font-semibold leading-5 text-[var(--text)]">
                                            {
                                                selectedCause.titulo
                                            }
                                        </h3>

                                        <div className="mt-3 space-y-2">
                                            <div className="flex justify-between gap-3">
                                                <span className="text-[7px] text-[var(--muted)]">
                                                    Categoría
                                                </span>

                                                <span className="text-[8px] text-[var(--text-soft)]">
                                                    {formatCategory(
                                                        selectedCause.categoria,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <span className="text-[7px] text-[var(--muted)]">
                                                    Completada
                                                </span>

                                                <span className="text-[8px] text-emerald-200">
                                                    {formatDate(
                                                        selectedCause.fecha_completada,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                <section className="rounded-2xl border border-cyan-300/[0.08] bg-cyan-300/[0.02] p-4 sm:rounded-3xl">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays
                                            size={14}
                                            className="text-cyan-300"
                                        />

                                        <span className="text-[9px] font-semibold text-cyan-200">
                                            Publicación
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-400/[0.08] text-[7px] font-bold text-violet-300">
                                                01
                                            </span>

                                            <div>
                                                <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                                    Guardar
                                                </span>

                                                <span className="text-[6px] leading-3 text-[var(--muted)]">
                                                    Se verifica y publica automáticamente cuando todos los datos y archivos terminan de guardarse.
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-400/[0.08] text-[7px] font-bold text-emerald-300">
                                                02
                                            </span>

                                            <div>
                                                <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                                    Verificar
                                                </span>

                                                <span className="text-[6px] leading-3 text-[var(--muted)]">
                                                    Los datos y archivos quedan asociados al administrador que guarda la evidencia.
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-300/[0.08] text-[7px] font-bold text-cyan-300">
                                                03
                                            </span>

                                            <div>
                                                <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                                    Publicar
                                                </span>

                                                <span className="text-[6px] leading-3 text-[var(--muted)]">
                                                    Al terminar correctamente, aparece automáticamente en Impacto.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {editing && (
                                    <section className="rounded-2xl border border-amber-300/[0.08] bg-amber-300/[0.025] p-4">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle
                                                size={13}
                                                className="mt-0.5 shrink-0 text-amber-200"
                                            />

                                            <span className="text-[7px] leading-4 text-amber-100">
                                                Si modificas la evidencia, vuelve a estado privado y pendiente de verificación.
                                            </span>
                                        </div>
                                    </section>
                                )}
                            </aside>

                            {attempted &&
                                !valid && (
                                    <div className="rounded-2xl border border-rose-400/[0.1] bg-rose-400/[0.025] p-4 lg:col-span-2">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle
                                                size={15}
                                                className="mt-0.5 shrink-0 text-rose-300"
                                            />

                                            <div>
                                                <span className="block text-[8px] font-semibold text-rose-300">
                                                    No se puede guardar todavía
                                                </span>

                                                <p className="mt-1 text-[7px] leading-4 text-[var(--muted)]">
                                                    Selecciona una causa completada, agrega un título, fecha de entrega y al menos una fotografía o documento.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            <div className="sticky bottom-3 z-30 lg:col-span-2">
                                <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[var(--bg)]/95 p-3 shadow-[0_20px_70px_rgba(0,0,0,.4)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                            {valid
                                                ? 'Todo listo para guardar'
                                                : 'Completa la evidencia'}
                                        </span>

                                        <span className="text-[6px] text-[var(--muted)]">
                                            La evidencia y sus archivos deben guardarse correctamente.
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void submit()
                                        }
                                        disabled={
                                            saving
                                        }
                                        className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-400/[0.12] px-5 text-[9px] font-bold text-violet-200 transition-all hover:bg-violet-400/[0.18] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />

                                                Guardando
                                            </>
                                        ) : (
                                            <>
                                                <Save
                                                    size={14}
                                                    className="transition-transform duration-300 group-hover:scale-110"
                                                />

                                                {editing
                                                    ? 'Guardar cambios'
                                                    : 'Crear evidencia'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}