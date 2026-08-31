import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BarChart3,
  ChevronDown,
  DollarSign,
  FileText,
  Heart,
  Settings,
  Users,
} from 'lucide-react';

import type {
  Screen,
} from '../../types';

import {
  supabase,
} from '../../lib/supabase';

import AdminCausesScreen from './causas/AdminCausesScreen';
import AdminCauseEditorScreen from './causas/AdminCauseEditorScreen';
import AdminContributionsScreen from './aportaciones/AdminContributionsScreen';
import AdminImpactScreen from './impacto/AdminImpactScreen';
import AdminUsersScreen from './usuarios/AdminUsersScreen';
import AdminSettingsScreen from './configuracion/AdminSettingsScreen';
import AdminAuditScreen from './bitacora/AdminAuditScreen';

interface AdminScreenProps {
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
  refreshKey?: number;
  onCauseModalChange?: (
    open: boolean,
    closeHandler?: () => void,
  ) => void;
  onAdminBackChange?: (
    canGoBack: boolean,
    backHandler?: () => void,
  ) => void;
}

type AdminTab =
  | 'causes'
  | 'contributions'
  | 'impact'
  | 'users'
  | 'settings'
  | 'audit';

interface AdminCounts {
  causes: number | null;
  contributions: number | null;
  impact: number | null;
  users: number | null;
  settings: number | null;
  audit: number | null;
}

interface AdminMenuItem {
  id: AdminTab;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  countLabel: string;
  tables: string[];
  icon: typeof Heart;
  iconClass: string;
  iconBackgroundClass: string;
}

const INITIAL_COUNTS: AdminCounts = {
  causes: null,
  contributions: null,
  impact: null,
  users: null,
  settings: null,
  audit: null,
};

const ADMIN_MENU: AdminMenuItem[] = [
  {
    id:
      'causes',
    title:
      'Gestión de causas',
    shortTitle:
      'Causas',
    eyebrow:
      'Contenido',
    description:
      'Administra las causas registradas en Shitan Trust.',
    countLabel:
      'causas',
    tables: [
      'causas',
    ],
    icon:
      Heart,
    iconClass:
      'text-emerald-400',
    iconBackgroundClass:
      'bg-emerald-400/10',
  },
  {
    id:
      'contributions',
    title:
      'Aportaciones',
    shortTitle:
      'Aportaciones',
    eyebrow:
      'Operación',
    description:
      'Revisa aportaciones, detalles en especie y comprobantes.',
    countLabel:
      'aportaciones',
    tables: [
      'aportaciones',
      'detalle_aportaciones_especie',
      'comprobantes',
    ],
    icon:
      DollarSign,
    iconClass:
      'text-amber-300',
    iconBackgroundClass:
      'bg-amber-300/10',
  },
  {
    id:
      'impact',
    title:
      'Impacto',
    shortTitle:
      'Impacto',
    eyebrow:
      'Transparencia',
    description:
      'Administra evidencias de impacto y sus archivos asociados.',
    countLabel:
      'evidencias',
    tables: [
      'evidencias_impacto',
      'archivos_evidencia',
    ],
    icon:
      BarChart3,
    iconClass:
      'text-violet-400',
    iconBackgroundClass:
      'bg-violet-400/10',
  },
  {
    id:
      'users',
    title:
      'Usuarios',
    shortTitle:
      'Usuarios',
    eyebrow:
      'Accesos',
    description:
      'Consulta y administra los perfiles registrados en Shitan Trust.',
    countLabel:
      'usuarios',
    tables: [
      'perfiles',
    ],
    icon:
      Users,
    iconClass:
      'text-cyan-400',
    iconBackgroundClass:
      'bg-cyan-400/10',
  },
  {
    id:
      'settings',
    title:
      'Configuración',
    shortTitle:
      'Configuración',
    eyebrow:
      'Sistema',
    description:
      'Administra la configuración general y financiera del fondo.',
    countLabel:
      'configuraciones',
    tables: [
      'configuracion_fondo',
    ],
    icon:
      Settings,
    iconClass:
      'text-amber-400',
    iconBackgroundClass:
      'bg-amber-400/10',
  },
  {
    id:
      'audit',
    title:
      'Auditoría',
    shortTitle:
      'Auditoría',
    eyebrow:
      'Seguridad',
    description:
      'Consulta el historial de acciones y cambios administrativos.',
    countLabel:
      'movimientos',
    tables: [
      'bitacora_auditoria',
    ],
    icon:
      FileText,
    iconClass:
      'text-rose-400',
    iconBackgroundClass:
      'bg-rose-400/10',
  },
];

export default function AdminScreen({
  showToast,
  refreshKey = 0,
  onCauseModalChange,
  onAdminBackChange,
}: AdminScreenProps) {
  const [
    counts,
    setCounts,
  ] =
    useState<AdminCounts>(
      INITIAL_COUNTS,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    localCauseRefreshKey,
    setLocalCauseRefreshKey,
  ] =
    useState(
      0,
    );

  const [
    localContributionRefreshKey,
    setLocalContributionRefreshKey,
  ] =
    useState(
      0,
    );

  const [
    localImpactRefreshKey,
    setLocalImpactRefreshKey,
  ] =
    useState(
      0,
    );

  const [
    localUsersRefreshKey,
    setLocalUsersRefreshKey,
  ] =
    useState(
      0,
    );

  const [
    localSettingsRefreshKey,
    setLocalSettingsRefreshKey,
  ] =
    useState(
      0,
    );

  const [
    localAuditRefreshKey,
    setLocalAuditRefreshKey,
  ] =
    useState(
      0,
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<AdminTab>(
      'causes',
    );

  const [
    tabHistory,
    setTabHistory,
  ] =
    useState<AdminTab[]>(
      [],
    );

  const [
    causeEditorOpen,
    setCauseEditorOpen,
  ] =
    useState(
      false,
    );

  const [
    editingCauseId,
    setEditingCauseId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    impactEditorOpen,
    setImpactEditorOpen,
  ] =
    useState(
      false,
    );

  const changeAdminTab =
    useCallback(
      (
        nextTab: AdminTab,
      ) => {
        if (
          nextTab ===
          activeTab
        ) {
          return;
        }

        setTabHistory(
          (
            previous,
          ) => [
              ...previous,
              activeTab,
            ],
        );

        setActiveTab(
          nextTab,
        );
      },
      [
        activeTab,
      ],
    );

  const goBackAdminTab =
    useCallback(
      () => {
        if (
          !tabHistory.length
        ) {
          return;
        }

        const nextHistory =
          [
            ...tabHistory,
          ];

        const previousTab =
          nextHistory.pop();

        setTabHistory(
          nextHistory,
        );

        if (
          previousTab
        ) {
          setActiveTab(
            previousTab,
          );
        }
      },
      [
        tabHistory,
      ],
    );

  useEffect(
    () => {
      onAdminBackChange?.(
        tabHistory.length >
        0,
        tabHistory.length >
          0
          ? goBackAdminTab
          : undefined,
      );
    },
    [
      goBackAdminTab,
      onAdminBackChange,
      tabHistory.length,
    ],
  );

  const activeItem =
    useMemo(
      () =>
        ADMIN_MENU.find(
          (
            item,
          ) =>
            item.id ===
            activeTab,
        ) ??
        ADMIN_MENU[0],
      [
        activeTab,
      ],
    );

  const causeRefreshKey =
    refreshKey +
    localCauseRefreshKey;

  const contributionRefreshKey =
    refreshKey +
    localContributionRefreshKey;

  const impactRefreshKey =
    refreshKey +
    localImpactRefreshKey;

  const usersRefreshKey =
    refreshKey +
    localUsersRefreshKey;

  const settingsRefreshKey =
    refreshKey +
    localSettingsRefreshKey;

  const auditRefreshKey =
    refreshKey +
    localAuditRefreshKey;

  const loadCounts =
    useCallback(
      async () => {
        const [
          causesResult,
          contributionsResult,
          impactResult,
          usersResult,
          settingsResult,
          auditResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'causas',
              )
              .select(
                '*',
                {
                  count:
                    'exact',
                  head:
                    true,
                },
              ),

            supabase
              .from(
                'aportaciones',
              )
              .select(
                '*',
                {
                  count:
                    'exact',
                  head:
                    true,
                },
              ),

            supabase
              .from(
                'evidencias_impacto',
              )
              .select(
                '*',
                {
                  count:
                    'exact',
                  head:
                    true,
                },
              ),

            supabase
              .from(
                'perfiles',
              )
              .select(
                '*',
                {
                  count:
                    'exact',
                  head:
                    true,
                },
              ),

            supabase
              .from(
                'configuracion_fondo',
              )
              .select(
                '*',
                {
                  count:
                    'exact',
                  head:
                    true,
                },
              ),

            supabase
              .from(
                'bitacora_auditoria',
              )
              .select(
                '*',
                {
                  count:
                    'exact',
                  head:
                    true,
                },
              ),
          ]);

        const hasError =
          causesResult.error ||
          contributionsResult.error ||
          impactResult.error ||
          usersResult.error ||
          settingsResult.error ||
          auditResult.error;

        setCounts({
          causes:
            causesResult.error
              ? null
              : causesResult.count ??
              0,

          contributions:
            contributionsResult.error
              ? null
              : contributionsResult.count ??
              0,

          impact:
            impactResult.error
              ? null
              : impactResult.count ??
              0,

          users:
            usersResult.error
              ? null
              : usersResult.count ??
              0,

          settings:
            settingsResult.error
              ? null
              : settingsResult.count ??
              0,

          audit:
            auditResult.error
              ? null
              : auditResult.count ??
              0,
        });

        if (
          hasError
        ) {
          showToast(
            'No se pudieron cargar algunos datos administrativos.',
            'error',
          );
        }
      },
      [
        showToast,
      ],
    );

  useEffect(
    () => {
      const run =
        async () => {
          setLoading(
            true,
          );

          try {
            await loadCounts();
          } finally {
            setLoading(
              false,
            );
          }
        };

      void run();
    },
    [
      loadCounts,
      refreshKey,
    ],
  );

  const closeCauseEditor =
    useCallback(
      () => {
        setCauseEditorOpen(
          false,
        );

        setEditingCauseId(
          null,
        );

        onCauseModalChange?.(
          false,
        );
      },
      [
        onCauseModalChange,
      ],
    );

  const openCreateCause =
    useCallback(
      () => {
        setEditingCauseId(
          null,
        );

        setCauseEditorOpen(
          true,
        );

        onCauseModalChange?.(
          true,
          closeCauseEditor,
        );
      },
      [
        closeCauseEditor,
        onCauseModalChange,
      ],
    );

  const openEditCause =
    useCallback(
      (
        causeId:
          string,
      ) => {
        setEditingCauseId(
          causeId,
        );

        setCauseEditorOpen(
          true,
        );

        onCauseModalChange?.(
          true,
          closeCauseEditor,
        );
      },
      [
        closeCauseEditor,
        onCauseModalChange,
      ],
    );

  const handleCauseSaved =
    useCallback(
      () => {
        setLocalCauseRefreshKey(
          (
            current,
          ) =>
            current +
            1,
        );

        void loadCounts();
      },
      [
        loadCounts,
      ],
    );

  const handleContributionChanged =
    useCallback(
      () => {
        setLocalContributionRefreshKey(
          (
            current,
          ) =>
            current +
            1,
        );

        void loadCounts();
      },
      [
        loadCounts,
      ],
    );

  const handleImpactChanged =
    useCallback(
      () => {
        setLocalImpactRefreshKey(
          (
            current,
          ) =>
            current +
            1,
        );

        setLocalAuditRefreshKey(
          (
            current,
          ) =>
            current +
            1,
        );

        void loadCounts();
      },
      [
        loadCounts,
      ],
    );

  const handleImpactEditorChange =
    useCallback(
      (
        open:
          boolean,
        closeHandler?:
          () => void,
      ) => {
        setImpactEditorOpen(
          open,
        );

        onCauseModalChange?.(
          open,
          closeHandler,
        );
      },
      [
        onCauseModalChange,
      ],
    );

  const handleUsersChanged =
    useCallback(
      () => {
        setLocalUsersRefreshKey(
          (
            current,
          ) =>
            current +
            1,
        );

        setLocalAuditRefreshKey(
          (
            current,
          ) =>
            current +
            1,
        );

        void loadCounts();
      },
      [
        loadCounts,
      ],
    );

  const handleSettingsChanged =
    useCallback(
      () => {
        setLocalSettingsRefreshKey(
          (
            current,
          ) =>
            current +
            1,
        );

        setLocalAuditRefreshKey(
          (
            current,
          ) =>
            current +
            1,
        );

        void loadCounts();
      },
      [
        loadCounts,
      ],
    );

  useEffect(
    () => {
      return () => {
        onCauseModalChange?.(
          false,
        );

        onAdminBackChange?.(
          false,
        );
      };
    },
    [
      onAdminBackChange,
      onCauseModalChange,
    ],
  );

  const ActiveIcon =
    activeItem.icon;

  return (
    <>
      <div className="mx-auto w-full max-w-[1480px] px-3 pb-4 sm:px-5 sm:pb-6 lg:px-7 lg:pb-8">
        <div
          className={`sticky top-0 z-30 -mx-3 border-b border-white/[0.05] bg-[var(--bg)]/95 px-3 py-3 backdrop-blur-xl sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7 ${impactEditorOpen
            ? 'hidden'
            : ''
            }`}
        >
          <div className="mx-auto w-full max-w-[1480px]">
            <div className="sm:hidden">
              <div className="relative">
                <div
                  className={`pointer-events-none absolute left-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg ${activeItem.iconBackgroundClass} ${activeItem.iconClass}`}
                >
                  <ActiveIcon
                    size={16}
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <select
                  value={
                    activeTab
                  }
                  onChange={(
                    event,
                  ) =>
                    changeAdminTab(
                      event.target
                        .value as AdminTab,
                    )
                  }
                  className="h-12 w-full appearance-none rounded-2xl border border-white/[0.06] bg-white/[0.035] pl-14 pr-10 text-[11px] font-semibold text-[var(--text)] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]"
                >
                  {ADMIN_MENU.map(
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
                        {
                          item.title
                        }
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  size={17}
                  strokeWidth={
                    1.8
                  }
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/[0.05] bg-white/[0.022] p-1.5 lg:grid-cols-6">
                {ADMIN_MENU.map(
                  (
                    item,
                  ) => {
                    const Icon =
                      item.icon;

                    const isActive =
                      activeTab ===
                      item.id;

                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          changeAdminTab(
                            item.id,
                          )
                        }
                        className={`relative flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-2 transition-all duration-300 ${isActive
                          ? 'bg-white/[0.07] text-[var(--text)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                          : 'text-[var(--muted)] hover:bg-white/[0.035] hover:text-[var(--text-soft)]'
                          }`}
                      >
                        <Icon
                          size={16}
                          strokeWidth={
                            isActive
                              ? 2
                              : 1.7
                          }
                          className={
                            isActive
                              ? item.iconClass
                              : ''
                          }
                        />

                        <span className="truncate text-[9px] font-semibold lg:text-[10px]">
                          {
                            item.shortTitle
                          }
                        </span>

                        {isActive && (
                          <span
                            className={`absolute bottom-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full ${item.id ===
                              'causes'
                              ? 'bg-emerald-400'
                              : item.id ===
                                'contributions'
                                ? 'bg-amber-300'
                                : item.id ===
                                  'impact'
                                  ? 'bg-violet-400'
                                  : item.id ===
                                    'users'
                                    ? 'bg-cyan-400'
                                    : item.id ===
                                      'settings'
                                      ? 'bg-amber-400'
                                      : 'bg-rose-400'
                              }`}
                          />
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>

        {activeTab ===
          'causes' ? (
          <div className="mt-4 sm:mt-5">
            <AdminCausesScreen
              showToast={
                showToast
              }
              refreshKey={
                causeRefreshKey
              }
              onCreateCause={
                openCreateCause
              }
              onEditCause={
                openEditCause
              }
            />
          </div>
        ) : activeTab ===
          'contributions' ? (
          <div className="mt-4 sm:mt-5">
            <AdminContributionsScreen
              showToast={
                showToast
              }
              refreshKey={
                contributionRefreshKey
              }
              onChanged={
                handleContributionChanged
              }
            />
          </div>
        ) : activeTab ===
          'impact' ? (
          <div
            className={
              impactEditorOpen
                ? ''
                : 'mt-4 sm:mt-5'
            }
          >
            <AdminImpactScreen
              showToast={
                showToast
              }
              refreshKey={
                impactRefreshKey
              }
              onChanged={
                handleImpactChanged
              }
              onEditorChange={
                handleImpactEditorChange
              }
            />
          </div>
        ) : activeTab ===
          'users' ? (
          <div className="mt-4 sm:mt-5">
            <AdminUsersScreen
              showToast={
                showToast
              }
              refreshKey={
                usersRefreshKey
              }
              onChanged={
                handleUsersChanged
              }
            />
          </div>
        ) : activeTab ===
          'settings' ? (
          <div className="mt-4 sm:mt-5">
            <AdminSettingsScreen
              showToast={
                showToast
              }
              refreshKey={
                settingsRefreshKey
              }
              onChanged={
                handleSettingsChanged
              }
            />
          </div>
        ) : (
          <div className="mt-4 sm:mt-5">
            <AdminAuditScreen
              showToast={
                showToast
              }
              refreshKey={
                auditRefreshKey
              }
            />
          </div>
        )}
      </div>

      <AdminCauseEditorScreen
        open={
          causeEditorOpen
        }
        causeId={
          editingCauseId
        }
        onClose={
          closeCauseEditor
        }
        onSaved={
          handleCauseSaved
        }
        showToast={
          showToast
        }
      />
    </>
  );
}