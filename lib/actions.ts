"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// --- Assignments ---

export async function createAssignmentFull({
    title,
    description,
    due_date,
    late_due_date,
    subject_id,
    teacher_id,
}: {
    title: string;
    description: string;
    due_date: string;
    late_due_date?: string;
    subject_id: string;
    teacher_id: string;
}) {
    if (!title || !due_date || !subject_id || !teacher_id) {
        return { success: false, error: "Faltan campos obligatorios." };
    }

    const { data, error } = await supabase.from("assignments").insert({
        title,
        description,
        due_date,
        late_due_date: late_due_date || null,
        subject_id,
        teacher_id,
    }).select("id").single();

    if (error) {
        console.error("Error creating assignment:", error);
        return { success: false, error: "Error al crear la tarea." };
    }

    revalidatePath("/dashboard/assignments");
    revalidatePath(`/dashboard/subjects/${subject_id}`);
    return { success: true, assignmentId: data?.id };
}

export async function submitAssignment(formData: FormData) {
    const assignment_id = formData.get("assignment_id") as string;
    const student_id = formData.get("student_id") as string;
    const file_url = formData.get("content") as string; // We map 'content' from form to 'file_url'

    const { error } = await supabase.from("submissions").insert({
        assignment_id,
        student_id,
        file_url,
        status: "submitted",
    });

    if (error) {
        console.error("Error submitting assignment:", error);
        return { success: false, error: "Error al entregar la tarea." };
    }

    revalidatePath("/dashboard/assignments");
    return { success: true };
}

export async function gradeSubmission(submissionId: string, grade: number, feedback: string) {
    const { error } = await supabase.from("submissions").update({
        grade,
        feedback,
        status: "graded",
    }).eq("id", submissionId);

    if (error) {
        console.error("Error grading submission:", error);
        return { success: false, error: "Error al calificar." };
    }

    revalidatePath("/dashboard/assignments");
    return { success: true };
}

export async function returnSubmission(submissionId: string, feedback: string) {
    const { error } = await supabase.from("submissions").update({
        feedback,
        grade: null,
        status: "returned",
    }).eq("id", submissionId);

    if (error) {
        console.error("Error returning submission:", error);
        return { success: false, error: "Error al devolver la entrega." };
    }

    revalidatePath("/dashboard/assignments");
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
        justification: `Análisis automático basado en los criterios proporcionados:\n\n` +
            `• Extensión y profundidad del contenido: ${contentLength > 200 ? 'Adecuada' : 'Insuficiente'}\n` +
            `• Criterios evaluados: "${criteria.substring(0, 100)}..."\n` +
            `• Coherencia y estructura: ${grade >= 7 ? 'Buena' : 'Mejorable'}\n\n` +
            `Nota estimada: ${grade}/10\n\n` +
            `⚠️ Esta es una estimación automática. Revisa el contenido antes de confirmar.`,
    };
}

// --- Subjects ---

export async function createSubject(formData: FormData) {
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
