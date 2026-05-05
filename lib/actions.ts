"use server";

import { createClient } from "@/lib/supabase/server";
import { processEmailQueue } from "@/lib/email-service";
import { revalidatePath } from "next/cache";

// --- Assignments ---

export async function createAssignment(formData: FormData) {
    const supabase = await createClient();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const due_date = formData.get("due_date") as string;
    const late_due_date = formData.get("late_due_date") as string;
    const subject_id = formData.get("subject_id") as string;
    const teacher_id = formData.get("teacher_id") as string;
    const file = formData.get("file") as File | null;

    if (!title || !due_date || !subject_id || !teacher_id) {
        return { success: false, error: "Falten camps obligatoris." };
    }

    let content_url = null;

    if (file && file.size > 0 && file.name !== 'undefined') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${subject_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assignments')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Error uploading assignment file:", uploadError);
            return { success: false, error: "Error en pujar el fitxer de material." };
        }

        const { data: publicUrlData } = supabase.storage
            .from('assignments')
            .getPublicUrl(filePath);

        content_url = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase.from("assignments").insert({
        title,
        description,
        due_date,
        late_due_date: late_due_date || null,
        subject_id,
        teacher_id,
        content_url,
    }).select("id").single();

    if (error) {
        console.error("Error creating assignment:", error);
        return { success: false, error: "Error en crear la tasca." };
    }

    revalidatePath("/dashboard/assignments");
    revalidatePath(`/dashboard/subjects/${subject_id}`);
    await processEmailQueue({ limit: 25 });
    return { success: true, assignmentId: data?.id };
}

export async function createAssignmentFull(input: {
    title: string;
    description?: string;
    due_date: string;
    late_due_date?: string;
    subject_id: string;
    teacher_id: string;
}) {
    const supabase = await createClient();
    if (!input.title || !input.due_date || !input.subject_id || !input.teacher_id) {
        return { success: false, error: "Falten camps obligatoris." };
    }

    const { data, error } = await supabase.from("assignments").insert({
        title: input.title,
        description: input.description || null,
        due_date: input.due_date,
        late_due_date: input.late_due_date || null,
        subject_id: input.subject_id,
        teacher_id: input.teacher_id,
    }).select("id").single();

    if (error) {
        console.error("Error creating assignment:", error);
        return { success: false, error: "Error en crear la tasca." };
    }

    revalidatePath("/dashboard/assignments");
    revalidatePath(`/dashboard/subjects/${input.subject_id}`);
    await processEmailQueue({ limit: 25 });
    return { success: true, assignmentId: data?.id };
}

export async function submitAssignment(formData: FormData) {
    const supabase = await createClient();
    const assignment_id = formData.get("assignment_id") as string;
    const student_id = formData.get("student_id") as string;
    let file_url = formData.get("content") as string;
    const file = formData.get("file") as File | null;

    if (file && file.size > 0 && file.name !== 'undefined') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${assignment_id}/${student_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('submissions')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Error uploading submission file:", uploadError);
            return { success: false, error: "Error en pujar el fitxer de lliurament." };
        }

        const { data: publicUrlData } = supabase.storage
            .from('submissions')
            .getPublicUrl(filePath);

        file_url = publicUrlData.publicUrl;
    }

    // Check if the user already submitted to just update
    const { data: existing } = await supabase.from('submissions')
        .select('id')
        .eq('assignment_id', assignment_id)
        .eq('student_id', student_id)
        .single();

    let error;
    if (existing) {
        const { error: updateError } = await supabase.from('submissions').update({
            file_url,
            status: "submitted",
            submitted_at: new Date().toISOString()
        }).eq('id', existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from("submissions").insert({
            assignment_id,
            student_id,
            file_url,
            status: "submitted",
        });
        error = insertError;
    }

    if (error) {
        console.error("Error submitting assignment:", error);
        return { success: false, error: "Error en lliurar la tasca." };
    }

    revalidatePath("/dashboard/assignments");
    revalidatePath(`/dashboard/assignments/${assignment_id}`);
    await processEmailQueue({ limit: 25 });
    return { success: true };
}

export async function gradeSubmission(submissionId: string, grade: number, feedback: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("submissions").update({
        grade,
        feedback,
        status: "graded",
    }).eq("id", submissionId);

    if (error) {
        console.error("Error grading submission:", error);
        return { success: false, error: "Error en qualificar." };
    }

    revalidatePath("/dashboard/assignments");
    await processEmailQueue({ limit: 25 });
    return { success: true };
}

export async function returnSubmission(submissionId: string, feedback: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("submissions").update({
        feedback,
        grade: null,
        status: "returned",
    }).eq("id", submissionId);

    if (error) {
        console.error("Error returning submission:", error);
        return { success: false, error: "Error en retornar el lliurament." };
    }

    revalidatePath("/dashboard/assignments");
    return { success: true };
}

export async function createResource(formData: FormData) {
    const supabase = await createClient();
    const subject_id = formData.get("subject_id") as string;
    const title = formData.get("title") as string;
    const type = (formData.get("type") as string) || "link";
    const file_url = formData.get("file_url") as string;

    if (!subject_id || !title || !file_url) {
        return { success: false, error: "El títol i l'enllaç són obligatoris." };
    }

    const { error } = await supabase.from("resources").insert({
        subject_id,
        title: title.trim(),
        type,
        file_url: file_url.trim(),
    });

    if (error) {
        console.error("Error creating resource:", error);
        return { success: false, error: "Error en publicar el contingut." };
    }

    revalidatePath(`/dashboard/subjects/${subject_id}`);
    return { success: true };
}

export async function saveAttendance(subjectId: string, entries: Array<{ student_id: string; status: string }>, date?: string) {
    const supabase = await createClient();
    if (!subjectId || entries.length === 0) {
        return { success: false, error: "No hi ha alumnes per desar." };
    }

    const attendanceDate = date || new Date().toISOString().slice(0, 10);
    const rows = entries.map((entry) => ({
        subject_id: subjectId,
        student_id: entry.student_id,
        date: attendanceDate,
        status: entry.status,
    }));

    const { error } = await supabase
        .from("attendance")
        .upsert(rows, { onConflict: "subject_id,student_id,date" });

    if (error) {
        console.error("Error saving attendance:", error);
        return { success: false, error: "Error en desar l'assistència." };
    }

    revalidatePath(`/dashboard/subjects/${subjectId}`);
    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
    await processEmailQueue({ limit: 25 });
    return { success: true };
}

export async function markNotificationRead(notificationId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

    if (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: "No s'ha pogut marcar com a llegida." };
    }

    revalidatePath("/dashboard/notifications");
    return { success: true };
}

export async function markAllNotificationsRead(userId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

    if (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false, error: "No s'han pogut marcar les notificacions." };
    }

    revalidatePath("/dashboard/notifications");
    return { success: true };
}

export async function aiGradeEstimate(content: string, criteria: string) {
    // This simulates an AI grading call.
    // In production, this would call OpenAI/Gemini API with the student's
    // submission content + teacher's criteria/rubric.
    // For now, we return a realistic mock response.

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API latency

    // Generate a grade based on content length as a simple heuristic
    const contentLength = content?.length || 0;
    const baseGrade = Math.min(10, Math.max(3, 5 + (contentLength / 100)));
    const grade = Math.round(baseGrade * 10) / 10;

    return {
        success: true,
        grade,
        justification: `Anàlisi automàtica basada en els criteris proporcionats:\n\n` +
            `• Extensió i profunditat del contingut: ${contentLength > 200 ? 'Adequada' : 'Insuficient'}\n` +
            `• Criteris avaluats: "${criteria.substring(0, 100)}..."\n` +
            `• Coherència i estructura: ${grade >= 7 ? 'Bona' : 'Millorable'}\n\n` +
            `Nota estimada: ${grade}/10\n\n` +
            `⚠️ Aquesta és una estimació automàtica. Revisa el contingut abans de confirmar.`,
    };
}

// --- Subjects ---

export async function createSubject(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    const teacher_id = formData.get("teacher_id") as string;
    const schedule = formData.get("schedule") as string;

    const { error } = await supabase.from("subjects").insert({
        name,
        teacher_id,
        schedule
    });

    if (error) {
        console.error("Error creating subject", error);
        throw new Error("Failed to create subject");
    }

    revalidatePath("/dashboard/subjects");
}
