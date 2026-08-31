import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Screen, UserRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileScreenProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  navigate: (to: Screen, causeId?: string) => void;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning'
  ) => void;
}

interface ContributionRow {
  id: string;
  causa_id: string;
  tipo: string;
  monto: number | null;
  estado: string;
}

interface ProfileData {
  nombre_completo: string | null;
  alias: string | null;
  telefono: string | null;
  rol: UserRole;
  anonimo_por_defecto: boolean;
  activo: boolean;
  creado_en: string;
}

type IconName =
  | 'user'
  | 'shield'
  | 'mail'
  | 'alias'
  | 'phone'
  | 'privacy'
  | 'status'
  | 'calendar'
  | 'wallet'
  | 'heart'
  | 'check'
  | 'edit'
  | 'arrow'
  | 'save'
  | 'close';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const icons: Record<IconName, ReactNode> = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m5 7 7 5 7-5" />
      </>
    ),
    alias: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M16 12v1a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
      </>
    ),
    phone: (
      <path d="M7 3h3l1.5 4-2 1.5a15 15 0 0 0 6 6l1.5-2 4 1.5v3c0 2.2-1.8 4-4 4C9.3 21 3 14.7 3 7c0-2.2 1.8-4 4-4z" />
    ),
    privacy: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15.5" r="1.4" />
      </>
    ),
    status: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v13H6a3 3 0 0 1-3-3V7" />
        <path d="M20 10h-5a2 2 0 0 0 0 4h5" />
      </>
    ),
    heart: (
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    edit: (
      <>
        <path d="M4 20h4l11-11-4-4L4 16v4z" />
        <path d="m13.5 6.5 4 4" />
      </>
    ),
    arrow: <path d="m9 5 7 7-7 7" />,
    save: (
      <>
        <path d="M5 4h12l2 2v14H5z" />
        <path d="M8 4v6h8V4M8 20v-6h8v6" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
  };

  return <svg {...common}>{icons[name]}</svg>;
}

const roles: Record<
  UserRole,
  {
    label: string;
    description: string;
    color: string;
    soft: string;
    border: string;
    shadow: string;
    gradient: string;
  }
> = {
  donante: {
    label: 'Donante',
    description: 'Puede aportar, consultar su historial y seguir causas.',
    color: '#94A3B8',
    soft: 'rgba(148,163,184,.08)',
    border: 'rgba(148,163,184,.16)',
    shadow: 'rgba(148,163,184,.12)',
    gradient: 'linear-gradient(135deg,#CBD5E1,#64748B)',
  },
  admin: {
    label: 'Administrador',
    description: 'Puede revisar y conciliar aportaciones de la plataforma.',
    color: '#C4A96B',
    soft: 'rgba(196,169,107,.10)',
    border: 'rgba(196,169,107,.24)',
    shadow: 'rgba(196,169,107,.22)',
    gradient: 'linear-gradient(135deg,#E0CB91,#9F7E45)',
  },
  adminmaster: {
    label: 'Administrador Master',
    description: 'Cuenta con acceso administrativo completo.',
    color: '#7DD3FC',
    soft: 'rgba(56,189,248,.10)',
    border: 'rgba(56,189,248,.24)',
    shadow: 'rgba(56,189,248,.20)',
    gradient: 'linear-gradient(135deg,#7DD3FC,#38BDF8)',
  },
};

const getInitials = (name: string) => {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'ST';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
};

export default function ProfileScreen({
  navigate,
  showToast,
}: ProfileScreenProps) {
  const { user, role } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [contributions, setContributions] = useState<ContributionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user?.id) {
        if (mounted) setLoading(false);
        return;
      }

      setLoading(true);

      const [profileRes, contributionsRes] = await Promise.all([
        supabase
          .from('perfiles')
          .select(
            'nombre_completo, alias, telefono, rol, anonimo_por_defecto, activo, creado_en'
          )
          .eq('id', user.id)
          .single(),
        supabase
          .from('aportaciones')
          .select('id, causa_id, tipo, monto, estado')
          .eq('donante_id', user.id),
      ]);

      if (!mounted) return;

      if (profileRes.data) {
        const data = profileRes.data as ProfileData;

        setProfile(data);
        setName(data.nombre_completo || '');
        setAlias(data.alias || '');
        setPhone(data.telefono || '');
        setAnonymous(data.anonimo_por_defecto);
      }

      if (contributionsRes.data) {
        setContributions(contributionsRes.data as ContributionRow[]);
      }

      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const approved = useMemo(
    () => contributions.filter((c) => c.estado === 'aprobada'),
    [contributions]
  );

  const total = useMemo(
    () =>
      approved
        .filter((c) => c.tipo === 'economica')
        .reduce((sum, c) => sum + Number(c.monto || 0), 0),
    [approved]
  );

  const causes = useMemo(
    () => new Set(approved.map((c) => c.causa_id).filter(Boolean)).size,
    [approved]
  );

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
            <Icon name="user" size={32} />
          </div>

          <h2 className="text-lg font-bold text-foreground">
            Sin sesión activa
          </h2>

          <p className="mt-2 text-xs text-muted-foreground">
            Inicia sesión para consultar tu perfil.
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.nombre_completo?.trim() ||
    profile?.alias?.trim() ||
    user.email?.split('@')[0] ||
    'Usuario';

  const currentRole: UserRole = profile?.rol || role;
  const roleInfo = roles[currentRole];

  const roleVars = {
    '--role-accent': roleInfo.color,
    '--role-soft': roleInfo.soft,
    '--role-border': roleInfo.border,
  } as CSSProperties;

  const resetEdit = () => {
    setName(profile?.nombre_completo || '');
    setAlias(profile?.alias || '');
    setPhone(profile?.telefono || '');
    setAnonymous(profile?.anonimo_por_defecto || false);
    setEditing(false);
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      showToast('Ingresa tu nombre completo.', 'warning');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre_completo: name.trim(),
        alias: alias.trim() || null,
        telefono: phone.trim() || null,
        anonimo_por_defecto: anonymous,
      })
      .eq('id', user.id);

    if (error) {
      setSaving(false);
      showToast('No fue posible actualizar tu perfil.', 'error');
      return;
    }

    await supabase.auth.updateUser({
      data: {
        nombre_completo: name.trim(),
        alias: alias.trim() || null,
        telefono: phone.trim() || null,
      },
    });

    setProfile((p) =>
      p
        ? {
          ...p,
          nombre_completo: name.trim(),
          alias: alias.trim() || null,
          telefono: phone.trim() || null,
          anonimo_por_defecto: anonymous,
        }
        : p
    );

    setSaving(false);
    setEditing(false);
    showToast('Perfil actualizado correctamente.', 'success');
  };

  const profileItems = [
    {
      icon: 'mail' as IconName,
      label: 'Correo electrónico',
      value: user.email || 'Sin correo',
    },
    {
      icon: 'alias' as IconName,
      label: 'Alias',
      value: profile?.alias ? `@${profile.alias}` : 'Sin alias',
    },
    {
      icon: 'phone' as IconName,
      label: 'Teléfono',
      value: profile?.telefono || 'Sin teléfono',
    },
    {
      icon: 'privacy' as IconName,
      label: 'Privacidad',
      value: profile?.anonimo_por_defecto
        ? 'Donaciones anónimas'
        : 'Nombre visible',
    },
    {
      icon: 'status' as IconName,
      label: 'Estado de cuenta',
      value: profile?.activo === false ? 'Inactiva' : 'Activa',
    },
    {
      icon: 'calendar' as IconName,
      label: 'Miembro desde',
      value: profile?.creado_en
        ? new Intl.DateTimeFormat('es-MX', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date(profile.creado_en))
        : 'Sin información',
    },
  ];

  return (
    <div
      style={roleVars}
      className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 md:px-6"
    >
      <section className="relative overflow-hidden rounded-3xl bg-card p-5 shadow-xl shadow-black/10 md:p-7">
        {currentRole !== 'donante' && (
          <div
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: roleInfo.soft }}
          />
        )}

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-[#0B132B] transition duration-300 hover:scale-105"
              style={{
                background: roleInfo.gradient,
                boxShadow: `0 12px 35px ${roleInfo.shadow}`,
              }}
            >
              {getInitials(displayName)}
            </div>

            <div>
              <div className="mb-1 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <h1 className="text-xl font-bold text-foreground md:text-2xl">
                  {loading ? 'Cargando...' : displayName}
                </h1>

                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    color: roleInfo.color,
                    background: roleInfo.soft,
                    borderColor: roleInfo.border,
                  }}
                >
                  <Icon name="shield" size={13} />
                  {roleInfo.label}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>

              {profile?.alias && (
                <p
                  className="mt-1 text-xs"
                  style={{
                    color:
                      currentRole === 'donante'
                        ? '#94A3B8'
                        : roleInfo.color,
                  }}
                >
                  @{profile.alias}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:brightness-110 active:scale-[.97]"
            style={{
              color:
                currentRole === 'donante'
                  ? '#CBD5E1'
                  : roleInfo.color,
              background:
                currentRole === 'donante'
                  ? 'rgba(255,255,255,.05)'
                  : roleInfo.soft,
            }}
          >
            <Icon name={editing ? 'close' : 'edit'} size={15} />
            {editing ? 'Cerrar edición' : 'Editar perfil'}
          </button>
        </div>
      </section>

      {editing && (
        <section className="grid gap-4 rounded-2xl bg-card p-5 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Nombre completo
            </span>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border-0 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition focus:ring-1 focus:ring-[var(--role-accent)]"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Alias
            </span>

            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full rounded-xl border-0 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition focus:ring-1 focus:ring-[var(--role-accent)]"
            />
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Teléfono
            </span>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border-0 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition focus:ring-1 focus:ring-[var(--role-accent)]"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/[.03] p-3 md:col-span-2">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4"
              style={{ accentColor: roleInfo.color }}
            />

            <div>
              <p className="text-xs font-medium text-foreground">
                Donar de forma anónima por defecto
              </p>

              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Tu nombre no aparecerá públicamente en tus aportaciones.
              </p>
            </div>
          </label>

          <div className="flex gap-2 md:col-span-2">
            <button
              onClick={resetEdit}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-xs text-muted-foreground transition hover:bg-white/10"
            >
              <Icon name="close" size={14} />
              Cancelar
            </button>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition hover:brightness-110 active:scale-[.98] disabled:opacity-50"
              style={{
                background:
                  currentRole === 'donante'
                    ? '#E2E8F0'
                    : roleInfo.color,
                color: '#0B132B',
              }}
            >
              <Icon name="save" size={14} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </section>
      )}

      <section className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          {
            icon: 'wallet' as IconName,
            label: 'Aportado',
            value: loading ? '—' : `$${total.toLocaleString('es-MX')}`,
            sub: 'MXN',
          },
          {
            icon: 'check' as IconName,
            label: 'Aportaciones',
            value: loading ? '—' : approved.length,
            sub: 'verificadas',
          },
          {
            icon: 'heart' as IconName,
            label: 'Causas',
            value: loading ? '—' : causes,
            sub: 'apoyadas',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="group rounded-2xl bg-card p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white/[.035] md:p-5"
          >
            <div
              className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              style={{
                color:
                  currentRole === 'donante'
                    ? '#94A3B8'
                    : roleInfo.color,
                background:
                  currentRole === 'donante'
                    ? 'rgba(148,163,184,.08)'
                    : roleInfo.soft,
              }}
            >
              <Icon name={item.icon} size={16} />
            </div>

            <p className="text-lg font-bold text-foreground md:text-2xl">
              {item.value}
            </p>

            <p className="mt-1 text-[9px] text-muted-foreground">
              {item.sub}
            </p>

            <p className="text-[10px] font-medium text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <section className="overflow-hidden rounded-2xl bg-card">
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
              Información de perfil
            </p>
          </div>

          <div className="divide-y divide-white/5">
            {profileItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[.025]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    color:
                      currentRole === 'donante'
                        ? '#94A3B8'
                        : roleInfo.color,
                    background:
                      currentRole === 'donante'
                        ? 'rgba(255,255,255,.035)'
                        : roleInfo.soft,
                  }}
                >
                  <Icon name={item.icon} size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-muted-foreground">
                    {item.label}
                  </p>

                  <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
                    {item.value}
                  </p>
                </div>

                <span className="text-slate-600">
                  <Icon name="arrow" size={14} />
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl bg-card p-5"
          style={{
            boxShadow:
              currentRole === 'donante'
                ? undefined
                : `inset 0 0 0 1px ${roleInfo.border}`,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
            Rol de la cuenta
          </p>

          <div className="mt-4 flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                color: roleInfo.color,
                background: roleInfo.soft,
              }}
            >
              <Icon name="shield" size={21} />
            </div>

            <div>
              <p
                className="text-sm font-bold"
                style={{ color: roleInfo.color }}
              >
                {roleInfo.label}
              </p>

              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {roleInfo.description}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[.03] px-3 py-3">
            <span className="text-[10px] text-muted-foreground">
              Estado de la cuenta
            </span>

            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              {profile?.activo === false ? 'Inactiva' : 'Activa'}
            </span>
          </div>

          {(currentRole === 'admin' || currentRole === 'adminmaster') && (
            <button
              onClick={() => navigate('admin')}
              className="mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-xs font-semibold transition-all hover:brightness-125 active:scale-[.98]"
              style={{
                color: roleInfo.color,
                background: roleInfo.soft,
                borderColor: roleInfo.border,
              }}
            >
              <span className="flex items-center gap-2">
                <Icon name="shield" size={16} />
                Panel de Conciliación
              </span>

              <Icon name="arrow" size={15} />
            </button>
          )}
        </section>
      </div>

      <div className="pb-2" />
    </div>
  );
}