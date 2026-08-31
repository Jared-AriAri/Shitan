import {
    type DragEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    AlertCircle,
    Check,
    ChevronDown,
    CircleDollarSign,
    FileText,
    Gift,
    HeartHandshake,
    ImagePlus,
    Loader2,
    Star,
    MapPin,
    PackagePlus,
    Plus,
    Send,
    Trash2,
    UploadCloud,
} from 'lucide-react';

import { createPortal } from 'react-dom';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

import GooglePlacePicker, {
    type GooglePlaceValue,
} from '../admin/causas/GooglePlacePicker';

interface CauseRequestFormProps {
    open: boolean;
    onClose: () => void;
    showToast: (
        message: string,
        type?:
            | 'success'
            | 'error'
            | 'info'
            | 'warning',
    ) => void;
}

type GoalType =
    | 'economica'
    | 'especie';


interface PendingImage {
    key: string;
    file: File;
    previewUrl: string;
    principal: boolean;
}

interface PendingProof {
    key: string;
    file: File;
}

interface Product {
    key: string;
    nombre: string;
    cantidad: string;
    unidad: string;
}

interface RequestForm {
    titulo: string;
    resumen: string;
    historia: string;
    categoria: string;
    nuevaCategoria: string;
    tipo_meta: GoalType;
    meta_economica: string;
    organizador: string;
    beneficiario: string;
    ubicacion: string;
    google_place_id: string | null;
    latitud: number | null;
    longitud: number | null;
}

const BASE_CATEGORIES = [
    'salud',
    'despensas',
    'educacion',
    'vivienda',
    'emergencia',
    'comunidad',
];

const UNITS = [
    'unidad',
    'pieza',
    'paquete',
    'caja',
    'kg',
    'litro',
    'bolsa',
    'par',
];

const IMAGE_BUCKET =
    'causas-imagenes';

const FILE_BUCKET =
    'causas-archivos';

const MAX_IMAGES =
    8;

const MAX_IMAGE_SIZE =
    8 * 1024 * 1024;

const MAX_PROOFS =
    8;

const MAX_PROOF_SIZE =
    15 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
];

const ALLOWED_PROOF_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
];

const INITIAL: RequestForm = {
    titulo: '',
    resumen: '',
    historia: '',
    categoria: '',
    nuevaCategoria: '',
    tipo_meta: 'economica',
    meta_economica: '',
    organizador: '',
    beneficiario: '',
    ubicacion: '',
    google_place_id: null,
    latitud: null,
    longitud: null,
};

const inputClass =
    'h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 text-[11px] text-[var(--text)] outline-none transition-all duration-300 placeholder:text-[var(--muted)] focus:border-rose-300/30 focus:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50';

const textareaClass =
    'w-full resize-y rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 text-[11px] leading-5 text-[var(--text)] outline-none transition-all duration-300 placeholder:text-[var(--muted)] focus:border-rose-300/30 focus:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50';


function createKey() {
    return (
        typeof crypto !==
            'undefined' &&
            crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random()
                .toString(36)
                .slice(2)
    );
}

function emptyProduct(): Product {
    return {
        key:
            createKey(),
        nombre:
            '',
        cantidad:
            '',
        unidad:
            'unidad',
    };
}

function formatBytes(
    bytes: number,
) {
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

function slugify(
    value: string,
) {
    return value
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            '',
        )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            '-',
        )
        .replace(
            /^-+|-+$/g,
            '',
        );
}

function formatCategory(
    value: string,
) {
    if (
        !value
    ) {
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

export default function CauseRequestForm({
    open,
    onClose,
    showToast,
}: CauseRequestFormProps) {
    const {
        session,
        profile,
    } =
        useAuth();

    const [
        form,
        setForm,
    ] =
        useState<RequestForm>(
            INITIAL,
        );

    const [
        categories,
        setCategories,
    ] =
        useState<string[]>(
            BASE_CATEGORIES,
        );

    const [
        attempted,
        setAttempted,
    ] =
        useState(
            false,
        );

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
        images,
        setImages,
    ] =
        useState<PendingImage[]>(
            [],
        );

    const [
        proofs,
        setProofs,
    ] =
        useState<PendingProof[]>(
            [],
        );

    const [
        products,
        setProducts,
    ] =
        useState<Product[]>(
            [],
        );

    const [
        draggingImages,
        setDraggingImages,
    ] =
        useState(
            false,
        );

    const [
        draggingProofs,
        setDraggingProofs,
    ] =
        useState(
            false,
        );

    const imageInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const proofInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const category =
        form.categoria ===
            '__otra__'
            ? form.nuevaCategoria
                .trim()
            : form.categoria
                .trim();

    const economicValid =
        form.tipo_meta !==
        'economica' ||
        Number(
            form.meta_economica,
        ) >
        0;

    const productsValid =
        form.tipo_meta !==
        'especie' ||
        (
            products.length >
            0 &&
            products.every(
                (
                    item,
                ) =>
                    Boolean(
                        item.nombre
                            .trim() &&
                        Number(
                            item.cantidad,
                        ) >
                        0 &&
                        item.unidad
                            .trim(),
                    ),
            )
        );

    const valid =
        Boolean(
            form.titulo
                .trim() &&
            form.resumen
                .trim() &&
            category &&
            form.beneficiario
                .trim() &&
            form.ubicacion
                .trim() &&
            economicValid &&
            productsValid,
        );

    const completedFields =
        useMemo(
            () => {
                const values = [
                    Boolean(
                        form.titulo
                            .trim(),
                    ),
                    Boolean(
                        category,
                    ),
                    Boolean(
                        form.resumen
                            .trim(),
                    ),
                    Boolean(
                        form.historia
                            .trim(),
                    ),
                    Boolean(
                        form.organizador
                            .trim(),
                    ),
                    Boolean(
                        form.beneficiario
                            .trim(),
                    ),
                    Boolean(
                        form.ubicacion
                            .trim(),
                    ),
                    images.length >
                    0,
                    proofs.length >
                    0,
                    form.tipo_meta ===
                        'economica'
                        ? Number(
                            form.meta_economica,
                        ) >
                        0
                        : products.length >
                        0 &&
                        products.every(
                            (
                                item,
                            ) =>
                                Boolean(
                                    item.nombre
                                        .trim() &&
                                    Number(
                                        item.cantidad,
                                    ) >
                                    0,
                                ),
                        ),
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
                form,
                category,
                images.length,
                proofs.length,
                products,
            ],
        );

    const setField = <
        K extends keyof RequestForm,
    >(
        field: K,
        value: RequestForm[K],
    ) => {
        setForm(
            (
                current,
            ) => ({
                ...current,
                [field]:
                    value,
            }),
        );
    };

    useEffect(
        () => {
            if (
                !open
            ) {
                return;
            }

            let active =
                true;

            const loadCategories =
                async () => {
                    setLoading(
                        true,
                    );

                    try {
                        const {
                            data,
                            error,
                        } =
                            await supabase
                                .from(
                                    'causas',
                                )
                                .select(
                                    'categoria',
                                )
                                .in(
                                    'estado',
                                    [
                                        'publicado',
                                        'activa',
                                        'meta_alcanzada',
                                        'completada',
                                    ],
                                )
                                .order(
                                    'categoria',
                                );

                        if (
                            error
                        ) {
                            throw error;
                        }

                        const categorySet =
                            new Set(
                                BASE_CATEGORIES,
                            );

                        data?.forEach(
                            (
                                row,
                            ) => {
                                if (
                                    row.categoria
                                ) {
                                    categorySet.add(
                                        row.categoria,
                                    );
                                }
                            },
                        );

                        if (
                            active
                        ) {
                            setCategories(
                                [
                                    ...categorySet,
                                ].sort(
                                    (
                                        a,
                                        b,
                                    ) =>
                                        a.localeCompare(
                                            b,
                                            'es-MX',
                                        ),
                                ),
                            );
                        }
                    } catch (
                    error
                    ) {
                        if (
                            active
                        ) {
                            showToast(
                                error instanceof
                                    Error
                                    ? error.message
                                    : 'No se pudieron cargar las categorías.',
                                'error',
                            );
                        }
                    } finally {
                        if (
                            active
                        ) {
                            setLoading(
                                false,
                            );
                        }
                    }
                };

            setAttempted(
                false,
            );

            setForm({
                ...INITIAL,
                organizador:
                    profile?.full_name ??
                    '',
            });

            setImages(
                (
                    current,
                ) => {
                    current.forEach(
                        (
                            item,
                        ) =>
                            URL.revokeObjectURL(
                                item.previewUrl,
                            ),
                    );

                    return [];
                },
            );

            setProofs(
                [],
            );

            setProducts(
                [],
            );

            void loadCategories();

            return () => {
                active =
                    false;
            };
        },
        [
            open,
            profile?.full_name,
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

    const placeChange =
        (
            place:
                GooglePlaceValue,
        ) => {
            setForm(
                (
                    current,
                ) => ({
                    ...current,
                    ...place,
                }),
            );
        };

    const changeGoalType =
        (
            type:
                GoalType,
        ) => {
            setField(
                'tipo_meta',
                type,
            );

            if (
                type ===
                'especie' &&
                products.length ===
                0
            ) {
                setProducts([
                    emptyProduct(),
                ]);
            }
        };

    const updateProduct =
        (
            productKey:
                string,
            field:
                | 'nombre'
                | 'cantidad'
                | 'unidad',
            value:
                string,
        ) => {
            setProducts(
                (
                    current,
                ) =>
                    current.map(
                        (
                            item,
                        ) =>
                            item.key ===
                                productKey
                                ? {
                                    ...item,
                                    [field]:
                                        value,
                                }
                                : item,
                    ),
            );
        };

    const addImages =
        (
            files: File[],
        ) => {
            if (
                !files.length
            ) {
                return;
            }

            const available =
                MAX_IMAGES -
                images.length;

            if (
                available <=
                0
            ) {
                showToast(
                    `Puedes agregar máximo ${MAX_IMAGES} imágenes.`,
                    'warning',
                );

                return;
            }

            const accepted:
                File[] =
                [];

            for (
                const file of
                files
            ) {
                if (
                    !ALLOWED_IMAGE_TYPES.includes(
                        file.type,
                    )
                ) {
                    showToast(
                        `${file.name}: formato de imagen no permitido.`,
                        'warning',
                    );

                    continue;
                }

                if (
                    file.size >
                    MAX_IMAGE_SIZE
                ) {
                    showToast(
                        `${file.name}: supera el límite de 8 MB.`,
                        'warning',
                    );

                    continue;
                }

                const duplicated =
                    images.some(
                        (
                            item,
                        ) =>
                            item.file.name ===
                            file.name &&
                            item.file.size ===
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

            setImages(
                (
                    current,
                ) => {
                    const hasPrincipal =
                        current.some(
                            (
                                item,
                            ) =>
                                item.principal,
                        );

                    return [
                        ...current,
                        ...limited.map(
                            (
                                file,
                                index,
                            ) => ({
                                key:
                                    createKey(),
                                file,
                                previewUrl:
                                    URL.createObjectURL(
                                        file,
                                    ),
                                principal:
                                    !hasPrincipal &&
                                    index ===
                                    0,
                            }),
                        ),
                    ];
                },
            );
        };

    const removeImage =
        (
            key: string,
        ) => {
            setImages(
                (
                    current,
                ) => {
                    const target =
                        current.find(
                            (
                                item,
                            ) =>
                                item.key ===
                                key,
                        );

                    if (
                        target
                    ) {
                        URL.revokeObjectURL(
                            target.previewUrl,
                        );
                    }

                    const next =
                        current.filter(
                            (
                                item,
                            ) =>
                                item.key !==
                                key,
                        );

                    if (
                        next.length &&
                        !next.some(
                            (
                                item,
                            ) =>
                                item.principal,
                        )
                    ) {
                        next[0] = {
                            ...next[0],
                            principal:
                                true,
                        };
                    }

                    return next;
                },
            );
        };

    const setPrincipalImage =
        (
            key: string,
        ) => {
            setImages(
                (
                    current,
                ) =>
                    current.map(
                        (
                            item,
                        ) => ({
                            ...item,
                            principal:
                                item.key ===
                                key,
                        }),
                    ),
            );
        };

    const handleImageDrop =
        (
            event:
                DragEvent<HTMLDivElement>,
        ) => {
            event.preventDefault();
            event.stopPropagation();

            setDraggingImages(
                false,
            );

            if (
                saving
            ) {
                return;
            }

            addImages(
                Array.from(
                    event.dataTransfer
                        .files,
                ),
            );
        };

    const addProofs =
        (
            files: File[],
        ) => {
            if (
                !files.length
            ) {
                return;
            }

            const available =
                MAX_PROOFS -
                proofs.length;

            if (
                available <=
                0
            ) {
                showToast(
                    `Puedes agregar máximo ${MAX_PROOFS} archivos de prueba.`,
                    'warning',
                );

                return;
            }

            const accepted:
                File[] =
                [];

            for (
                const file of
                files
            ) {
                if (
                    !ALLOWED_PROOF_TYPES.includes(
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
                    MAX_PROOF_SIZE
                ) {
                    showToast(
                        `${file.name}: supera el límite de 15 MB.`,
                        'warning',
                    );

                    continue;
                }

                const duplicated =
                    proofs.some(
                        (
                            item,
                        ) =>
                            item.file.name ===
                            file.name &&
                            item.file.size ===
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

            setProofs(
                (
                    current,
                ) => [
                        ...current,
                        ...accepted
                            .slice(
                                0,
                                available,
                            )
                            .map(
                                (
                                    file,
                                ) => ({
                                    key:
                                        createKey(),
                                    file,
                                }),
                            ),
                    ],
            );
        };

    const handleProofDrop =
        (
            event:
                DragEvent<HTMLDivElement>,
        ) => {
            event.preventDefault();
            event.stopPropagation();

            setDraggingProofs(
                false,
            );

            if (
                saving
            ) {
                return;
            }

            addProofs(
                Array.from(
                    event.dataTransfer
                        .files,
                ),
            );
        };

    const submit =
        async () => {
            setAttempted(
                true,
            );

            if (
                !session?.user
            ) {
                showToast(
                    'Debes iniciar sesión para enviar una solicitud.',
                    'warning',
                );

                return;
            }

            if (
                !valid
            ) {
                showToast(
                    'Revisa los campos obligatorios.',
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

            const uploadedImagePaths:
                string[] =
                [];

            const uploadedFilePaths:
                string[] =
                [];

            try {
                const slugBase =
                    slugify(
                        form.titulo,
                    ) ||
                    'solicitud';

                const slug =
                    `${slugBase}-${Date.now()}`;

                const {
                    data:
                    cause,
                    error:
                    causeError,
                } =
                    await supabase
                        .from(
                            'causas',
                        )
                        .insert({
                            slug,
                            titulo:
                                form.titulo
                                    .trim(),
                            resumen:
                                form.resumen
                                    .trim() ||
                                null,
                            historia:
                                form.historia
                                    .trim() ||
                                null,
                            categoria:
                                category,
                            estado:
                                'solicitud',
                            meta_economica:
                                form.tipo_meta ===
                                    'economica'
                                    ? Number(
                                        form.meta_economica,
                                    )
                                    : null,
                            organizador:
                                form.organizador
                                    .trim() ||
                                profile?.full_name ||
                                null,
                            beneficiario:
                                form.beneficiario
                                    .trim() ||
                                null,
                            ubicacion:
                                form.ubicacion
                                    .trim() ||
                                null,
                            fecha_inicio:
                                null,
                            fecha_limite:
                                null,
                            fecha_completada:
                                null,
                            destacada:
                                false,
                            orden:
                                0,
                            creado_por:
                                session.user.id,
                            tipo_meta:
                                form.tipo_meta,
                            latitud:
                                form.latitud,
                            longitud:
                                form.longitud,
                            google_place_id:
                                form.google_place_id,
                        })
                        .select(
                            'id',
                        )
                        .single();

                if (
                    causeError
                ) {
                    throw causeError;
                }

                if (
                    !cause?.id
                ) {
                    throw new Error(
                        'No se pudo obtener el ID de la solicitud.',
                    );
                }

                if (
                    form.tipo_meta ===
                    'especie'
                ) {
                    const {
                        error:
                        productsError,
                    } =
                        await supabase
                            .from(
                                'metas_especie',
                            )
                            .insert(
                                products.map(
                                    (
                                        item,
                                        index,
                                    ) => ({
                                        causa_id:
                                            cause.id,
                                        nombre:
                                            item.nombre
                                                .trim(),
                                        descripcion:
                                            null,
                                        unidad:
                                            item.unidad
                                                .trim(),
                                        cantidad_objetivo:
                                            Number(
                                                item.cantidad,
                                            ),
                                        orden:
                                            index,
                                    }),
                                ),
                            );

                    if (
                        productsError
                    ) {
                        throw productsError;
                    }
                }

                for (
                    let index = 0;
                    index <
                    images.length;
                    index += 1
                ) {
                    const image =
                        images[index];

                    const extension =
                        image.file.name
                            .split('.')
                            .pop()
                            ?.toLowerCase() ||
                        image.file.type
                            .split('/')
                            .pop() ||
                        'jpg';

                    const storagePath =
                        `${cause.id}/${Date.now()}-${createKey()}.${extension}`;

                    const {
                        error:
                        uploadError,
                    } =
                        await supabase.storage
                            .from(
                                IMAGE_BUCKET,
                            )
                            .upload(
                                storagePath,
                                image.file,
                                {
                                    cacheControl:
                                        '3600',
                                    upsert:
                                        false,
                                    contentType:
                                        image.file.type,
                                },
                            );

                    if (
                        uploadError
                    ) {
                        throw uploadError;
                    }

                    uploadedImagePaths.push(
                        storagePath,
                    );

                    const {
                        data:
                        publicUrlData,
                    } =
                        supabase.storage
                            .from(
                                IMAGE_BUCKET,
                            )
                            .getPublicUrl(
                                storagePath,
                            );

                    const {
                        error:
                        imageInsertError,
                    } =
                        await supabase
                            .from(
                                'imagenes_causa',
                            )
                            .insert({
                                causa_id:
                                    cause.id,
                                storage_path:
                                    storagePath,
                                public_url:
                                    publicUrlData.publicUrl,
                                nombre_archivo:
                                    image.file.name,
                                mime_type:
                                    image.file.type ||
                                    null,
                                size_bytes:
                                    image.file.size,
                                es_principal:
                                    image.principal,
                                orden:
                                    index,
                            });

                    if (
                        imageInsertError
                    ) {
                        throw imageInsertError;
                    }
                }

                for (
                    let index = 0;
                    index <
                    proofs.length;
                    index += 1
                ) {
                    const proof =
                        proofs[index];

                    const extension =
                        proof.file.name
                            .split('.')
                            .pop()
                            ?.toLowerCase() ||
                        proof.file.type
                            .split('/')
                            .pop() ||
                        'bin';

                    const storagePath =
                        `${cause.id}/${Date.now()}-${createKey()}.${extension}`;

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
                                proof.file,
                                {
                                    cacheControl:
                                        '3600',
                                    upsert:
                                        false,
                                    contentType:
                                        proof.file.type ||
                                        undefined,
                                },
                            );

                    if (
                        uploadError
                    ) {
                        throw uploadError;
                    }

                    uploadedFilePaths.push(
                        storagePath,
                    );

                    const {
                        data:
                        publicUrlData,
                    } =
                        supabase.storage
                            .from(
                                FILE_BUCKET,
                            )
                            .getPublicUrl(
                                storagePath,
                            );

                    const {
                        error:
                        fileInsertError,
                    } =
                        await supabase
                            .from(
                                'archivos_causa',
                            )
                            .insert({
                                causa_id:
                                    cause.id,
                                storage_path:
                                    storagePath,
                                public_url:
                                    publicUrlData.publicUrl,
                                nombre_archivo:
                                    proof.file.name,
                                mime_type:
                                    proof.file.type ||
                                    null,
                                size_bytes:
                                    proof.file.size,
                                orden:
                                    index,
                            });

                    if (
                        fileInsertError
                    ) {
                        throw fileInsertError;
                    }
                }

                showToast(
                    'Solicitud enviada correctamente con su información, productos, imágenes y documentación. Un administrador la revisará antes de publicarla.',
                    'success',
                );

                onClose();
            } catch (
            error
            ) {
                if (
                    uploadedImagePaths.length >
                    0
                ) {
                    const {
                        error:
                        cleanupImageError,
                    } =
                        await supabase.storage
                            .from(
                                IMAGE_BUCKET,
                            )
                            .remove(
                                uploadedImagePaths,
                            );

                    if (
                        cleanupImageError
                    ) {
                        console.error(
                            'No se pudieron limpiar algunas imágenes:',
                            cleanupImageError,
                        );
                    }
                }

                if (
                    uploadedFilePaths.length >
                    0
                ) {
                    const {
                        error:
                        cleanupFileError,
                    } =
                        await supabase.storage
                            .from(
                                FILE_BUCKET,
                            )
                            .remove(
                                uploadedFilePaths,
                            );

                    if (
                        cleanupFileError
                    ) {
                        console.error(
                            'No se pudieron limpiar algunos documentos:',
                            cleanupFileError,
                        );
                    }
                }

                console.error(
                    'Error al enviar solicitud de causa:',
                    error,
                );

                showToast(
                    error instanceof
                        Error
                        ? error.message
                        : 'No se pudo enviar la solicitud.',
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
        <div
            className="fixed inset-x-0 bottom-0 top-[76px] z-[155] flex items-end justify-center overflow-hidden bg-black/70 backdrop-blur-[6px] sm:items-center sm:p-4 lg:p-6"
            onMouseDown={(
                event,
            ) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !saving
                ) {
                    onClose();
                }
            }}
        >
            <style>{`
                @keyframes requestCauseEnter {
                    from {
                        opacity: 0;
                        transform: translate3d(0, 24px, 0) scale(.985);
                    }

                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                }

                .request-cause-scroll {
                    overscroll-behavior: contain;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-gutter: stable;
                }

                @media (max-width: 639px) {
                    .request-cause-dialog {
                        height: 100%;
                        max-height: 100%;
                        border-bottom-left-radius: 0;
                        border-bottom-right-radius: 0;
                    }

                    .request-cause-scroll {
                        height: 100%;
                        max-height: 100%;
                    }
                }
            `}</style>

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="request-cause-title"
                className="request-cause-dialog flex h-full max-h-full w-full min-w-0 flex-col overflow-hidden rounded-t-[28px] border border-white/[0.07] bg-[var(--bg)] shadow-[0_-20px_80px_rgba(0,0,0,.55)] animate-[requestCauseEnter_.3s_cubic-bezier(.22,1,.36,1)] sm:h-[min(88dvh,920px)] sm:max-w-[1220px] sm:rounded-[28px] sm:shadow-[0_30px_100px_rgba(0,0,0,.65)]"
                onMouseDown={(
                    event,
                ) =>
                    event.stopPropagation()
                }
            >
                <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[var(--bg)]/95 px-4 py-3.5 backdrop-blur-xl sm:px-5 lg:px-6">
                    <div className="min-w-0 flex-1">
                        <span className="block truncate text-[8px] font-bold uppercase tracking-[0.18em] text-rose-300 sm:text-[9px]">
                            Donante · Solicitud de causa
                        </span>

                        <h1
                            id="request-cause-title"
                            className="mt-0.5 truncate text-lg font-bold tracking-[-0.03em] text-[var(--text)] sm:text-xl"
                        >
                            Proponer una causa
                        </h1>
                    </div>

                    <span className="hidden items-center gap-1.5 rounded-full border border-amber-300/15 bg-amber-300/[0.08] px-2.5 py-1.5 text-[8px] font-semibold text-amber-200 sm:inline-flex">
                        Solicitud
                    </span>
                </header>

                <div className="request-cause-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                    {loading ? (
                        <div className="flex min-h-[460px] items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2
                                    size={26}
                                    className="animate-spin text-rose-300"
                                />

                                <span className="text-[9px] text-[var(--muted)]">
                                    Preparando formulario...
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto grid w-full max-w-[1180px] gap-4 p-3 pb-8 sm:p-5 lg:grid-cols-[minmax(0,1fr)_310px] lg:p-6">
                            <div className="min-w-0 space-y-4">
                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-300/[0.09] text-rose-300">
                                            <HeartHandshake
                                                size={18}
                                            />
                                        </div>

                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                                                Información
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Datos de la causa
                                            </h2>

                                            <span className="text-[8px] text-[var(--muted)]">
                                                Los campos con * son obligatorios
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="sm:col-span-2">
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Título *
                                            </span>

                                            <input
                                                value={
                                                    form.titulo
                                                }
                                                maxLength={180}
                                                disabled={
                                                    saving
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'titulo',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ej. Apoyo alimentario para familias"
                                                className={`${inputClass} ${attempted &&
                                                    !form.titulo.trim()
                                                    ? 'border-rose-400/40'
                                                    : ''
                                                    }`}
                                            />
                                        </label>

                                        <label className="sm:col-span-2">
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Resumen *
                                            </span>

                                            <textarea
                                                rows={4}
                                                value={
                                                    form.resumen
                                                }
                                                disabled={
                                                    saving
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'resumen',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Resume qué se necesita y quiénes se beneficiarán."
                                                className={`${textareaClass} ${attempted &&
                                                    !form.resumen.trim()
                                                    ? 'border-rose-400/40'
                                                    : ''
                                                    }`}
                                            />
                                        </label>

                                        <label className="sm:col-span-2">
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Historia
                                            </span>

                                            <textarea
                                                rows={7}
                                                value={
                                                    form.historia
                                                }
                                                disabled={
                                                    saving
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'historia',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Cuenta el contexto de la causa, por qué es importante y qué impacto se espera lograr."
                                                className={
                                                    textareaClass
                                                }
                                            />
                                        </label>

                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Categoría *
                                            </span>

                                            <div className="relative">
                                                <select
                                                    value={
                                                        form.categoria
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setField(
                                                            'categoria',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={`${inputClass} appearance-none pr-10 ${attempted &&
                                                        !category
                                                        ? 'border-rose-400/40'
                                                        : ''
                                                        }`}
                                                >
                                                    <option value="">
                                                        Selecciona una categoría
                                                    </option>

                                                    {categories
                                                        .filter(
                                                            (
                                                                item,
                                                            ) =>
                                                                item !==
                                                                'otra',
                                                        )
                                                        .map(
                                                            (
                                                                item,
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        item
                                                                    }
                                                                    value={
                                                                        item
                                                                    }
                                                                >
                                                                    {formatCategory(
                                                                        item,
                                                                    )}
                                                                </option>
                                                            ),
                                                        )}

                                                    <option value="__otra__">
                                                        + Otra categoría
                                                    </option>
                                                </select>

                                                <ChevronDown
                                                    size={14}
                                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                                />
                                            </div>
                                        </label>

                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Beneficiario *
                                            </span>

                                            <div className="relative">
                                                <Gift
                                                    size={14}
                                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300"
                                                />

                                                <input
                                                    value={
                                                        form.beneficiario
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setField(
                                                            'beneficiario',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Persona, familia o comunidad"
                                                    className={`${inputClass} pl-9`}
                                                />
                                            </div>
                                        </label>

                                        {form.categoria ===
                                            '__otra__' && (
                                                <label className="sm:col-span-2">
                                                    <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                        Nueva categoría *
                                                    </span>

                                                    <input
                                                        value={
                                                            form.nuevaCategoria
                                                        }
                                                        disabled={
                                                            saving
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setField(
                                                                'nuevaCategoria',
                                                                event.target.value,
                                                            )
                                                        }
                                                        placeholder="Escribe la categoría"
                                                        className={
                                                            inputClass
                                                        }
                                                    />
                                                </label>
                                            )}

                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Organizador
                                            </span>

                                            <input
                                                value={
                                                    form.organizador
                                                }
                                                disabled={
                                                    saving
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'organizador',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Nombre del organizador"
                                                className={
                                                    inputClass
                                                }
                                            />
                                        </label>

                                        <div>
                                            <div className="mb-2 flex items-center gap-2">
                                                <MapPin
                                                    size={13}
                                                    className="text-rose-300"
                                                />

                                                <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                    Ubicación *
                                                </span>
                                            </div>

                                            <GooglePlacePicker
                                                value={{
                                                    ubicacion:
                                                        form.ubicacion,
                                                    google_place_id:
                                                        form.google_place_id,
                                                    latitud:
                                                        form.latitud,
                                                    longitud:
                                                        form.longitud,
                                                }}
                                                onChange={
                                                    placeChange
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/[0.08] text-amber-200">
                                            <PackagePlus
                                                size={18}
                                            />
                                        </div>

                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                                                Meta
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Tipo de apoyo solicitado
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            disabled={
                                                saving
                                            }
                                            onClick={() =>
                                                changeGoalType(
                                                    'economica',
                                                )
                                            }
                                            className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-[9px] font-semibold transition-all ${form.tipo_meta ===
                                                'economica'
                                                ? 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200'
                                                : 'border-white/[0.05] bg-white/[0.02] text-[var(--muted)]'
                                                }`}
                                        >
                                            <CircleDollarSign
                                                size={15}
                                            />

                                            Económica
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                saving
                                            }
                                            onClick={() =>
                                                changeGoalType(
                                                    'especie',
                                                )
                                            }
                                            className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-[9px] font-semibold transition-all ${form.tipo_meta ===
                                                'especie'
                                                ? 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200'
                                                : 'border-white/[0.05] bg-white/[0.02] text-[var(--muted)]'
                                                }`}
                                        >
                                            <PackagePlus
                                                size={15}
                                            />

                                            En especie
                                        </button>
                                    </div>

                                    {form.tipo_meta ===
                                        'economica' ? (
                                        <div className="mt-4">
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Meta económica *
                                            </span>

                                            <div className="relative">
                                                <CircleDollarSign
                                                    size={14}
                                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300"
                                                />

                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="0.01"
                                                    value={
                                                        form.meta_economica
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setField(
                                                            'meta_economica',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    className={`${inputClass} pl-9`}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-5">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-[10px] font-semibold text-[var(--text-soft)]">
                                                        Productos a recolectar
                                                        <span className="ml-1 text-rose-300">
                                                            *
                                                        </span>
                                                    </h3>

                                                    <span className="text-[8px] text-[var(--muted)]">
                                                        Agrega cada producto y la cantidad necesaria.
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        saving
                                                    }
                                                    onClick={() =>
                                                        setProducts(
                                                            (
                                                                current,
                                                            ) => [
                                                                    ...current,
                                                                    emptyProduct(),
                                                                ],
                                                        )
                                                    }
                                                    className="group flex h-9 shrink-0 items-center gap-2 rounded-xl bg-amber-300/10 px-3 text-[9px] font-semibold text-amber-200 transition-all duration-300 hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Plus
                                                        size={14}
                                                        className="transition-transform duration-500 group-hover:rotate-180"
                                                    />
                                                    Agregar
                                                </button>
                                            </div>

                                            {attempted &&
                                                !productsValid && (
                                                    <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-400/10 bg-rose-400/[0.04] p-3">
                                                        <AlertCircle
                                                            size={14}
                                                            className="mt-0.5 shrink-0 text-rose-300"
                                                        />

                                                        <span className="text-[8px] leading-4 text-rose-300">
                                                            Agrega al menos un producto y completa su nombre, cantidad y unidad.
                                                        </span>
                                                    </div>
                                                )}

                                            <div className="space-y-3">
                                                {products.map(
                                                    (
                                                        item,
                                                        index,
                                                    ) => {
                                                        const nameError =
                                                            attempted &&
                                                            !item.nombre
                                                                .trim();

                                                        const quantityError =
                                                            attempted &&
                                                            Number(
                                                                item.cantidad,
                                                            ) <=
                                                            0;

                                                        return (
                                                            <div
                                                                key={
                                                                    item.key
                                                                }
                                                                className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4"
                                                            >
                                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                                    <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                                                        Producto{' '}
                                                                        {index +
                                                                            1}
                                                                    </span>

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                        onClick={() =>
                                                                            setProducts(
                                                                                (
                                                                                    current,
                                                                                ) =>
                                                                                    current.filter(
                                                                                        (
                                                                                            product,
                                                                                        ) =>
                                                                                            product.key !==
                                                                                            item.key,
                                                                                    ),
                                                                            )
                                                                        }
                                                                        className="group grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition-all hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        <Trash2
                                                                            size={14}
                                                                            className="transition-transform duration-300 group-hover:scale-110"
                                                                        />
                                                                    </button>
                                                                </div>

                                                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_130px]">
                                                                    <label>
                                                                        <span className="mb-1.5 block text-[8px] text-[var(--muted)]">
                                                                            Producto *
                                                                        </span>

                                                                        <input
                                                                            value={
                                                                                item.nombre
                                                                            }
                                                                            disabled={
                                                                                saving
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateProduct(
                                                                                    item.key,
                                                                                    'nombre',
                                                                                    event.target.value,
                                                                                )
                                                                            }
                                                                            placeholder="Ej. Despensa básica"
                                                                            className={`${inputClass} ${nameError
                                                                                ? 'border-rose-400/40'
                                                                                : ''
                                                                                }`}
                                                                        />
                                                                    </label>

                                                                    <label>
                                                                        <span className="mb-1.5 block text-[8px] text-[var(--muted)]">
                                                                            Cantidad *
                                                                        </span>

                                                                        <input
                                                                            type="number"
                                                                            min="0.01"
                                                                            step="0.01"
                                                                            value={
                                                                                item.cantidad
                                                                            }
                                                                            disabled={
                                                                                saving
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateProduct(
                                                                                    item.key,
                                                                                    'cantidad',
                                                                                    event.target.value,
                                                                                )
                                                                            }
                                                                            placeholder="Ej. 100"
                                                                            className={`${inputClass} ${quantityError
                                                                                ? 'border-rose-400/40'
                                                                                : ''
                                                                                }`}
                                                                        />
                                                                    </label>

                                                                    <label>
                                                                        <span className="mb-1.5 block text-[8px] text-[var(--muted)]">
                                                                            Unidad *
                                                                        </span>

                                                                        <div className="relative">
                                                                            <select
                                                                                value={
                                                                                    item.unidad
                                                                                }
                                                                                disabled={
                                                                                    saving
                                                                                }
                                                                                onChange={(
                                                                                    event,
                                                                                ) =>
                                                                                    updateProduct(
                                                                                        item.key,
                                                                                        'unidad',
                                                                                        event.target.value,
                                                                                    )
                                                                                }
                                                                                className={`${inputClass} appearance-none pr-9`}
                                                                            >
                                                                                {UNITS.map(
                                                                                    (
                                                                                        unit,
                                                                                    ) => (
                                                                                        <option
                                                                                            key={
                                                                                                unit
                                                                                            }
                                                                                            value={
                                                                                                unit
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                unit
                                                                                            }
                                                                                        </option>
                                                                                    ),
                                                                                )}
                                                                            </select>

                                                                            <ChevronDown
                                                                                size={13}
                                                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                                                            />
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}

                                                {!products.length && (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            saving
                                                        }
                                                        onClick={() =>
                                                            setProducts([
                                                                emptyProduct(),
                                                            ])
                                                        }
                                                        className={`group flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-white/[0.015] text-[var(--muted)] transition-all hover:border-amber-300/20 hover:bg-amber-300/[0.02] disabled:cursor-not-allowed disabled:opacity-50 ${attempted &&
                                                            !productsValid
                                                            ? 'border-rose-400/30'
                                                            : 'border-white/[0.08]'
                                                            }`}
                                                    >
                                                        <PackagePlus
                                                            size={21}
                                                            className="transition-transform duration-300 group-hover:scale-110"
                                                        />

                                                        <span className="mt-2 text-[9px] font-semibold">
                                                            Agregar primer producto
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                                                Fotografías
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Imágenes de apoyo
                                            </h2>

                                            <span className="text-[8px] text-[var(--muted)]">
                                                Hasta 8 imágenes · JPG, PNG, WebP o AVIF · máximo 8 MB
                                            </span>
                                        </div>
                                    </div>

                                    <input
                                        ref={
                                            imageInputRef
                                        }
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        className="hidden"
                                        onChange={(
                                            event,
                                        ) => {
                                            addImages(
                                                Array.from(
                                                    event.target.files ??
                                                    [],
                                                ),
                                            );

                                            event.target.value =
                                                '';
                                        }}
                                    />

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            if (
                                                !saving &&
                                                images.length <
                                                MAX_IMAGES
                                            ) {
                                                imageInputRef.current?.click();
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
                                                    images.length <
                                                    MAX_IMAGES
                                                ) {
                                                    imageInputRef.current?.click();
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
                                                setDraggingImages(
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

                                                setDraggingImages(
                                                    true,
                                                );
                                            }
                                        }}
                                        onDragLeave={(
                                            event,
                                        ) => {
                                            event.preventDefault();
                                            event.stopPropagation();

                                            setDraggingImages(
                                                false,
                                            );
                                        }}
                                        onDrop={
                                            handleImageDrop
                                        }
                                        className={`group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center outline-none transition-all duration-300 ${draggingImages
                                            ? 'border-cyan-300/45 bg-cyan-300/[0.08] shadow-[inset_0_0_0_1px_rgba(103,232,249,.08)]'
                                            : 'border-white/[0.09] bg-white/[0.015] hover:border-cyan-300/25 hover:bg-cyan-300/[0.025] focus:border-cyan-300/30'
                                            } ${saving ||
                                                images.length >=
                                                MAX_IMAGES
                                                ? 'cursor-not-allowed opacity-60'
                                                : ''
                                            }`}
                                    >
                                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/[0.07] text-cyan-300">
                                            <UploadCloud
                                                size={22}
                                            />
                                        </div>

                                        <span className="mt-3 text-[10px] font-semibold text-[var(--text-soft)]">
                                            Arrastra fotografías aquí
                                        </span>

                                        <span className="mt-1 text-[8px] text-[var(--muted)]">
                                            o haz clic para seleccionar archivos
                                        </span>
                                    </div>

                                    {images.length >
                                        0 && (
                                            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                                {images.map(
                                                    (
                                                        item,
                                                    ) => (
                                                        <div
                                                            key={
                                                                item.key
                                                            }
                                                            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]"
                                                        >
                                                            <div className="relative aspect-[16/10] overflow-hidden bg-black/20">
                                                                <img
                                                                    src={
                                                                        item.previewUrl
                                                                    }
                                                                    alt={
                                                                        item.file.name
                                                                    }
                                                                    className="h-full w-full object-cover"
                                                                />

                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        saving
                                                                    }
                                                                    onClick={() =>
                                                                        setPrincipalImage(
                                                                            item.key,
                                                                        )
                                                                    }
                                                                    className={`absolute left-2 top-2 inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[7px] font-bold backdrop-blur-md transition-all ${item.principal
                                                                        ? 'border-amber-300/30 bg-amber-300 text-black shadow-[0_8px_24px_rgba(251,191,36,.25)]'
                                                                        : 'border-white/10 bg-black/45 text-white hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-200'
                                                                        }`}
                                                                >
                                                                    <Star
                                                                        size={11}
                                                                        className={
                                                                            item.principal
                                                                                ? 'fill-current'
                                                                                : ''
                                                                        }
                                                                    />

                                                                    {item.principal
                                                                        ? 'Principal'
                                                                        : 'Hacer principal'}
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center gap-2 p-3">
                                                                <div className="min-w-0 flex-1">
                                                                    <span className="block truncate text-[8px] text-[var(--text-soft)]">
                                                                        {item.file.name}
                                                                    </span>

                                                                    <span className="mt-0.5 block text-[7px] text-[var(--muted)]">
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
                                                                        setPrincipalImage(
                                                                            item.key,
                                                                        )
                                                                    }
                                                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-all ${item.principal
                                                                        ? 'border-amber-300/25 bg-amber-300/[0.12] text-amber-200'
                                                                        : 'border-white/[0.06] bg-white/[0.03] text-[var(--muted)] hover:border-amber-300/20 hover:bg-amber-300/[0.07] hover:text-amber-200'
                                                                        }`}
                                                                    aria-label={
                                                                        item.principal
                                                                            ? 'Imagen principal'
                                                                            : 'Hacer imagen principal'
                                                                    }
                                                                >
                                                                    <Star
                                                                        size={13}
                                                                        className={
                                                                            item.principal
                                                                                ? 'fill-current'
                                                                                : ''
                                                                        }
                                                                    />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        saving
                                                                    }
                                                                    onClick={() =>
                                                                        removeImage(
                                                                            item.key,
                                                                        )
                                                                    }
                                                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-400/[0.07] text-rose-300 transition-all hover:bg-rose-400/[0.13]"
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
                                        )}
                                </section>

                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/[0.08] text-violet-300">
                                            <FileText
                                                size={18}
                                            />
                                        </div>

                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                                                Pruebas
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Documentos y comprobantes
                                            </h2>

                                            <span className="text-[8px] text-[var(--muted)]">
                                                PDF o imágenes · máximo 15 MB · hasta 8 archivos
                                            </span>
                                        </div>
                                    </div>

                                    <input
                                        ref={
                                            proofInputRef
                                        }
                                        type="file"
                                        multiple
                                        accept="application/pdf,image/jpeg,image/png,image/webp,image/avif"
                                        className="hidden"
                                        onChange={(
                                            event,
                                        ) => {
                                            addProofs(
                                                Array.from(
                                                    event.target.files ??
                                                    [],
                                                ),
                                            );

                                            event.target.value =
                                                '';
                                        }}
                                    />

                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            if (
                                                !saving &&
                                                proofs.length <
                                                MAX_PROOFS
                                            ) {
                                                proofInputRef.current?.click();
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
                                                    proofs.length <
                                                    MAX_PROOFS
                                                ) {
                                                    proofInputRef.current?.click();
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
                                                setDraggingProofs(
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

                                                setDraggingProofs(
                                                    true,
                                                );
                                            }
                                        }}
                                        onDragLeave={(
                                            event,
                                        ) => {
                                            event.preventDefault();
                                            event.stopPropagation();

                                            setDraggingProofs(
                                                false,
                                            );
                                        }}
                                        onDrop={
                                            handleProofDrop
                                        }
                                        className={`group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center outline-none transition-all duration-300 ${draggingProofs
                                            ? 'border-violet-400/45 bg-violet-400/[0.08] shadow-[inset_0_0_0_1px_rgba(167,139,250,.08)]'
                                            : 'border-white/[0.09] bg-white/[0.015] hover:border-violet-400/25 hover:bg-violet-400/[0.025] focus:border-violet-400/30'
                                            } ${saving ||
                                                proofs.length >=
                                                MAX_PROOFS
                                                ? 'cursor-not-allowed opacity-60'
                                                : ''
                                            }`}
                                    >
                                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-400/[0.07] text-violet-300">
                                            <UploadCloud
                                                size={20}
                                            />
                                        </div>

                                        <span className="mt-3 text-[10px] font-semibold text-[var(--text-soft)]">
                                            Arrastra documentos aquí
                                        </span>

                                        <span className="mt-1 text-[8px] text-[var(--muted)]">
                                            o haz clic para seleccionar
                                        </span>
                                    </div>

                                    {proofs.length >
                                        0 && (
                                            <div className="mt-4 space-y-2">
                                                {proofs.map(
                                                    (
                                                        item,
                                                    ) => (
                                                        <div
                                                            key={
                                                                item.key
                                                            }
                                                            className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                                                        >
                                                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-400/[0.07] text-violet-300">
                                                                <FileText
                                                                    size={14}
                                                                />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <span className="block truncate text-[8px] font-medium text-[var(--text-soft)]">
                                                                    {item.file.name}
                                                                </span>

                                                                <span className="mt-0.5 block text-[7px] text-[var(--muted)]">
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
                                                                    setProofs(
                                                                        (
                                                                            current,
                                                                        ) =>
                                                                            current.filter(
                                                                                (
                                                                                    currentItem,
                                                                                ) =>
                                                                                    currentItem.key !==
                                                                                    item.key,
                                                                            ),
                                                                    )
                                                                }
                                                                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-400/[0.07] text-rose-300 transition-all hover:bg-rose-400/[0.13]"
                                                            >
                                                                <Trash2
                                                                    size={13}
                                                                />
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                </section>
                            </div>

                            <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
                                <section className="rounded-2xl border border-rose-300/[0.08] bg-rose-300/[0.025] p-4 sm:rounded-3xl">
                                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-rose-300">
                                        Solicitud
                                    </span>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                Información completa
                                            </span>

                                            <strong className="text-[11px] text-rose-200">
                                                {completedFields}%
                                            </strong>
                                        </div>

                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                            <div
                                                className="h-full rounded-full bg-rose-300 transition-all duration-500"
                                                style={{
                                                    width: `${completedFields}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {[
                                            {
                                                label:
                                                    'Título',
                                                ready:
                                                    Boolean(
                                                        form.titulo.trim(),
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Categoría',
                                                ready:
                                                    Boolean(
                                                        category,
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Resumen',
                                                ready:
                                                    Boolean(
                                                        form.resumen.trim(),
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Beneficiario',
                                                ready:
                                                    Boolean(
                                                        form.beneficiario.trim(),
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Ubicación',
                                                ready:
                                                    Boolean(
                                                        form.ubicacion.trim(),
                                                    ),
                                            },
                                            {
                                                label:
                                                    'Meta',
                                                ready:
                                                    economicValid,
                                            },
                                            {
                                                label:
                                                    'Fotografías',
                                                ready:
                                                    images.length >
                                                    0,
                                            },
                                            {
                                                label:
                                                    'Pruebas',
                                                ready:
                                                    proofs.length >
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
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-amber-300/[0.08] bg-amber-300/[0.02] p-4 sm:rounded-3xl">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle
                                            size={14}
                                            className="mt-0.5 shrink-0 text-amber-200"
                                        />

                                        <div>
                                            <span className="text-[9px] font-semibold text-amber-200">
                                                Revisión administrativa
                                            </span>

                                            <p className="mt-1 text-[7px] leading-4 text-[var(--muted)]">
                                                La causa se guardará con estado Solicitud. Solo un administrador podrá revisarla, completar imágenes o información adicional y cambiarla a Publicado.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {attempted &&
                                    !valid && (
                                        <div className="flex items-start gap-2 rounded-xl border border-rose-400/10 bg-rose-400/[0.04] p-3">
                                            <AlertCircle
                                                size={14}
                                                className="mt-0.5 shrink-0 text-rose-300"
                                            />

                                            <span className="text-[8px] leading-4 text-rose-300">
                                                Revisa los campos obligatorios antes de enviar.
                                            </span>
                                        </div>
                                    )}

                                <button
                                    type="button"
                                    disabled={
                                        saving
                                    }
                                    onClick={() =>
                                        void submit()
                                    }
                                    className={`group flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[10px] font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${valid
                                        ? 'bg-rose-300/10 text-rose-200 hover:bg-rose-300/15'
                                        : 'bg-white/[0.04] text-[var(--muted)]'
                                        }`}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />

                                            Enviando
                                        </>
                                    ) : (
                                        <>
                                            <Send
                                                size={16}
                                            />

                                            Enviar solicitud
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        saving
                                    }
                                    onClick={
                                        onClose
                                    }
                                    className="flex h-10 w-full items-center justify-center rounded-xl bg-white/[0.04] text-[8px] font-semibold text-[var(--text-soft)] transition-all hover:bg-white/[0.07] disabled:opacity-40"
                                >
                                    Cancelar
                                </button>
                            </aside>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
