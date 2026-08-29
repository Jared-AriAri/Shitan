import { useCallback, useEffect, useRef, useState } from 'react';

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

import HomeScreen from './screens/HomeScreen';
import CauseDetailScreen from './screens/CauseDetailScreen';
import ContributeScreen from './screens/ContributeScreen';
import SuccessScreen from './screens/SuccessScreen';
import LedgerScreen from './screens/LedgerScreen';
import ImpactScreen from './screens/ImpactScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';

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

function TabIcon({ tab }: { tab: NavTab }) {
  if (tab === 'home') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    role: authRole,
  } = useAuth();

  const [screen, setScreen] = useState<Screen>('home');
  const [selectedCauseId, setSelectedCauseId] =
    useState<string | null>(null);
  const [activeNav, setActiveNav] =
    useState<NavTab>('home');
  const [userRole, setUserRole] =
    useState<UserRole>(authRole);
  const [toasts, setToasts] =
    useState<ToastMessage[]>([]);
  const [submissionData, setSubmissionData] =
    useState<SubmissionData | null>(null);
  const [authModalOpen, setAuthModalOpen] =
    useState(false);
  const [adminPendingCount] = useState(5);

  const mainRef = useRef<HTMLElement | null>(null);
  const appRef = useRef<HTMLDivElement | null>(null);

  const authenticated =
    !authLoading && Boolean(session?.user);

  const showToast = useCallback(
    (
      message: string,
      type: ToastMessage['type'] = 'success',
    ) => {
      const id =
        typeof crypto !== 'undefined' &&
          crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
        },
      ]);

      window.setTimeout(() => {
        setToasts((prev) =>
          prev.filter(
            (toast) => toast.id !== id,
          ),
        );
      }, 3500);
    },
    [],
  );

  const navigate = useCallback(
    (to: Screen, causeId?: string) => {
      if (causeId) {
        setSelectedCauseId(causeId);
      }

      setScreen(to);

      if (
        to === 'home' ||
        to === 'ledger' ||
        to === 'impact' ||
        to === 'profile'
      ) {
        setActiveNav(to as NavTab);
      }

      if (
        to === 'cause-detail' ||
        to === 'contribute'
      ) {
        setActiveNav('causes');
      }
    },
    [],
  );

  const handleNavTab = useCallback(
    (tab: NavTab) => {
      setActiveNav(tab);

      if (tab === 'causes') {
        setScreen('home');

        window.setTimeout(() => {
          const section =
            document.querySelector(
              '[data-section="causes"]',
            ) ||
            document.getElementById('causes');

          section?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);

        return;
      }

      if (tab === 'home') {
        setScreen('home');

        window.setTimeout(() => {
          mainRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }, 50);

        return;
      }

      setScreen(tab as Screen);
    },
    [],
  );

  const handleGoHome = useCallback(() => {
    setScreen('home');
    setActiveNav('home');
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const handleAuthenticated = useCallback(() => {
    setAuthModalOpen(false);
    showToast(
      'Sesión iniciada correctamente',
      'success',
    );
    setScreen('profile');
    setActiveNav('profile');
  }, [showToast]);

  const handleLoggedOut = useCallback(() => {
    setAuthModalOpen(false);
    setSelectedCauseId(null);
    setScreen('home');
    setActiveNav('home');
    showToast(
      'Sesión cerrada correctamente',
      'success',
    );
  }, [showToast]);

  useEffect(() => {
    setUserRole(authRole);
  }, [authRole]);

  useEffect(() => {
    if (!mainRef.current) {
      return;
    }

    if (
      activeNav === 'causes' &&
      screen === 'home'
    ) {
      return;
    }

    mainRef.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [
    screen,
    selectedCauseId,
    activeNav,
  ]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (screen === 'cause-detail') {
        navigate('home');
        return;
      }

      if (screen === 'contribute') {
        navigate(
          'cause-detail',
          selectedCauseId || undefined,
        );
        return;
      }

      if (screen === 'admin') {
        navigate('profile');
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
  ]);

  useEffect(() => {
    const app = appRef.current;

    if (!app) {
      return;
    }

    const handlePointerMove = (
      event: PointerEvent,
    ) => {
      const x =
        (event.clientX /
          window.innerWidth) *
        100;

      const y =
        (event.clientY /
          window.innerHeight) *
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
    screen !== 'success' &&
    screen !== 'admin';

  const showDesktopNav =
    screen !== 'success' &&
    screen !== 'admin' &&
    screen !== 'contribute' &&
    screen !== 'cause-detail';

  const causeDetailActive =
    screen === 'cause-detail' ||
    screen === 'contribute';

  const visibleDesktopNav =
    DESKTOP_NAV.filter(
      (item) =>
        item.id !== 'profile' ||
        authenticated,
    );

  const renderAppBar = () => {
    if (screen === 'success') {
      return null;
    }

    if (screen === 'admin') {
      return (
        <AppBar
          title="Administración"
          showBack
          onBack={() =>
            navigate('profile')
          }
          onLoginClick={openAuthModal}
          onProfileClick={() =>
            navigate('profile')
          }
          onLoggedOut={handleLoggedOut}
          rightContent={
            <span className="admin-pending-badge">
              <span className="admin-pending-dot" />
              {adminPendingCount}{' '}
              pendientes
            </span>
          }
        />
      );
    }

    if (screen === 'cause-detail') {
      return (
        <AppBar
          title="Detalle de causa"
          showBack
          onBack={handleGoHome}
          onLoginClick={openAuthModal}
          onProfileClick={() =>
            navigate('profile')
          }
          onLoggedOut={handleLoggedOut}
        />
      );
    }

    if (screen === 'contribute') {
      return (
        <AppBar
          title="Aportar"
          showBack
          onBack={() =>
            navigate(
              'cause-detail',
              selectedCauseId ||
              undefined,
            )
          }
          onLoginClick={openAuthModal}
          onProfileClick={() =>
            navigate('profile')
          }
          onLoggedOut={handleLoggedOut}
        />
      );
    }

    const tabTitles: Record<
      NavTab,
      string
    > = {
      home: 'Inicio',
      causes: 'Causas',
      ledger: 'Transparencia',
      impact: 'Impacto',
      profile: 'Perfil',
    };

    return (
      <AppBar
        title={tabTitles[activeNav]}
        onLoginClick={openAuthModal}
        onProfileClick={() =>
          navigate('profile')
        }
        onLoggedOut={handleLoggedOut}
      />
    );
  };

  const renderDesktopNavigation = () => {
    if (!showDesktopNav) {
      return null;
    }

    return (
      <div className="premium-nav-shell">
        <div className="premium-nav-ambient" />

        <div
          className="premium-nav-container"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) auto minmax(0, 1fr)',
            alignItems: 'center',
          }}
        >
          <div />

          <nav
            className="premium-tabs"
            aria-label="Navegación principal"
          >
            {visibleDesktopNav.map(
              (item) => {
                const isActive =
                  activeNav === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-tab={item.id}
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
                        tab={item.id}
                      />
                    </span>

                    <span className="premium-tab-content">
                      <span className="premium-tab-eyebrow">
                        {item.eyebrow}
                      </span>

                      <span className="premium-tab-label">
                        {item.label}
                      </span>
                    </span>

                    <span className="premium-tab-glow" />
                    <span className="premium-tab-line" />
                  </button>
                );
              },
            )}
          </nav>

          <div
            className="premium-nav-actions"
            style={{
              justifySelf: 'end',
            }}
          >
            {authenticated &&
              userRole !== 'donante' && (
                <button
                  type="button"
                  className="premium-admin-button"
                  onClick={() =>
                    navigate('admin')
                  }
                >
                  <span>
                    Administración
                  </span>

                  {adminPendingCount > 0 && (
                    <span className="premium-admin-count">
                      {adminPendingCount}
                    </span>
                  )}
                </button>
              )}
          </div>
        </div>
      </div>
    );
  };

  const renderScreen = () => {
    if (screen === 'home') {
      return (
        <div className="screen-wrapper screen-wrapper-home">
          <HomeScreen
            navigate={navigate}
            showToast={showToast}
          />
        </div>
      );
    }

    if (
      screen === 'cause-detail' &&
      selectedCauseId
    ) {
      return (
        <div className="screen-wrapper screen-wrapper-cause">
          <CauseDetailScreen
            causeId={selectedCauseId}
            navigate={navigate}
            showToast={showToast}
          />
        </div>
      );
    }

    if (
      screen === 'contribute' &&
      selectedCauseId
    ) {
      return (
        <div className="screen-wrapper screen-wrapper-contribute">
          <ContributeScreen
            causeId={selectedCauseId}
            navigate={navigate}
            showToast={showToast}
            onSuccess={(data) => {
              setSubmissionData(data);
              setScreen('success');
            }}
          />
        </div>
      );
    }

    if (screen === 'success') {
      return (
        <div className="screen-wrapper screen-wrapper-success">
          <SuccessScreen
            data={submissionData}
            navigate={navigate}
          />
        </div>
      );
    }

    if (screen === 'ledger') {
      return (
        <div className="screen-wrapper screen-wrapper-ledger">
          <LedgerScreen
            showToast={showToast}
          />
        </div>
      );
    }

    if (screen === 'impact') {
      return (
        <div className="screen-wrapper screen-wrapper-impact">
          <ImpactScreen
            navigate={navigate}
          />
        </div>
      );
    }

    if (screen === 'profile') {
      return (
        <div className="screen-wrapper screen-wrapper-profile">
          <ProfileScreen
            userRole={userRole}
            onRoleChange={setUserRole}
            navigate={navigate}
            showToast={showToast}
          />
        </div>
      );
    }

    if (screen === 'admin') {
      return (
        <div className="screen-wrapper screen-wrapper-admin">
          <AdminScreen
            navigate={navigate}
            showToast={showToast}
          />
        </div>
      );
    }

    return (
      <div className="screen-wrapper screen-wrapper-home">
        <HomeScreen
          navigate={navigate}
          showToast={showToast}
        />
      </div>
    );
  };

  return (
    <div
      ref={appRef}
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
        ref={mainRef}
        className="app-main"
      >
        <div
          key={`${screen}-${selectedCauseId ?? 'none'}`}
          className="app-screen"
        >
          {renderScreen()}
        </div>
      </main>

      {showBottomNav && (
        <div className="mobile-bottom-nav">
          <BottomNav
            activeTab={activeNav}
            onTabChange={handleNavTab}
            userRole={userRole}
            causeDetailActive={
              causeDetailActive
            }
          />
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
          />
        ))}
      </div>

      <AuthModal
        open={authModalOpen}
        onClose={closeAuthModal}
        onAuthenticated={
          handleAuthenticated
        }
        initialMode="login"
      />
    </div>
  );
}