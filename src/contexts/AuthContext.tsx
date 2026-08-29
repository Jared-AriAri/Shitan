import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';

interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    alias: string | null;
    phone: string | null;
    role: UserRole;
    anonymous_default: boolean;
    is_active: boolean;
}

interface ProfileRow {
    id: string;
    nombre_completo: string | null;
    alias: string | null;
    telefono: string | null;
    rol: UserRole;
    anonimo_por_defecto: boolean;
    activo: boolean;
}

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    role: UserRole;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async (currentUser: User | null) => {
        if (!currentUser) {
            setProfile(null);
            return;
        }

        const { data, error } = await supabase
            .from('perfiles')
            .select(
                'id, nombre_completo, alias, telefono, rol, anonimo_por_defecto, activo'
            )
            .eq('id', currentUser.id)
            .single();

        if (error) {
            console.error('Error cargando perfil:', error);
            setProfile(null);
            return;
        }

        const row = data as ProfileRow;

        setProfile({
            id: row.id,
            email: currentUser.email ?? null,
            full_name: row.nombre_completo,
            alias: row.alias,
            phone: row.telefono,
            role: row.rol,
            anonymous_default: row.anonimo_por_defecto,
            is_active: row.activo,
        });
    }, []);

    const refreshProfile = useCallback(async () => {
        await loadProfile(user);
    }, [user, loadProfile]);

    const logout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        setSession(null);
        setUser(null);
        setProfile(null);
    }, []);

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            setLoading(true);

            const {
                data: { session: currentSession },
                error,
            } = await supabase.auth.getSession();

            if (!mounted) return;

            if (error) {
                console.error('Error obteniendo sesión:', error);
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }

            const currentUser = currentSession?.user ?? null;

            setSession(currentSession);
            setUser(currentUser);

            await loadProfile(currentUser);

            if (mounted) setLoading(false);
        };

        initialize();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (!mounted) return;

            const newUser = newSession?.user ?? null;

            setSession(newSession);
            setUser(newUser);

            setTimeout(async () => {
                await loadProfile(newUser);

                if (mounted) setLoading(false);
            }, 0);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [loadProfile]);

    const role: UserRole = profile?.role ?? 'donante';

    const value = useMemo(
        () => ({
            session,
            user,
            profile,
            role,
            loading,
            refreshProfile,
            logout,
        }),
        [
            session,
            user,
            profile,
            role,
            loading,
            refreshProfile,
            logout,
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }

    return context;
}