import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Screen,
  NavTab,
  UserRole,
  ToastMessage,
  SubmissionData,
} from './types';

import AppBar from './components/AppBar';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import AuthModal from './components/auth/AuthModal';
import { useAuth } from './contexts/AuthContext';

import HomeScreen from './screens/user/HomeScreen';
import CausesScreen from './screens/user/CausesScreen';
import CauseDetailScreen from './screens/user/CauseDetailScreen';
import ContributeScreen from './screens/user/ContributeScreen';
import SuccessScreen from './screens/user/SuccessScreen';
import LedgerScreen from './screens/user/LedgerScreen';
import ImpactScreen from './screens/user/ImpactScreen';
import ProfileScreen from './screens/user/ProfileScreen';
import AdminScreen from './screens/admin/AdminScreen';

type AppScreen = Screen | 'causes';

const DESKTOP_NAV: Array<{
  id: NavTab;
  label: string;
  eyebrow: string;
}> = [
    {
      id: 'home',
      label: 'Inicio',
      eyebrow: 'Principal',
    },
    {
      id: 'causes',
      label: 'Causas',
      eyebrow: 'Apoyar',
    },
    {
      id: 'ledger',
      label: 'Transparencia',
      eyebrow: 'Registro',
    },
    {
      id: 'impact',
      label: 'Impacto',
      eyebrow: 'Resultados',
    },
    {
      id: 'profile',
      label: 'Perfil',
      eyebrow: 'Cuenta',
    },
  ];

function TabIcon({
  tab,
}: {
  tab: NavTab;
}) {
  if (tab === 'home') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3.5 11.5L12 4L20.5 11.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M5.5 10.5V20H18.5V10.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M9.5 20V14H14.5V20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tab === 'causes') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 20.5S4 16.1 4 9.6C4 6.7 5.9 4.5 8.7 4.5C10.3 4.5 11.4 5.3 12 6.2C12.6 5.3 13.7 4.5 15.3 4.5C18.1 4.5 20 6.7 20 9.6C20 16.1 12 20.5 12 20.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tab === 'ledger') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 3L19 6.2V11.2C19 15.7 16.1 19.2 12 21C7.9 19.2 5 15.7 5 11.2V6.2L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M8.5 12L10.7 14.2L15.7 9.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tab === 'impact') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M18.5 15L19.3 17.2L21.5 18L19.3 18.8L18.5 21L17.7 18.8L15.5 18L17.7 17.2L18.5 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4.8 20C5.5 16.6 8.2 14.5 12 14.5C15.8 14.5 18.5 16.6 19.2 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  const {
    session,
    loading: authLoading,
  } = useAuth();

  const authenticated =
    !authLoading &&
    Boolean(
      session?.user,
    );

  const [
    screen,
    setScreen,
  ] =
    useState<AppScreen>(
      'home',
    );

  const [
    selectedCauseId,
    setSelectedCauseId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    activeNav,
    setActiveNav,
  ] =
    useState<NavTab>(
      'home',
    );

  const [
    userRole,
    setUserRole,
  ] =
    useState<UserRole>(
      'donante',
    );

  const [
    toasts,
    setToasts,
  ] =
    useState<ToastMessage[]>(
      [],
    );

  const [
    submissionData,
    setSubmissionData,
  ] =
    useState<SubmissionData | null>(
      null,
    );

  const [
    navigationHistory,
    setNavigationHistory,
  ] =
    useState<AppScreen[]>(
      [],
    );

  const [
    authModalOpen,
    setAuthModalOpen,
  ] = useState(false);

  const [
    adminCauseModalOpen,
    setAdminCauseModalOpen,
  ] = useState(false);

  const [
    adminInternalBackAvailable,
    setAdminInternalBackAvailable,
  ] = useState(false);

  const [
    impactDetailOpen,
    setImpactDetailOpen,
  ] = useState(false);

  const [
    causeDetailModalOpen,
    setCauseDetailModalOpen,
  ] = useState(false);

  const [
    contributeModalOpen,
    setContributeModalOpen,
  ] = useState(false);

  const [
    adminRefreshKey,
    setAdminRefreshKey,
  ] = useState(0);

  const [
    adminRefreshing,
    setAdminRefreshing,
  ] = useState(false);

  const adminCauseModalCloseRef =
    useRef<
      (() => void) | null
    >(null);

  const adminInternalBackRef =
    useRef<
      (() => void) | null
    >(null);

  const impactDetailCloseRef =
    useRef<
      (() => void) | null
    >(null);

  const causeDetailOriginRef =
    useRef<AppScreen>(
      'home',
    );

  const mainRef =
    useRef<HTMLElement | null>(
      null,
    );

  const appRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const showToast =
    useCallback(
      (
        message: string,
        type: ToastMessage['type'] =
          'success',
      ) => {
        const id =
          typeof crypto !==
            'undefined' &&
            crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random()
              .toString(36)
              .slice(2);

        setToasts(
          (previous) => [
            ...previous,
            {
              id,
              message,
              type,
            },
          ],
        );

        window.setTimeout(
          () => {
            setToasts(
              (previous) =>
                previous.filter(
                  (toast) =>
                    toast.id !==
                    id,
                ),
            );
          },
          3500,
        );
      },
      [],
    );

  const pushNavigationHistory =
    useCallback(
      (
        current: AppScreen,
      ) => {
        setNavigationHistory(
          (
            previous,
          ) => {
            if (
              previous[
              previous.length -
              1
              ] ===
              current
            ) {
              return previous;
            }

            return [
              ...previous,
              current,
            ];
          },
        );
      },
      [],
    );

  const restoreScreen =
    useCallback(
      (
        target: AppScreen,
      ) => {
        setScreen(
          target,
        );

        if (
          target ===
          'home' ||
          target ===
          'causes' ||
          target ===
          'ledger' ||
          target ===
          'impact' ||
          target ===
          'profile'
        ) {
          setActiveNav(
            target as NavTab,
          );
        }
      },
      [],
    );

  const closeContributeModal =
    useCallback(
      () => {
        setContributeModalOpen(
          false,
        );
      },
      [],
    );

  const closeCauseDetailModal =
    useCallback(
      () => {
        setContributeModalOpen(
          false,
        );

        setCauseDetailModalOpen(
          false,
        );
      },
      [],
    );

  const navigate =
    useCallback(
      (
        to: AppScreen,
        causeId?: string,
      ) => {
        if (
          impactDetailOpen
        ) {
          impactDetailCloseRef.current?.();

          impactDetailCloseRef.current =
            null;

          setImpactDetailOpen(
            false,
          );
        }

        if (
          to ===
          'cause-detail' &&
          causeId
        ) {
          setSelectedCauseId(
            causeId,
          );

          if (
            !causeDetailModalOpen
          ) {
            causeDetailOriginRef.current =
              screen;
          }

          setContributeModalOpen(
            false,
          );

          setCauseDetailModalOpen(
            true,
          );

          return;
        }

        if (
          to ===
          'contribute' &&
          causeId
        ) {
          setSelectedCauseId(
            causeId,
          );

          if (
            !causeDetailModalOpen
          ) {
            causeDetailOriginRef.current =
              screen;

            setCauseDetailModalOpen(
              true,
            );
          }

          setContributeModalOpen(
            true,
          );

          return;
        }

        if (
          contributeModalOpen
        ) {
          setContributeModalOpen(
            false,
          );
        }

        if (
          causeDetailModalOpen
        ) {
          setCauseDetailModalOpen(
            false,
          );
        }

        if (
          to !==
          screen
        ) {
          pushNavigationHistory(
            screen,
          );
        }

        if (causeId) {
          setSelectedCauseId(
            causeId,
          );
        }

        restoreScreen(
          to,
        );
      },
      [
        causeDetailModalOpen,
        contributeModalOpen,
        impactDetailOpen,
        pushNavigationHistory,
        restoreScreen,
        screen,
      ],
    );

  const handleNavTab =
    useCallback(
      (
        tab: NavTab,
      ) => {
        if (
          contributeModalOpen
        ) {
          setContributeModalOpen(
            false,
          );
        }

        if (
          causeDetailModalOpen
        ) {
          setCauseDetailModalOpen(
            false,
          );
        }

        if (
          impactDetailOpen
        ) {
          impactDetailCloseRef.current?.();

          impactDetailCloseRef.current =
            null;

          setImpactDetailOpen(
            false,
          );
        }

        const target =
          tab ===
            'causes'
            ? 'causes'
            : tab as Screen;

        if (
          target !==
          screen
        ) {
          pushNavigationHistory(
            screen,
          );
        }

        restoreScreen(
          target,
        );

        window.setTimeout(
          () => {
            mainRef.current?.scrollTo(
              {
                top: 0,
                behavior:
                  'smooth',
              },
            );
          },
          50,
        );
      },
      [
        causeDetailModalOpen,
        contributeModalOpen,
        impactDetailOpen,
        pushNavigationHistory,
        restoreScreen,
        screen,
      ],
    );

  const openAuthModal =
    useCallback(
      () => {
        setAuthModalOpen(
          true,
        );
      },
      [],
    );

  const closeAuthModal =
    useCallback(
      () => {
        setAuthModalOpen(
          false,
        );
      },
      [],
    );

  const handleLogoClick =
    useCallback(
      () => {
        setAuthModalOpen(
          false,
        );

        setAdminCauseModalOpen(
          false,
        );

        adminCauseModalCloseRef.current =
          null;

        setAdminInternalBackAvailable(
          false,
        );

        adminInternalBackRef.current =
          null;

        if (
          impactDetailOpen
        ) {
          impactDetailCloseRef.current?.();

          impactDetailCloseRef.current =
            null;

          setImpactDetailOpen(
            false,
          );
        }

        setContributeModalOpen(
          false,
        );

        setCauseDetailModalOpen(
          false,
        );

        setNavigationHistory(
          [],
        );

        setSelectedCauseId(
          null,
        );

        restoreScreen(
          'home',
        );

        window.setTimeout(
          () => {
            mainRef.current?.scrollTo(
              {
                top: 0,
                behavior:
                  'smooth',
              },
            );
          },
          50,
        );
      },
      [
        impactDetailOpen,
        restoreScreen,
      ],
    );

  const handleAuthenticated =
    useCallback(
      () => {
        setAuthModalOpen(
          false,
        );

        showToast(
          'Sesión iniciada correctamente',
          'success',
        );

        if (
          screen !==
          'profile'
        ) {
          pushNavigationHistory(
            screen,
          );
        }

        restoreScreen(
          'profile',
        );
      },
      [
        showToast,
        screen,
        pushNavigationHistory,
        restoreScreen,
      ],
    );

  const handleLoggedOut =
    useCallback(
      () => {
        setAuthModalOpen(
          false,
        );

        setAdminCauseModalOpen(
          false,
        );

        adminCauseModalCloseRef.current =
          null;

        setAdminInternalBackAvailable(
          false,
        );

        adminInternalBackRef.current =
          null;

        setImpactDetailOpen(
          false,
        );

        impactDetailCloseRef.current =
          null;

        setCauseDetailModalOpen(
          false,
        );

        setContributeModalOpen(
          false,
        );

        setAdminRefreshing(
          false,
        );

        setUserRole(
          'donante',
        );

        setNavigationHistory(
          [],
        );

        restoreScreen(
          'home',
        );
      },
      [
        restoreScreen,
      ],
    );

  const handleAdminCauseModalChange =
    useCallback(
      (
        open: boolean,
        closeHandler?: () => void,
      ) => {
        adminCauseModalCloseRef.current =
          open &&
            closeHandler
            ? closeHandler
            : null;

        setAdminCauseModalOpen(
          open,
        );
      },
      [],
    );

  const handleAdminBackChange =
    useCallback(
      (
        canGoBack: boolean,
        backHandler?: () => void,
      ) => {
        adminInternalBackRef.current =
          canGoBack &&
            backHandler
            ? backHandler
            : null;

        setAdminInternalBackAvailable(
          canGoBack,
        );
      },
      [],
    );

  const handleImpactDetailChange =
    useCallback(
      (
        open: boolean,
        closeHandler?: () => void,
      ) => {
        impactDetailCloseRef.current =
          open &&
            closeHandler
            ? closeHandler
            : null;

        setImpactDetailOpen(
          open,
        );
      },
      [],
    );

  const handleGlobalBack =
    useCallback(
      () => {
        if (
          contributeModalOpen
        ) {
          setContributeModalOpen(
            false,
          );

          setCauseDetailModalOpen(
            false,
          );

          restoreScreen(
            causeDetailOriginRef.current,
          );

          return;
        }

        if (
          causeDetailModalOpen
        ) {
          setCauseDetailModalOpen(
            false,
          );

          restoreScreen(
            causeDetailOriginRef.current,
          );

          return;
        }

        if (
          screen ===
          'impact' &&
          impactDetailOpen
        ) {
          impactDetailCloseRef.current?.();

          return;
        }

        if (
          screen ===
          'admin' &&
          adminCauseModalOpen
        ) {
          adminCauseModalCloseRef.current?.();

          return;
        }

        if (
          screen ===
          'admin' &&
          adminInternalBackAvailable
        ) {
          adminInternalBackRef.current?.();

          return;
        }

        if (
          !navigationHistory.length
        ) {
          return;
        }

        const next =
          [
            ...navigationHistory,
          ];

        const target =
          next.pop();

        setNavigationHistory(
          next,
        );

        if (
          target
        ) {
          restoreScreen(
            target,
          );
        }
      },
      [
        adminCauseModalOpen,
        adminInternalBackAvailable,
        causeDetailModalOpen,
        contributeModalOpen,
        impactDetailOpen,
        navigationHistory,
        restoreScreen,
        screen,
      ],
    );

  const handleAdminBack =
    useCallback(
      () => {
        handleGlobalBack();
      },
      [
        handleGlobalBack,
      ],
    );

  const refreshAdminGlobal =
    useCallback(
      async () => {
        if (
          adminRefreshing ||
          adminCauseModalOpen
        ) {
          return;
        }

        setAdminRefreshing(
          true,
        );

        setAdminRefreshKey(
          (current) =>
            current + 1,
        );

        await new Promise<void>(
          (resolve) => {
            window.setTimeout(
              resolve,
              700,
            );
          },
        );

        setAdminRefreshing(
          false,
        );
      },
      [
        adminRefreshing,
        adminCauseModalOpen,
      ],
    );

  useEffect(() => {
    if (
      !mainRef.current
    ) {
      return;
    }

    mainRef.current.scrollTo(
      {
        top: 0,
        behavior:
          'smooth',
      },
    );
  }, [
    screen,
    selectedCauseId,
    activeNav,
  ]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key !==
        'Escape'
      ) {
        return;
      }

      if (
        contributeModalOpen
      ) {
        setContributeModalOpen(
          false,
        );

        setCauseDetailModalOpen(
          false,
        );

        restoreScreen(
          causeDetailOriginRef.current,
        );

        return;
      }

      if (
        causeDetailModalOpen
      ) {
        setCauseDetailModalOpen(
          false,
        );

        restoreScreen(
          causeDetailOriginRef.current,
        );

        return;
      }

      if (
        screen ===
        'impact' &&
        impactDetailOpen
      ) {
        impactDetailCloseRef.current?.();

        return;
      }

      if (
        screen ===
        'admin' &&
        adminCauseModalOpen
      ) {
        adminCauseModalCloseRef.current?.();

        return;
      }

      if (
        screen ===
        'admin' &&
        adminInternalBackAvailable
      ) {
        adminInternalBackRef.current?.();

        return;
      }

      if (
        navigationHistory.length >
        0
      ) {
        handleGlobalBack();
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [
    screen,
    selectedCauseId,
    navigate,
    adminCauseModalOpen,
    adminInternalBackAvailable,
    impactDetailOpen,
    causeDetailModalOpen,
    contributeModalOpen,
    navigationHistory.length,
    handleGlobalBack,
    restoreScreen,
  ]);

  useEffect(() => {
    const app =
      appRef.current;

    if (!app) {
      return;
    }

    const handlePointerMove = (
      event: PointerEvent,
    ) => {
      const x =
        (
          event.clientX /
          window.innerWidth
        ) *
        100;

      const y =
        (
          event.clientY /
          window.innerHeight
        ) *
        100;

      app.style.setProperty(
        '--mouse-x',
        `${x}%`,
      );

      app.style.setProperty(
        '--mouse-y',
        `${y}%`,
      );
    };

    window.addEventListener(
      'pointermove',
      handlePointerMove,
    );

    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove,
      );
    };
  }, []);

  const showBottomNav =
    authenticated &&
    screen !==
    'success' &&
    screen !==
    'admin' &&
    !(
      screen ===
      'impact' &&
      impactDetailOpen
    ) &&
    !causeDetailModalOpen &&
    !contributeModalOpen;

  const showDesktopNav =
    authenticated &&
    screen !==
    'success' &&
    screen !==
    'admin' &&
    !(
      screen ===
      'impact' &&
      impactDetailOpen
    ) &&
    !causeDetailModalOpen &&
    !contributeModalOpen;

  const causeDetailActive =
    causeDetailModalOpen ||
    contributeModalOpen;

  const renderAppBar =
    () => {
      if (
        screen ===
        'success'
      ) {
        return null;
      }

      if (
        contributeModalOpen
      ) {
        return (
          <AppBar
            title="Aportar"
            showBack
            onBack={
              handleGlobalBack
            }
            onLoginClick={
              openAuthModal
            }
            onProfileClick={() =>
              navigate(
                'profile',
              )
            }
            onLogoClick={
              handleLogoClick
            }
            onLoggedOut={
              handleLoggedOut
            }
          />
        );
      }

      if (
        causeDetailModalOpen
      ) {
        return (
          <AppBar
            title="Detalle de causa"
            showBack
            onBack={
              handleGlobalBack
            }
            onLoginClick={
              openAuthModal
            }
            onProfileClick={() =>
              navigate(
                'profile',
              )
            }
            onLogoClick={
              handleLogoClick
            }
            onLoggedOut={
              handleLoggedOut
            }
          />
        );
      }

      if (
        screen ===
        'admin'
      ) {
        return (
          <AppBar
            title={
              adminCauseModalOpen
                ? 'Causas'
                : 'Administración'
            }
            showBack
            onBack={
              handleAdminBack
            }
            showRefresh={
              !adminCauseModalOpen
            }
            onRefresh={
              refreshAdminGlobal
            }
            refreshing={
              adminRefreshing
            }
            onLoginClick={
              openAuthModal
            }
            onProfileClick={() =>
              navigate(
                'profile',
              )
            }
            onLogoClick={
              handleLogoClick
            }
            onLoggedOut={
              handleLoggedOut
            }
          />
        );
      }

      if (
        screen ===
        'impact' &&
        impactDetailOpen
      ) {
        return (
          <AppBar
            title="Impacto"
            showBack
            onBack={
              handleGlobalBack
            }
            onLoginClick={
              openAuthModal
            }
            onProfileClick={() =>
              navigate(
                'profile',
              )
            }
            onLogoClick={
              handleLogoClick
            }
            onLoggedOut={
              handleLoggedOut
            }
          />
        );
      }

      const tabTitles: Record<
        NavTab,
        string
      > = {
        home: 'Inicio',
        causes: 'Causas',
        ledger:
          'Transparencia',
        impact: 'Impacto',
        profile: 'Perfil',
      };

      return (
        <AppBar
          title={
            tabTitles[
            activeNav
            ]
          }
          showBack={
            navigationHistory.length >
            0
          }
          onBack={
            handleGlobalBack
          }
          onLoginClick={
            openAuthModal
          }
          onProfileClick={() =>
            navigate(
              'profile',
            )
          }
          onLogoClick={
            handleLogoClick
          }
          onLoggedOut={
            handleLoggedOut
          }
        />
      );
    };

  const renderDesktopNavigation =
    () => {
      if (
        !showDesktopNav
      ) {
        return null;
      }

      return (
        <div className="premium-nav-shell">
          <div className="premium-nav-ambient" />

          <div className="premium-nav-container">
            <nav
              className="premium-tabs"
              aria-label="Navegación principal"
            >
              {DESKTOP_NAV.map(
                (
                  item,
                ) => {
                  const isActive =
                    activeNav ===
                    item.id;

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      data-tab={
                        item.id
                      }
                      aria-current={
                        isActive
                          ? 'page'
                          : undefined
                      }
                      onClick={() =>
                        handleNavTab(
                          item.id,
                        )
                      }
                      className={`premium-tab ${isActive
                        ? 'is-active'
                        : ''
                        }`}
                    >
                      <span className="premium-tab-icon">
                        <TabIcon
                          tab={
                            item.id
                          }
                        />
                      </span>

                      <span className="premium-tab-content">
                        <span className="premium-tab-eyebrow">
                          {
                            item.eyebrow
                          }
                        </span>

                        <span className="premium-tab-label">
                          {
                            item.label
                          }
                        </span>
                      </span>

                      <span className="premium-tab-glow" />

                      <span className="premium-tab-line" />
                    </button>
                  );
                },
              )}
            </nav>

            {userRole !==
              'donante' && (
                <div className="premium-nav-actions">
                  <button
                    type="button"
                    className="premium-admin-button"
                    onClick={() =>
                      navigate(
                        'admin',
                      )
                    }
                  >
                    <span>
                      Administración
                    </span>
                  </button>
                </div>
              )}
          </div>
        </div>
      );
    };

  const renderScreen =
    () => {
      if (
        screen ===
        'home'
      ) {
        return (
          <div className="screen-wrapper screen-wrapper-home">
            <HomeScreen
              navigate={
                navigate
              }
              onLoginClick={
                openAuthModal
              }
              showToast={
                showToast
              }
            />
          </div>
        );
      }

      if (
        screen ===
        'causes'
      ) {
        return (
          <div className="screen-wrapper screen-wrapper-causes">
            <CausesScreen
              navigate={
                navigate
              }
              showToast={
                showToast
              }
            />
          </div>
        );
      }

      if (
        screen ===
        'success'
      ) {
        return (
          <div className="screen-wrapper screen-wrapper-success">
            <SuccessScreen
              data={
                submissionData
              }
              navigate={
                navigate
              }
            />
          </div>
        );
      }

      if (
        screen ===
        'ledger'
      ) {
        return (
          <div className="screen-wrapper screen-wrapper-ledger">
            <LedgerScreen
              showToast={
                showToast
              }
            />
          </div>
        );
      }

      if (
        screen ===
        'impact'
      ) {
        return (
          <div className="screen-wrapper screen-wrapper-impact">
            <ImpactScreen
              navigate={
                navigate
              }
              onDetailChange={
                handleImpactDetailChange
              }
            />
          </div>
        );
      }

      if (
        screen ===
        'profile'
      ) {
        return (
          <div className="screen-wrapper screen-wrapper-profile">
            <ProfileScreen
              userRole={
                userRole
              }
              onRoleChange={
                setUserRole
              }
              navigate={
                navigate
              }
              showToast={
                showToast
              }
            />
          </div>
        );
      }

      if (
        screen ===
        'admin'
      ) {
        return (
          <div className="screen-wrapper screen-wrapper-admin">
            <AdminScreen
              navigate={
                navigate
              }
              showToast={
                showToast
              }
              refreshKey={
                adminRefreshKey
              }
              onCauseModalChange={
                handleAdminCauseModalChange
              }
              onAdminBackChange={
                handleAdminBackChange
              }
            />
          </div>
        );
      }

      return (
        <div className="screen-wrapper screen-wrapper-home">
          <HomeScreen
            navigate={
              navigate
            }
            onLoginClick={
              openAuthModal
            }
            showToast={
              showToast
            }
          />
        </div>
      );
    };

  return (
    <div
      ref={
        appRef
      }
      className={`app-shell app-theme-${activeNav}`}
    >
      <div className="app-background">
        <div className="app-background-grid" />
        <div className="app-background-noise" />
        <div className="app-background-orb app-background-orb-one" />
        <div className="app-background-orb app-background-orb-two" />
        <div className="app-background-orb app-background-orb-three" />
        <div className="app-pointer-glow" />
      </div>

      <div className="app-header">
        {renderAppBar()}
      </div>

      {renderDesktopNavigation()}

      <main
        ref={
          mainRef
        }
        className="app-main"
      >
        <div
          key={`${screen}-${selectedCauseId ?? 'none'}`}
          className="app-screen"
        >
          {renderScreen()}
        </div>
      </main>

      {selectedCauseId && (
        <CauseDetailScreen
          open={
            causeDetailModalOpen
          }
          causeId={
            selectedCauseId
          }
          navigate={
            navigate
          }
          showToast={
            showToast
          }
          onClose={
            closeCauseDetailModal
          }
        />
      )}

      {selectedCauseId && (
        <ContributeScreen
          open={
            contributeModalOpen
          }
          causeId={
            selectedCauseId
          }
          navigate={
            navigate
          }
          showToast={
            showToast
          }
          onSuccess={(
            data,
          ) => {
            setSubmissionData(
              data,
            );

            setContributeModalOpen(
              false,
            );

            setCauseDetailModalOpen(
              false,
            );

            setScreen(
              'success',
            );
          }}
        />
      )}

      {showBottomNav && (
        <div className="mobile-bottom-nav">
          <BottomNav
            activeTab={
              activeNav
            }
            onTabChange={
              handleNavTab
            }
            userRole={
              userRole
            }
            causeDetailActive={
              causeDetailActive
            }
          />
        </div>
      )}

      <div className="toast-container">
        {toasts.map(
          (
            toast,
          ) => (
            <Toast
              key={
                toast.id
              }
              message={
                toast.message
              }
              type={
                toast.type
              }
            />
          ),
        )}
      </div>

      <AuthModal
        open={
          authModalOpen
        }
        onClose={
          closeAuthModal
        }
        onAuthenticated={
          handleAuthenticated
        }
        initialMode="login"
      />
    </div>
  );
}