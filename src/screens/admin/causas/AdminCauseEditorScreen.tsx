import {
    type DragEvent,
    type FormEvent,
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
    ChevronDown,
    CircleDollarSign,
    FileEdit,
    Gift,
    HeartHandshake,
    ImagePlus,
    Loader2,
    MapPin,
    PackagePlus,
    Plus,
    Save,
    Star,
    Trash2,
    UploadCloud,
    X,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

import GooglePlacePicker, {
    type GooglePlaceValue,
} from './GooglePlacePicker';

type MetaType =
    | 'economica'
    | 'especie';

type Status =
    | 'borrador'
    | 'publicado';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    showToast: (
        message: string,
        type?:
            | 'success'
            | 'error'
            | 'info'
            | 'warning',
    ) => void;
    causeId?: string | null;
}

interface CauseForm {
    titulo: string;
    resumen: string;
    historia: string;
    categoria: string;
    nuevaCategoria: string;
    estado: Status;
    tipo_meta: MetaType;
    meta_economica: string;
    organizador: string;
    beneficiario: string;
    ubicacion: string;
    google_place_id: string | null;
    latitud: number | null;
    longitud: number | null;
    fecha_inicio: string;
    fecha_limite: string;
    destacada: boolean;
}

interface Product {
    id?: string;
    key: string;
    nombre: string;
    cantidad: string;
    unidad: string;
}

interface FundOrganization {
    id: number;
    nombre_organizacion: string;
}


interface CauseImage {
    id?: string;
    key: string;
    file?: File;
    previewUrl: string;
    storagePath?: string;
    publicUrl?: string;
    name: string;
    mimeType: string;
    size: number;
    isPrincipal: boolean;
    order: number;
}

interface RemovedCauseImage {
    id: string;
    storagePath: string;
}

const IMAGE_BUCKET = 'causas-imagenes';
const MAX_IMAGES = 8;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
];

const INITIAL: CauseForm = {
    titulo: '',
    resumen: '',
    historia: '',
    categoria: '',
    nuevaCategoria: '',
    estado: 'borrador',
    tipo_meta: 'economica',
    meta_economica: '',
    organizador: '',
    beneficiario: '',
    ubicacion: '',
    google_place_id: null,
    latitud: null,
    longitud: null,
    fecha_inicio: '',
    fecha_limite: '',
    destacada: false,
};

const BASE_CATEGORIES = [
    'salud',
    'despensas',
    'educacion',
    'vivienda',
    'emergencia',
    'comunidad',
    'otra',
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

const createKey = () =>
    typeof crypto !== 'undefined' &&
        crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

const emptyProduct = (): Product => ({
    key: createKey(),
    nombre: '',
    cantidad: '',
    unidad: 'unidad',
});

const slugify = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const text = (value: string) =>
    value.trim() || null;

const localDate = (
    value: string | null,
) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);

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
        date.getTime() - offset,
    )
        .toISOString()
        .slice(0, 16);
};

const isoDate = (
    value: string,
) =>
    value
        ? new Date(
            value,
        ).toISOString()
        : null;

const formatCategory = (
    value: string,
) => {
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
};

const formatDate = (
    value: string,
) => {
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
};

const inputClass =
    'h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 text-[11px] text-[var(--text)] outline-none transition-all duration-300 placeholder:text-[var(--muted)] focus:border-emerald-400/30 focus:bg-white/[0.04]';

const textareaClass =
    'w-full resize-y rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 text-[11px] leading-5 text-[var(--text)] outline-none transition-all duration-300 placeholder:text-[var(--muted)] focus:border-emerald-400/30 focus:bg-white/[0.04]';

export default function AdminCauseEditorScreen({
    open,
    onClose,
    onSaved,
    showToast,
    causeId,
}: Props) {
    const { user } =
        useAuth();

    const editing =
        Boolean(causeId);

    const [
        form,
        setForm,
    ] =
        useState<CauseForm>(
            INITIAL,
        );

    const [
        products,
        setProducts,
    ] =
        useState<Product[]>(
            [],
        );

    const [
        originalProductIds,
        setOriginalProductIds,
    ] =
        useState<string[]>(
            [],
        );

    const [
        categories,
        setCategories,
    ] =
        useState<string[]>(
            BASE_CATEGORIES,
        );

    const [
        organizations,
        setOrganizations,
    ] =
        useState<
            FundOrganization[]
        >([]);

    const [
        order,
        setOrder,
    ] = useState(0);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        attemptedSubmit,
        setAttemptedSubmit,
    ] = useState(false);


    const [
        images,
        setImages,
    ] = useState<CauseImage[]>([]);

    const [
        removedImages,
        setRemovedImages,
    ] = useState<RemovedCauseImage[]>([]);

    const [
        draggingImages,
        setDraggingImages,
    ] = useState(false);

    const imageInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const slug =
        useMemo(
            () =>
                slugify(
                    form.titulo,
                ),
            [form.titulo],
        );

    const category =
        form.categoria ===
            '__otra__'
            ? form.nuevaCategoria.trim()
            : form.categoria.trim();

    const setField = <
        K extends keyof CauseForm,
    >(
        field: K,
        value: CauseForm[K],
    ) => {
        setForm(
            (current) => ({
                ...current,
                [field]: value,
            }),
        );
    };

    const valid =
        useMemo(
            () =>
                Boolean(
                    form.titulo.trim() &&
                    category &&
                    slug &&
                    (form.tipo_meta ===
                        'economica'
                        ? Number(
                            form.meta_economica,
                        ) > 0
                        : products.length >
                        0 &&
                        products.every(
                            (item) =>
                                Boolean(
                                    item.nombre.trim() &&
                                    Number(
                                        item.cantidad,
                                    ) >
                                    0 &&
                                    item.unidad.trim(),
                                ),
                        )),
                ),
            [
                form.titulo,
                form.tipo_meta,
                form.meta_economica,
                category,
                slug,
                products,
                images,
            ],
        );

    const titleError =
        attemptedSubmit &&
        !form.titulo.trim();

    const categoryError =
        attemptedSubmit &&
        !category;

    const economicError =
        attemptedSubmit &&
        form.tipo_meta ===
        'economica' &&
        Number(
            form.meta_economica,
        ) <= 0;

    const productError =
        attemptedSubmit &&
        form.tipo_meta ===
        'especie' &&
        (products.length ===
            0 ||
            products.some(
                (item) =>
                    !item.nombre.trim() ||
                    Number(
                        item.cantidad,
                    ) <= 0 ||
                    !item.unidad.trim(),
            ));

    const completedFields =
        useMemo(
            () => {
                const values = [
                    Boolean(
                        form.titulo.trim(),
                    ),
                    Boolean(
                        category,
                    ),
                    Boolean(
                        form.resumen.trim(),
                    ),
                    Boolean(
                        form.historia.trim(),
                    ),
                    Boolean(
                        form.organizador.trim(),
                    ),
                    Boolean(
                        form.beneficiario.trim(),
                    ),
                    Boolean(
                        form.ubicacion.trim(),
                    ),
                    Boolean(
                        form.fecha_inicio,
                    ),
                    Boolean(
                        form.fecha_limite,
                    ),
                    images.length > 0,
                    form.tipo_meta ===
                        'economica'
                        ? Number(
                            form.meta_economica,
                        ) > 0
                        : products.length >
                        0 &&
                        products.every(
                            (item) =>
                                Boolean(
                                    item.nombre.trim() &&
                                    Number(
                                        item.cantidad,
                                    ) > 0,
                                ),
                        ),
                ];

                return Math.round(
                    (values.filter(
                        Boolean,
                    ).length /
                        values.length) *
                    100,
                );
            },
            [
                form,
                category,
                products,
            ],
        );

    const load =
        useCallback(
            async () => {
                setLoading(true);

                try {
                    const [
                        categoriesResult,
                        organizationsResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from('causas')
                                .select(
                                    'categoria',
                                )
                                .order(
                                    'categoria',
                                ),

                            supabase
                                .from(
                                    'configuracion_fondo',
                                )
                                .select(
                                    'id,nombre_organizacion',
                                )
                                .order(
                                    'nombre_organizacion',
                                    {
                                        ascending:
                                            true,
                                    },
                                ),
                        ]);

                    if (
                        categoriesResult.error
                    ) {
                        throw categoriesResult.error;
                    }

                    if (
                        organizationsResult.error
                    ) {
                        throw organizationsResult.error;
                    }

                    const categorySet =
                        new Set(
                            BASE_CATEGORIES,
                        );

                    categoriesResult.data?.forEach(
                        (row) => {
                            if (
                                row.categoria
                            ) {
                                categorySet.add(
                                    row.categoria,
                                );
                            }
                        },
                    );

                    setCategories(
                        [
                            ...categorySet,
                        ].sort(),
                    );

                    const loadedOrganizations =
                        (
                            organizationsResult.data ??
                            []
                        ).map(
                            (item) => ({
                                id: Number(
                                    item.id,
                                ),
                                nombre_organizacion:
                                    item.nombre_organizacion,
                            }),
                        );

                    setOrganizations(
                        loadedOrganizations,
                    );

                    if (
                        !editing ||
                        !causeId
                    ) {
                        const {
                            data,
                            error,
                        } =
                            await supabase
                                .from(
                                    'causas',
                                )
                                .select(
                                    'orden',
                                )
                                .order(
                                    'orden',
                                    {
                                        ascending:
                                            false,
                                    },
                                )
                                .limit(1);

                        if (error) {
                            throw error;
                        }

                        setForm({
                            ...INITIAL,
                            organizador:
                                loadedOrganizations.length ===
                                    1
                                    ? loadedOrganizations[0]
                                        .nombre_organizacion
                                    : '',
                        });

                        setProducts(
                            [],
                        );

                        setOriginalProductIds(
                            [],
                        );

                        setImages(
                            (current) => {
                                current.forEach(
                                    (item) => {
                                        if (
                                            item.file
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

                        setRemovedImages(
                            [],
                        );

                        setOrder(
                            (data?.[0]
                                ?.orden ??
                                -1) + 1,
                        );

                        return;
                    }

                    const [
                        causeResult,
                        productsResult,
                        imagesResult,
                    ] =
                        await Promise.all([
                            supabase
                                .from(
                                    'causas',
                                )
                                .select('*')
                                .eq(
                                    'id',
                                    causeId,
                                )
                                .single(),

                            supabase
                                .from(
                                    'metas_especie',
                                )
                                .select('*')
                                .eq(
                                    'causa_id',
                                    causeId,
                                )
                                .order(
                                    'orden',
                                    {
                                        ascending:
                                            true,
                                    },
                                ),

                            supabase
                                .from(
                                    'imagenes_causa',
                                )
                                .select(
                                    'id,storage_path,public_url,nombre_archivo,mime_type,size_bytes,es_principal,orden',
                                )
                                .eq(
                                    'causa_id',
                                    causeId,
                                )
                                .order(
                                    'orden',
                                    {
                                        ascending:
                                            true,
                                    },
                                ),
                        ]);

                    if (
                        causeResult.error
                    ) {
                        throw causeResult.error;
                    }

                    if (
                        productsResult.error
                    ) {
                        throw productsResult.error;
                    }

                    if (
                        imagesResult.error
                    ) {
                        throw imagesResult.error;
                    }

                    const cause =
                        causeResult.data;

                    const isKnown =
                        [
                            ...categorySet,
                        ].includes(
                            cause.categoria,
                        );

                    setForm({
                        titulo:
                            cause.titulo ??
                            '',
                        resumen:
                            cause.resumen ??
                            '',
                        historia:
                            cause.historia ??
                            '',
                        categoria:
                            isKnown
                                ? cause.categoria
                                : '__otra__',
                        nuevaCategoria:
                            isKnown
                                ? ''
                                : cause.categoria ??
                                '',
                        estado:
                            cause.estado ===
                                'publicado'
                                ? 'publicado'
                                : 'borrador',
                        tipo_meta:
                            cause.tipo_meta ===
                                'especie'
                                ? 'especie'
                                : 'economica',
                        meta_economica:
                            cause.meta_economica ==
                                null
                                ? ''
                                : String(
                                    cause.meta_economica,
                                ),
                        organizador:
                            cause.organizador ??
                            '',
                        beneficiario:
                            cause.beneficiario ??
                            '',
                        ubicacion:
                            cause.ubicacion ??
                            '',
                        google_place_id:
                            cause.google_place_id ??
                            null,
                        latitud:
                            cause.latitud ??
                            null,
                        longitud:
                            cause.longitud ??
                            null,
                        fecha_inicio:
                            localDate(
                                cause.fecha_inicio,
                            ),
                        fecha_limite:
                            localDate(
                                cause.fecha_limite,
                            ),
                        destacada:
                            Boolean(
                                cause.destacada,
                            ),
                    });

                    setOrder(
                        cause.orden ??
                        0,
                    );

                    const loadedProducts: Product[] =
                        (
                            productsResult.data ??
                            []
                        ).map(
                            (item) => ({
                                id: item.id,
                                key: item.id,
                                nombre:
                                    item.nombre,
                                cantidad:
                                    String(
                                        item.cantidad_objetivo,
                                    ),
                                unidad:
                                    item.unidad,
                            }),
                        );

                    setProducts(
                        loadedProducts,
                    );

                    setOriginalProductIds(
                        loadedProducts.flatMap(
                            (item) =>
                                item.id
                                    ? [item.id]
                                    : [],
                        ),
                    );

                    setImages(
                        (current) => {
                            current.forEach(
                                (item) => {
                                    if (
                                        item.file
                                    ) {
                                        URL.revokeObjectURL(
                                            item.previewUrl,
                                        );
                                    }
                                },
                            );

                            return (
                                imagesResult.data ??
                                []
                            ).map(
                                (
                                    item,
                                    index,
                                ) => ({
                                    id: item.id,
                                    key: item.id,
                                    previewUrl:
                                        item.public_url,
                                    storagePath:
                                        item.storage_path,
                                    publicUrl:
                                        item.public_url,
                                    name:
                                        item.nombre_archivo ??
                                        `Imagen ${index + 1}`,
                                    mimeType:
                                        item.mime_type ??
                                        'image/jpeg',
                                    size:
                                        Number(
                                            item.size_bytes ??
                                            0,
                                        ),
                                    isPrincipal:
                                        Boolean(
                                            item.es_principal,
                                        ),
                                    order:
                                        Number(
                                            item.orden ??
                                            index,
                                        ),
                                }),
                            );
                        },
                    );

                    setRemovedImages(
                        [],
                    );
                } catch (error) {
                    showToast(
                        error instanceof
                            Error
                            ? error.message
                            : 'No se pudo cargar la causa.',
                        'error',
                    );
                } finally {
                    setLoading(
                        false,
                    );
                }
            },
            [
                causeId,
                editing,
                showToast,
            ],
        );

    useEffect(() => {
        if (!open) {
            return;
        }

        setAttemptedSubmit(
            false,
        );

        void load();
    }, [
        open,
        load,
    ]);

    useEffect(() => {
        if (!open) {
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
    }, [open]);


    useEffect(() => {
        return () => {
            images.forEach(
                (item) => {
                    if (
                        item.file
                    ) {
                        URL.revokeObjectURL(
                            item.previewUrl,
                        );
                    }
                },
            );
        };
    }, []);

    const changeMeta = (
        type: MetaType,
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

    const updateProduct = (
        productKey: string,
        field:
            | 'nombre'
            | 'cantidad'
            | 'unidad',
        value: string,
    ) => {
        setProducts(
            (current) =>
                current.map(
                    (item) =>
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

    const normalizeImages =
        (
            nextImages: CauseImage[],
        ) => {
            if (
                !nextImages.length
            ) {
                return [];
            }

            const hasPrincipal =
                nextImages.some(
                    (item) =>
                        item.isPrincipal,
                );

            return nextImages.map(
                (
                    item,
                    index,
                ) => ({
                    ...item,
                    order: index,
                    isPrincipal:
                        hasPrincipal
                            ? item.isPrincipal
                            : index === 0,
                }),
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
                available <= 0
            ) {
                showToast(
                    `Puedes agregar máximo ${MAX_IMAGES} imágenes.`,
                    'warning',
                );

                return;
            }

            const accepted:
                File[] = [];

            for (
                const file of files
            ) {
                if (
                    !ALLOWED_IMAGE_TYPES.includes(
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
                        (item) =>
                            item.name ===
                            file.name &&
                            item.size ===
                            file.size,
                    ) ||
                    accepted.some(
                        (item) =>
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
                    `Solo se agregaron ${available} imágenes para respetar el límite de ${MAX_IMAGES}.`,
                    'warning',
                );
            }

            if (
                !limited.length
            ) {
                return;
            }

            setImages(
                (current) => {
                    const shouldSetPrincipal =
                        !current.some(
                            (item) =>
                                item.isPrincipal,
                        );

                    const added =
                        limited.map(
                            (
                                file,
                                index,
                            ) => ({
                                key: createKey(),
                                file,
                                previewUrl:
                                    URL.createObjectURL(
                                        file,
                                    ),
                                name:
                                    file.name,
                                mimeType:
                                    file.type,
                                size:
                                    file.size,
                                isPrincipal:
                                    shouldSetPrincipal &&
                                    index === 0,
                                order:
                                    current.length +
                                    index,
                            }),
                        );

                    return normalizeImages(
                        [
                            ...current,
                            ...added,
                        ],
                    );
                },
            );
        };

    const removeImage =
        (
            imageKey: string,
        ) => {
            setImages(
                (current) => {
                    const target =
                        current.find(
                            (item) =>
                                item.key ===
                                imageKey,
                        );

                    if (
                        !target
                    ) {
                        return current;
                    }

                    if (
                        target.file
                    ) {
                        URL.revokeObjectURL(
                            target.previewUrl,
                        );
                    }

                    if (
                        target.id &&
                        target.storagePath
                    ) {
                        setRemovedImages(
                            (
                                removed,
                            ) => [
                                    ...removed,
                                    {
                                        id: target.id!,
                                        storagePath:
                                            target.storagePath!,
                                    },
                                ],
                        );
                    }

                    return normalizeImages(
                        current.filter(
                            (item) =>
                                item.key !==
                                imageKey,
                        ),
                    );
                },
            );
        };

    const setPrincipalImage =
        (
            imageKey: string,
        ) => {
            setImages(
                (current) =>
                    current.map(
                        (
                            item,
                            index,
                        ) => ({
                            ...item,
                            isPrincipal:
                                item.key ===
                                imageKey,
                            order:
                                index,
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

    const saveImages =
        async (
            targetCauseId: string,
        ) => {
            if (
                removedImages.length
            ) {
                const paths =
                    removedImages.map(
                        (item) =>
                            item.storagePath,
                    );

                const storageDelete =
                    await supabase.storage
                        .from(
                            IMAGE_BUCKET,
                        )
                        .remove(
                            paths,
                        );

                if (
                    storageDelete.error
                ) {
                    throw storageDelete.error;
                }

                const dbDelete =
                    await supabase
                        .from(
                            'imagenes_causa',
                        )
                        .delete()
                        .in(
                            'id',
                            removedImages.map(
                                (item) =>
                                    item.id,
                            ),
                        );

                if (
                    dbDelete.error
                ) {
                    throw dbDelete.error;
                }
            }

            const normalized =
                normalizeImages(
                    images,
                );

            for (
                let index = 0;
                index <
                normalized.length;
                index += 1
            ) {
                const item =
                    normalized[index];

                if (
                    item.file
                ) {
                    const extension =
                        item.file.name
                            .split('.')
                            .pop()
                            ?.toLowerCase() ||
                        item.mimeType
                            .split('/')
                            .pop() ||
                        'jpg';

                    const storagePath =
                        `${targetCauseId}/${Date.now()}-${createKey()}.${extension}`;

                    const uploadResult =
                        await supabase.storage
                            .from(
                                IMAGE_BUCKET,
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
                                        item.mimeType,
                                },
                            );

                    if (
                        uploadResult.error
                    ) {
                        throw uploadResult.error;
                    }

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

                    const insertResult =
                        await supabase
                            .from(
                                'imagenes_causa',
                            )
                            .insert({
                                causa_id:
                                    targetCauseId,
                                storage_path:
                                    storagePath,
                                public_url:
                                    publicUrlData.publicUrl,
                                nombre_archivo:
                                    item.name,
                                mime_type:
                                    item.mimeType,
                                size_bytes:
                                    item.size,
                                es_principal:
                                    item.isPrincipal,
                                orden:
                                    index,
                            });

                    if (
                        insertResult.error
                    ) {
                        await supabase.storage
                            .from(
                                IMAGE_BUCKET,
                            )
                            .remove([
                                storagePath,
                            ]);

                        throw insertResult.error;
                    }

                    continue;
                }

                if (
                    item.id
                ) {
                    const updateResult =
                        await supabase
                            .from(
                                'imagenes_causa',
                            )
                            .update({
                                es_principal:
                                    item.isPrincipal,
                                orden:
                                    index,
                            })
                            .eq(
                                'id',
                                item.id,
                            );

                    if (
                        updateResult.error
                    ) {
                        throw updateResult.error;
                    }
                }
            }
        };

    const uniqueSlug =
        async () => {
            let candidate =
                slug;

            let suffix = 2;

            while (true) {
                let query =
                    supabase
                        .from(
                            'causas',
                        )
                        .select('id')
                        .eq(
                            'slug',
                            candidate,
                        )
                        .limit(1);

                if (causeId) {
                    query =
                        query.neq(
                            'id',
                            causeId,
                        );
                }

                const {
                    data,
                    error,
                } =
                    await query;

                if (error) {
                    throw error;
                }

                if (
                    !data?.length
                ) {
                    return candidate;
                }

                candidate =
                    `${slug}-${suffix++}`;
            }
        };

    const saveProducts =
        async (
            targetCauseId: string,
        ) => {
            if (
                form.tipo_meta ===
                'economica'
            ) {
                const {
                    error,
                } =
                    await supabase
                        .from(
                            'metas_especie',
                        )
                        .delete()
                        .eq(
                            'causa_id',
                            targetCauseId,
                        );

                if (error) {
                    throw error;
                }

                return;
            }

            const currentIds =
                new Set(
                    products.flatMap(
                        (item) =>
                            item.id
                                ? [item.id]
                                : [],
                    ),
                );

            const deleted =
                originalProductIds.filter(
                    (id) =>
                        !currentIds.has(
                            id,
                        ),
                );

            if (
                deleted.length
            ) {
                const {
                    error,
                } =
                    await supabase
                        .from(
                            'metas_especie',
                        )
                        .delete()
                        .in(
                            'id',
                            deleted,
                        );

                if (error) {
                    throw error;
                }
            }

            for (
                let index = 0;
                index <
                products.length;
                index += 1
            ) {
                const item =
                    products[index];

                const payload = {
                    causa_id:
                        targetCauseId,
                    nombre:
                        item.nombre.trim(),
                    cantidad_objetivo:
                        Number(
                            item.cantidad,
                        ),
                    unidad:
                        item.unidad.trim(),
                    orden:
                        index,
                };

                const result =
                    item.id
                        ? await supabase
                            .from(
                                'metas_especie',
                            )
                            .update(
                                payload,
                            )
                            .eq(
                                'id',
                                item.id,
                            )
                        : await supabase
                            .from(
                                'metas_especie',
                            )
                            .insert(
                                payload,
                            );

                if (
                    result.error
                ) {
                    throw result.error;
                }
            }
        };

    const submit =
        async (
            event: FormEvent,
        ) => {
            event.preventDefault();

            setAttemptedSubmit(
                true,
            );

            if (!valid) {
                showToast(
                    'Completa los campos obligatorios antes de guardar.',
                    'warning',
                );

                return;
            }

            if (saving) {
                return;
            }

            setSaving(true);

            try {
                const generatedSlug =
                    await uniqueSlug();

                const payload = {
                    slug:
                        generatedSlug,
                    titulo:
                        form.titulo.trim(),
                    resumen:
                        text(
                            form.resumen,
                        ),
                    historia:
                        text(
                            form.historia,
                        ),
                    categoria:
                        category,
                    estado:
                        form.estado,
                    tipo_meta:
                        form.tipo_meta,
                    meta_economica:
                        form.tipo_meta ===
                            'economica'
                            ? Number(
                                form.meta_economica,
                            )
                            : null,
                    organizador:
                        text(
                            form.organizador,
                        ),
                    beneficiario:
                        text(
                            form.beneficiario,
                        ),
                    ubicacion:
                        text(
                            form.ubicacion,
                        ),
                    google_place_id:
                        form.google_place_id,
                    latitud:
                        form.latitud,
                    longitud:
                        form.longitud,
                    fecha_inicio:
                        isoDate(
                            form.fecha_inicio,
                        ),
                    fecha_limite:
                        isoDate(
                            form.fecha_limite,
                        ),
                    destacada:
                        form.destacada,
                    orden: order,
                    actualizado_en:
                        new Date().toISOString(),
                };
                let targetCauseId:
                    string;

                if (
                    editing &&
                    causeId
                ) {
                    const {
                        error,
                    } =
                        await supabase
                            .from(
                                'causas',
                            )
                            .update(
                                payload,
                            )
                            .eq(
                                'id',
                                causeId,
                            );

                    if (error) {
                        throw error;
                    }

                    targetCauseId =
                        causeId;
                } else {
                    const {
                        data,
                        error,
                    } =
                        await supabase
                            .from(
                                'causas',
                            )
                            .insert({
                                ...payload,
                                creado_por:
                                    user?.id ??
                                    null,
                            })
                            .select('id')
                            .single();

                    if (error) {
                        throw error;
                    }

                    if (!data?.id) {
                        throw new Error(
                            'No se pudo obtener el ID de la causa.',
                        );
                    }

                    targetCauseId =
                        data.id;
                }

                await saveProducts(
                    targetCauseId,
                );

                await saveImages(
                    targetCauseId,
                );

                showToast(
                    editing
                        ? 'Causa actualizada correctamente.'
                        : 'Causa creada correctamente.',
                    'success',
                );

                onSaved();
                onClose();
            } catch (error) {
                showToast(
                    error instanceof
                        Error
                        ? error.message
                        : 'No se pudo guardar la causa.',
                    'error',
                );
            } finally {
                setSaving(
                    false,
                );
            }
        };

    const placeChange = (
        place: GooglePlaceValue,
    ) => {
        setForm(
            (current) => ({
                ...current,
                ...place,
            }),
        );
    };

    if (!open) {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-x-0 bottom-0 top-[76px] z-[150] flex items-end justify-center overflow-hidden bg-black/70 backdrop-blur-[6px] sm:items-center sm:p-4 lg:p-6"
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
            <style>
                {`
          @keyframes causeModalEnter {
            from {
              opacity: 0;
              transform: translate3d(0, 24px, 0) scale(.985);
            }

            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          .cause-editor-scroll {
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-gutter: stable;
          }

          @media (max-width: 639px) {
            .cause-editor-dialog {
              height: 100%;
              max-height: 100%;
              border-bottom-left-radius: 0;
              border-bottom-right-radius: 0;
            }

            .cause-editor-scroll {
              height: 100%;
              max-height: 100%;
            }
          }
        `}
            </style>

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="cause-editor-title"
                className="cause-editor-dialog flex h-full max-h-full w-full min-w-0 flex-col overflow-hidden rounded-t-[28px] border border-white/[0.07] bg-[var(--bg)] shadow-[0_-20px_80px_rgba(0,0,0,.55)] animate-[causeModalEnter_.3s_cubic-bezier(.22,1,.36,1)] sm:h-[min(88dvh,900px)] sm:max-w-[1220px] sm:rounded-[28px] sm:shadow-[0_30px_100px_rgba(0,0,0,.65)]"
                onMouseDown={(
                    event,
                ) =>
                    event.stopPropagation()
                }
            >
                <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[var(--bg)]/95 px-4 py-3.5 backdrop-blur-xl sm:px-5 lg:px-6">
                    <div className="min-w-0 flex-1">
                        <span className="block truncate text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--emerald)] sm:text-[9px]">
                            Administración · Causas
                        </span>

                        <h1
                            id="cause-editor-title"
                            className="mt-0.5 truncate text-lg font-bold tracking-[-0.03em] text-[var(--text)] sm:text-xl"
                        >
                            {editing
                                ? 'Editar causa'
                                : 'Nueva causa'}
                        </h1>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                        <span
                            className={`rounded-full px-2.5 py-1.5 text-[8px] font-semibold ${form.estado ===
                                'publicado'
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : 'bg-amber-300/10 text-amber-300'
                                }`}
                        >
                            {form.estado ===
                                'publicado'
                                ? 'Publicado'
                                : 'Borrador'}
                        </span>

                        <span className="rounded-full bg-white/[0.04] px-2.5 py-1.5 text-[8px] font-semibold text-[var(--muted)]">
                            {form.tipo_meta ===
                                'economica'
                                ? 'Económica'
                                : 'En especie'}
                        </span>
                    </div>
                </header>

                <div className="cause-editor-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                    {loading ? (
                        <div className="flex min-h-[450px] items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2
                                    size={26}
                                    strokeWidth={
                                        1.8
                                    }
                                    className="animate-spin text-[var(--emerald)]"
                                />

                                <span className="text-[9px] text-[var(--muted)]">
                                    {editing
                                        ? 'Cargando causa...'
                                        : 'Preparando causa...'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={
                                submit
                            }
                            className="mx-auto grid w-full max-w-[1180px] gap-4 p-3 pb-8 sm:p-5 lg:grid-cols-[minmax(0,1fr)_310px] lg:p-6"
                        >
                            <div className="min-w-0 space-y-4">
                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-[var(--emerald)]">
                                            <FileEdit
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
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                    Título
                                                    <span className="ml-1 text-rose-300">
                                                        *
                                                    </span>
                                                </span>

                                                {titleError && (
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
                                                    form.titulo
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'titulo',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ej. Ayudemos a reconstruir un hogar"
                                                className={`${inputClass} ${titleError
                                                    ? 'border-rose-400/40 focus:border-rose-400/60'
                                                    : ''
                                                    }`}
                                            />

                                            <span className="mt-1.5 block text-[8px] text-[var(--muted)]">
                                                Slug: {slug || '—'}
                                            </span>
                                        </label>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                    Categoría
                                                    <span className="ml-1 text-rose-300">
                                                        *
                                                    </span>
                                                </span>

                                                {categoryError && (
                                                    <span className="text-[8px] text-rose-300">
                                                        Obligatorio
                                                    </span>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <select
                                                    value={
                                                        form.categoria
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setField(
                                                            'categoria',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={`${inputClass} appearance-none pr-10 ${categoryError
                                                        ? 'border-rose-400/40'
                                                        : ''
                                                        }`}
                                                >
                                                    <option value="">
                                                        Selecciona una categoría
                                                    </option>

                                                    {categories.map(
                                                        (item) => (
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

                                            {form.categoria ===
                                                '__otra__' && (
                                                    <input
                                                        value={
                                                            form.nuevaCategoria
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setField(
                                                                'nuevaCategoria',
                                                                event.target.value,
                                                            )
                                                        }
                                                        placeholder="Ej. Animales, Adultos mayores..."
                                                        className={`${inputClass} mt-2 ${categoryError
                                                            ? 'border-rose-400/40'
                                                            : ''
                                                            }`}
                                                    />
                                                )}
                                        </div>

                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Estado
                                            </span>

                                            <div className="relative">
                                                <select
                                                    value={
                                                        form.estado
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setField(
                                                            'estado',
                                                            event.target.value as Status,
                                                        )
                                                    }
                                                    className={`${inputClass} appearance-none pr-10`}
                                                >
                                                    <option value="borrador">
                                                        Borrador
                                                    </option>

                                                    <option value="publicado">
                                                        Publicado
                                                    </option>
                                                </select>

                                                <ChevronDown
                                                    size={14}
                                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                                />
                                            </div>
                                        </label>

                                        <label className="sm:col-span-2">
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Resumen
                                            </span>

                                            <textarea
                                                rows={3}
                                                maxLength={300}
                                                value={
                                                    form.resumen
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'resumen',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Describe brevemente qué necesita esta causa, a quién ayudará y cuál es su objetivo principal..."
                                                className={
                                                    textareaClass
                                                }
                                            />

                                            <div className="mt-1 flex justify-between gap-3">
                                                <span className="text-[8px] text-[var(--muted)]">
                                                    Este texto se mostrará como introducción de la causa.
                                                </span>

                                                <span className="shrink-0 text-[8px] text-[var(--muted)]">
                                                    {
                                                        form.resumen
                                                            .length
                                                    }
                                                    /300
                                                </span>
                                            </div>
                                        </label>

                                        <label className="sm:col-span-2">
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Historia
                                            </span>

                                            <textarea
                                                rows={6}
                                                value={
                                                    form.historia
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'historia',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Cuenta la historia completa: cuál es la situación, quiénes serán beneficiados, por qué se necesita apoyo y cómo se utilizarán las aportaciones..."
                                                className={
                                                    textareaClass
                                                }
                                            />
                                        </label>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-[var(--emerald)]">
                                            <ImagePlus
                                                size={18}
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                                                Galería
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Imágenes de la causa
                                            </h2>

                                            <span className="text-[8px] text-[var(--muted)]">
                                                Hasta 8 imágenes · JPG, PNG, WebP o AVIF · máximo 8 MB por archivo
                                            </span>
                                        </div>
                                    </div>

                                    <input
                                        ref={
                                            imageInputRef
                                        }
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        multiple
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

                                            if (
                                                event.currentTarget ===
                                                event.target
                                            ) {
                                                setDraggingImages(
                                                    false,
                                                );
                                            }
                                        }}
                                        onDrop={
                                            handleImageDrop
                                        }
                                        className={`group flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center outline-none transition-all duration-300 ${draggingImages
                                            ? 'border-emerald-400/45 bg-emerald-400/[0.08] shadow-[inset_0_0_0_1px_rgba(52,211,153,.08)]'
                                            : 'border-white/[0.09] bg-white/[0.015] hover:border-emerald-400/25 hover:bg-emerald-400/[0.025] focus:border-emerald-400/30'
                                            } ${saving ||
                                                images.length >=
                                                MAX_IMAGES
                                                ? 'cursor-not-allowed opacity-60'
                                                : ''
                                            }`}
                                    >
                                        <div
                                            className={`grid h-12 w-12 place-items-center rounded-2xl transition-all duration-300 ${draggingImages
                                                ? 'scale-110 bg-emerald-400/15 text-emerald-300'
                                                : 'bg-white/[0.04] text-[var(--muted)] group-hover:-translate-y-0.5 group-hover:bg-emerald-400/10 group-hover:text-emerald-300'
                                                }`}
                                        >
                                            <UploadCloud
                                                size={22}
                                                strokeWidth={
                                                    1.7
                                                }
                                            />
                                        </div>

                                        <span className="mt-3 text-[10px] font-semibold text-[var(--text-soft)]">
                                            {draggingImages
                                                ? 'Suelta las imágenes aquí'
                                                : images.length >=
                                                    MAX_IMAGES
                                                    ? 'Límite de imágenes alcanzado'
                                                    : 'Arrastra imágenes aquí'}
                                        </span>

                                        <span className="mt-1 text-[8px] text-[var(--muted)]">
                                            {images.length >=
                                                MAX_IMAGES
                                                ? `${images.length}/${MAX_IMAGES} imágenes`
                                                : 'o haz clic para seleccionar desde tu dispositivo'}
                                        </span>
                                    </div>

                                    {images.length >
                                        0 && (
                                            <div className="mt-4">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                                        Imágenes seleccionadas
                                                    </span>

                                                    <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[8px] font-semibold text-[var(--text-soft)]">
                                                        {
                                                            images.length
                                                        }
                                                        /{
                                                            MAX_IMAGES
                                                        }
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                    {images.map(
                                                        (
                                                            image,
                                                            index,
                                                        ) => (
                                                            <div
                                                                key={
                                                                    image.key
                                                                }
                                                                className={`group relative overflow-hidden rounded-2xl border bg-white/[0.02] transition-all duration-300 ${image.isPrincipal
                                                                    ? 'border-emerald-400/30 shadow-[0_0_0_1px_rgba(52,211,153,.05)]'
                                                                    : 'border-white/[0.055] hover:border-white/[0.1]'
                                                                    }`}
                                                            >
                                                                <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
                                                                    <img
                                                                        src={
                                                                            image.previewUrl
                                                                        }
                                                                        alt={`Imagen ${index + 1} de la causa`}
                                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                                                    />

                                                                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                                                                        {image.isPrincipal ? (
                                                                            <span className="rounded-full border border-emerald-300/15 bg-emerald-950/80 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-emerald-200 backdrop-blur-md">
                                                                                Principal
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setPrincipalImage(
                                                                                        image.key,
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    saving
                                                                                }
                                                                                className="rounded-full border border-white/[0.08] bg-black/55 px-2 py-1 text-[7px] font-semibold text-white/80 backdrop-blur-md transition hover:bg-emerald-950/80 hover:text-emerald-200 disabled:opacity-50"
                                                                            >
                                                                                Hacer principal
                                                                            </button>
                                                                        )}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeImage(
                                                                                    image.key,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                saving
                                                                            }
                                                                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-black/60 text-white/75 backdrop-blur-md transition hover:bg-rose-500/80 hover:text-white disabled:opacity-50"
                                                                            aria-label="Eliminar imagen"
                                                                        >
                                                                            <X
                                                                                size={13}
                                                                            />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="p-2.5">
                                                                    <span className="block truncate text-[8px] font-semibold text-[var(--text-soft)]">
                                                                        {
                                                                            image.name
                                                                        }
                                                                    </span>

                                                                    <div className="mt-1 flex items-center justify-between gap-2">
                                                                        <span className="truncate text-[7px] uppercase text-[var(--muted)]">
                                                                            {image.mimeType
                                                                                .replace(
                                                                                    'image/',
                                                                                    '',
                                                                                )
                                                                                .toUpperCase()}
                                                                        </span>

                                                                        <span className="shrink-0 text-[7px] text-[var(--muted)]">
                                                                            {image.size
                                                                                ? `${(
                                                                                    image.size /
                                                                                    1024 /
                                                                                    1024
                                                                                ).toFixed(
                                                                                    1,
                                                                                )} MB`
                                                                                : 'Guardada'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </section>

                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                                        Objetivo
                                    </span>

                                    <h2 className="mt-1 text-sm font-semibold text-[var(--text)]">
                                        Tipo de aportación
                                        <span className="ml-1 text-rose-300">
                                            *
                                        </span>
                                    </h2>

                                    <p className="mt-1 text-[8px] leading-4 text-[var(--muted)]">
                                        Selecciona si la causa necesita recaudar dinero o productos físicos.
                                    </p>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeMeta(
                                                    'economica',
                                                )
                                            }
                                            className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-300 sm:p-4 ${form.tipo_meta ===
                                                'economica'
                                                ? 'border-emerald-400/20 bg-emerald-400/[0.09]'
                                                : 'border-white/[0.05] bg-white/[0.025] hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <CircleDollarSign
                                                size={20}
                                                className="shrink-0 text-[var(--emerald)] transition-transform duration-300 group-hover:scale-110"
                                            />

                                            <div>
                                                <span className="block text-[10px] font-semibold text-[var(--text)] sm:text-[11px]">
                                                    Económica
                                                </span>

                                                <span className="hidden text-[8px] text-[var(--muted)] sm:block">
                                                    Recaudar dinero
                                                </span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeMeta(
                                                    'especie',
                                                )
                                            }
                                            className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-300 sm:p-4 ${form.tipo_meta ===
                                                'especie'
                                                ? 'border-emerald-400/20 bg-emerald-400/[0.09]'
                                                : 'border-white/[0.05] bg-white/[0.025] hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <Gift
                                                size={20}
                                                className="shrink-0 text-[var(--emerald)] transition-transform duration-300 group-hover:scale-110"
                                            />

                                            <div>
                                                <span className="block text-[10px] font-semibold text-[var(--text)] sm:text-[11px]">
                                                    En especie
                                                </span>

                                                <span className="hidden text-[8px] text-[var(--muted)] sm:block">
                                                    Recolectar productos
                                                </span>
                                            </div>
                                        </button>
                                    </div>

                                    {form.tipo_meta ===
                                        'economica' ? (
                                        <div className="mt-5">
                                            <label>
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <span className="text-[9px] font-semibold text-[var(--text-soft)]">
                                                        Meta económica
                                                        <span className="ml-1 text-rose-300">
                                                            *
                                                        </span>
                                                    </span>

                                                    {economicError && (
                                                        <span className="flex items-center gap-1 text-[8px] text-rose-300">
                                                            <AlertCircle
                                                                size={11}
                                                            />
                                                            Ingresa una cantidad
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                                                        $
                                                    </span>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="0.01"
                                                        value={
                                                            form.meta_economica
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setField(
                                                                'meta_economica',
                                                                event.target.value,
                                                            )
                                                        }
                                                        placeholder="Ej. 100000"
                                                        className={`${inputClass} pl-8 pr-14 ${economicError
                                                            ? 'border-rose-400/40'
                                                            : ''
                                                            }`}
                                                    />

                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[var(--muted)]">
                                                        MXN
                                                    </span>
                                                </div>
                                            </label>
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
                                                    className="group flex h-9 shrink-0 items-center gap-2 rounded-xl bg-emerald-400/10 px-3 text-[9px] font-semibold text-[var(--emerald-soft)] transition-all duration-300 hover:bg-emerald-400/15"
                                                >
                                                    <Plus
                                                        size={14}
                                                        className="transition-transform duration-500 group-hover:rotate-180"
                                                    />
                                                    Agregar
                                                </button>
                                            </div>

                                            {productError && (
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
                                                            attemptedSubmit &&
                                                            !item.nombre.trim();

                                                        const quantityError =
                                                            attemptedSubmit &&
                                                            Number(
                                                                item.cantidad,
                                                            ) <= 0;

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
                                                                        className="group grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition-all hover:bg-rose-400/10 hover:text-rose-300"
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
                                                        onClick={() =>
                                                            setProducts([
                                                                emptyProduct(),
                                                            ])
                                                        }
                                                        className={`group flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-white/[0.015] text-[var(--muted)] transition-all hover:border-emerald-400/20 hover:bg-emerald-400/[0.02] ${productError
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
                                        <MapPin
                                            size={18}
                                            className="text-[var(--emerald)]"
                                        />

                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                                                Google Places
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Ubicación
                                            </h2>

                                            <span className="text-[8px] text-[var(--muted)]">
                                                Busca y selecciona el lugar donde se llevará a cabo la causa.
                                            </span>
                                        </div>
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
                                </section>

                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-4">
                                        <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                                            Participantes
                                        </span>

                                        <h2 className="mt-1 text-sm font-semibold text-[var(--text)]">
                                            Organización y beneficiario
                                        </h2>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Organización
                                            </span>

                                            <div className="relative">
                                                <select
                                                    value={
                                                        form.organizador
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setField(
                                                            'organizador',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={`${inputClass} appearance-none pr-10`}
                                                >
                                                    <option value="">
                                                        Selecciona una organización
                                                    </option>

                                                    {form.organizador &&
                                                        !organizations.some(
                                                            (
                                                                organization,
                                                            ) =>
                                                                organization.nombre_organizacion ===
                                                                form.organizador,
                                                        ) && (
                                                            <option
                                                                value={
                                                                    form.organizador
                                                                }
                                                            >
                                                                {
                                                                    form.organizador
                                                                }
                                                            </option>
                                                        )}

                                                    {organizations.map(
                                                        (
                                                            organization,
                                                        ) => (
                                                            <option
                                                                key={
                                                                    organization.id
                                                                }
                                                                value={
                                                                    organization.nombre_organizacion
                                                                }
                                                            >
                                                                {
                                                                    organization.nombre_organizacion
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

                                            {!organizations.length && (
                                                <span className="mt-1.5 block text-[8px] text-amber-300">
                                                    No hay una organización configurada.
                                                </span>
                                            )}
                                        </label>

                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Beneficiario
                                            </span>

                                            <input
                                                value={
                                                    form.beneficiario
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'beneficiario',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ej. 50 familias de la comunidad"
                                                className={
                                                    inputClass
                                                }
                                            />
                                        </label>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <CalendarDays
                                            size={17}
                                            className="text-[var(--emerald)]"
                                        />

                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                                                Calendario
                                            </span>

                                            <h2 className="text-sm font-semibold text-[var(--text)]">
                                                Periodo de la causa
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Fecha de inicio
                                            </span>

                                            <input
                                                type="datetime-local"
                                                value={
                                                    form.fecha_inicio
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'fecha_inicio',
                                                        event.target.value,
                                                    )
                                                }
                                                className={
                                                    inputClass
                                                }
                                            />

                                            <span className="mt-1.5 block text-[8px] text-[var(--muted)]">
                                                Momento en que inicia la recepción de aportaciones.
                                            </span>
                                        </label>

                                        <label>
                                            <span className="mb-2 block text-[9px] font-semibold text-[var(--text-soft)]">
                                                Fecha límite
                                            </span>

                                            <input
                                                type="datetime-local"
                                                value={
                                                    form.fecha_limite
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setField(
                                                        'fecha_limite',
                                                        event.target.value,
                                                    )
                                                }
                                                className={
                                                    inputClass
                                                }
                                            />

                                            <span className="mt-1.5 block text-[8px] text-[var(--muted)]">
                                                Fecha máxima prevista para alcanzar la meta.
                                            </span>
                                        </label>
                                    </div>
                                </section>
                            </div>

                            <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:rounded-3xl sm:p-5">
                                    {images.length >
                                        0 && (
                                            <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.055] bg-black/20">
                                                <div className="relative aspect-[16/9]">
                                                    <img
                                                        src={
                                                            images.find(
                                                                (
                                                                    item,
                                                                ) =>
                                                                    item.isPrincipal,
                                                            )?.previewUrl ??
                                                            images[0].previewUrl
                                                        }
                                                        alt="Imagen principal de la causa"
                                                        className="h-full w-full object-cover"
                                                    />

                                                    <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[7px] font-semibold text-white/80 backdrop-blur-md">
                                                        Imagen principal
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                    <div className="flex items-start justify-between gap-3">
                                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/[0.08] text-[var(--emerald)]">
                                            <HeartHandshake
                                                size={19}
                                            />
                                        </div>

                                        {form.destacada && (
                                            <span className="flex items-center gap-1 rounded-full bg-amber-300/10 px-2.5 py-1.5 text-[8px] text-amber-300">
                                                <Star
                                                    size={11}
                                                    fill="currentColor"
                                                />
                                                Destacada
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                            Resumen de la causa
                                        </span>

                                        <h3 className="mt-1 break-words text-sm font-semibold leading-5 text-[var(--text)]">
                                            {form.titulo ||
                                                'Nueva causa'}
                                        </h3>

                                        {form.resumen ? (
                                            <p className="mt-2 line-clamp-4 text-[9px] leading-4 text-[var(--muted)]">
                                                {
                                                    form.resumen
                                                }
                                            </p>
                                        ) : (
                                            <p className="mt-2 text-[9px] italic text-[var(--muted)]">
                                                El resumen de la causa aparecerá aquí.
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-5">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-[8px] font-semibold text-[var(--muted)]">
                                                Información completada
                                            </span>

                                            <span className="text-[8px] font-bold text-[var(--emerald)]">
                                                {
                                                    completedFields
                                                }
                                                %
                                            </span>
                                        </div>

                                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                                            <div
                                                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                                                style={{
                                                    width: `${completedFields}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3 border-t border-white/[0.05] pt-4 text-[9px]">
                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Slug
                                            </span>

                                            <span className="max-w-[180px] truncate text-right text-[var(--text-soft)]">
                                                {slug || '—'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Categoría
                                            </span>

                                            <span className="max-w-[180px] truncate text-right text-[var(--text-soft)]">
                                                {category
                                                    ? formatCategory(
                                                        category,
                                                    )
                                                    : '—'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Estado
                                            </span>

                                            <span
                                                className={`rounded-full px-2 py-1 text-[8px] font-semibold ${form.estado ===
                                                    'publicado'
                                                    ? 'bg-emerald-400/10 text-emerald-300'
                                                    : 'bg-amber-300/10 text-amber-300'
                                                    }`}
                                            >
                                                {form.estado ===
                                                    'publicado'
                                                    ? 'Publicado'
                                                    : 'Borrador'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Tipo de meta
                                            </span>

                                            <span className="font-semibold text-[var(--text-soft)]">
                                                {form.tipo_meta ===
                                                    'economica'
                                                    ? 'Económica'
                                                    : 'En especie'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Meta
                                            </span>

                                            <span className="text-right font-semibold text-[var(--text-soft)]">
                                                {form.tipo_meta ===
                                                    'economica'
                                                    ? form.meta_economica
                                                        ? Number(
                                                            form.meta_economica,
                                                        ).toLocaleString(
                                                            'es-MX',
                                                            {
                                                                style:
                                                                    'currency',
                                                                currency:
                                                                    'MXN',
                                                            },
                                                        )
                                                        : '—'
                                                    : `${products.length} ${products.length ===
                                                        1
                                                        ? 'producto'
                                                        : 'productos'
                                                    }`}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Organización
                                            </span>

                                            <span className="max-w-[180px] truncate text-right text-[var(--text-soft)]">
                                                {form.organizador ||
                                                    '—'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Beneficiario
                                            </span>

                                            <span className="max-w-[180px] truncate text-right text-[var(--text-soft)]">
                                                {form.beneficiario ||
                                                    '—'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Ubicación
                                            </span>

                                            <span className="max-w-[180px] truncate text-right text-[var(--text-soft)]">
                                                {form.ubicacion ||
                                                    '—'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Inicio
                                            </span>

                                            <span className="text-right text-[var(--text-soft)]">
                                                {formatDate(
                                                    form.fecha_inicio,
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-[var(--muted)]">
                                                Fecha límite
                                            </span>

                                            <span className="text-right text-[var(--text-soft)]">
                                                {formatDate(
                                                    form.fecha_limite,
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {form.tipo_meta ===
                                        'especie' &&
                                        products.length >
                                        0 && (
                                            <div className="mt-5 border-t border-white/[0.05] pt-4">
                                                <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                                    Productos
                                                </span>

                                                <div className="mt-3 space-y-2">
                                                    {products.map(
                                                        (
                                                            item,
                                                            index,
                                                        ) => (
                                                            <div
                                                                key={
                                                                    item.key
                                                                }
                                                                className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-2.5 py-2"
                                                            >
                                                                <span className="min-w-0 truncate text-[8px] text-[var(--text-soft)]">
                                                                    {item.nombre ||
                                                                        `Producto ${index + 1}`}
                                                                </span>

                                                                <span className="shrink-0 text-[8px] font-semibold text-[var(--emerald-soft)]">
                                                                    {item.cantidad ||
                                                                        '0'}{' '}
                                                                    {
                                                                        item.unidad
                                                                    }
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    <label className="mt-5 flex cursor-pointer items-center justify-between rounded-xl bg-white/[0.025] p-3.5 transition-all hover:bg-white/[0.04]">
                                        <div>
                                            <span className="block text-[10px] font-semibold text-[var(--text-soft)]">
                                                Causa destacada
                                            </span>

                                            <span className="mt-0.5 block text-[8px] text-[var(--muted)]">
                                                Mostrar esta causa con prioridad
                                            </span>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={
                                                form.destacada
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setField(
                                                    'destacada',
                                                    event.target.checked,
                                                )
                                            }
                                            className="h-4 w-4 accent-emerald-500"
                                        />
                                    </label>

                                    {attemptedSubmit &&
                                        !valid && (
                                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/10 bg-rose-400/[0.04] p-3">
                                                <AlertCircle
                                                    size={14}
                                                    className="mt-0.5 shrink-0 text-rose-300"
                                                />

                                                <span className="text-[8px] leading-4 text-rose-300">
                                                    Revisa los campos marcados como obligatorios.
                                                </span>
                                            </div>
                                        )}

                                    <button
                                        type="submit"
                                        disabled={
                                            saving
                                        }
                                        className={`group mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-semibold transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${valid
                                            ? 'bg-emerald-400/10 text-[var(--emerald-soft)] hover:-translate-y-0.5 hover:bg-emerald-400/15'
                                            : 'bg-white/[0.04] text-[var(--muted)] hover:bg-white/[0.06]'
                                            }`}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                                Guardando
                                            </>
                                        ) : editing ? (
                                            <>
                                                <Save
                                                    size={16}
                                                    className="transition-transform duration-300 group-hover:scale-110"
                                                />
                                                Guardar cambios
                                            </>
                                        ) : (
                                            <>
                                                <Plus
                                                    size={16}
                                                    className="transition-transform duration-500 group-hover:rotate-180 group-active:rotate-[360deg]"
                                                />
                                                Crear causa
                                            </>
                                        )}
                                    </button>

                                    {valid && (
                                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-400/[0.035] p-3">
                                            <Check
                                                size={14}
                                                className="shrink-0 text-[var(--emerald)]"
                                            />

                                            <span className="text-[8px] text-[var(--muted)]">
                                                Los campos obligatorios están completos
                                            </span>
                                        </div>
                                    )}
                                </section>
                            </aside>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}