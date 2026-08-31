import {
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    AlertCircle,
    BadgeDollarSign,
    Building2,
    CheckCircle2,
    ChevronDown,
    Clipboard,
    Landmark,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    ShieldCheck,
    UserRound,
    X,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase';

import type {
    FundSettingsWithUpdater,
    SettingsForm,
    SettingsUpdater,
} from './settingsTypes';

import {
    cleanText,
    formatDate,
    getInitials,
    getUpdaterName,
    maskClabe,
} from './settingsUtils';

interface AdminSettingsScreenProps {
    showToast: (
        message: string,
        type?:
            | 'success'
            | 'error'
            | 'info'
            | 'warning',
    ) => void;
    refreshKey?: number;
    onChanged?: () => void;
}

const INITIAL_FORM: SettingsForm = {
    nombre_organizacion:
        '',
    institucion_bancaria:
        '',
    nombre_beneficiario:
        '',
    clabe:
        '',
    concepto_transferencia:
        'APORTE SHITAN TRUST',
};

function toForm(
    item:
        | FundSettingsWithUpdater
        | null,
): SettingsForm {
    if (!item) {
        return {
            ...INITIAL_FORM,
        };
    }

    return {
        nombre_organizacion:
            item.nombre_organizacion ??
            '',
        institucion_bancaria:
            item.institucion_bancaria ??
            '',
        nombre_beneficiario:
            item.nombre_beneficiario ??
            '',
        clabe:
            item.clabe ??
            '',
        concepto_transferencia:
            item.concepto_transferencia ??
            '',
    };
}

export default function AdminSettingsScreen({
    showToast,
    refreshKey = 0,
    onChanged,
}: AdminSettingsScreenProps) {
    const [
        configurations,
        setConfigurations,
    ] =
        useState<
            FundSettingsWithUpdater[]
        >([]);

    const [
        selectedId,
        setSelectedId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        form,
        setForm,
    ] =
        useState<SettingsForm>({
            ...INITIAL_FORM,
        });

    const [
        originalForm,
        setOriginalForm,
    ] =
        useState<SettingsForm>({
            ...INITIAL_FORM,
        });

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        copied,
        setCopied,
    ] = useState(false);

    const [
        attemptedSubmit,
        setAttemptedSubmit,
    ] = useState(false);

    const [
        touchedFields,
        setTouchedFields,
    ] =
        useState<
            Partial<
                Record<
                    keyof SettingsForm,
                    boolean
                >
            >
        >({});

    const selectedConfiguration =
        useMemo(
            () =>
                configurations.find(
                    (
                        item,
                    ) =>
                        item.id ===
                        selectedId,
                ) ??
                null,
            [
                configurations,
                selectedId,
            ],
        );

    const setField =
        <
            K extends keyof SettingsForm,
        >(
            field: K,
            value: SettingsForm[K],
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

    const touchField =
        (
            field: keyof SettingsForm,
        ) => {
            setTouchedFields(
                (
                    current,
                ) => ({
                    ...current,
                    [field]:
                        true,
                }),
            );
        };

    const resetValidation =
        () => {
            setAttemptedSubmit(
                false,
            );

            setTouchedFields(
                {},
            );
        };

    const loadConfigurations =
        useCallback(
            async (
                refresh = false,
                preferredId?: number | null,
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
                                'configuracion_fondo',
                            )
                            .select(
                                'id,nombre_organizacion,institucion_bancaria,nombre_beneficiario,clabe,concepto_transferencia,actualizado_por,actualizado_en',
                            )
                            .order(
                                'nombre_organizacion',
                                {
                                    ascending:
                                        true,
                                },
                            );

                    if (
                        error
                    ) {
                        throw error;
                    }

                    const rows =
                        data ??
                        [];

                    const profileIds =
                        [
                            ...new Set(
                                rows
                                    .map(
                                        (
                                            item,
                                        ) =>
                                            item.actualizado_por,
                                    )
                                    .filter(
                                        (
                                            value,
                                        ): value is string =>
                                            Boolean(
                                                value,
                                            ),
                                    ),
                            ),
                        ];

                    let profiles:
                        SettingsUpdater[] =
                        [];

                    if (
                        profileIds.length
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
                                    profileIds,
                                );

                        if (
                            profileError
                        ) {
                            throw profileError;
                        }

                        profiles =
                            (
                                profileData ??
                                []
                            ).map(
                                (
                                    profile,
                                ) => ({
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
                                }),
                            );
                    }

                    const profileMap =
                        new Map(
                            profiles.map(
                                (
                                    profile,
                                ) => [
                                        profile.id,
                                        profile,
                                    ],
                            ),
                        );

                    const normalized:
                        FundSettingsWithUpdater[] =
                        rows.map(
                            (
                                item,
                            ) => ({
                                id:
                                    Number(
                                        item.id,
                                    ),

                                nombre_organizacion:
                                    item.nombre_organizacion ??
                                    null,

                                institucion_bancaria:
                                    item.institucion_bancaria ??
                                    null,

                                nombre_beneficiario:
                                    item.nombre_beneficiario ??
                                    null,

                                clabe:
                                    item.clabe ??
                                    null,

                                concepto_transferencia:
                                    item.concepto_transferencia ??
                                    null,

                                actualizado_por:
                                    item.actualizado_por ??
                                    null,

                                actualizado_en:
                                    item.actualizado_en ??
                                    null,

                                actualizador:
                                    item.actualizado_por
                                        ? profileMap.get(
                                            item.actualizado_por,
                                        ) ??
                                        null
                                        : null,
                            }),
                        );

                    setConfigurations(
                        normalized,
                    );

                    if (
                        creating &&
                        preferredId ===
                        undefined
                    ) {
                        return;
                    }

                    const targetId =
                        preferredId ??
                        selectedId;

                    const target =
                        targetId !==
                            null &&
                            targetId !==
                            undefined
                            ? normalized.find(
                                (
                                    item,
                                ) =>
                                    item.id ===
                                    targetId,
                            ) ??
                            null
                            : normalized[0] ??
                            null;

                    if (
                        target
                    ) {
                        const targetForm =
                            toForm(
                                target,
                            );

                        setSelectedId(
                            target.id,
                        );

                        setCreating(
                            false,
                        );

                        setForm(
                            targetForm,
                        );

                        setOriginalForm(
                            targetForm,
                        );

                        resetValidation();
                    } else if (
                        !normalized.length
                    ) {
                        setSelectedId(
                            null,
                        );

                        setCreating(
                            true,
                        );

                        setForm({
                            ...INITIAL_FORM,
                        });

                        setOriginalForm({
                            ...INITIAL_FORM,
                        });

                        resetValidation();
                    }
                } catch (
                error
                ) {
                    showToast(
                        error instanceof Error
                            ? error.message
                            : 'No se pudo cargar la configuración.',
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
                creating,
                selectedId,
                showToast,
            ],
        );

    useEffect(() => {
        void loadConfigurations();
    }, [
        refreshKey,
    ]);

    const selectConfiguration =
        (
            id: number,
        ) => {
            const selected =
                configurations.find(
                    (
                        item,
                    ) =>
                        item.id ===
                        id,
                ) ??
                null;

            if (
                !selected
            ) {
                return;
            }

            const selectedForm =
                toForm(
                    selected,
                );

            setSelectedId(
                selected.id,
            );

            setCreating(
                false,
            );

            setForm(
                selectedForm,
            );

            setOriginalForm(
                selectedForm,
            );

            resetValidation();
        };

    const createConfiguration =
        () => {
            setSelectedId(
                null,
            );

            setCreating(
                true,
            );

            setForm({
                ...INITIAL_FORM,
            });

            setOriginalForm({
                ...INITIAL_FORM,
            });

            resetValidation();
        };

    const cancelCreate =
        () => {
            if (
                configurations.length
            ) {
                selectConfiguration(
                    configurations[0].id,
                );

                return;
            }

            setSelectedId(
                null,
            );

            setCreating(
                true,
            );

            setForm({
                ...INITIAL_FORM,
            });

            setOriginalForm({
                ...INITIAL_FORM,
            });

            resetValidation();
        };

    const hasChanges =
        useMemo(
            () =>
                form.nombre_organizacion !==
                originalForm.nombre_organizacion ||
                form.institucion_bancaria !==
                originalForm.institucion_bancaria ||
                form.nombre_beneficiario !==
                originalForm.nombre_beneficiario ||
                form.clabe !==
                originalForm.clabe ||
                form.concepto_transferencia !==
                originalForm.concepto_transferencia,
            [
                form,
                originalForm,
            ],
        );

    const organizationMissing =
        !form.nombre_organizacion.trim();

    const bankMissing =
        !form.institucion_bancaria.trim();

    const beneficiaryMissing =
        !form.nombre_beneficiario.trim();

    const clabeMissing =
        !form.clabe.trim();

    const clabeInvalid =
        Boolean(
            form.clabe.trim(),
        ) &&
        !/^\d{18}$/.test(
            form.clabe.trim(),
        );

    const conceptMissing =
        !form.concepto_transferencia.trim();

    const organizationError =
        (
            attemptedSubmit ||
            touchedFields.nombre_organizacion
        ) &&
        organizationMissing;

    const bankError =
        (
            attemptedSubmit ||
            touchedFields.institucion_bancaria
        ) &&
        bankMissing;

    const beneficiaryError =
        (
            attemptedSubmit ||
            touchedFields.nombre_beneficiario
        ) &&
        beneficiaryMissing;

    const clabeError =
        (
            attemptedSubmit ||
            touchedFields.clabe
        ) &&
        (
            clabeMissing ||
            clabeInvalid
        );

    const conceptError =
        (
            attemptedSubmit ||
            touchedFields.concepto_transferencia
        ) &&
        conceptMissing;

    const valid =
        !organizationMissing &&
        !bankMissing &&
        !beneficiaryMissing &&
        !clabeMissing &&
        !clabeInvalid &&
        !conceptMissing;

    const completedFields =
        useMemo(() => {
            const values = [
                !organizationMissing,
                !bankMissing,
                !beneficiaryMissing,
                !clabeMissing &&
                !clabeInvalid,
                !conceptMissing,
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
        }, [
            organizationMissing,
            bankMissing,
            beneficiaryMissing,
            clabeMissing,
            clabeInvalid,
            conceptMissing,
        ]);

    const handleClabeChange =
        (
            value: string,
        ) => {
            setField(
                'clabe',
                value
                    .replace(
                        /\D/g,
                        '',
                    )
                    .slice(
                        0,
                        18,
                    ),
            );
        };

    const getNextId =
        async () => {
            const {
                data,
                error,
            } =
                await supabase
                    .from(
                        'configuracion_fondo',
                    )
                    .select(
                        'id',
                    )
                    .order(
                        'id',
                        {
                            ascending:
                                false,
                        },
                    )
                    .limit(
                        1,
                    );

            if (
                error
            ) {
                throw error;
            }

            const highest =
                Number(
                    data?.[0]?.id ??
                    0,
                );

            return highest + 1;
        };

    const submit =
        async (
            event: FormEvent,
        ) => {
            event.preventDefault();

            setAttemptedSubmit(
                true,
            );

            if (
                saving
            ) {
                return;
            }

            if (
                !valid
            ) {
                showToast(
                    'Completa correctamente todos los campos obligatorios.',
                    'warning',
                );

                return;
            }

            setSaving(
                true,
            );

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

                const userId =
                    authData.user
                        ?.id ??
                    null;

                if (
                    !userId
                ) {
                    throw new Error(
                        'No se encontró la sesión del administrador.',
                    );
                }

                const now =
                    new Date()
                        .toISOString();

                const payload = {
                    nombre_organizacion:
                        cleanText(
                            form.nombre_organizacion,
                        ),

                    institucion_bancaria:
                        cleanText(
                            form.institucion_bancaria,
                        ),

                    nombre_beneficiario:
                        cleanText(
                            form.nombre_beneficiario,
                        ),

                    clabe:
                        cleanText(
                            form.clabe,
                        ),

                    concepto_transferencia:
                        cleanText(
                            form.concepto_transferencia,
                        ),

                    actualizado_por:
                        userId,

                    actualizado_en:
                        now,
                };

                let savedId:
                    number;

                if (
                    creating ||
                    selectedId ===
                    null
                ) {
                    savedId =
                        await getNextId();

                    const {
                        error,
                    } =
                        await supabase
                            .from(
                                'configuracion_fondo',
                            )
                            .insert({
                                id:
                                    savedId,
                                ...payload,
                            });

                    if (
                        error
                    ) {
                        throw error;
                    }
                } else {
                    savedId =
                        selectedId;

                    const {
                        error,
                    } =
                        await supabase
                            .from(
                                'configuracion_fondo',
                            )
                            .update(
                                payload,
                            )
                            .eq(
                                'id',
                                selectedId,
                            );

                    if (
                        error
                    ) {
                        throw error;
                    }
                }

                setCreating(
                    false,
                );

                setSelectedId(
                    savedId,
                );

                await loadConfigurations(
                    false,
                    savedId,
                );

                setAttemptedSubmit(
                    false,
                );

                setTouchedFields(
                    {},
                );

                showToast(
                    creating
                        ? 'Configuración creada correctamente.'
                        : 'Configuración actualizada correctamente.',
                    'success',
                );

                onChanged?.();
            } catch (
            error
            ) {
                showToast(
                    error instanceof Error
                        ? error.message
                        : 'No se pudo guardar la configuración.',
                    'error',
                );
            } finally {
                setSaving(
                    false,
                );
            }
        };

    const restore =
        () => {
            setForm(
                originalForm,
            );

            resetValidation();
        };

    const copyClabe =
        async () => {
            const clabe =
                form.clabe.trim();

            if (
                !clabe
            ) {
                return;
            }

            try {
                await navigator.clipboard
                    .writeText(
                        clabe,
                    );

                setCopied(
                    true,
                );

                window.setTimeout(
                    () => {
                        setCopied(
                            false,
                        );
                    },
                    1500,
                );
            } catch {
                showToast(
                    'No se pudo copiar la CLABE.',
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
                    className="animate-spin text-amber-300"
                />
            </div>
        );
    }

    const updaterName =
        getUpdaterName(
            selectedConfiguration
                ?.actualizador,
        );

    const requiredLabel =
        (
            label: string,
        ) => (
            <span className="mb-2 flex items-center gap-1.5 text-[8px] font-semibold text-[var(--text-soft)]">
                {label}

                <span className="text-rose-300">
                    *
                </span>

                <span className="ml-auto text-[6px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                    Obligatorio
                </span>
            </span>
        );

    return (
        <form
            onSubmit={
                submit
            }
            noValidate
            className="w-full min-w-0"
        >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-amber-300">
                        Sistema
                    </span>

                    <div className="mt-1 flex items-baseline gap-2">
                        <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text)] sm:text-xl">
                            Configuración
                        </h2>

                        <span className="text-[9px] text-[var(--muted)]">
                            {
                                configurations.length
                            }
                        </span>
                    </div>

                    <p className="mt-1 max-w-2xl text-[9px] leading-4 text-[var(--muted)] sm:text-[10px]">
                        Administra organizaciones y sus configuraciones financieras.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={
                            createConfiguration
                        }
                        className="group flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-300/[0.1] px-4 text-[9px] font-semibold text-amber-200 transition-all hover:bg-amber-300/[0.16] active:scale-[0.98]"
                    >
                        <Plus
                            size={14}
                            className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110"
                        />

                        Nueva Organización
                    </button>
                </div>
            </div>

            {configurations.length >
                0 && (
                    <section className="mb-4 rounded-2xl border border-white/[0.055] bg-white/[0.022] p-3 sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                    Organización
                                </span>

                                <span className="mt-1 block text-[9px] text-[var(--text-soft)]">
                                    Selecciona la configuración que deseas administrar.
                                </span>
                            </div>

                            <div className="relative min-w-0 sm:w-[320px]">
                                <select
                                    value={
                                        creating
                                            ? ''
                                            : selectedId ??
                                            ''
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        const value =
                                            Number(
                                                event.target
                                                    .value,
                                            );

                                        if (
                                            Number.isFinite(
                                                value,
                                            )
                                        ) {
                                            selectConfiguration(
                                                value,
                                            );
                                        }
                                    }}
                                    className="h-11 w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 pr-10 text-[10px] font-semibold text-[var(--text)] outline-none focus:border-amber-300/25"
                                >
                                    {creating && (
                                        <option value="">
                                            Nueva configuración
                                        </option>
                                    )}

                                    {configurations.map(
                                        (
                                            item,
                                        ) => (
                                            <option
                                                key={
                                                    item.id
                                                }
                                                value={
                                                    item.id
                                                }
                                                className="bg-[#0d1424] text-white"
                                            >
                                                {item.nombre_organizacion ??
                                                    `Configuración ${item.id}`}
                                            </option>
                                        ),
                                    )}
                                </select>

                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                />
                            </div>
                        </div>
                    </section>
                )}

            {creating && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-300/[0.09] bg-amber-300/[0.025] px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-300/[0.09] text-amber-200">
                            <Plus
                                size={15}
                            />
                        </div>

                        <div>
                            <span className="block text-[9px] font-semibold text-amber-100">
                                Nueva configuración
                            </span>

                            <span className="mt-0.5 block text-[7px] text-[var(--muted)]">
                                Todos los campos marcados con * son obligatorios.
                            </span>
                        </div>
                    </div>

                    {configurations.length >
                        0 && (
                            <button
                                type="button"
                                onClick={
                                    cancelCreate
                                }
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-[var(--muted)] transition hover:bg-white/[0.08] hover:text-white"
                            >
                                <X
                                    size={14}
                                />
                            </button>
                        )}
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Campos completos
                    </span>

                    <strong
                        className={`mt-2 block text-xl font-bold ${completedFields ===
                            100
                            ? 'text-emerald-300'
                            : 'text-amber-200'
                            }`}
                    >
                        {completedFields}%
                    </strong>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.022] p-4">
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Organización
                    </span>

                    <strong className="mt-2 block truncate text-[12px] font-bold text-[var(--text)]">
                        {form.nombre_organizacion.trim() ||
                            'Pendiente'}
                    </strong>
                </div>

                <div
                    className={`rounded-2xl border p-4 ${valid
                        ? 'border-emerald-400/[0.08] bg-emerald-400/[0.018]'
                        : 'border-amber-300/[0.08] bg-amber-300/[0.018]'
                        }`}
                >
                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Estado
                    </span>

                    <strong
                        className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold ${valid
                            ? 'text-emerald-300'
                            : 'text-amber-200'
                            }`}
                    >
                        {valid ? (
                            <CheckCircle2
                                size={13}
                            />
                        ) : (
                            <AlertCircle
                                size={13}
                            />
                        )}

                        {valid
                            ? 'Listo para guardar'
                            : 'Faltan campos obligatorios'}
                    </strong>
                </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <main className="min-w-0 space-y-4">
                    <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/[0.08] text-amber-200">
                                <Building2
                                    size={17}
                                />
                            </div>

                            <div>
                                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                    Organización
                                </span>

                                <h3 className="mt-0.5 text-[11px] font-semibold text-[var(--text)]">
                                    Información general
                                </h3>
                            </div>
                        </div>

                        <label className="block">
                            {requiredLabel(
                                'Nombre de la organización',
                            )}

                            <input
                                type="text"
                                value={
                                    form.nombre_organizacion
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setField(
                                        'nombre_organizacion',
                                        event.target
                                            .value,
                                    )
                                }
                                onBlur={() =>
                                    touchField(
                                        'nombre_organizacion',
                                    )
                                }
                                aria-invalid={
                                    organizationError
                                }
                                placeholder="Nombre de la organización"
                                className={`h-11 w-full rounded-xl border bg-white/[0.025] px-3.5 text-[10px] text-[var(--text)] outline-none transition-all placeholder:text-[var(--muted)] ${organizationError
                                    ? 'border-rose-400/40 bg-rose-400/[0.025] focus:border-rose-400/60'
                                    : form.nombre_organizacion.trim()
                                        ? 'border-emerald-400/15 focus:border-emerald-400/30'
                                        : 'border-white/[0.06] focus:border-amber-300/25'
                                    }`}
                            />

                            {organizationError && (
                                <span className="mt-1.5 flex items-center gap-1.5 text-[7px] font-medium text-rose-300">
                                    <AlertCircle
                                        size={10}
                                    />

                                    Ingresa el nombre de la organización.
                                </span>
                            )}
                        </label>
                    </section>

                    <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
                                <Landmark
                                    size={17}
                                />
                            </div>

                            <div>
                                <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                    Transferencias
                                </span>

                                <h3 className="mt-0.5 text-[11px] font-semibold text-[var(--text)]">
                                    Información bancaria
                                </h3>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                {requiredLabel(
                                    'Institución bancaria',
                                )}

                                <input
                                    type="text"
                                    value={
                                        form.institucion_bancaria
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setField(
                                            'institucion_bancaria',
                                            event.target
                                                .value,
                                        )
                                    }
                                    onBlur={() =>
                                        touchField(
                                            'institucion_bancaria',
                                        )
                                    }
                                    aria-invalid={
                                        bankError
                                    }
                                    placeholder="Nombre del banco"
                                    className={`h-11 w-full rounded-xl border bg-white/[0.025] px-3.5 text-[10px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] ${bankError
                                        ? 'border-rose-400/40 bg-rose-400/[0.025] focus:border-rose-400/60'
                                        : form.institucion_bancaria.trim()
                                            ? 'border-emerald-400/15 focus:border-emerald-400/30'
                                            : 'border-white/[0.06] focus:border-cyan-300/25'
                                        }`}
                                />

                                {bankError && (
                                    <span className="mt-1.5 flex items-center gap-1.5 text-[7px] font-medium text-rose-300">
                                        <AlertCircle
                                            size={10}
                                        />

                                        Ingresa la institución bancaria.
                                    </span>
                                )}
                            </label>

                            <label className="block">
                                {requiredLabel(
                                    'Nombre del beneficiario',
                                )}

                                <input
                                    type="text"
                                    value={
                                        form.nombre_beneficiario
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setField(
                                            'nombre_beneficiario',
                                            event.target
                                                .value,
                                        )
                                    }
                                    onBlur={() =>
                                        touchField(
                                            'nombre_beneficiario',
                                        )
                                    }
                                    aria-invalid={
                                        beneficiaryError
                                    }
                                    placeholder="Nombre del beneficiario"
                                    className={`h-11 w-full rounded-xl border bg-white/[0.025] px-3.5 text-[10px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] ${beneficiaryError
                                        ? 'border-rose-400/40 bg-rose-400/[0.025] focus:border-rose-400/60'
                                        : form.nombre_beneficiario.trim()
                                            ? 'border-emerald-400/15 focus:border-emerald-400/30'
                                            : 'border-white/[0.06] focus:border-cyan-300/25'
                                        }`}
                                />

                                {beneficiaryError && (
                                    <span className="mt-1.5 flex items-center gap-1.5 text-[7px] font-medium text-rose-300">
                                        <AlertCircle
                                            size={10}
                                        />

                                        Ingresa el nombre del beneficiario.
                                    </span>
                                )}
                            </label>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                {requiredLabel(
                                    'CLABE',
                                )}

                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={
                                            form.clabe
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            handleClabeChange(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        onBlur={() =>
                                            touchField(
                                                'clabe',
                                            )
                                        }
                                        aria-invalid={
                                            clabeError
                                        }
                                        placeholder="18 dígitos"
                                        className={`h-11 w-full rounded-xl border bg-white/[0.025] px-3.5 pr-11 font-mono text-[10px] text-[var(--text)] outline-none ${clabeError
                                            ? 'border-rose-400/40 bg-rose-400/[0.025] focus:border-rose-400/60'
                                            : /^\d{18}$/.test(
                                                form.clabe,
                                            )
                                                ? 'border-emerald-400/15 focus:border-emerald-400/30'
                                                : 'border-white/[0.06] focus:border-cyan-300/25'
                                            }`}
                                    />

                                    <button
                                        type="button"
                                        disabled={
                                            !form.clabe
                                        }
                                        onClick={() =>
                                            void copyClabe()
                                        }
                                        className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-white/[0.04] text-[var(--muted)] transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
                                    >
                                        {copied ? (
                                            <CheckCircle2
                                                size={13}
                                                className="text-emerald-300"
                                            />
                                        ) : (
                                            <Clipboard
                                                size={13}
                                            />
                                        )}
                                    </button>
                                </div>

                                <div className="mt-1.5 flex items-center justify-between gap-2">
                                    {clabeError ? (
                                        <span className="flex items-center gap-1.5 text-[7px] font-medium text-rose-300">
                                            <AlertCircle
                                                size={10}
                                            />

                                            {clabeMissing
                                                ? 'Ingresa la CLABE.'
                                                : 'La CLABE debe contener exactamente 18 dígitos.'}
                                        </span>
                                    ) : (
                                        <span className="text-[7px] text-[var(--muted)]">
                                            Solo números
                                        </span>
                                    )}

                                    <span
                                        className={`shrink-0 font-mono text-[7px] ${form.clabe.length ===
                                            18
                                            ? 'text-emerald-300'
                                            : 'text-[var(--muted)]'
                                            }`}
                                    >
                                        {form.clabe.length}/18
                                    </span>
                                </div>
                            </label>

                            <label className="block">
                                {requiredLabel(
                                    'Concepto de transferencia',
                                )}

                                <input
                                    type="text"
                                    value={
                                        form.concepto_transferencia
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setField(
                                            'concepto_transferencia',
                                            event.target
                                                .value,
                                        )
                                    }
                                    onBlur={() =>
                                        touchField(
                                            'concepto_transferencia',
                                        )
                                    }
                                    aria-invalid={
                                        conceptError
                                    }
                                    placeholder="APORTE SHITAN TRUST"
                                    className={`h-11 w-full rounded-xl border bg-white/[0.025] px-3.5 text-[10px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] ${conceptError
                                        ? 'border-rose-400/40 bg-rose-400/[0.025] focus:border-rose-400/60'
                                        : form.concepto_transferencia.trim()
                                            ? 'border-emerald-400/15 focus:border-emerald-400/30'
                                            : 'border-white/[0.06] focus:border-cyan-300/25'
                                        }`}
                                />

                                {conceptError && (
                                    <span className="mt-1.5 flex items-center gap-1.5 text-[7px] font-medium text-rose-300">
                                        <AlertCircle
                                            size={10}
                                        />

                                        Ingresa el concepto de transferencia.
                                    </span>
                                )}
                            </label>
                        </div>
                    </section>

                    {attemptedSubmit &&
                        !valid && (
                            <section className="rounded-2xl border border-rose-400/[0.12] bg-rose-400/[0.035] p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle
                                        size={16}
                                        className="mt-0.5 shrink-0 text-rose-300"
                                    />

                                    <div>
                                        <span className="block text-[9px] font-semibold text-rose-300">
                                            Revisa los campos obligatorios
                                        </span>

                                        <p className="mt-1 text-[8px] leading-4 text-[var(--muted)]">
                                            Completa los campos marcados con * antes de guardar esta configuración.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                    <section className="rounded-2xl border border-emerald-400/[0.07] bg-emerald-400/[0.018] p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <ShieldCheck
                                size={16}
                                className="mt-0.5 shrink-0 text-emerald-300"
                            />

                            <div>
                                <span className="block text-[9px] font-semibold text-emerald-300">
                                    Información sensible
                                </span>

                                <p className="mt-1 text-[8px] leading-4 text-[var(--muted)]">
                                    Verifica cuidadosamente los datos bancarios antes de guardar los cambios.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>

                <aside className="min-w-0">
                    <div className="space-y-4 xl:sticky xl:top-4">
                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4">
                            <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                Vista previa
                            </span>

                            <div className="mt-4 rounded-2xl border border-amber-300/[0.09] bg-gradient-to-br from-amber-300/[0.05] via-white/[0.015] to-transparent p-4">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/[0.09] text-amber-200">
                                        <BadgeDollarSign
                                            size={17}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <span className="block text-[7px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                            Transferencia
                                        </span>

                                        <span className="mt-0.5 block truncate text-[10px] font-semibold text-[var(--text)]">
                                            {form.nombre_organizacion.trim() ||
                                                'Sin organización'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    <div>
                                        <span className="block text-[7px] text-[var(--muted)]">
                                            Banco
                                        </span>

                                        <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                            {form.institucion_bancaria.trim() ||
                                                'Pendiente'}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="block text-[7px] text-[var(--muted)]">
                                            Beneficiario
                                        </span>

                                        <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                            {form.nombre_beneficiario.trim() ||
                                                'Pendiente'}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="block text-[7px] text-[var(--muted)]">
                                            CLABE
                                        </span>

                                        <span className="mt-1 block break-all font-mono text-[9px] font-semibold text-emerald-300">
                                            {form.clabe
                                                ? maskClabe(
                                                    form.clabe,
                                                )
                                                : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="block text-[7px] text-[var(--muted)]">
                                            Concepto
                                        </span>

                                        <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                                            {form.concepto_transferencia.trim() ||
                                                'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {!creating &&
                            selectedConfiguration && (
                                <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4">
                                    <div className="flex items-center gap-3">
                                        {selectedConfiguration
                                            .actualizador
                                            ?.avatar_url ? (
                                            <img
                                                src={
                                                    selectedConfiguration
                                                        .actualizador
                                                        .avatar_url
                                                }
                                                alt={
                                                    updaterName
                                                }
                                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-[9px] font-black text-[var(--text-soft)]">
                                                {getInitials(
                                                    updaterName,
                                                )}
                                            </div>
                                        )}

                                        <div className="min-w-0">
                                            <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                                                Última actualización
                                            </span>

                                            <span className="mt-1 block truncate text-[9px] font-semibold text-[var(--text-soft)]">
                                                {
                                                    updaterName
                                                }
                                            </span>

                                            <span className="mt-1 block text-[7px] text-[var(--muted)]">
                                                {formatDate(
                                                    selectedConfiguration.actualizado_en,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            )}

                        <section
                            className={`rounded-2xl border p-4 ${valid
                                ? 'border-emerald-400/[0.1] bg-emerald-400/[0.02]'
                                : 'border-amber-300/[0.09] bg-amber-300/[0.02]'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {valid ? (
                                    <CheckCircle2
                                        size={16}
                                        className="mt-0.5 shrink-0 text-emerald-300"
                                    />
                                ) : (
                                    <AlertCircle
                                        size={16}
                                        className="mt-0.5 shrink-0 text-amber-200"
                                    />
                                )}

                                <div>
                                    <span
                                        className={`block text-[8px] font-semibold ${valid
                                            ? 'text-emerald-300'
                                            : 'text-amber-200'
                                            }`}
                                    >
                                        {valid
                                            ? 'Configuración completa'
                                            : 'Configuración incompleta'}
                                    </span>

                                    <span className="mt-1 block text-[7px] leading-4 text-[var(--muted)]">
                                        {valid
                                            ? 'Todos los campos obligatorios están completos.'
                                            : `${5 - Math.round((completedFields / 100) * 5)} campos pendientes por completar.`}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-white/[0.055] bg-white/[0.022] p-4">
                            <div className="flex items-start gap-3">
                                <UserRound
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                                />

                                <div className="min-w-0">
                                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                                        Registro
                                    </span>

                                    <span className="mt-1 block font-mono text-[7px] text-[var(--muted)]">
                                        {creating
                                            ? 'Nuevo registro'
                                            : selectedId !==
                                                null
                                                ? `configuracion_fondo / ${selectedId}`
                                                : '—'}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>
                </aside>
            </div>

            <div className="sticky bottom-3 z-20 mt-4">
                <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[var(--bg)]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                            {!valid
                                ? 'Completa los campos obligatorios'
                                : creating
                                    ? 'Nueva configuración lista'
                                    : hasChanges
                                        ? 'Tienes cambios sin guardar'
                                        : 'Configuración actualizada'}
                        </span>

                        <span className="mt-0.5 block text-[7px] text-[var(--muted)]">
                            {!valid
                                ? 'Los campos marcados con * son necesarios para continuar.'
                                : creating
                                    ? 'Ya puedes registrar esta configuración.'
                                    : hasChanges
                                        ? 'Guarda los cambios para aplicarlos.'
                                        : 'No hay cambios pendientes.'}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {!creating &&
                            hasChanges && (
                                <button
                                    type="button"
                                    disabled={
                                        saving
                                    }
                                    onClick={
                                        restore
                                    }
                                    className="h-10 flex-1 rounded-xl bg-white/[0.04] px-4 text-[9px] font-semibold text-[var(--muted)] transition-all hover:bg-white/[0.07] hover:text-white disabled:opacity-40 sm:flex-none"
                                >
                                    Descartar
                                </button>
                            )}

                        {creating &&
                            configurations.length >
                            0 && (
                                <button
                                    type="button"
                                    disabled={
                                        saving
                                    }
                                    onClick={
                                        cancelCreate
                                    }
                                    className="h-10 flex-1 rounded-xl bg-white/[0.04] px-4 text-[9px] font-semibold text-[var(--muted)] transition-all hover:bg-white/[0.07] hover:text-white disabled:opacity-40 sm:flex-none"
                                >
                                    Cancelar
                                </button>
                            )}

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                (
                                    !creating &&
                                    !hasChanges
                                )
                            }
                            className={`group flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-[9px] font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none ${valid
                                ? 'bg-amber-300/[0.11] text-amber-200 hover:bg-amber-300/[0.17]'
                                : 'bg-rose-400/[0.08] text-rose-300 hover:bg-rose-400/[0.12]'
                                }`}
                        >
                            {saving ? (
                                <Loader2
                                    size={14}
                                    className="animate-spin"
                                />
                            ) : valid ? (
                                creating ? (
                                    <Plus
                                        size={14}
                                        className="transition-transform duration-300 group-hover:rotate-90"
                                    />
                                ) : (
                                    <Save
                                        size={14}
                                        className="transition-transform duration-300 group-hover:scale-110"
                                    />
                                )
                            ) : (
                                <AlertCircle
                                    size={14}
                                />
                            )}

                            {saving
                                ? 'Guardando...'
                                : !valid
                                    ? 'Revisar campos'
                                    : creating
                                        ? 'Crear configuración'
                                        : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}