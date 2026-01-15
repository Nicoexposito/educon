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
        .select('password, role')
        .eq('email', email)
        .eq('institute_id', institute.id)
        .single();

    if (user && await bcrypt.compare(password, user.password)) {
        await createSession(user.role);
        return { success: true };
    } else {
        return { success: false, error: 'Invalid credentials' };
    }
}
