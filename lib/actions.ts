"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// --- Assignments ---

export async function createAssignment(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const due_date = formData.get("due_date") as string;
    const subject_id = formData.get("subject_id") as string;
    const teacher_id = formData.get("teacher_id") as string;

    const { error } = await supabase.from("assignments").insert({
        title,
        description,
        due_date,
        subject_id,
        teacher_id,
    });

    if (error) {
        console.error("Error creating assignment:", error);
        throw new Error("Failed to create assignment");
    }

    revalidatePath(`/dashboard/subjects/${subject_id}`);
}

export async function submitAssignment(formData: FormData) {

    const assignment_id = formData.get("assignment_id") as string;
    const student_id = formData.get("student_id") as string;
    const content = formData.get("content") as string; // Or handle file upload logic separately

    const { error } = await supabase.from("submissions").insert({
        assignment_id,
        student_id,
        content,
    });

    if (error) {
        console.error("Error submitting assignment:", error);
        throw new Error("Failed to submit assignment");
    }

    revalidatePath("/dashboard/assignments");
}

export async function gradeSubmission(submissionId: string, grade: number, feedback: string) {

    const { error } = await supabase.from("submissions").update({
        grade,
        feedback
    }).eq("id", submissionId);

    if (error) {
        console.error("Error grading submission:", error);
        throw new Error("Failed to grade submission");
    }

    revalidatePath("/dashboard/assignments");
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
