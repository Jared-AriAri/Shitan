import { supabase } from '../lib/supabase';

export async function signIn(
    email: string,
    password: string,
) {
    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password,
        });

    if (error) {
        throw error;
    }

    return data;
}

export async function signUp(
    email: string,
    password: string,
    fullName: string,
) {
    const { data, error } =
        await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

    if (error) {
        throw error;
    }

    return data;
}

export async function signOut() {
    const { error } =
        await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}

export async function getSession() {
    const { data, error } =
        await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    return data.session;
}

export async function getCurrentProfile() {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        throw error;
    }

    return data;
}