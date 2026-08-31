import {
  Home,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

import {
  NavTab,
  UserRole,
} from '../types';

import {
  useAuth,
} from '../contexts/AuthContext';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (
    tab: NavTab,
  ) => void;
  userRole: UserRole;
  causeDetailActive?: boolean;
}

const ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: typeof Home;
}> = [
    {
      id: 'home',
      label: 'Inicio',
      icon: Home,
    },
    {
      id: 'causes',
      label: 'Causas',
      icon: HeartHandshake,
    },
    {
      id: 'ledger',
      label: 'Transparencia',
      icon: ShieldCheck,
    },
    {
      id: 'impact',
      label: 'Impacto',
      icon: Sparkles,
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: UserRound,
    },
  ];

export default function BottomNav({
  activeTab,
  onTabChange,
  causeDetailActive = false,
}: BottomNavProps) {
  const {
    session,
    loading,
  } = useAuth();

  const authenticated =
    !loading &&
    Boolean(
      session?.user,
    );

  if (
    loading ||
    !authenticated
  ) {
    return null;
  }

  return (
    <div className="mobile-dock-wrapper flex w-full justify-center">
      <nav
        className="mobile-dock mx-auto"
        aria-label="Navegación principal"
        style={{
          gridTemplateColumns: `repeat(${ITEMS.length}, minmax(0, 1fr))`,
        }}
      >
        <div className="mobile-dock-light" />

        {ITEMS.map(
          (
            item,
          ) => {
            const Icon =
              item.icon;

            const isActive =
              item.id ===
                'causes'
                ? activeTab ===
                item.id ||
                causeDetailActive
                : activeTab ===
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
                className={`mobile-dock-item ${isActive
                    ? 'is-active'
                    : ''
                  }`}
                onClick={() =>
                  onTabChange(
                    item.id,
                  )
                }
              >
                <span className="mobile-dock-active" />

                <span className="mobile-dock-icon">
                  <Icon
                    size={
                      21
                    }
                    strokeWidth={
                      isActive
                        ? 2.15
                        : 1.7
                    }
                  />

                  <span className="mobile-dock-indicator" />
                </span>

                <span className="mobile-dock-label">
                  {
                    item.label
                  }
                </span>
              </button>
            );
          },
        )}
      </nav>
    </div>
  );
}