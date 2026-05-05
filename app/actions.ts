'use server'

import { supabase as legacySupabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession, deleteSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    await deleteSession(); // Keep old session as fallback cleanup
}

export async function searchInstitutes(query: string) {
    const searchTerm = normalizeInstituteInput(query);
    if (searchTerm.length < 2) return [];

    const { data, error } = await legacySupabase
        .from('institutes')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(8);

    if (error) {
        console.error('searchInstitutes error:', error);
        return [];
    }

    return (data || [])
        .sort((a, b) => {
            const left = rankInstituteName(a.name, searchTerm);
            const right = rankInstituteName(b.name, searchTerm);
            if (left !== right) return left - right;
            return a.name.localeCompare(b.name, 'ca');
        })
        .slice(0, 6);
}

export async function checkInstituteExists(name: string) {
    const instituteName = normalizeInstituteInput(name);
    if (!instituteName) return false;

    const { data, error } = await legacySupabase
        .from('institutes')
        .select('id')
        .eq('name', instituteName)
        .maybeSingle();

    if (error) {
        console.error('checkInstituteExists error:', error);
        return false;
    }

    return Boolean(data);
}

export async function authenticateUser(email: string, password: string, instituteName: string) {
    const cleanInstituteName = normalizeInstituteInput(instituteName);

    // 1. Get Institute ID
    const { data: institute } = await legacySupabase
        .from('institutes')
        .select('id')
        .eq('name', cleanInstituteName)
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
        .select('id, role, institute_id, is_active, must_change_password')
        .eq('id', authData.user.id)
        .single();

    if (!user || user.institute_id !== institute.id) {
        await supabase.auth.signOut();
        return { success: false, error: "L'usuari no pertany a aquest institut" };
    }

    if (user.is_active === false) {
        await supabase.auth.signOut();
        return { success: false, error: "Aquest compte està desactivat" };
    }

    // Keep backwards compatibility with our custom session if other components still rely on it
    await createSession(user.id, user.role);

    return { success: true, mustChangePassword: Boolean(user.must_change_password) };
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

    const admin = createAdminClient();
    await admin
        .from('users')
        .update({ must_change_password: false })
        .eq('id', userId);

    return { success: true };
}

function normalizeInstituteInput(value: string) {
    return value
        .trim()
        .replace(/[%_]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 80);
}

function rankInstituteName(name: string, searchTerm: string) {
    const normalizedName = name.toLocaleLowerCase('ca');
    const normalizedTerm = searchTerm.toLocaleLowerCase('ca');

    if (normalizedName === normalizedTerm) return 0;
    if (normalizedName.startsWith(normalizedTerm)) return 1;
    return 2;
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

    const admin = createAdminClient();
    const { data, error } = await admin
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

    const admin = createAdminClient();
    const { error } = await admin
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
