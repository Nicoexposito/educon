"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminRole, AnnouncementAudience } from "@/lib/admin-types";

type ActionResult = {
    success: boolean;
    error?: string;
    temporaryPassword?: string;
};

const ADMIN_PATHS = [
    "/dashboard",
    "/dashboard/admin",
    "/dashboard/admin/users",
    "/dashboard/admin/subjects",
    "/dashboard/admin/schedule",
    "/dashboard/admin/announcements",
];

async function requireAdmin() {
    const session = await getSession();
    if (!session) redirect("/");
    if (session.role !== "admin") return null;

    const supabase = await createClient();
    const { data: admin } = await supabase
        .from("users")
        .select("id, institute_id, role, is_active")
        .eq("id", session.userId)
        .single();

    if (!admin?.institute_id || admin.role !== "admin" || admin.is_active === false) {
        return null;
    }

    return {
        userId: session.userId as string,
        instituteId: admin.institute_id as string,
    };
}

function getText(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: string): AdminRole | null {
    return value === "teacher" || value === "student" ? value : null;
}

function normalizeAudience(value: string): AnnouncementAudience {
    if (value === "teachers" || value === "students") return value;
    return "all";
}

function generateTemporaryPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let password = "Educon-";
    for (let i = 0; i < 10; i += 1) {
        password += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return password;
}

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message || fallback : fallback;
}

function revalidateAdminPaths(extraPaths: string[] = []) {
    [...ADMIN_PATHS, ...extraPaths].forEach((path) => revalidatePath(path));
}

async function writeAuditLog(event: string, entityType: string, entityId: string | null, metadata: Record<string, unknown> = {}) {
    const admin = await requireAdmin();
    if (!admin) return;

    try {
        const service = createAdminClient();
        await service.from("admin_audit_log").insert({
            institute_id: admin.instituteId,
            admin_id: admin.userId,
            event,
            entity_type: entityType,
            entity_id: entityId,
            metadata,
        });
    } catch {
        // Audit should never block the user-facing action.
    }
}

export async function createAdminUser(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const fullName = getText(formData, "full_name");
    const email = getText(formData, "email").toLowerCase();
    const phone = getText(formData, "phone");
    const role = normalizeRole(getText(formData, "role"));
    const requestedPassword = getText(formData, "temporary_password");
    const temporaryPassword = requestedPassword || generateTemporaryPassword();

    if (!fullName || !email || !role) {
        return { success: false, error: "Nom, correu i rol són obligatoris." };
    }

    if (temporaryPassword.length < 6) {
        return { success: false, error: "La contrasenya temporal ha de tenir com a mínim 6 caràcters." };
    }

    try {
        const service = createAdminClient();
        const { data: created, error: authError } = await service.auth.admin.createUser({
            email,
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: { full_name: fullName },
            app_metadata: {
                role,
                institute_id: admin.instituteId,
            },
        });

        if (authError || !created.user) {
            return { success: false, error: authError?.message || "No s'ha pogut crear l'usuari." };
        }

        const { error: profileError } = await service.from("users").insert({
            id: created.user.id,
            email,
            full_name: fullName,
            phone: phone || null,
            role,
            institute_id: admin.instituteId,
            is_active: true,
            must_change_password: true,
            created_by: admin.userId,
        });

        if (profileError) {
            await service.auth.admin.deleteUser(created.user.id);
            return { success: false, error: profileError.message };
        }

        await writeAuditLog("user.created", "user", created.user.id, { role, email });
        revalidateAdminPaths();
        return { success: true, temporaryPassword };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "Error de configuració del servei admin.") };
    }
}

export async function updateAdminUser(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const userId = getText(formData, "user_id");
    const fullName = getText(formData, "full_name");
    const email = getText(formData, "email").toLowerCase();
    const phone = getText(formData, "phone");
    const role = normalizeRole(getText(formData, "role"));
    const isActive = getText(formData, "is_active") !== "false";

    if (!userId || !fullName || !email || !role) {
        return { success: false, error: "Falten camps obligatoris." };
    }

    try {
        const service = createAdminClient();
        const { data: existing } = await service
            .from("users")
            .select("id, institute_id")
            .eq("id", userId)
            .single();

        if (!existing || existing.institute_id !== admin.instituteId) {
            return { success: false, error: "Usuari no trobat en aquest institut." };
        }

        const { error: authError } = await service.auth.admin.updateUserById(userId, {
            email,
            user_metadata: { full_name: fullName },
            app_metadata: { role, institute_id: admin.instituteId },
        });

        if (authError) return { success: false, error: authError.message };

        const { error } = await service
            .from("users")
            .update({
                full_name: fullName,
                email,
                phone: phone || null,
                role,
                is_active: isActive,
            })
            .eq("id", userId)
            .eq("institute_id", admin.instituteId);

        if (error) return { success: false, error: error.message };

        await writeAuditLog("user.updated", "user", userId, { role, email, isActive });
        revalidateAdminPaths();
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut actualitzar l'usuari.") };
    }
}

export async function deactivateAdminUser(userId: string): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    try {
        const service = createAdminClient();
        const { error } = await service
            .from("users")
            .update({ is_active: false })
            .eq("id", userId)
            .eq("institute_id", admin.instituteId)
            .in("role", ["teacher", "student"]);

        if (error) return { success: false, error: error.message };

        await writeAuditLog("user.deactivated", "user", userId);
        revalidateAdminPaths();
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut desactivar l'usuari.") };
    }
}

export async function resetTemporaryPassword(userId: string, temporaryPassword?: string): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const nextPassword = temporaryPassword?.trim() || generateTemporaryPassword();
    if (nextPassword.length < 6) {
        return { success: false, error: "La contrasenya temporal ha de tenir com a mínim 6 caràcters." };
    }

    try {
        const service = createAdminClient();
        const { data: existing } = await service
            .from("users")
            .select("id, institute_id")
            .eq("id", userId)
            .single();

        if (!existing || existing.institute_id !== admin.instituteId) {
            return { success: false, error: "Usuari no trobat en aquest institut." };
        }

        const { error: authError } = await service.auth.admin.updateUserById(userId, {
            password: nextPassword,
        });
        if (authError) return { success: false, error: authError.message };

        const { error } = await service
            .from("users")
            .update({ must_change_password: true })
            .eq("id", userId)
            .eq("institute_id", admin.instituteId);

        if (error) return { success: false, error: error.message };

        await writeAuditLog("user.password_reset", "user", userId);
        revalidateAdminPaths();
        return { success: true, temporaryPassword: nextPassword };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut reiniciar la contrasenya.") };
    }
}

export async function createAdminSubject(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const name = getText(formData, "name");
    const category = getText(formData, "category") || "General";
    const description = getText(formData, "description");
    const teacherId = getText(formData, "teacher_id");
    const color = getText(formData, "color") || "#4f46e5";
    const day = getText(formData, "day_of_week");
    const startTime = getText(formData, "start_time");
    const endTime = getText(formData, "end_time");

    if (!name || !teacherId) {
        return { success: false, error: "Nom i professor són obligatoris." };
    }

    try {
        const service = createAdminClient();
        const { data: teacher } = await service
            .from("users")
            .select("id")
            .eq("id", teacherId)
            .eq("institute_id", admin.instituteId)
            .eq("role", "teacher")
            .single();

        if (!teacher) return { success: false, error: "Professor no vàlid." };

        const schedule = day && startTime && endTime ? `${day} ${startTime}-${endTime}` : null;
        const { data: subject, error } = await service
            .from("subjects")
            .insert({
                name,
                category,
                description: description || null,
                teacher_id: teacherId,
                institute_id: admin.instituteId,
                color,
                schedule,
            })
            .select("id")
            .single();

        if (error || !subject) return { success: false, error: error?.message || "No s'ha pogut crear l'assignatura." };

        if (day && startTime && endTime) {
            await service.from("subject_schedules").insert({
                subject_id: subject.id,
                day_of_week: day,
                start_time: startTime,
                end_time: endTime,
            });
        }

        await writeAuditLog("subject.created", "subject", subject.id, { name, teacherId });
        revalidateAdminPaths([`/dashboard/admin/subjects/${subject.id}`, "/dashboard/subjects"]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut crear l'assignatura.") };
    }
}

export async function updateAdminSubject(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const subjectId = getText(formData, "subject_id");
    const name = getText(formData, "name");
    const category = getText(formData, "category") || "General";
    const description = getText(formData, "description");
    const teacherId = getText(formData, "teacher_id");

    if (!subjectId || !name || !teacherId) {
        return { success: false, error: "Falten camps obligatoris." };
    }

    try {
        const service = createAdminClient();
        const { error } = await service
            .from("subjects")
            .update({
                name,
                category,
                description: description || null,
                teacher_id: teacherId,
            })
            .eq("id", subjectId)
            .eq("institute_id", admin.instituteId);

        if (error) return { success: false, error: error.message };

        await writeAuditLog("subject.updated", "subject", subjectId, { name, teacherId });
        revalidateAdminPaths([`/dashboard/admin/subjects/${subjectId}`, `/dashboard/subjects/${subjectId}`]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut actualitzar l'assignatura.") };
    }
}

export async function enrollStudentsInSubject(subjectId: string, studentIds: string[]): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };
    if (!subjectId || studentIds.length === 0) return { success: false, error: "Selecciona com a mínim un alumne." };

    try {
        const service = createAdminClient();
        const { data: subject } = await service
            .from("subjects")
            .select("id")
            .eq("id", subjectId)
            .eq("institute_id", admin.instituteId)
            .single();

        if (!subject) return { success: false, error: "Assignatura no trobada." };

        const { data: students } = await service
            .from("users")
            .select("id")
            .eq("institute_id", admin.instituteId)
            .eq("role", "student")
            .in("id", studentIds);

        const validStudentIds = (students || []).map((student: { id: string }) => student.id);
        if (validStudentIds.length === 0) return { success: false, error: "Cap alumne vàlid." };

        const { error } = await service
            .from("enrollments")
            .upsert(validStudentIds.map((studentId) => ({ subject_id: subjectId, student_id: studentId })), {
                onConflict: "subject_id,student_id",
            });

        if (error) return { success: false, error: error.message };

        await writeAuditLog("subject.students_enrolled", "subject", subjectId, { studentIds: validStudentIds });
        revalidateAdminPaths([`/dashboard/admin/subjects/${subjectId}`, `/dashboard/subjects/${subjectId}`]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'han pogut matricular els alumnes.") };
    }
}

export async function removeStudentFromSubject(subjectId: string, studentId: string): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    try {
        const service = createAdminClient();
        const { data: subject } = await service
            .from("subjects")
            .select("id")
            .eq("id", subjectId)
            .eq("institute_id", admin.instituteId)
            .single();

        if (!subject) return { success: false, error: "Assignatura no trobada." };

        const { error } = await service
            .from("enrollments")
            .delete()
            .eq("subject_id", subjectId)
            .eq("student_id", studentId);

        if (error) return { success: false, error: error.message };

        await writeAuditLog("subject.student_removed", "subject", subjectId, { studentId });
        revalidateAdminPaths([`/dashboard/admin/subjects/${subjectId}`, `/dashboard/subjects/${subjectId}`]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut treure l'alumne.") };
    }
}

export async function updateSubjectSchedule(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const subjectId = getText(formData, "subject_id");
    const day = getText(formData, "day_of_week");
    const startTime = getText(formData, "start_time");
    const endTime = getText(formData, "end_time");

    if (!subjectId || !day || !startTime || !endTime) {
        return { success: false, error: "Assignatura, dia i hores són obligatoris." };
    }

    try {
        const service = createAdminClient();
        const { data: subject } = await service
            .from("subjects")
            .select("id")
            .eq("id", subjectId)
            .eq("institute_id", admin.instituteId)
            .single();

        if (!subject) return { success: false, error: "Assignatura no trobada." };

        const { error } = await service.from("subject_schedules").insert({
            subject_id: subjectId,
            day_of_week: day,
            start_time: startTime,
            end_time: endTime,
        });

        if (error) return { success: false, error: error.message };

        await service
            .from("subjects")
            .update({ schedule: `${day} ${startTime}-${endTime}` })
            .eq("id", subjectId)
            .eq("institute_id", admin.instituteId);

        await writeAuditLog("subject.schedule_added", "subject", subjectId, { day, startTime, endTime });
        revalidateAdminPaths([`/dashboard/admin/subjects/${subjectId}`, "/dashboard/admin/schedule"]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut actualitzar l'horari.") };
    }
}

export async function deleteSubjectSchedule(scheduleId: string, subjectId: string): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    try {
        const service = createAdminClient();
        const { data: subject } = await service
            .from("subjects")
            .select("id")
            .eq("id", subjectId)
            .eq("institute_id", admin.instituteId)
            .single();

        if (!subject) return { success: false, error: "Assignatura no trobada." };

        const { error } = await service
            .from("subject_schedules")
            .delete()
            .eq("id", scheduleId)
            .eq("subject_id", subjectId);

        if (error) return { success: false, error: error.message };

        await writeAuditLog("subject.schedule_deleted", "subject", subjectId, { scheduleId });
        revalidateAdminPaths([`/dashboard/admin/subjects/${subjectId}`, "/dashboard/admin/schedule"]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut eliminar l'horari.") };
    }
}

export async function createAnnouncement(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const title = getText(formData, "title");
    const content = getText(formData, "content");
    const audience = normalizeAudience(getText(formData, "audience"));

    if (!title || !content) {
        return { success: false, error: "Títol i contingut són obligatoris." };
    }

    try {
        const service = createAdminClient();
        const { data: post, error } = await service
            .from("posts")
            .insert({
                title,
                content,
                audience,
                institute_id: admin.instituteId,
                author_id: admin.userId,
            })
            .select("id")
            .single();

        if (error || !post) return { success: false, error: error?.message || "No s'ha pogut publicar l'anunci." };

        const roleFilter = audience === "teachers" ? ["teacher"] : audience === "students" ? ["student"] : ["teacher", "student", "admin"];
        const { data: recipients } = await service
            .from("users")
            .select("id")
            .eq("institute_id", admin.instituteId)
            .eq("is_active", true)
            .in("role", roleFilter);

        if (recipients?.length) {
            await service.from("notifications").insert(
                recipients.map((recipient: { id: string }) => ({
                    user_id: recipient.id,
                    type: "system",
                    message: `${title}: ${content}`,
                })),
            );
        }

        await writeAuditLog("announcement.created", "post", post.id, { audience, title });
        revalidateAdminPaths(["/dashboard/news", "/dashboard/notifications"]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut publicar l'anunci.") };
    }
}
