'use server'

import { supabase as legacySupabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { createSession, deleteSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    await deleteSession(); // Keep old session as fallback cleanup
}

export async function searchInstitutes(query: string) {
    if (!query) return [];

    const { data } = await legacySupabase
        .from('institutes')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(5);

    return data || [];
}

export async function checkInstituteExists(name: string) {
    const { count } = await legacySupabase
        .from('institutes')
        .select('*', { count: 'exact', head: true })
        .eq('name', name);

    return count ? count > 0 : false;
}

export async function authenticateUser(email: string, password: string, instituteName: string) {
    // 1. Get Institute ID
    const { data: institute } = await legacySupabase
        .from('institutes')
        .select('id')
        .eq('name', instituteName)
        .single();

    if (!institute) return { success: false, error: 'Institut no trobat' };

    // 2. We use Supabase Auth to check the password (this replaces the old bcrypt check)
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError || !authData.user) {
        return { success: false, error: 'Credencials incorrectes' };
    }

    // 3. Verify user belongs to the specified institute
    const { data: user } = await supabase
        .from('users')
        .select('id, role, institute_id')
        .eq('id', authData.user.id)
        .single();

    if (!user || user.institute_id !== institute.id) {
        await supabase.auth.signOut();
        return { success: false, error: "L'usuari no pertany a aquest institut" };
    }

    // Keep backwards compatibility with our custom session if other components still rely on it
    await createSession(user.id, user.role);

    return { success: true };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'La contrasenya ha de tenir com a mínim 6 caràcters.' };
    }

    const supabase = await createClient();

    // We attempt to sign in to verify current password
    // NOTE: This assumes the user's email is needed, we should fetch it first.
    const { data: userRecord } = await supabase.from('users').select('email').eq('id', userId).single();
    if (!userRecord) return { success: false, error: 'Usuari no trobat.' };

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userRecord.email,
        password: currentPassword
    });

    if (signInError) return { success: false, error: 'La contrasenya actual és incorrecta.' };

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (updateError) return { success: false, error: 'Error en actualitzar la contrasenya.' };

    return { success: true };
}

export async function updateProfile(userId: string, fullName: string) {
    if (!fullName || fullName.trim().length < 2) {
        return { success: false, error: 'El nom ha de tenir com a mínim 2 caràcters.' };
    }

    const supabase = await createClient();

    // Verify the user has a valid Supabase Auth session (not just the fallback cookie)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
        return {
            success: false,
            error: 'Sessió obsoleta. Si us plau, tanca la sessió i torna a entrar per desar els canvis.'
        };
    }

    const { data, error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', userId)
        .select()
        .single();

    if (error || !data) {
        console.error("Update profile error:", error);
        return { success: false, error: 'Error en actualitzar el perfil.' };
    }

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard');

    return { success: true };
}

export async function updateEmailPreferences(userId: string, emailPreferences: Record<string, boolean>, emailNotifications: boolean) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
        return {
            success: false,
            error: 'Sessió obsoleta. Si us plau, tanca la sessió i torna a entrar per desar els canvis.'
        };
    }

    const { data: currentUser } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single();

    const currentPreferences = currentUser?.preferences || {};
    const nextPreferences = {
        ...currentPreferences,
        emailNotifications,
        email: {
            ...(currentPreferences.email || {}),
            ...emailPreferences,
        },
    };

    const { error } = await supabase
        .from('users')
        .update({ preferences: nextPreferences })
        .eq('id', userId);

    if (error) {
        console.error("Update email preferences error:", error);
        return { success: false, error: 'Error en actualitzar les preferències de correu.' };
    }

    revalidatePath('/dashboard/profile');
    return { success: true };
}
