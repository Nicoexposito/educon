'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { processEmailQueue } from "@/lib/email-service";

async function uploadEventImage(supabase: any, imageFile: File): Promise<string> {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
        .from('events-images')
        .upload(fileName, imageFile);
    if (uploadError) throw new Error('Error al subir la imagen');
    const { data: { publicUrl } } = supabase.storage
        .from('events-images')
        .getPublicUrl(fileName);
    return publicUrl;
}

export async function createEvent(formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
        return { success: false, error: 'Unauthorized' };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const start_time = formData.get('start_time') as string;
    const end_time = formData.get('end_time') as string;
    const type = formData.get('type') as string;
    const location = formData.get('location') as string;
    const imageFile = formData.get('image') as File | null;
    const subject_id = formData.get('subject_id') as string;

    if (!title || !start_time || !end_time) {
        return { success: false, error: 'Título, fecha de inicio y fin son obligatorios' };
    }

    const supabase = await createClient();
    const { data: user } = await supabase.from('users').select('institute_id').eq('id', session.userId).single();
    if (!user?.institute_id) return { success: false, error: 'Instituto no encontrado' };

    let image_url: string | null = null;
    try {
        if (imageFile && imageFile.size > 0) image_url = await uploadEventImage(supabase, imageFile);
    } catch (e: any) {
        return { success: false, error: e.message };
    }

    const { error } = await supabase.from('events').insert({
        title,
        description: description || null,
        start_time,
        end_time,
        type: type || 'general',
        location: location || null,
        image_url,
        subject_id: subject_id || null,
        institute_id: user.institute_id,
        created_by: session.userId,
    });

    if (error) {
        console.error("Create event error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/events');
    await processEmailQueue({ limit: 25 });
    return { success: true };
}

export async function updateEvent(eventId: string, formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
        return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
        .from('events')
        .select('id, created_by, image_url')
        .eq('id', eventId)
        .single();

    if (!existing) return { success: false, error: 'Evento no encontrado' };
    if (existing.created_by !== null && existing.created_by !== session.userId) {
        return { success: false, error: 'No tienes permiso para editar este evento' };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const start_time = formData.get('start_time') as string;
    const end_time = formData.get('end_time') as string;
    const type = formData.get('type') as string;
    const location = formData.get('location') as string;
    const imageFile = formData.get('image') as File | null;
    const subject_id = formData.get('subject_id') as string;

    if (!title || !start_time || !end_time) {
        return { success: false, error: 'Título, fecha de inicio y fin son obligatorios' };
    }

    let image_url: string | null = existing.image_url ?? null;
    try {
        if (imageFile && imageFile.size > 0) image_url = await uploadEventImage(supabase, imageFile);
    } catch (e: any) {
        return { success: false, error: e.message };
    }

    const { error } = await supabase.from('events').update({
        title,
        description: description || null,
        start_time,
        end_time,
        type: type || 'general',
        location: location || null,
        image_url,
        subject_id: subject_id || null,
    }).eq('id', eventId);

    if (error) {
        console.error("Update event error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/events');
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
}

export async function getAllEvents() {
    const session = await getSession();
    if (!session) return [];
    const supabase = await createClient();
    const { data } = await supabase
        .from('events')
        .select('*')
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });
    return data || [];
}

export async function getEventById(eventId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
    return data;
}

export async function deleteEvent(eventId: string) {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
        return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Verify ownership before deleting
    const { data: existing } = await supabase
        .from('events')
        .select('created_by')
        .eq('id', eventId)
        .single();

    if (!existing) return { success: false, error: 'Evento no encontrado' };
    if (existing.created_by !== null && existing.created_by !== session.userId) {
        return { success: false, error: 'No tienes permiso para eliminar este evento' };
    }

    const { error } = await supabase.from('events').delete().eq('id', eventId);

    if (error) {
        console.error("Delete event error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/events');
    return { success: true };
}
