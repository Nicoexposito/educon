'use server'

import { supabase } from "@/lib/supabase";
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from "@/lib/session";

export async function logout() {
    await deleteSession();
}

export async function searchInstitutes(query: string) {
    if (!query) return [];

    const { data } = await supabase
        .from('institutes')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(5);

    return data || [];
}

export async function checkInstituteExists(name: string) {
    const { count } = await supabase
        .from('institutes')
        .select('*', { count: 'exact', head: true })
        .eq('name', name);

    return count ? count > 0 : false;
}

export async function authenticateUser(email: string, password: string, instituteName: string) {
    // 1. Get Institute ID
    const { data: institute } = await supabase
        .from('institutes')
        .select('id')
        .eq('name', instituteName)
        .single();

    if (!institute) return { success: false, error: 'Institut not found' };

    // 2. Check User credentials
    const { data: user } = await supabase
        .from('users')
        .select('id, password, role')
        .eq('email', email)
        .eq('institute_id', institute.id)
        .single();

    if (user && await bcrypt.compare(password, user.password)) {
        await createSession(user.id, user.role);
        return { success: true };
    } else {
        return { success: false, error: 'Invalid credentials' };
    }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    // 1. Get current hash
    const { data: user } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

    if (!user) return { success: false, error: 'Usuario no encontrado.' };

    // 2. Check current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return { success: false, error: 'La contraseña actual es incorrecta.' };

    // 3. Hash new password & update
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', userId);

    if (error) return { success: false, error: 'Error al actualizar la contraseña.' };

    return { success: true };
}

export async function updateProfile(userId: string, fullName: string) {
    if (!fullName || fullName.trim().length < 2) {
        return { success: false, error: 'El nombre debe tener al menos 2 caracteres.' };
    }

    const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', userId);

    if (error) return { success: false, error: 'Error al actualizar el perfil.' };

    return { success: true };
}
