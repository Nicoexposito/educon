"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
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

export async function updateAssignment(input: {
    assignmentId: string;
    title: string;
    description?: string;
    due_date: string;
    late_due_date?: string | null;
    subject_id: string;
}) {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
        return { success: false, error: "No tens permisos per modificar aquesta tasca." };
    }

    if (!input.assignmentId || !input.title || !input.due_date || !input.subject_id) {
        return { success: false, error: "Falten camps obligatoris." };
    }

    const service = createAdminClient();

    const { data: assignment, error: fetchError } = await service
        .from("assignments")
        .select("id, teacher_id, subject_id")
        .eq("id", input.assignmentId)
        .single();

    if (fetchError || !assignment) {
        console.error("Error fetching assignment for update:", fetchError);
        return { success: false, error: "No s'ha trobat la tasca." };
    }

    if (assignment.teacher_id !== session.userId) {
        return { success: false, error: "No pots modificar una tasca que no és teva." };
    }

    const { data: subject, error: subjectError } = await service
        .from("subjects")
        .select("id, teacher_id")
        .eq("id", input.subject_id)
        .single();

    if (subjectError || !subject || subject.teacher_id !== session.userId) {
        return { success: false, error: "No pots moure la tasca a una assignatura que no és teva." };
    }

    const { error } = await service
        .from("assignments")
        .update({
            title: input.title.trim(),
            description: input.description?.trim() || null,
            due_date: input.due_date,
            late_due_date: input.late_due_date || null,
            subject_id: input.subject_id,
        })
        .eq("id", input.assignmentId)
        .eq("teacher_id", session.userId as string);

    if (error) {
        console.error("Error updating assignment:", error);
        return { success: false, error: "Error en modificar la tasca." };
    }

    revalidatePath("/dashboard/assignments");
    revalidatePath(`/dashboard/assignments/${input.assignmentId}`);
    revalidatePath(`/dashboard/subjects/${assignment.subject_id}`);
    revalidatePath(`/dashboard/subjects/${input.subject_id}`);
    return { success: true };
}

export async function deleteAssignment(assignmentId: string) {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
        return { success: false, error: "No tens permisos per eliminar aquesta tasca." };
    }

    if (!assignmentId) {
        return { success: false, error: "Falta l'identificador de la tasca." };
    }

    const service = createAdminClient();

    const { data: assignment, error: fetchError } = await service
        .from("assignments")
        .select("id, teacher_id, subject_id")
        .eq("id", assignmentId)
        .single();

    if (fetchError || !assignment) {
        console.error("Error fetching assignment for delete:", fetchError);
        return { success: false, error: "No s'ha trobat la tasca." };
    }

    if (assignment.teacher_id !== session.userId) {
        return { success: false, error: "No pots eliminar una tasca que no és teva." };
    }

    const { error: submissionsError } = await service
        .from("submissions")
        .delete()
        .eq("assignment_id", assignmentId);

    if (submissionsError) {
        console.error("Error deleting assignment submissions:", submissionsError);
        return { success: false, error: "No s'han pogut eliminar els lliuraments de la tasca." };
    }

    const { error } = await service
        .from("assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("teacher_id", session.userId as string);

    if (error) {
        console.error("Error deleting assignment:", error);
        return { success: false, error: "Error en eliminar la tasca." };
    }

    revalidatePath("/dashboard/assignments");
    revalidatePath(`/dashboard/subjects/${assignment.subject_id}`);
    return { success: true };
}

export async function submitAssignment(formData: FormData) {
    const supabase = await createClient();
    const assignment_id = formData.get("assignment_id") as string;
    const student_id = formData.get("student_id") as string;
    const studentComment = ((formData.get("content") as string | null) || "").trim();
    const submittedUrl = getHttpUrl(studentComment);
    let file_url: string | null = submittedUrl;
    let student_comment: string | null = studentComment && !submittedUrl ? studentComment : null;
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
        student_comment = studentComment || null;
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
            student_comment,
            status: "submitted",
            submitted_at: new Date().toISOString()
        }).eq('id', existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from("submissions").insert({
            assignment_id,
            student_id,
            file_url,
            student_comment,
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

type AIGradeResult = {
    submissionId?: string;
    studentName?: string;
    grade: number;
    shouldReturn: boolean;
    teacherComment: string;
    studentFeedback: string;
    confidence: "low" | "medium" | "high";
};

type AIGradeResponse =
    | ({ success: true } & AIGradeResult & { justification: string })
    | { success: false; error: string };

type AIFeedbackLanguage = "ca" | "es" | "en";

type GeminiPart =
    | { text: string }
    | { inline_data: { mime_type: string; data: string } };

type ResolvedSubmission = {
    submissionId: string;
    studentName: string;
    content: string;
    studentComment?: string;
    fileAttached: boolean;
    sourceUrl?: string;
    attachmentError?: string;
    attachment?: {
        mimeType: string;
        data: string;
    };
};

const MAX_INLINE_FILE_BYTES = 12 * 1024 * 1024;

type AIGradeSubmissionInput = {
    submissionId: string;
    studentName: string;
    content: string;
    fileUrl?: string | null;
    studentComment?: string | null;
};

export async function aiGradeEstimate(content: string, criteria: string, feedbackLanguage: AIFeedbackLanguage = "ca", studentComment?: string | null): Promise<AIGradeResponse> {
    const result = await generateGeminiGrade({
        assignmentTitle: "Treball",
        criteria,
        feedbackLanguage,
        submissions: [{
            submissionId: "single",
            studentName: "Alumne",
            content,
            fileUrl: getHttpUrl(content),
            studentComment,
        }],
    });

    if (!result.success) return result;

    const first = result.results[0];
    return {
        success: true,
        ...first,
        justification: first.studentFeedback,
    };
}

export async function aiGradeSubmissionsBatch(input: {
    assignmentTitle: string;
    assignmentDescription?: string | null;
    subjectName?: string | null;
    feedbackLanguage?: AIFeedbackLanguage;
    submissions: AIGradeSubmissionInput[];
}): Promise<{ success: true; results: AIGradeResult[] } | { success: false; error: string }> {
    if (!input.submissions.length) {
        return { success: false, error: "No hi ha lliuraments pendents per analitzar." };
    }

    return generateGeminiGrade({
        assignmentTitle: input.assignmentTitle,
        criteria: [
            input.subjectName ? `Assignatura: ${input.subjectName}` : "",
            input.assignmentDescription ? `Descripció i criteris: ${input.assignmentDescription}` : "Criteris generals de qualitat acadèmica.",
        ].filter(Boolean).join("\n"),
        feedbackLanguage: input.feedbackLanguage || "ca",
        submissions: input.submissions,
    });
}

async function generateGeminiGrade(input: {
    assignmentTitle: string;
    criteria: string;
    feedbackLanguage: AIFeedbackLanguage;
    submissions: AIGradeSubmissionInput[];
}): Promise<{ success: true; results: AIGradeResult[] } | { success: false; error: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { success: false, error: "Falta GEMINI_API_KEY al fitxer .env del servidor." };
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    try {
        const resolvedSubmissions = await Promise.all(input.submissions.map(resolveSubmissionForGemini));
        const prompt = buildGradePrompt({
            assignmentTitle: input.assignmentTitle,
            criteria: input.criteria,
            feedbackLanguage: input.feedbackLanguage,
            submissions: resolvedSubmissions.map(({ attachment, ...submission }) => submission),
        });
        const parts = buildGeminiParts(prompt, resolvedSubmissions);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts,
                }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini grading error:", errorText);
            return { success: false, error: "Gemini no ha pogut generar la correcció." };
        }

        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join("") || "";
        const parsed = parseGeminiJson(text);
        const results = normalizeAIResults(parsed?.results, input.submissions);

        if (!results.length) {
            return { success: false, error: "La IA no ha retornat cap correcció vàlida." };
        }

        return { success: true, results };
    } catch (error) {
        console.error("Gemini grading exception:", error);
        return { success: false, error: "Error en contactar amb Gemini." };
    }
}

async function resolveSubmissionForGemini(submission: AIGradeSubmissionInput): Promise<ResolvedSubmission> {
    const content = submission.content || "";
    const url = submission.fileUrl || getHttpUrl(content);
    const studentComment = submission.studentComment?.trim() || (!url ? content.trim() : "");
    const commentBlock = studentComment ? `\n\nComentari de l'alumne:\n${studentComment}` : "";

    if (!url) {
        return {
            ...submission,
            content: studentComment || content,
            studentComment: studentComment || undefined,
            fileAttached: false,
        };
    }

    const file = await downloadSubmissionFile(url);
    if (!file.success) {
        return {
            ...submission,
            content: `El lliurament és una URL, però el servidor no ha pogut descarregar el fitxer.${commentBlock}`,
            studentComment: studentComment || undefined,
            sourceUrl: url,
            fileAttached: false,
            attachmentError: file.error,
        };
    }

    if (file.bytes.length > MAX_INLINE_FILE_BYTES) {
        return {
            ...submission,
            content: `El lliurament és un fitxer massa gran per adjuntar-lo directament a Gemini.${commentBlock}`,
            studentComment: studentComment || undefined,
            sourceUrl: url,
            fileAttached: false,
            attachmentError: "Fitxer massa gran per a l'anàlisi inline.",
        };
    }

    if (isPdfFile(file.bytes, file.mimeType, url)) {
        return {
            ...submission,
            content: `PDF adjuntat al missatge de Gemini. Has de corregir el contingut del PDF, no només aquesta URL.${commentBlock}`,
            studentComment: studentComment || undefined,
            sourceUrl: url,
            fileAttached: true,
            attachment: {
                mimeType: "application/pdf",
                data: Buffer.from(file.bytes).toString("base64"),
            },
        };
    }

    if (file.mimeType.startsWith("text/") || file.mimeType.includes("json") || file.mimeType.includes("xml")) {
        return {
            ...submission,
            content: `${new TextDecoder().decode(file.bytes).slice(0, 80000)}${commentBlock}`,
            studentComment: studentComment || undefined,
            sourceUrl: url,
            fileAttached: false,
        };
    }

    return {
        ...submission,
        content: `El lliurament és un fitxer, però no és un PDF ni text llegible compatible amb aquesta correcció automàtica.${commentBlock}`,
        studentComment: studentComment || undefined,
        sourceUrl: url,
        fileAttached: false,
        attachmentError: `Tipus no compatible: ${file.mimeType || "desconegut"}`,
    };
}

function buildGeminiParts(prompt: string, submissions: ResolvedSubmission[]): GeminiPart[] {
    const parts: GeminiPart[] = [{ text: prompt }];

    for (const submission of submissions) {
        if (!submission.attachment) continue;

        parts.push({
            text: `PDF del lliurament ${submission.submissionId}, alumne ${submission.studentName}. Corregeix aquest fitxer per aquest submissionId.`,
        });
        parts.push({
            inline_data: {
                mime_type: submission.attachment.mimeType,
                data: submission.attachment.data,
            },
        });
    }

    return parts;
}

function getHttpUrl(value: string) {
    try {
        const url = new URL(value.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        return url.toString();
    } catch {
        return null;
    }
}

async function downloadSubmissionFile(url: string): Promise<{ success: true; bytes: Uint8Array; mimeType: string } | { success: false; error: string }> {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            return {
                success: true,
                bytes: new Uint8Array(buffer),
                mimeType: normalizeMimeType(response.headers.get("content-type") || inferMimeTypeFromUrl(url)),
            };
        }
    } catch (error) {
        console.error("Submission URL fetch failed, trying storage fallback:", error);
    }

    const storageFile = await downloadSupabaseStorageFile(url);
    if (storageFile.success) return storageFile;

    return { success: false, error: storageFile.error };
}

async function downloadSupabaseStorageFile(url: string): Promise<{ success: true; bytes: Uint8Array; mimeType: string } | { success: false; error: string }> {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: "No hi ha service role per descarregar fitxers privats de Supabase Storage." };
    }

    const storagePath = parseSupabaseStoragePath(url);
    if (!storagePath) {
        return { success: false, error: "La URL no sembla un fitxer de Supabase Storage." };
    }

    try {
        const service = createAdminClient();
        const { data, error } = await service.storage
            .from(storagePath.bucket)
            .download(storagePath.path);

        if (error || !data) {
            return { success: false, error: error?.message || "No s'ha pogut descarregar el fitxer del bucket." };
        }

        const buffer = await data.arrayBuffer();
        return {
            success: true,
            bytes: new Uint8Array(buffer),
            mimeType: normalizeMimeType(data.type || inferMimeTypeFromUrl(url)),
        };
    } catch (error) {
        console.error("Supabase Storage fallback failed:", error);
        return { success: false, error: "Error descarregant el fitxer del bucket." };
    }
}

function parseSupabaseStoragePath(url: string) {
    try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split("/").filter(Boolean);
        const objectIndex = parts.findIndex((part) => part === "object");
        if (objectIndex === -1) return null;

        const visibility = parts[objectIndex + 1];
        if (visibility !== "public" && visibility !== "sign" && visibility !== "authenticated") return null;

        const bucket = parts[objectIndex + 2];
        const path = parts.slice(objectIndex + 3).map(decodeURIComponent).join("/");
        if (!bucket || !path) return null;

        return { bucket, path };
    } catch {
        return null;
    }
}

function normalizeMimeType(mimeType: string) {
    return mimeType.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

function inferMimeTypeFromUrl(url: string) {
    try {
        const pathname = new URL(url).pathname.toLowerCase();
        if (pathname.endsWith(".pdf")) return "application/pdf";
        if (pathname.endsWith(".txt")) return "text/plain";
        if (pathname.endsWith(".md")) return "text/markdown";
        if (pathname.endsWith(".json")) return "application/json";
        if (pathname.endsWith(".html")) return "text/html";
    } catch {
        return "application/octet-stream";
    }
    return "application/octet-stream";
}

function isPdfFile(bytes: Uint8Array, mimeType: string, url: string) {
    const header = Buffer.from(bytes.slice(0, 4)).toString("utf8");
    return mimeType === "application/pdf" || header === "%PDF" || inferMimeTypeFromUrl(url) === "application/pdf";
}

function buildGradePrompt(input: {
    assignmentTitle: string;
    criteria: string;
    feedbackLanguage: AIFeedbackLanguage;
    submissions: Array<{
        submissionId: string;
        studentName: string;
        content: string;
    }>;
}) {
    const feedbackLanguage = getAIFeedbackLanguageInstruction(input.feedbackLanguage);

    return `
Ets un assistent de correcció per a professorat d'institut.
Corregeix els lliuraments segons els criteris. Si un lliurament indica "fileAttached": true, el PDF real està adjuntat en aquest mateix missatge i l'has de llegir i avaluar.
No diguis que no pots accedir a l'enllaç quan el PDF està adjunt. Només indica falta d'accés si "attachmentError" existeix o "fileAttached" és false i no hi ha contingut suficient.
Idioma obligatori de resposta: ${feedbackLanguage}. Escriu teacherComment i studentFeedback en aquest idioma, sense barrejar idiomes.

Treball: ${input.assignmentTitle}
Criteris:
${input.criteria}

Lliuraments:
${JSON.stringify(input.submissions, null, 2)}

Retorna NOMÉS JSON vàlid amb aquesta forma:
{
  "results": [
    {
      "submissionId": "id exacte rebut",
      "studentName": "nom",
      "grade": 0-10,
      "shouldReturn": true/false,
      "confidence": "low" | "medium" | "high",
      "teacherComment": "Comentari tècnic per al professor en l'idioma obligatori: criteris aplicats, dubtes, riscos i què revisar abans de confirmar. No és per a l'alumne.",
      "studentFeedback": "Comentari directe per a l'alumne en l'idioma obligatori. Ha de dir què ha fet mal, què ha de corregir i com millorar-ho. No incloguis advertències sobre IA."
    }
  ]
}

Regles:
- teacherComment és privat per al professor.
- studentFeedback és el text que veurà l'alumne; ha de ser concret, útil i directe.
- Respecta sempre l'idioma obligatori de resposta: ${feedbackLanguage}.
- Si el lliurament no conté contingut suficient per corregir, posa confidence "low", una nota prudent i shouldReturn true.
- Si està prou bé per qualificar, shouldReturn false.
- Nota amb un decimal com a màxim.
`.trim();
}

function getAIFeedbackLanguageInstruction(language: AIFeedbackLanguage) {
    if (language === "es") return "castellano";
    if (language === "en") return "inglés";
    return "català";
}

function parseGeminiJson(text: string) {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
}

function normalizeAIResults(results: any, submissions: Array<{ submissionId: string; studentName: string }>): AIGradeResult[] {
    if (!Array.isArray(results)) return [];

    const allowedIds = new Set(submissions.map((submission) => submission.submissionId));
    return results
        .filter((item) => allowedIds.has(String(item?.submissionId)))
        .map((item) => {
            const gradeNumber = Number(item.grade);
            const grade = Number.isFinite(gradeNumber) ? Math.min(10, Math.max(0, Math.round(gradeNumber * 10) / 10)) : 0;
            return {
                submissionId: String(item.submissionId),
                studentName: String(item.studentName || submissions.find((submission) => submission.submissionId === item.submissionId)?.studentName || "Alumne"),
                grade,
                shouldReturn: Boolean(item.shouldReturn),
                confidence: ["low", "medium", "high"].includes(item.confidence) ? item.confidence : "medium",
                teacherComment: String(item.teacherComment || "Revisa aquesta proposta abans de confirmar."),
                studentFeedback: String(item.studentFeedback || "Has de revisar el lliurament i corregir els punts indicats pel professor."),
            } satisfies AIGradeResult;
        });
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
