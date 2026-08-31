import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  createPortal,
} from 'react-dom';

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  FileCheck2,
  FileImage,
  FileText,
  HeartHandshake,
  ImageIcon,
  Landmark,
  Loader2,
  LockKeyhole,
  Package,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from 'lucide-react';

import type {
  Screen,
  SubmissionData,
} from '../../types';

import {
  supabase,
} from '../../lib/supabase';

interface ContributeScreenProps {
  open: boolean;
  causeId: string;
  navigate: (
    to: Screen,
    causeId?: string,
  ) => void;
  showToast: (
    message: string,
    type?:
      | 'success'
      | 'error'
      | 'info'
      | 'warning',
  ) => void;
  onSuccess: (
    data: SubmissionData,
  ) => void;
}

interface CauseData {
  id: string;
  titulo: string;
  resumen: string | null;
  tipo_meta:
  | 'economica'
  | 'especie';
  meta_economica: number | null;
  organizador: string | null;
  beneficiario: string | null;
  fecha_completada: string | null;
}

interface ProfileData {
  id: string;
  correo: string | null;
  nombre_completo: string | null;
  alias: string | null;
  telefono: string | null;
  anonimo_por_defecto: boolean;
}

interface FundSettings {
  nombre_organizacion: string;
  institucion_bancaria: string | null;
  nombre_beneficiario: string | null;
  clabe: string | null;
  concepto_transferencia: string | null;
}

interface MetaEspecie {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  cantidad_objetivo: number;
  cantidad_aprobada: number;
  cantidad_restante: number;
  orden: number;
}

interface SpeciesItemForm {
  key: string;
  meta_especie_id: string;
  nombre: string;
  cantidad: string;
  unidad: string;
  notas: string;
}

interface MetaProgressRow {
  meta_especie_id: string;
  cantidad_objetivo: number | string | null;
  cantidad_aprobada: number | string | null;
  cantidad_restante: number | string | null;
}

interface MetaProgress {
  cantidad_aprobada: number;
  cantidad_restante: number;
}

interface EconomicProgressRow {
  meta_economica: number | string | null;
  monto_aprobado: number | string | null;
  monto_restante: number | string | null;
}

const PROOF_BUCKET =
  'comprobantes';

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

function createKey() {
  if (
    typeof crypto !==
    'undefined' &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return Math.random()
    .toString(36)
    .slice(2);
}

function cleanFileName(
  value: string,
) {
  const extension =
    value
      .split('.')
      .pop()
      ?.toLowerCase() ||
    '';

  const base =
    value
      .replace(
        /\.[^/.]+$/,
        '',
      )
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      )
      .slice(
        0,
        70,
      ) ||
    'archivo';

  return extension
    ? `${base}.${extension}`
    : base;
}

function formatMXN(
  value: number,
) {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style:
        'currency',
      currency:
        'MXN',
      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}

function getProfileName(
  profile:
    | ProfileData
    | null,
) {
  return (
    profile?.nombre_completo
      ?.trim() ||
    profile?.alias
      ?.trim() ||
    profile?.correo
      ?.trim() ||
    'Donante'
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

function emptySpeciesItem(
  metas: MetaEspecie[],
): SpeciesItemForm {
  const first =
    metas.find(
      (
        meta,
      ) =>
        meta.cantidad_restante >
        0,
    ) ??
    metas[0];

  return {
    key:
      createKey(),
    meta_especie_id:
      first?.id ??
      '',
    nombre:
      first?.nombre ??
      '',
    cantidad:
      '',
    unidad:
      first?.unidad ??
      'unidad',
    notas:
      '',
  };
}

export default function ContributeScreen({
  open,
  causeId,
  navigate,
  showToast,
  onSuccess,
}: ContributeScreenProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    cause,
    setCause,
  ] =
    useState<CauseData | null>(
      null,
    );

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileData | null>(
      null,
    );

  const [
    fund,
    setFund,
  ] =
    useState<FundSettings | null>(
      null,
    );

  const [
    metas,
    setMetas,
  ] =
    useState<
      MetaEspecie[]
    >([]);

  const [
    amount,
    setAmount,
  ] =
    useState('');

  const [
    economicRaised,
    setEconomicRaised,
  ] =
    useState(0);

  const [
    economicRemaining,
    setEconomicRemaining,
  ] =
    useState<number | null>(
      null,
    );

  const [
    transferReference,
    setTransferReference,
  ] =
    useState('');

  const [
    message,
    setMessage,
  ] =
    useState('');

  const [
    anonymous,
    setAnonymous,
  ] =
    useState(false);

  const [
    speciesItems,
    setSpeciesItems,
  ] =
    useState<
      SpeciesItemForm[]
    >([]);

  const [
    proofFile,
    setProofFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    proofPreview,
    setProofPreview,
  ] =
    useState<string | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    copied,
    setCopied,
  ] =
    useState<
      string | null
    >(null);

  const [
    attempted,
    setAttempted,
  ] =
    useState(false);

  const load =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        try {
          const {
            data:
            authData,
            error:
            authError,
          } =
            await supabase.auth.getUser();

          if (
            authError
          ) {
            throw authError;
          }

          if (
            !authData.user
          ) {
            throw new Error(
              'Debes iniciar sesión para realizar una aportación.',
            );
          }

          const [
            causeResult,
            profileResult,
            fundResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  'causas',
                )
                .select(
                  'id,titulo,resumen,tipo_meta,meta_economica,organizador,beneficiario,fecha_completada',
                )
                .eq(
                  'id',
                  causeId,
                )
                .maybeSingle(),

              supabase
                .from(
                  'perfiles',
                )
                .select(
                  'id,correo,nombre_completo,alias,telefono,anonimo_por_defecto',
                )
                .eq(
                  'id',
                  authData.user.id,
                )
                .maybeSingle(),

              supabase
                .from(
                  'configuracion_fondo',
                )
                .select(
                  'nombre_organizacion,institucion_bancaria,nombre_beneficiario,clabe,concepto_transferencia',
                )
                .eq(
                  'id',
                  1,
                )
                .maybeSingle(),
            ]);

          if (
            causeResult.error
          ) {
            throw causeResult.error;
          }

          if (
            profileResult.error
          ) {
            throw profileResult.error;
          }

          if (
            fundResult.error
          ) {
            throw fundResult.error;
          }

          if (
            !causeResult.data
          ) {
            throw new Error(
              'No se encontró la causa.',
            );
          }

          const loadedCause:
            CauseData = {
            id:
              causeResult.data.id,
            titulo:
              causeResult.data.titulo,
            resumen:
              causeResult.data.resumen ??
              null,
            tipo_meta:
              causeResult.data.tipo_meta ===
                'especie'
                ? 'especie'
                : 'economica',
            meta_economica:
              causeResult.data.meta_economica ===
                null ||
                causeResult.data.meta_economica ===
                undefined
                ? null
                : Number(
                  causeResult.data.meta_economica,
                ),
            organizador:
              causeResult.data.organizador ??
              null,
            beneficiario:
              causeResult.data.beneficiario ??
              null,
            fecha_completada:
              causeResult.data.fecha_completada ??
              null,
          };

          if (
            loadedCause.fecha_completada
          ) {
            throw new Error(
              'Esta causa ya está completada y no acepta nuevas aportaciones.',
            );
          }

          const loadedProfile =
            profileResult.data
              ? {
                id:
                  profileResult.data.id,
                correo:
                  profileResult.data.correo ??
                  null,
                nombre_completo:
                  profileResult.data.nombre_completo ??
                  null,
                alias:
                  profileResult.data.alias ??
                  null,
                telefono:
                  profileResult.data.telefono ??
                  null,
                anonimo_por_defecto:
                  Boolean(
                    profileResult.data
                      .anonimo_por_defecto,
                  ),
              }
              : null;

          setCause(
            loadedCause,
          );

          setProfile(
            loadedProfile,
          );

          setAnonymous(
            Boolean(
              loadedProfile
                ?.anonimo_por_defecto,
            ),
          );

          setFund(
            fundResult.data
              ? {
                nombre_organizacion:
                  fundResult.data
                    .nombre_organizacion ??
                  'Shitan Trust',
                institucion_bancaria:
                  fundResult.data
                    .institucion_bancaria ??
                  null,
                nombre_beneficiario:
                  fundResult.data
                    .nombre_beneficiario ??
                  null,
                clabe:
                  fundResult.data
                    .clabe ??
                  null,
                concepto_transferencia:
                  fundResult.data
                    .concepto_transferencia ??
                  null,
              }
              : null,
          );

          if (
            loadedCause.tipo_meta ===
            'economica'
          ) {
            const {
              data:
              economicProgress,
              error:
              economicProgressError,
            } =
              await supabase.rpc(
                'obtener_restante_meta_economica',
                {
                  p_causa_id:
                    causeId,
                },
              );

            if (
              economicProgressError
            ) {
              throw economicProgressError;
            }

            const economicRows =
              (
                economicProgress ??
                []
              ) as EconomicProgressRow[];

            const economicRow =
              economicRows[0];

            const approved =
              Math.max(
                0,
                Number(
                  economicRow?.monto_aprobado ??
                  0,
                ),
              );

            const remaining =
              Math.max(
                0,
                Number(
                  economicRow?.monto_restante ??
                  loadedCause.meta_economica ??
                  0,
                ),
              );

            setEconomicRaised(
              approved,
            );

            setEconomicRemaining(
              remaining,
            );
          }

          if (
            loadedCause.tipo_meta ===
            'especie'
          ) {
            const [
              metasResult,
              progressResult,
            ] =
              await Promise.all([
                supabase
                  .from(
                    'metas_especie',
                  )
                  .select(
                    'id,nombre,descripcion,unidad,cantidad_objetivo,orden',
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
                supabase.rpc(
                  'obtener_restante_meta_especie',
                  {
                    p_causa_id:
                      causeId,
                  },
                ),
              ]);

            if (
              metasResult.error
            ) {
              throw metasResult.error;
            }

            if (
              progressResult.error
            ) {
              throw progressResult.error;
            }

            const progressRows =
              (
                progressResult.data ??
                []
              ) as MetaProgressRow[];

            const progressMap =
              new Map<
                string,
                MetaProgress
              >(
                progressRows.map(
                  (
                    item,
                  ) => [
                      item.meta_especie_id,
                      {
                        cantidad_aprobada:
                          Number(
                            item.cantidad_aprobada ??
                            0,
                          ),
                        cantidad_restante:
                          Math.max(
                            0,
                            Number(
                              item.cantidad_restante ??
                              0,
                            ),
                          ),
                      },
                    ],
                ),
              );

            const loadedMetas:
              MetaEspecie[] =
              (
                metasResult.data ??
                []
              ).map(
                (
                  item,
                ) => {
                  const progress =
                    progressMap.get(
                      item.id,
                    );

                  return {
                    id:
                      item.id,
                    nombre:
                      item.nombre,
                    descripcion:
                      item.descripcion ??
                      null,
                    unidad:
                      item.unidad,
                    cantidad_objetivo:
                      Number(
                        item.cantidad_objetivo,
                      ),
                    cantidad_aprobada:
                      progress?.cantidad_aprobada ??
                      0,
                    cantidad_restante:
                      progress?.cantidad_restante ??
                      Number(
                        item.cantidad_objetivo,
                      ),
                    orden:
                      Number(
                        item.orden ??
                        0,
                      ),
                  };
                },
              );

            setMetas(
              loadedMetas,
            );

            setSpeciesItems(
              loadedMetas.some(
                (
                  meta,
                ) =>
                  meta.cantidad_restante >
                  0,
              )
                ? [
                  emptySpeciesItem(
                    loadedMetas,
                  ),
                ]
                : [],
            );
          }
        } catch (
        error
        ) {
          showToast(
            error instanceof
              Error
              ? error.message
              : 'No se pudo preparar la aportación.',
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

  useEffect(
    () => {
      return () => {
        if (
          proofPreview
        ) {
          URL.revokeObjectURL(
            proofPreview,
          );
        }
      };
    },
    [
      proofPreview,
    ],
  );

  const numericAmount =
    Number(
      amount,
    );

  const amountValid =
    Number.isFinite(
      numericAmount,
    ) &&
    numericAmount >
    0 &&
    (
      economicRemaining ===
      null ||
      (
        economicRemaining >
        0 &&
        numericAmount <=
        economicRemaining
      )
    );

  const speciesTotals =
    useMemo(
      () => {
        const totals =
          new Map<
            string,
            number
          >();

        speciesItems.forEach(
          (
            item,
          ) => {
            const quantity =
              Number(
                item.cantidad,
              );

            if (
              !item.meta_especie_id ||
              !Number.isFinite(
                quantity,
              ) ||
              quantity <=
              0
            ) {
              return;
            }

            totals.set(
              item.meta_especie_id,
              (
                totals.get(
                  item.meta_especie_id,
                ) ??
                0
              ) +
              quantity,
            );
          },
        );

        return totals;
      },
      [
        speciesItems,
      ],
    );

  const speciesValid =
    speciesItems.length >
    0 &&
    speciesItems.every(
      (
        item,
      ) => {
        const meta =
          metas.find(
            (
              candidate,
            ) =>
              candidate.id ===
              item.meta_especie_id,
          );

        const quantity =
          Number(
            item.cantidad,
          );

        if (
          !meta ||
          !item.nombre.trim() ||
          !item.unidad.trim() ||
          !Number.isFinite(
            quantity,
          ) ||
          quantity <=
          0 ||
          meta.cantidad_restante <=
          0
        ) {
          return false;
        }

        return (
          speciesTotals.get(
            meta.id,
          ) ??
          0
        ) <=
          meta.cantidad_restante;
      },
    );

  const getSpeciesRemaining =
    (
      metaId: string,
      excludeKey?: string,
    ) => {
      const meta =
        metas.find(
          (
            candidate,
          ) =>
            candidate.id ===
            metaId,
        );

      if (
        !meta
      ) {
        return 0;
      }

      const used =
        speciesItems.reduce(
          (
            total,
            item,
          ) => {
            if (
              item.meta_especie_id !==
              metaId ||
              item.key ===
              excludeKey
            ) {
              return total;
            }

            const quantity =
              Number(
                item.cantidad,
              );

            return total +
              (
                Number.isFinite(
                  quantity,
                ) &&
                  quantity >
                  0
                  ? quantity
                  : 0
              );
          },
          0,
        );

      return Math.max(
        0,
        meta.cantidad_restante -
        used,
      );
    };

  const hasSpeciesAvailability =
    metas.some(
      (
        meta,
      ) =>
        getSpeciesRemaining(
          meta.id,
        ) >
        0,
    );

  const proofValid =
    Boolean(
      proofFile,
    );

  const formValid =
    Boolean(
      cause,
    ) &&
    proofValid &&
    (
      cause?.tipo_meta ===
        'economica'
        ? amountValid
        : speciesValid
    );

  const donorName =
    useMemo(
      () =>
        getProfileName(
          profile,
        ),
      [
        profile,
      ],
    );

  const selectProof =
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0] ??
        null;

      if (
        !file
      ) {
        return;
      }

      const economic =
        cause?.tipo_meta ===
        'economica';

      const allowedEconomic =
        file.type.startsWith(
          'image/',
        ) ||
        file.type ===
        'application/pdf';

      const allowedSpecies =
        file.type.startsWith(
          'image/',
        );

      if (
        economic
          ? !allowedEconomic
          : !allowedSpecies
      ) {
        showToast(
          economic
            ? 'El comprobante debe ser una imagen o un archivo PDF.'
            : 'La evidencia de entrega debe ser una imagen.',
          'warning',
        );

        event.target.value =
          '';

        return;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        showToast(
          'El archivo no puede superar 10 MB.',
          'warning',
        );

        event.target.value =
          '';

        return;
      }

      if (
        proofPreview
      ) {
        URL.revokeObjectURL(
          proofPreview,
        );
      }

      setProofFile(
        file,
      );

      if (
        file.type.startsWith(
          'image/',
        )
      ) {
        setProofPreview(
          URL.createObjectURL(
            file,
          ),
        );
      } else {
        setProofPreview(
          null,
        );
      }
    };

  const removeProof =
    () => {
      if (
        proofPreview
      ) {
        URL.revokeObjectURL(
          proofPreview,
        );
      }

      setProofFile(
        null,
      );

      setProofPreview(
        null,
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          '';
      }
    };

  const copy =
    async (
      key: string,
      value:
        | string
        | null,
    ) => {
      if (
        !value
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          value,
        );

        setCopied(
          key,
        );

        window.setTimeout(
          () =>
            setCopied(
              null,
            ),
          1400,
        );
      } catch {
        showToast(
          'No se pudo copiar.',
          'error',
        );
      }
    };

  const updateSpeciesItem =
    (
      key: string,
      field:
        | 'meta_especie_id'
        | 'cantidad'
        | 'notas',
      value: string,
    ) => {
      setSpeciesItems(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) => {
              if (
                item.key !==
                key
              ) {
                return item;
              }

              if (
                field ===
                'meta_especie_id'
              ) {
                const meta =
                  metas.find(
                    (
                      candidate,
                    ) =>
                      candidate.id ===
                      value,
                  );

                return {
                  ...item,
                  meta_especie_id:
                    value,
                  nombre:
                    meta?.nombre ??
                    '',
                  cantidad:
                    '',
                  unidad:
                    meta?.unidad ??
                    'unidad',
                };
              }

              if (
                field ===
                'cantidad'
              ) {
                if (
                  value ===
                  ''
                ) {
                  return {
                    ...item,
                    cantidad:
                      '',
                  };
                }

                const meta =
                  metas.find(
                    (
                      candidate,
                    ) =>
                      candidate.id ===
                      item.meta_especie_id,
                  );

                const parsed =
                  Number(
                    value,
                  );

                if (
                  !meta ||
                  !Number.isFinite(
                    parsed,
                  )
                ) {
                  return item;
                }

                const usedByOthers =
                  current.reduce(
                    (
                      total,
                      candidate,
                    ) => {
                      if (
                        candidate.key ===
                        key ||
                        candidate.meta_especie_id !==
                        item.meta_especie_id
                      ) {
                        return total;
                      }

                      const quantity =
                        Number(
                          candidate.cantidad,
                        );

                      return total +
                        (
                          Number.isFinite(
                            quantity,
                          ) &&
                            quantity >
                            0
                            ? quantity
                            : 0
                        );
                    },
                    0,
                  );

                const maxAvailable =
                  Math.max(
                    0,
                    meta.cantidad_restante -
                    usedByOthers,
                  );

                const nextValue =
                  Math.min(
                    Math.max(
                      0,
                      parsed,
                    ),
                    maxAvailable,
                  );

                return {
                  ...item,
                  cantidad:
                    nextValue >
                      0
                      ? String(
                        nextValue,
                      )
                      : '',
                };
              }

              return {
                ...item,
                [field]:
                  value,
              };
            },
          ),
      );
    };

  const addSpeciesItem =
    () => {
      if (
        !metas.length
      ) {
        return;
      }

      setSpeciesItems(
        (
          current,
        ) => {
          const usedByMeta =
            new Map<
              string,
              number
            >();

          current.forEach(
            (
              item,
            ) => {
              const quantity =
                Number(
                  item.cantidad,
                );

              if (
                !item.meta_especie_id ||
                !Number.isFinite(
                  quantity,
                ) ||
                quantity <=
                0
              ) {
                return;
              }

              usedByMeta.set(
                item.meta_especie_id,
                (
                  usedByMeta.get(
                    item.meta_especie_id,
                  ) ??
                  0
                ) +
                quantity,
              );
            },
          );

          const availableMetas =
            metas.filter(
              (
                meta,
              ) =>
                meta.cantidad_restante -
                (
                  usedByMeta.get(
                    meta.id,
                  ) ??
                  0
                ) >
                0,
            );

          if (
            !availableMetas.length
          ) {
            showToast(
              'Ya cubriste en este formulario todo lo que falta por aportar.',
              'info',
            );

            return current;
          }

          return [
            ...current,
            emptySpeciesItem(
              availableMetas,
            ),
          ];
        },
      );
    };

  const removeSpeciesItem =
    (
      key: string,
    ) => {
      setSpeciesItems(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.key !==
              key,
          ),
      );
    };

  const uploadProof =
    async (
      userId: string,
      contributionId: string,
      file: File,
    ) => {
      const safeName =
        cleanFileName(
          file.name,
        );

      const path =
        `${userId}/${contributionId}/${Date.now()}-${createKey()}-${safeName}`;

      const {
        error:
        uploadError,
      } =
        await supabase.storage
          .from(
            PROOF_BUCKET,
          )
          .upload(
            path,
            file,
            {
              cacheControl:
                '3600',
              upsert:
                false,
              contentType:
                file.type ||
                undefined,
            },
          );

      if (
        uploadError
      ) {
        throw uploadError;
      }

      const {
        error:
        receiptError,
      } =
        await supabase
          .from(
            'comprobantes',
          )
          .insert({
            aportacion_id:
              contributionId,
            usuario_id:
              userId,
            ruta_storage:
              path,
            nombre_archivo:
              file.name,
            tipo_mime:
              file.type ||
              null,
            tamano_bytes:
              file.size,
          });

      if (
        receiptError
      ) {
        await supabase.storage
          .from(
            PROOF_BUCKET,
          )
          .remove([
            path,
          ]);

        throw receiptError;
      }

      return path;
    };

  const submit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setAttempted(
        true,
      );

      if (
        submitting
      ) {
        return;
      }

      if (
        !formValid ||
        !cause ||
        !proofFile
      ) {
        showToast(
          cause?.tipo_meta ===
            'economica'
            ? 'Ingresa el monto y adjunta el comprobante de pago.'
            : 'Completa los artículos y adjunta una fotografía de la entrega.',
          'warning',
        );

        return;
      }

      if (
        cause.tipo_meta ===
        'economica'
      ) {
        const {
          data:
          latestEconomicProgress,
          error:
          latestEconomicProgressError,
        } =
          await supabase.rpc(
            'obtener_restante_meta_economica',
            {
              p_causa_id:
                cause.id,
            },
          );

        if (
          latestEconomicProgressError
        ) {
          showToast(
            latestEconomicProgressError.message,
            'error',
          );

          return;
        }

        const latestEconomicRows =
          (
            latestEconomicProgress ??
            []
          ) as EconomicProgressRow[];

        const latestEconomicRow =
          latestEconomicRows[0];

        const latestApproved =
          Math.max(
            0,
            Number(
              latestEconomicRow?.monto_aprobado ??
              0,
            ),
          );

        const latestRemaining =
          Math.max(
            0,
            Number(
              latestEconomicRow?.monto_restante ??
              cause.meta_economica ??
              0,
            ),
          );

        setEconomicRaised(
          latestApproved,
        );

        setEconomicRemaining(
          latestRemaining,
        );

        if (
          latestRemaining <=
          0
        ) {
          setAmount(
            '',
          );

          showToast(
            'La meta económica ya fue cubierta.',
            'warning',
          );

          return;
        }

        if (
          numericAmount >
          latestRemaining
        ) {
          setAmount(
            String(
              latestRemaining,
            ),
          );

          showToast(
            `El monto disponible cambió. Ahora solo faltan ${formatMXN(
              latestRemaining,
            )}.`,
            'warning',
          );

          return;
        }
      }

      if (
        cause.tipo_meta ===
        'especie'
      ) {
        const {
          data:
          latestProgress,
          error:
          latestProgressError,
        } =
          await supabase.rpc(
            'obtener_restante_meta_especie',
            {
              p_causa_id:
                cause.id,
            },
          );

        if (
          latestProgressError
        ) {
          showToast(
            latestProgressError.message,
            'error',
          );

          return;
        }

        const latestRows =
          (
            latestProgress ??
            []
          ) as MetaProgressRow[];

        const latestMap =
          new Map<
            string,
            number
          >(
            latestRows.map(
              (
                item,
              ) => [
                  item.meta_especie_id,
                  Math.max(
                    0,
                    Number(
                      item.cantidad_restante ??
                      0,
                    ),
                  ),
                ],
            ),
          );

        const invalidMeta =
          metas.find(
            (
              meta,
            ) =>
              (
                speciesTotals.get(
                  meta.id,
                ) ??
                0
              ) >
              (
                latestMap.get(
                  meta.id,
                ) ??
                0
              ),
          );

        if (
          invalidMeta
        ) {
          setMetas(
            (
              current,
            ) =>
              current.map(
                (
                  meta,
                ) => ({
                  ...meta,
                  cantidad_restante:
                    latestMap.get(
                      meta.id,
                    ) ??
                    meta.cantidad_restante,
                }),
              ),
          );

          showToast(
            `La cantidad disponible de ${invalidMeta.nombre} cambió. Ajusta tu aportación antes de enviarla.`,
            'warning',
          );

          return;
        }
      }

      setSubmitting(
        true,
      );

      let createdContributionId:
        string | null =
        null;

      let uploadedPath:
        string | null =
        null;

      try {
        const {
          data:
          authData,
          error:
          authError,
        } =
          await supabase.auth.getUser();

        if (
          authError
        ) {
          throw authError;
        }

        const user =
          authData.user;

        if (
          !user
        ) {
          throw new Error(
            'Debes iniciar sesión para realizar una aportación.',
          );
        }

        const donorEmail =
          profile?.correo ??
          user.email ??
          null;

        const donorFullName =
          profile?.nombre_completo ??
          null;

        const donorAlias =
          profile?.alias ??
          null;

        const donorPhone =
          profile?.telefono ??
          null;

        const {
          data:
          contribution,
          error:
          contributionError,
        } =
          await supabase
            .from(
              'aportaciones',
            )
            .insert({
              causa_id:
                cause.id,
              donante_id:
                user.id,
              tipo:
                cause.tipo_meta,
              monto:
                cause.tipo_meta ===
                  'economica'
                  ? numericAmount
                  : null,
              nombre_donante:
                donorFullName,
              alias_donante:
                donorAlias,
              correo_donante:
                donorEmail,
              telefono_donante:
                donorPhone,
              anonima:
                anonymous,
              mensaje:
                message.trim() ||
                null,
              referencia_transferencia:
                cause.tipo_meta ===
                  'economica'
                  ? transferReference.trim() ||
                  null
                  : null,
              estado:
                'pendiente',
            })
            .select(
              'id,folio,tipo,monto,estado,creada_en',
            )
            .single();

        if (
          contributionError
        ) {
          throw contributionError;
        }

        if (
          !contribution?.id
        ) {
          throw new Error(
            'No se pudo registrar la aportación.',
          );
        }

        createdContributionId =
          contribution.id;

        if (
          cause.tipo_meta ===
          'especie'
        ) {
          const details =
            speciesItems.map(
              (
                item,
              ) => ({
                aportacion_id:
                  contribution.id,
                meta_especie_id:
                  item.meta_especie_id ||
                  null,
                nombre:
                  item.nombre.trim(),
                cantidad:
                  Number(
                    item.cantidad,
                  ),
                unidad:
                  item.unidad.trim(),
                notas:
                  item.notas.trim() ||
                  null,
              }),
            );

          const {
            error,
          } =
            await supabase
              .from(
                'detalle_aportaciones_especie',
              )
              .insert(
                details,
              );

          if (
            error
          ) {
            throw error;
          }
        }

        uploadedPath =
          await uploadProof(
            user.id,
            contribution.id,
            proofFile,
          );

        showToast(
          cause.tipo_meta ===
            'economica'
            ? 'Aportación enviada. El administrador revisará tu comprobante.'
            : 'Aportación enviada. El administrador revisará la evidencia de entrega.',
          'success',
        );

        const successData = {
          id:
            contribution.id,
          contributionId:
            contribution.id,
          folio:
            contribution.folio,
          causeId:
            cause.id,
          causeTitle:
            cause.titulo,
          type:
            cause.tipo_meta,
          tipo:
            cause.tipo_meta,
          amount:
            cause.tipo_meta ===
              'economica'
              ? numericAmount
              : null,
          monto:
            cause.tipo_meta ===
              'economica'
              ? numericAmount
              : null,
          status:
            'pendiente',
          estado:
            'pendiente',
          reference:
            transferReference.trim() ||
            null,
          referencia:
            transferReference.trim() ||
            null,
          createdAt:
            contribution.creada_en,
          creada_en:
            contribution.creada_en,
        } as unknown as SubmissionData;

        onSuccess(
          successData,
        );
      } catch (
      error
      ) {
        if (
          uploadedPath
        ) {
          await supabase.storage
            .from(
              PROOF_BUCKET,
            )
            .remove([
              uploadedPath,
            ]);
        }

        if (
          createdContributionId
        ) {
          await supabase
            .from(
              'detalle_aportaciones_especie',
            )
            .delete()
            .eq(
              'aportacion_id',
              createdContributionId,
            );

          await supabase
            .from(
              'comprobantes',
            )
            .delete()
            .eq(
              'aportacion_id',
              createdContributionId,
            );

          await supabase
            .from(
              'aportaciones',
            )
            .delete()
            .eq(
              'id',
              createdContributionId,
            );
        }

        showToast(
          error instanceof
            Error
            ? error.message
            : 'No se pudo registrar la aportación.',
          'error',
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  if (
    !open
  ) {
    return null;
  }

  const renderModal =
    (
      content: ReactNode,
    ) =>
      createPortal(
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-[210] flex items-end justify-center overflow-hidden bg-black/75 backdrop-blur-[7px] sm:items-center sm:p-4 lg:p-6">
          <style>
            {`
              @keyframes contributeModalEnter {
                from {
                  opacity: 0;
                  transform: translate3d(0, 26px, 0) scale(.985);
                }

                to {
                  opacity: 1;
                  transform: translate3d(0, 0, 0) scale(1);
                }
              }

              .contribute-modal-scroll {
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
                scrollbar-gutter: stable;
              }

              @media (max-width: 639px) {
                .contribute-modal-dialog {
                  height: 100%;
                  max-height: 100%;
                  border-bottom-left-radius: 0;
                  border-bottom-right-radius: 0;
                }
              }
            `}
          </style>

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Realizar aportación"
            className="contribute-modal-dialog flex h-full max-h-full w-full min-w-0 flex-col overflow-hidden rounded-t-[28px] border border-white/[0.07] bg-[#080d17] shadow-[0_-20px_90px_rgba(0,0,0,.6)] animate-[contributeModalEnter_.3s_cubic-bezier(.22,1,.36,1)] sm:h-[min(90dvh,960px)] sm:max-w-[1240px] sm:rounded-[28px] sm:shadow-[0_30px_110px_rgba(0,0,0,.72)]"
          >
            <div className="contribute-modal-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              {content}
            </div>
          </div>
        </div>,
        document.body,
      );

  if (
    loading
  ) {
    return renderModal(
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.05]">
            <Loader2
              size={23}
              className="animate-spin text-emerald-300"
            />
          </div>

          <p className="mt-4 text-[9px] text-[var(--muted)]">
            Preparando tu aportación...
          </p>
        </div>
      </div>,
    );
  }

  if (
    !cause
  ) {
    return renderModal(
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[700px] items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle
            size={28}
            className="mx-auto text-rose-300"
          />

          <h2 className="mt-4 text-sm font-semibold text-[var(--text)]">
            No se puede realizar la aportación
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate(
                'home',
              )
            }
            className="mt-4 rounded-xl bg-white/[0.05] px-4 py-2.5 text-[9px] font-semibold text-[var(--text-soft)]"
          >
            Ir al inicio
          </button>
        </div>
      </div>,
    );
  }

  const economic =
    cause.tipo_meta ===
    'economica';

  const proofMissing =
    attempted &&
    !proofFile;

  const amountExceeded =
    economic &&
    economicRemaining !==
    null &&
    Number.isFinite(
      numericAmount,
    ) &&
    numericAmount >
    economicRemaining;

  const amountError =
    attempted &&
    economic &&
    !amountValid;

  const speciesError =
    attempted &&
    !economic &&
    !speciesValid;

  return renderModal(
    <form
      onSubmit={
        submit
      }
      noValidate
      className="mx-auto w-full max-w-[1180px] px-3 pb-28 sm:px-5 lg:px-7"
    >
      <section className="relative overflow-hidden rounded-[26px] border border-white/[0.055] bg-[linear-gradient(135deg,rgba(16,185,129,.07),rgba(255,255,255,.02)_48%,rgba(196,169,107,.04))] p-4 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-400/[0.07] blur-[80px]" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {economic ? (
                  <CircleDollarSign
                    size={14}
                    className="text-emerald-300"
                  />
                ) : (
                  <Package
                    size={14}
                    className="text-amber-200"
                  />
                )}

                <span className="text-[7px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                  {economic
                    ? 'Aportación económica'
                    : 'Aportación en especie'}
                </span>
              </div>

              <h1 className="mt-2 text-xl font-black tracking-[-0.035em] text-[var(--text)] sm:text-2xl">
                {
                  cause.titulo
                }
              </h1>

              {cause.resumen && (
                <p className="mt-2 max-w-2xl text-[8px] leading-4 text-[var(--muted)] sm:text-[9px]">
                  {
                    cause.resumen
                  }
                </p>
              )}
            </div>

            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/[0.07] text-emerald-300">
              <HeartHandshake
                size={19}
              />
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/[0.08] bg-amber-300/[0.025] p-3.5">
            <ShieldCheck
              size={15}
              className="mt-0.5 shrink-0 text-amber-200"
            />

            <div>
              <span className="block text-[8px] font-semibold text-amber-100">
                Revisión administrativa
              </span>

              <p className="mt-1 text-[7px] leading-4 text-[var(--muted)]">
                Tu aportación se registrará como pendiente. El administrador revisará la evidencia antes de confirmarla.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-4">
          {economic ? (
            <>
              <section className="rounded-[22px] border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/[0.07] text-emerald-300">
                    <CircleDollarSign
                      size={17}
                    />
                  </div>

                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                      Monto
                    </span>

                    <h2 className="mt-0.5 text-[11px] font-semibold text-[var(--text)]">
                      ¿Cuánto deseas aportar?
                    </h2>
                  </div>
                </div>

                <div className="mb-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-3.5">
                    <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                      Meta
                    </span>

                    <strong className="mt-1 block text-[10px] font-bold text-[var(--text)]">
                      {formatMXN(
                        cause.meta_economica ??
                        0,
                      )}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-400/[0.02] p-3.5">
                    <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                      Aprobado
                    </span>

                    <strong className="mt-1 block text-[10px] font-bold text-emerald-300">
                      {formatMXN(
                        economicRaised,
                      )}
                    </strong>
                  </div>

                  <div className={`rounded-2xl border p-3.5 ${economicRemaining !== null &&
                    economicRemaining <=
                    0
                    ? 'border-emerald-400/[0.1] bg-emerald-400/[0.025]'
                    : 'border-amber-300/[0.1] bg-amber-300/[0.025]'
                    }`}>
                    <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                      Falta por aportar
                    </span>

                    <strong className={`mt-1 block text-[10px] font-bold ${economicRemaining !== null &&
                      economicRemaining <=
                      0
                      ? 'text-emerald-300'
                      : 'text-amber-200'
                      }`}>
                      {economicRemaining ===
                        null
                        ? '—'
                        : formatMXN(
                          economicRemaining,
                        )}
                    </strong>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[8px] font-semibold text-[var(--text-soft)]">
                    Monto de la aportación
                    <span className="ml-1 text-rose-300">
                      *
                    </span>
                  </span>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-300">
                      $
                    </span>

                    <input
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      max={
                        economicRemaining ??
                        undefined
                      }
                      step="0.01"
                      value={
                        amount
                      }
                      disabled={
                        economicRemaining !==
                        null &&
                        economicRemaining <=
                        0
                      }
                      onChange={(
                        event,
                      ) => {
                        const value =
                          event.target.value;

                        if (
                          value ===
                          ''
                        ) {
                          setAmount(
                            '',
                          );

                          return;
                        }

                        const parsed =
                          Number(
                            value,
                          );

                        if (
                          !Number.isFinite(
                            parsed,
                          )
                        ) {
                          return;
                        }

                        if (
                          economicRemaining !==
                          null
                        ) {
                          const limited =
                            Math.min(
                              Math.max(
                                0,
                                parsed,
                              ),
                              economicRemaining,
                            );

                          setAmount(
                            limited >
                              0
                              ? String(
                                limited,
                              )
                              : '',
                          );

                          return;
                        }

                        setAmount(
                          value,
                        );
                      }}
                      placeholder={
                        economicRemaining !==
                          null &&
                          economicRemaining >
                          0
                          ? `Máximo ${economicRemaining.toLocaleString(
                            'es-MX',
                            {
                              maximumFractionDigits:
                                2,
                            },
                          )}`
                          : '0.00'
                      }
                      className={`h-14 w-full rounded-2xl border bg-white/[0.025] pl-9 pr-14 text-lg font-bold text-[var(--text)] outline-none transition-all placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-40 ${amountError ||
                        amountExceeded
                        ? 'border-rose-400/35 focus:border-rose-400/50'
                        : 'border-white/[0.06] focus:border-emerald-400/30'
                        }`}
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[7px] font-semibold text-[var(--muted)]">
                      MXN
                    </span>
                  </div>

                  {economicRemaining !==
                    null &&
                    economicRemaining >
                    0 && (
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-amber-300/[0.08] bg-amber-300/[0.02] px-3 py-2.5">
                        <span className="text-[7px] text-[var(--muted)]">
                          Máximo disponible
                        </span>

                        <strong className="text-[8px] font-bold text-amber-200">
                          {formatMXN(
                            economicRemaining,
                          )}
                        </strong>
                      </div>
                    )}

                  {economicRemaining !==
                    null &&
                    economicRemaining <=
                    0 && (
                      <span className="mt-2 flex items-center gap-1.5 text-[7px] text-emerald-300">
                        <CheckCircle2
                          size={10}
                        />

                        La meta económica ya está cubierta.
                      </span>
                    )}

                  {amountError &&
                    (
                      economicRemaining ===
                      null ||
                      economicRemaining >
                      0
                    ) && (
                      <span className="mt-2 flex items-center gap-1.5 text-[7px] text-rose-300">
                        <AlertCircle
                          size={10}
                        />

                        {amountExceeded
                          ? `No puedes aportar más de ${formatMXN(
                            economicRemaining ??
                            0,
                          )}.`
                          : 'Ingresa un monto mayor a cero.'}
                      </span>
                    )}
                </label>
              </section>

              <section className="rounded-[22px] border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-300">
                    <Landmark
                      size={17}
                    />
                  </div>

                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                      Transferencia
                    </span>

                    <h2 className="mt-0.5 text-[11px] font-semibold text-[var(--text)]">
                      Datos bancarios
                    </h2>
                  </div>
                </div>

                {fund ? (
                  <div className="space-y-2.5">
                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-3.5">
                      <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        Institución bancaria
                      </span>

                      <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                        {fund.institucion_bancaria ||
                          'No especificada'}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-3.5">
                      <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        Beneficiario
                      </span>

                      <span className="mt-1 block text-[9px] font-semibold text-[var(--text-soft)]">
                        {fund.nombre_beneficiario ||
                          'No especificado'}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                            CLABE
                          </span>

                          <span className="mt-1 block break-all font-mono text-[10px] font-semibold text-emerald-300">
                            {fund.clabe ||
                              'No especificada'}
                          </span>
                        </div>

                        {fund.clabe && (
                          <button
                            type="button"
                            onClick={() =>
                              void copy(
                                'clabe',
                                fund.clabe,
                              )
                            }
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-[var(--muted)]"
                          >
                            {copied ===
                              'clabe' ? (
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
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-[6px] uppercase tracking-[0.1em] text-[var(--muted)]">
                            Concepto sugerido
                          </span>

                          <span className="mt-1 block text-[9px] font-semibold text-amber-200">
                            {fund.concepto_transferencia ||
                              'APORTE SHITAN TRUST'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void copy(
                              'concepto',
                              fund.concepto_transferencia ||
                              'APORTE SHITAN TRUST',
                            )
                          }
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-[var(--muted)]"
                        >
                          {copied ===
                            'concepto' ? (
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
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-300/[0.08] bg-amber-300/[0.02] p-4 text-[8px] leading-4 text-[var(--muted)]">
                    La información bancaria no está disponible.
                  </div>
                )}

                <label className="mt-4 block">
                  <span className="mb-2 block text-[8px] font-semibold text-[var(--text-soft)]">
                    Referencia de transferencia
                  </span>

                  <input
                    type="text"
                    value={
                      transferReference
                    }
                    onChange={(
                      event,
                    ) =>
                      setTransferReference(
                        event.target.value,
                      )
                    }
                    placeholder="Referencia, folio o número de operación"
                    className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 text-[10px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-emerald-400/30"
                  />
                </label>
              </section>
            </>
          ) : (
            <section className="rounded-[22px] border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/[0.07] text-amber-200">
                    <Package
                      size={17}
                    />
                  </div>

                  <div>
                    <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                      Donación en especie
                    </span>

                    <h2 className="mt-0.5 text-[11px] font-semibold text-[var(--text)]">
                      Artículos entregados
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    addSpeciesItem
                  }
                  disabled={
                    !metas.length ||
                    !hasSpeciesAvailability
                  }
                  className="rounded-xl bg-amber-300/[0.08] px-3 py-2 text-[8px] font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Agregar
                </button>
              </div>

              {!metas.length ? (
                <div className="rounded-2xl border border-amber-300/[0.08] bg-amber-300/[0.02] p-4 text-[8px] text-[var(--muted)]">
                  Esta causa no tiene metas en especie registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {metas.map(
                      (
                        meta,
                      ) => {
                        const remaining =
                          getSpeciesRemaining(
                            meta.id,
                          );

                        const complete =
                          meta.cantidad_restante <=
                          0;

                        return (
                          <div
                            key={
                              meta.id
                            }
                            className={`rounded-2xl border p-3.5 ${complete
                              ? 'border-emerald-400/[0.1] bg-emerald-400/[0.025]'
                              : 'border-amber-300/[0.09] bg-amber-300/[0.02]'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="block truncate text-[9px] font-semibold text-[var(--text)]">
                                  {
                                    meta.nombre
                                  }
                                </span>

                                <span className="mt-1 block text-[7px] text-[var(--muted)]">
                                  Meta:{' '}
                                  {
                                    meta.cantidad_objetivo
                                  }{' '}
                                  {
                                    meta.unidad
                                  }
                                </span>
                              </div>

                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[7px] font-bold ${complete
                                ? 'bg-emerald-400/[0.1] text-emerald-300'
                                : 'bg-amber-300/[0.09] text-amber-200'
                                }`}
                              >
                                {complete
                                  ? 'Completa'
                                  : `Faltan ${meta.cantidad_restante} ${meta.unidad}`}
                              </span>
                            </div>

                            {!complete &&
                              remaining <
                              meta.cantidad_restante && (
                                <span className="mt-2 block text-[7px] text-cyan-300/80">
                                  Disponible en este formulario:{' '}
                                  {
                                    remaining
                                  }{' '}
                                  {
                                    meta.unidad
                                  }
                                </span>
                              )}
                          </div>
                        );
                      },
                    )}
                  </div>

                  {!hasSpeciesAvailability && (
                    <div className="rounded-2xl border border-emerald-400/[0.12] bg-emerald-400/[0.025] p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0 text-emerald-300"
                        />

                        <div>
                          <span className="block text-[8px] font-semibold text-emerald-300">
                            Necesidades cubiertas
                          </span>

                          <span className="mt-1 block text-[7px] leading-4 text-[var(--muted)]">
                            Ya no falta cantidad por aportar en las necesidades disponibles.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {speciesItems.map(
                    (
                      item,
                      index,
                    ) => {
                      const selectedMeta =
                        metas.find(
                          (
                            meta,
                          ) =>
                            meta.id ===
                            item.meta_especie_id,
                        );

                      const maxAvailable =
                        getSpeciesRemaining(
                          item.meta_especie_id,
                          item.key,
                        );

                      const quantity =
                        Number(
                          item.cantidad,
                        );

                      const quantityMissing =
                        attempted &&
                        item.cantidad.trim() ===
                        '';

                      const quantityInvalid =
                        attempted &&
                        (
                          !Number.isFinite(
                            quantity,
                          ) ||
                          quantity <=
                          0 ||
                          quantity >
                          maxAvailable
                        );

                      const inputError =
                        quantityMissing ||
                        quantityInvalid;

                      return (
                        <div
                          key={
                            item.key
                          }
                          className={`rounded-2xl border p-3.5 transition-all ${inputError
                            ? 'border-rose-400/25 bg-rose-400/[0.02]'
                            : 'border-white/[0.05] bg-white/[0.018]'
                            }`}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-amber-200">
                              Artículo{' '}
                              {index +
                                1}
                            </span>

                            {speciesItems.length >
                              1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSpeciesItem(
                                      item.key,
                                    )
                                  }
                                  className="grid h-7 w-7 place-items-center rounded-lg bg-rose-400/[0.06] text-rose-300"
                                >
                                  <X
                                    size={12}
                                  />
                                </button>
                              )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <label>
                              <span className="mb-2 block text-[7px] text-[var(--muted)]">
                                Necesidad
                              </span>

                              <select
                                value={
                                  item.meta_especie_id
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateSpeciesItem(
                                    item.key,
                                    'meta_especie_id',
                                    event.target.value,
                                  )
                                }
                                className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 text-[9px] text-[var(--text)] outline-none focus:border-amber-300/25"
                              >
                                {metas.map(
                                  (
                                    meta,
                                  ) => {
                                    const available =
                                      getSpeciesRemaining(
                                        meta.id,
                                        item.key,
                                      );

                                    return (
                                      <option
                                        key={
                                          meta.id
                                        }
                                        value={
                                          meta.id
                                        }
                                        disabled={
                                          available <=
                                          0 &&
                                          meta.id !==
                                          item.meta_especie_id
                                        }
                                        className="bg-[#0d1424]"
                                      >
                                        {meta.nombre}{' — '}
                                        {available >
                                          0
                                          ? `faltan ${available} ${meta.unidad}`
                                          : 'completa'}
                                      </option>
                                    );
                                  },
                                )}
                              </select>
                            </label>

                            <label>
                              <span className="mb-2 flex items-center justify-between gap-2 text-[7px] text-[var(--muted)]">
                                <span>
                                  Cantidad
                                  <span className="ml-1 text-rose-300">
                                    *
                                  </span>
                                </span>

                                {selectedMeta && (
                                  <span className="font-semibold text-amber-200">
                                    Máximo{' '}
                                    {
                                      maxAvailable
                                    }{' '}
                                    {
                                      selectedMeta.unidad
                                    }
                                  </span>
                                )}
                              </span>

                              <div className="relative">
                                <input
                                  type="number"
                                  min="0.01"
                                  max={
                                    maxAvailable
                                  }
                                  step="0.01"
                                  inputMode="decimal"
                                  value={
                                    item.cantidad
                                  }
                                  disabled={
                                    maxAvailable <=
                                    0
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateSpeciesItem(
                                      item.key,
                                      'cantidad',
                                      event.target.value,
                                    )
                                  }
                                  placeholder={
                                    maxAvailable >
                                      0
                                      ? `Máximo ${maxAvailable}`
                                      : 'Completa'
                                  }
                                  className={`h-11 w-full rounded-xl border bg-white/[0.025] px-3 pr-20 text-[10px] text-[var(--text)] outline-none transition-all disabled:cursor-not-allowed disabled:opacity-40 ${inputError
                                    ? 'border-rose-400/35 focus:border-rose-400/50'
                                    : 'border-white/[0.06] focus:border-amber-300/25'
                                    }`}
                                />

                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] text-[var(--muted)]">
                                  {
                                    item.unidad
                                  }
                                </span>
                              </div>

                              {selectedMeta &&
                                maxAvailable >
                                0 && (
                                  <span className="mt-2 flex items-center gap-1.5 text-[7px] text-amber-200/80">
                                    <Package
                                      size={10}
                                    />

                                    Faltan{' '}
                                    {
                                      maxAvailable
                                    }{' '}
                                    {
                                      selectedMeta.unidad
                                    }
                                    . No puedes aportar más de esa cantidad.
                                  </span>
                                )}

                              {quantityMissing && (
                                <span className="mt-2 flex items-center gap-1.5 text-[7px] text-rose-300">
                                  <AlertCircle
                                    size={10}
                                  />

                                  Ingresa la cantidad que vas a aportar.
                                </span>
                              )}

                              {!quantityMissing &&
                                quantityInvalid && (
                                  <span className="mt-2 flex items-center gap-1.5 text-[7px] text-rose-300">
                                    <AlertCircle
                                      size={10}
                                    />

                                    La cantidad debe ser mayor a cero y no exceder lo que falta.
                                  </span>
                                )}
                            </label>
                          </div>

                          <label className="mt-3 block">
                            <span className="mb-2 block text-[7px] text-[var(--muted)]">
                              Notas
                            </span>

                            <input
                              type="text"
                              value={
                                item.notas
                              }
                              onChange={(
                                event,
                              ) =>
                                updateSpeciesItem(
                                  item.key,
                                  'notas',
                                  event.target.value,
                                )
                              }
                              placeholder="Detalles de lo que entregaste"
                              className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 text-[9px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-amber-300/20"
                            />
                          </label>
                        </div>
                      );
                    },
                  )}

                  {speciesError && (
                    <span className="flex items-center gap-1.5 text-[7px] text-rose-300">
                      <AlertCircle
                        size={10}
                      />

                      Completa las cantidades sin exceder lo que falta por aportar.
                    </span>
                  )}
                </div>
              )}
            </section>
          )}

          <section className={`rounded-[22px] border p-4 sm:p-5 ${proofMissing
            ? 'border-rose-400/20 bg-rose-400/[0.02]'
            : 'border-white/[0.055] bg-white/[0.022]'
            }`}>
            <div className="mb-5 flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${economic
                ? 'bg-cyan-300/[0.07] text-cyan-300'
                : 'bg-amber-300/[0.07] text-amber-200'
                }`}>
                {economic ? (
                  <ReceiptText
                    size={17}
                  />
                ) : (
                  <Camera
                    size={17}
                  />
                )}
              </div>

              <div>
                <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                  Evidencia obligatoria
                </span>

                <h2 className="mt-0.5 text-[11px] font-semibold text-[var(--text)]">
                  {economic
                    ? 'Comprobante de pago'
                    : 'Fotografía de la entrega'}
                </h2>
              </div>
            </div>

            {!proofFile ? (
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className={`group flex min-h-[190px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition-all ${proofMissing
                  ? 'border-rose-400/30 bg-rose-400/[0.025]'
                  : 'border-white/[0.08] bg-white/[0.015] hover:border-emerald-400/20 hover:bg-emerald-400/[0.018]'
                  }`}
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-emerald-300 transition-transform duration-300 group-hover:-translate-y-1">
                  <Upload
                    size={19}
                  />
                </div>

                <span className="mt-4 text-[9px] font-semibold text-[var(--text)]">
                  {economic
                    ? 'Subir comprobante'
                    : 'Subir fotografía'}
                </span>

                <span className="mt-1 max-w-[330px] text-[7px] leading-4 text-[var(--muted)]">
                  {economic
                    ? 'Selecciona una imagen o PDF donde pueda comprobarse la transferencia realizada.'
                    : 'Selecciona una fotografía que compruebe que los artículos fueron entregados.'}
                </span>

                <span className="mt-3 text-[6px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  {economic
                    ? 'JPG · PNG · WEBP · PDF · máximo 10 MB'
                    : 'JPG · PNG · WEBP · máximo 10 MB'}
                </span>
              </button>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-emerald-400/[0.1] bg-emerald-400/[0.018]">
                {proofPreview ? (
                  <div className="relative aspect-[16/9] max-h-[360px] overflow-hidden bg-black/20">
                    <img
                      src={
                        proofPreview
                      }
                      alt="Evidencia seleccionada"
                      className="h-full w-full object-contain"
                    />

                    <button
                      type="button"
                      onClick={
                        removeProof
                      }
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-black/60 text-white backdrop-blur-lg"
                    >
                      <X
                        size={14}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="flex min-h-[130px] items-center justify-center">
                    <FileText
                      size={32}
                      className="text-emerald-300"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 border-t border-white/[0.05] p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                    {proofFile.type.startsWith(
                      'image/',
                    ) ? (
                      <FileImage
                        size={15}
                      />
                    ) : (
                      <FileCheck2
                        size={15}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[8px] font-semibold text-[var(--text)]">
                      {
                        proofFile.name
                      }
                    </span>

                    <span className="mt-0.5 block text-[6px] text-[var(--muted)]">
                      {(
                        proofFile.size /
                        1024 /
                        1024
                      ).toFixed(
                        2,
                      )}{' '}
                      MB
                    </span>
                  </div>

                  <CheckCircle2
                    size={15}
                    className="shrink-0 text-emerald-300"
                  />
                </div>
              </div>
            )}

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept={
                economic
                  ? 'image/jpeg,image/png,image/webp,application/pdf'
                  : 'image/jpeg,image/png,image/webp'
              }
              onChange={
                selectProof
              }
              className="hidden"
            />

            {proofMissing && (
              <span className="mt-2 flex items-center gap-1.5 text-[7px] text-rose-300">
                <AlertCircle
                  size={10}
                />

                {economic
                  ? 'Debes adjuntar el comprobante de pago.'
                  : 'Debes adjuntar una fotografía de la entrega.'}
              </span>
            )}
          </section>

          <section className="rounded-[22px] border border-white/[0.055] bg-white/[0.022] p-4 sm:p-5">
            <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
              Mensaje
            </span>

            <textarea
              value={
                message
              }
              onChange={(
                event,
              ) =>
                setMessage(
                  event.target.value,
                )
              }
              rows={4}
              placeholder="Escribe un mensaje opcional para esta causa..."
              className="mt-3 w-full resize-none rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5 text-[9px] leading-4 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-emerald-400/25"
            />

            <button
              type="button"
              onClick={() =>
                setAnonymous(
                  (
                    current,
                  ) =>
                    !current,
                )
              }
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.018] p-3 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserRound
                  size={14}
                  className="shrink-0 text-[var(--muted)]"
                />

                <div className="min-w-0">
                  <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                    Aportación anónima
                  </span>

                  <span className="mt-0.5 block text-[6px] text-[var(--muted)]">
                    Tu identidad no se mostrará públicamente.
                  </span>
                </div>
              </div>

              <span className={`relative h-5 w-9 shrink-0 rounded-full transition-all ${anonymous
                ? 'bg-emerald-400/30'
                : 'bg-white/[0.08]'
                }`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${anonymous
                  ? 'left-[18px] bg-emerald-300'
                  : 'left-0.5 bg-white/50'
                  }`} />
              </span>
            </button>
          </section>
        </main>

        <aside className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-4">
            <section className="rounded-[22px] border border-white/[0.055] bg-white/[0.022] p-4">
              <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                Donante
              </span>

              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/[0.07] text-[9px] font-black text-emerald-300">
                  {getInitials(
                    donorName,
                  )}
                </div>

                <div className="min-w-0">
                  <span className="block truncate text-[9px] font-semibold text-[var(--text)]">
                    {
                      donorName
                    }
                  </span>

                  <span className="mt-0.5 block truncate text-[7px] text-[var(--muted)]">
                    {anonymous
                      ? 'Se mostrará como anónimo'
                      : profile?.correo ||
                      'Cuenta registrada'}
                  </span>
                </div>
              </div>
            </section>

            {economic &&
              amountValid && (
                <section className="rounded-[22px] border border-emerald-400/[0.09] bg-emerald-400/[0.02] p-4">
                  <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                    Tu aportación
                  </span>

                  <strong className="mt-2 block text-2xl font-black tracking-[-0.04em] text-emerald-300">
                    {formatMXN(
                      numericAmount,
                    )}
                  </strong>

                  <span className="mt-1 block text-[7px] text-[var(--muted)]">
                    Pendiente de validación
                  </span>
                </section>
              )}

            {!economic && (
              <section className="rounded-[22px] border border-amber-300/[0.09] bg-amber-300/[0.02] p-4">
                <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                  Entrega
                </span>

                <strong className="mt-2 block text-lg font-black text-amber-200">
                  {
                    speciesItems.length
                  }{' '}
                  {speciesItems.length ===
                    1
                    ? 'artículo'
                    : 'artículos'}
                </strong>

                <span className="mt-1 block text-[7px] text-[var(--muted)]">
                  Pendiente de validación
                </span>
              </section>
            )}

            <section className="rounded-[22px] border border-cyan-300/[0.07] bg-cyan-300/[0.018] p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole
                  size={15}
                  className="mt-0.5 shrink-0 text-cyan-300"
                />

                <div>
                  <span className="block text-[8px] font-semibold text-cyan-200">
                    Evidencia protegida
                  </span>

                  <p className="mt-1 text-[7px] leading-4 text-[var(--muted)]">
                    El comprobante se guarda para que el equipo administrativo pueda revisar y validar la aportación.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-white/[0.055] bg-white/[0.022] p-4">
              <span className="block text-[7px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                Proceso
              </span>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-400/[0.07] text-[7px] font-bold text-emerald-300">
                    01
                  </div>

                  <div>
                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                      Envías tu aporte
                    </span>

                    <span className="mt-0.5 block text-[6px] text-[var(--muted)]">
                      Datos y evidencia.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-300/[0.07] text-[7px] font-bold text-amber-200">
                    02
                  </div>

                  <div>
                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                      Queda pendiente
                    </span>

                    <span className="mt-0.5 block text-[6px] text-[var(--muted)]">
                      No se suma al fondo todavía.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-300/[0.07] text-[7px] font-bold text-cyan-300">
                    03
                  </div>

                  <div>
                    <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
                      El admin valida
                    </span>

                    <span className="mt-0.5 block text-[6px] text-[var(--muted)]">
                      Confirma o rechaza la aportación.
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>

      {attempted &&
        !formValid && (
          <div className="mt-4 rounded-2xl border border-rose-400/[0.1] bg-rose-400/[0.025] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0 text-rose-300"
              />

              <div>
                <span className="block text-[8px] font-semibold text-rose-300">
                  Faltan datos para enviar
                </span>

                <p className="mt-1 text-[7px] leading-4 text-[var(--muted)]">
                  {economic
                    ? 'Verifica el monto y adjunta obligatoriamente el comprobante de transferencia.'
                    : 'Verifica los artículos entregados y adjunta obligatoriamente una fotografía como evidencia.'}
                </p>
              </div>
            </div>
          </div>
        )}

      <div className="sticky bottom-3 z-20 mt-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[var(--bg)]/95 p-3 shadow-[0_20px_70px_rgba(0,0,0,.4)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="block text-[8px] font-semibold text-[var(--text-soft)]">
              {formValid
                ? 'Todo listo para enviar'
                : 'Completa tu aportación'}
            </span>

            <span className="mt-0.5 block text-[6px] text-[var(--muted)]">
              Se enviará al administrador para revisión.
            </span>
          </div>

          <button
            type="submit"
            disabled={
              submitting
            }
            className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400/[0.12] px-5 text-[9px] font-bold text-emerald-200 transition-all hover:bg-emerald-400/[0.18] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <>
                <ShieldCheck
                  size={14}
                />

                Enviar para revisión

                <ArrowRight
                  size={13}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </div>
      </div>
    </form>,
  );
}