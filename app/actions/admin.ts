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
    "/dashboard/admin/courses",
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

function normalizeOptionalId(value: string) {
    return value || null;
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

function isAuthAlreadyRegistered(message?: string) {
    if (!message) return false;
    return /already (been )?registered|already exists|already.*email/i.test(message);
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

    const assignedInstituteId = admin.instituteId;
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
        const { data: existingProfile, error: existingProfileError } = await service
            .from("users")
            .select("id, institute_id")
            .eq("email", email)
            .maybeSingle();

        if (existingProfileError) {
            return { success: false, error: existingProfileError.message };
        }

        if (existingProfile?.institute_id && existingProfile.institute_id !== assignedInstituteId) {
            return { success: false, error: "Aquest correu ja pertany a un altre centre." };
        }

        const authAttributes = {
            email,
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role,
                institute_id: assignedInstituteId,
            },
            app_metadata: {
                role,
                institute_id: assignedInstituteId,
            },
        };

        let userId: string | null = null;
        let createdAuthUser = false;
        let auditEvent = "user.created";

        if (existingProfile) {
            const { data: created, error: authError } = await service.auth.admin.createUser({
                id: existingProfile.id,
                ...authAttributes,
            });

            if (created.user && !authError) {
                userId = created.user.id;
                createdAuthUser = true;
                auditEvent = "user.repaired";
            } else if (isAuthAlreadyRegistered(authError?.message)) {
                const { data: existingAuth } = await service.auth.admin.getUserById(existingProfile.id);
                if (existingAuth?.user) {
                    if (existingProfile.institute_id === assignedInstituteId) {
                        return { success: false, error: "Aquest correu ja existeix. Fes servir el botó Reset per reiniciar la contrasenya." };
                    }

                    const { error: authUpdateError } = await service.auth.admin.updateUserById(existingProfile.id, authAttributes);
                    if (authUpdateError) return { success: false, error: authUpdateError.message };

                    userId = existingProfile.id;
                    auditEvent = "user.claimed";
                } else {
                    return {
                        success: false,
                        error: "Aquest correu ja existeix a Auth amb un altre identificador. Revisa la llista o reinicia la contrasenya.",
                    };
                }
            } else {
                return { success: false, error: authError?.message || "No s'ha pogut crear l'usuari a Auth." };
            }
        }

        if (!userId) {
            const { data: created, error: authError } = await service.auth.admin.createUser(authAttributes);

            if (authError || !created.user) {
                return {
                    success: false,
                    error: isAuthAlreadyRegistered(authError?.message)
                        ? "Aquest correu ja existeix a l'autenticació. Revisa la llista o reinicia la contrasenya."
                        : authError?.message || "No s'ha pogut crear l'usuari.",
                };
            }

            userId = created.user.id;
            createdAuthUser = true;
            auditEvent = existingProfile ? "user.repaired" : "user.created";
        }

        if (!userId) {
            return { success: false, error: "No s'ha pogut obtenir l'identificador de l'usuari." };
        }

        const { error: profileError } = await service
            .from("users")
            .upsert({
                id: userId,
                email,
                full_name: fullName,
                phone: phone || null,
                role,
                institute_id: assignedInstituteId,
                is_active: true,
                must_change_password: true,
                created_by: admin.userId,
            }, {
                onConflict: "id",
            });

        if (profileError) {
            if (createdAuthUser && userId) {
                await service.auth.admin.deleteUser(userId);
            }
            return {
                success: false,
                error: profileError.code === "23505"
                    ? "Ja existeix un usuari amb aquest correu o identificador."
                    : profileError.message,
            };
        }

        await writeAuditLog(auditEvent, "user", userId, { role, email });
        revalidateAdminPaths();
        return { success: true, temporaryPassword };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "Error de configuració del servei admin.") };
    }
}

export async function updateAdminUser(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const assignedInstituteId = admin.instituteId;
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

        if (!existing || existing.institute_id !== assignedInstituteId) {
            return { success: false, error: "Usuari no trobat en aquest institut." };
        }

        const { error: authError } = await service.auth.admin.updateUserById(userId, {
            email,
            user_metadata: {
                full_name: fullName,
                role,
                institute_id: assignedInstituteId,
            },
            app_metadata: { role, institute_id: assignedInstituteId },
        });

        if (authError) return { success: false, error: authError.message };

        const { error } = await service
            .from("users")
            .update({
                full_name: fullName,
                email,
                phone: phone || null,
                role,
                institute_id: assignedInstituteId,
                is_active: isActive,
            })
            .eq("id", userId)
            .eq("institute_id", assignedInstituteId);

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

export async function activateAdminUser(userId: string): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    try {
        const service = createAdminClient();
        const { error } = await service
            .from("users")
            .update({ is_active: true })
            .eq("id", userId)
            .eq("institute_id", admin.instituteId)
            .in("role", ["teacher", "student"]);

        if (error) return { success: false, error: error.message };

        await writeAuditLog("user.activated", "user", userId);
        revalidateAdminPaths();
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut activar l'usuari.") };
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

export async function updateStudentSubjectEnrollments(studentId: string, subjectIds: string[]): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };
    if (!studentId) return { success: false, error: "Alumne no vàlid." };

    const requestedSubjectIds = Array.from(new Set(subjectIds.filter(Boolean)));

    try {
        const service = createAdminClient();
        const [{ data: student }, { data: subjects, error: subjectsError }] = await Promise.all([
            service
                .from("users")
                .select("id")
                .eq("id", studentId)
                .eq("institute_id", admin.instituteId)
                .eq("role", "student")
                .single(),
            service
                .from("subjects")
                .select("id")
                .eq("institute_id", admin.instituteId),
        ]);

        if (!student) return { success: false, error: "Alumne no trobat en aquest institut." };
        if (subjectsError) return { success: false, error: subjectsError.message };

        const instituteSubjectIds = (subjects || []).map((subject: { id: string }) => subject.id);
        const instituteSubjectSet = new Set(instituteSubjectIds);
        const validSubjectIds = requestedSubjectIds.filter((subjectId) => instituteSubjectSet.has(subjectId));

        if (validSubjectIds.length !== requestedSubjectIds.length) {
            return { success: false, error: "Alguna assignatura no pertany a aquest institut." };
        }

        let currentSubjectIds: string[] = [];
        if (instituteSubjectIds.length > 0) {
            const { data: currentEnrollments, error: currentError } = await service
                .from("enrollments")
                .select("subject_id")
                .eq("student_id", studentId)
                .in("subject_id", instituteSubjectIds);

            if (currentError) return { success: false, error: currentError.message };
            currentSubjectIds = (currentEnrollments || [])
                .map((enrollment: { subject_id: string | null }) => enrollment.subject_id)
                .filter((subjectId): subjectId is string => Boolean(subjectId));
        }

        const selectedSubjectSet = new Set(validSubjectIds);
        const currentSubjectSet = new Set(currentSubjectIds);
        const subjectIdsToAdd = validSubjectIds.filter((subjectId) => !currentSubjectSet.has(subjectId));
        const subjectIdsToRemove = currentSubjectIds.filter((subjectId) => !selectedSubjectSet.has(subjectId));

        if (subjectIdsToRemove.length > 0) {
            const { error: deleteError } = await service
                .from("enrollments")
                .delete()
                .eq("student_id", studentId)
                .is("course_id", null)
                .in("subject_id", subjectIdsToRemove);

            if (deleteError) return { success: false, error: deleteError.message };
        }

        if (subjectIdsToAdd.length > 0) {
            const { error: insertError } = await service
                .from("enrollments")
                .upsert(subjectIdsToAdd.map((subjectId) => ({ subject_id: subjectId, student_id: studentId })), {
                    onConflict: "subject_id,student_id",
                });

            if (insertError) return { success: false, error: insertError.message };
        }

        const affectedSubjectIds = Array.from(new Set([...subjectIdsToAdd, ...subjectIdsToRemove]));
        await writeAuditLog("student.subjects_updated", "user", studentId, { subjectIds: validSubjectIds });
        revalidateAdminPaths([
            "/dashboard/subjects",
            ...affectedSubjectIds.flatMap((subjectId) => [
                `/dashboard/admin/subjects/${subjectId}`,
                `/dashboard/subjects/${subjectId}`,
            ]),
        ]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'han pogut actualitzar les assignatures.") };
    }
}

type CourseTutoringRow = {
    id: string;
    institute_id?: string | null;
    name?: string | null;
    code?: string | null;
    tutor_id?: string | null;
    tutoring_subject_id?: string | null;
};

function tutoringSubjectName(course: CourseTutoringRow) {
    const label = (course.name || course.code || "CURS").trim();
    return `TUTORIA ${label}`.replace(/\s+/g, " ");
}

async function validateCourseTutor(service: ReturnType<typeof createAdminClient>, admin: { instituteId: string }, tutorId: string | null) {
    if (!tutorId) return null;

    const { data: tutor, error } = await service
        .from("users")
        .select("id")
        .eq("id", tutorId)
        .eq("institute_id", admin.instituteId)
        .eq("role", "teacher")
        .eq("is_active", true)
        .maybeSingle();

    if (error) return error.message;
    if (!tutor) return "El tutor ha de ser un professor actiu del centre.";
    return null;
}

async function ensureTutoringSubjectForCourse(
    service: ReturnType<typeof createAdminClient>,
    admin: { instituteId: string },
    course: CourseTutoringRow,
): Promise<{ subjectId: string | null; error?: string }> {
    if (!course.tutor_id) return { subjectId: null };

    const name = tutoringSubjectName(course);
    let subjectId = course.tutoring_subject_id || null;

    if (subjectId) {
        const { data: existingSubject, error } = await service
            .from("subjects")
            .select("id")
            .eq("id", subjectId)
            .eq("institute_id", admin.instituteId)
            .maybeSingle();

        if (error) return { subjectId: null, error: error.message };
        if (!existingSubject) subjectId = null;
    }

    if (!subjectId) {
        const { data: matchingSubjects, error } = await service
            .from("subjects")
            .select("id")
            .eq("institute_id", admin.instituteId)
            .eq("name", name)
            .limit(1);

        if (error) return { subjectId: null, error: error.message };
        subjectId = matchingSubjects?.[0]?.id || null;
    }

    if (subjectId) {
        const { error } = await service
            .from("subjects")
            .update({
                name,
                category: "Tutoria",
                teacher_id: course.tutor_id,
                institute_id: admin.instituteId,
                description: `Tutoria del curs ${course.name || name}`,
                color: "#7c3aed",
            })
            .eq("id", subjectId)
            .eq("institute_id", admin.instituteId);

        if (error) return { subjectId: null, error: error.message };
    } else {
        const { data: subject, error } = await service
            .from("subjects")
            .insert({
                name,
                category: "Tutoria",
                teacher_id: course.tutor_id,
                institute_id: admin.instituteId,
                description: `Tutoria del curs ${course.name || name}`,
                color: "#7c3aed",
            })
            .select("id")
            .single();

        if (error || !subject) return { subjectId: null, error: error?.message || "No s'ha pogut crear l'assignatura de tutoria." };
        subjectId = subject.id;
    }

    if (course.tutoring_subject_id !== subjectId) {
        const { error } = await service
            .from("courses")
            .update({ tutoring_subject_id: subjectId, updated_at: new Date().toISOString() })
            .eq("id", course.id)
            .eq("institute_id", admin.instituteId);

        if (error) return { subjectId: null, error: error.message };
    }

    const { error: courseSubjectError } = await service
        .from("course_subjects")
        .upsert({ course_id: course.id, subject_id: subjectId }, { onConflict: "course_id,subject_id" });

    if (courseSubjectError) return { subjectId: null, error: courseSubjectError.message };

    return { subjectId };
}

async function syncTutoringSubjectEnrollments(
    service: ReturnType<typeof createAdminClient>,
    courseId: string,
    subjectId: string | null,
) {
    if (!subjectId) return null;

    const { data: courseStudents, error: studentsError } = await service
        .from("course_students")
        .select("student_id")
        .eq("course_id", courseId);

    if (studentsError) return studentsError.message;

    const enrollments = (courseStudents || [])
        .map((row: { student_id: string | null }) => row.student_id)
        .filter((studentId): studentId is string => Boolean(studentId))
        .map((studentId) => ({
            subject_id: subjectId,
            student_id: studentId,
            course_id: courseId,
        }));

    if (enrollments.length === 0) return null;

    const { error } = await service
        .from("enrollments")
        .upsert(enrollments, { onConflict: "subject_id,student_id", ignoreDuplicates: true });

    return error?.message || null;
}

export async function createAdminCourse(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const name = getText(formData, "name");
    const code = getText(formData, "code");
    const description = getText(formData, "description");
    const tutorId = normalizeOptionalId(getText(formData, "tutor_id"));

    if (!name) return { success: false, error: "El nom del curs és obligatori." };

    try {
        const service = createAdminClient();
        const tutorError = await validateCourseTutor(service, admin, tutorId);
        if (tutorError) return { success: false, error: tutorError };

        const { data: course, error } = await service
            .from("courses")
            .insert({
                institute_id: admin.instituteId,
                name,
                code: code || null,
                description: description || null,
                tutor_id: tutorId,
                is_active: true,
            })
            .select("id, institute_id, name, code, tutor_id, tutoring_subject_id")
            .single();

        if (error || !course) return { success: false, error: error?.message || "No s'ha pogut crear el curs." };

        const tutoring = await ensureTutoringSubjectForCourse(service, admin, course);
        if (tutoring.error) return { success: false, error: tutoring.error };

        await writeAuditLog("course.created", "course", course.id, { name, code, tutorId });
        revalidateAdminPaths();
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut crear el curs.") };
    }
}

export async function updateAdminCourse(formData: FormData): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };

    const courseId = getText(formData, "course_id");
    const name = getText(formData, "name");
    const code = getText(formData, "code");
    const description = getText(formData, "description");
    const tutorId = normalizeOptionalId(getText(formData, "tutor_id"));
    const isActive = getText(formData, "is_active") !== "false";

    if (!courseId || !name) return { success: false, error: "Falten camps obligatoris." };

    try {
        const service = createAdminClient();
        const tutorError = await validateCourseTutor(service, admin, tutorId);
        if (tutorError) return { success: false, error: tutorError };

        const { data: course, error } = await service
            .from("courses")
            .update({
                name,
                code: code || null,
                description: description || null,
                tutor_id: tutorId,
                is_active: isActive,
                updated_at: new Date().toISOString(),
            })
            .eq("id", courseId)
            .eq("institute_id", admin.instituteId)
            .select("id, institute_id, name, code, tutor_id, tutoring_subject_id")
            .single();

        if (error) return { success: false, error: error.message };
        if (!course) return { success: false, error: "Curs no trobat." };

        const tutoring = await ensureTutoringSubjectForCourse(service, admin, course);
        if (tutoring.error) return { success: false, error: tutoring.error };

        const enrollmentError = await syncTutoringSubjectEnrollments(service, courseId, tutoring.subjectId);
        if (enrollmentError) return { success: false, error: enrollmentError };

        await writeAuditLog("course.updated", "course", courseId, { name, code, tutorId, isActive });
        revalidateAdminPaths();
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut actualitzar el curs.") };
    }
}

export async function updateAdminCourseMembership(courseId: string, subjectIds: string[], studentIds: string[]): Promise<ActionResult> {
    const admin = await requireAdmin();
    if (!admin) return { success: false, error: "No autoritzat." };
    if (!courseId) return { success: false, error: "Curs no vàlid." };

    const requestedSubjectIds = Array.from(new Set(subjectIds.filter(Boolean)));
    const requestedStudentIds = Array.from(new Set(studentIds.filter(Boolean)));

    try {
        const service = createAdminClient();
        const [{ data: course }, { data: subjects }, { data: students }] = await Promise.all([
            service
                .from("courses")
                .select("id, institute_id, name, code, tutor_id, tutoring_subject_id")
                .eq("id", courseId)
                .eq("institute_id", admin.instituteId)
                .single(),
            requestedSubjectIds.length > 0
                ? service
                    .from("subjects")
                    .select("id")
                    .eq("institute_id", admin.instituteId)
                    .in("id", requestedSubjectIds)
                : Promise.resolve({ data: [] as { id: string }[] }),
            requestedStudentIds.length > 0
                ? service
                    .from("users")
                    .select("id")
                    .eq("institute_id", admin.instituteId)
                    .eq("role", "student")
                    .eq("is_active", true)
                    .in("id", requestedStudentIds)
                : Promise.resolve({ data: [] as { id: string }[] }),
        ]);

        if (!course) return { success: false, error: "Curs no trobat." };

        let validSubjectIds = (subjects || []).map((subject: { id: string }) => subject.id);
        const validStudentIds = (students || []).map((student: { id: string }) => student.id);

        if (validSubjectIds.length !== requestedSubjectIds.length) {
            return { success: false, error: "Alguna assignatura no pertany a aquest institut." };
        }

        if (validStudentIds.length !== requestedStudentIds.length) {
            return { success: false, error: "Algun alumne no pertany a aquest institut o no està actiu." };
        }

        const tutoring = await ensureTutoringSubjectForCourse(service, admin, course);
        if (tutoring.error) return { success: false, error: tutoring.error };
        validSubjectIds = Array.from(new Set([...validSubjectIds, tutoring.subjectId].filter((subjectId): subjectId is string => Boolean(subjectId))));

        const [deleteSubjects, deleteStudents, deleteEnrollments] = await Promise.all([
            service.from("course_subjects").delete().eq("course_id", courseId),
            service.from("course_students").delete().eq("course_id", courseId),
            service.from("enrollments").delete().eq("course_id", courseId),
        ]);

        if (deleteSubjects.error) return { success: false, error: deleteSubjects.error.message };
        if (deleteStudents.error) return { success: false, error: deleteStudents.error.message };
        if (deleteEnrollments.error) return { success: false, error: deleteEnrollments.error.message };

        if (validSubjectIds.length > 0) {
            const { error } = await service
                .from("course_subjects")
                .upsert(validSubjectIds.map((subjectId) => ({ course_id: courseId, subject_id: subjectId })), {
                    onConflict: "course_id,subject_id",
                });
            if (error) return { success: false, error: error.message };
        }

        if (validStudentIds.length > 0) {
            const { error } = await service
                .from("course_students")
                .upsert(validStudentIds.map((studentId) => ({ course_id: courseId, student_id: studentId })), {
                    onConflict: "course_id,student_id",
                });
            if (error) return { success: false, error: error.message };
        }

        const nextEnrollments = validSubjectIds.flatMap((subjectId) =>
            validStudentIds.map((studentId) => ({
                subject_id: subjectId,
                student_id: studentId,
                course_id: courseId,
            })),
        );

        if (nextEnrollments.length > 0) {
            const { error } = await service
                .from("enrollments")
                .upsert(nextEnrollments, { onConflict: "subject_id,student_id", ignoreDuplicates: true });
            if (error) return { success: false, error: error.message };
        }

        await writeAuditLog("course.membership_updated", "course", courseId, {
            subjectIds: validSubjectIds,
            studentIds: validStudentIds,
        });
        revalidateAdminPaths([
            "/dashboard/subjects",
            ...validSubjectIds.flatMap((subjectId) => [
                `/dashboard/admin/subjects/${subjectId}`,
                `/dashboard/subjects/${subjectId}`,
            ]),
        ]);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error, "No s'ha pogut actualitzar el curs.") };
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
