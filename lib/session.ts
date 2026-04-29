import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { supabase as legacySupabase } from "@/lib/supabase";

const secretKey = process.env.SESSION_SECRET || 'default_secret_key_change_me';
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function createSession(userId: string, role: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ userId, role, expiresAt });

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    });
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

export async function getSession() {
    // 1. First try Supabase Auth
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (user && !error) {
            // Need to fetch user role from legacy db
            const { data: dbUser } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (dbUser) {
                return {
                    userId: user.id,
                    role: dbUser.role
                };
            }
        }
    } catch(e) {
        // Fallback or ignore
    }

    // 2. Fallback to old custom cookie session
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    const payload = await decrypt(session);
    return payload;
}
