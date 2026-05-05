"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { AdminAnnouncement, AdminEnrollmentWithStudent, AdminSubject, AdminUser } from "@/lib/admin-types";

type RelationOne<T> = T | T[] | null | undefined;
type AdminTeacherReference = Pick<AdminUser, "id" | "full_name" | "email">;
type AdminAuthorReference = Pick<AdminUser, "full_name" | "email">;
type AdminSubjectRow = Omit<AdminSubject, "teacher"> & {
    teacher?: RelationOne<AdminTeacherReference>;
};
type AdminAnnouncementRow = Omit<AdminAnnouncement, "author"> & {
    author?: RelationOne<AdminAuthorReference>;
};

function normalizeRelation<T>(value: RelationOne<T>) {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

function normalizeSubject(subject: AdminSubjectRow): AdminSubject {
    return {
        ...subject,
        teacher: normalizeRelation(subject.teacher),
    };
}

export async function getCurrentAdminContext() {
    const session = await getSession();

    if (!session) {
        redirect("/");
    }

    if (session.role !== "admin") {
        redirect("/dashboard");
    }

    const supabase = await createClient();
    const { data: admin, error } = await supabase
        .from("users")
        .select("id, full_name, email, role, institute_id, institute:institutes(id, name)")
        .eq("id", session.userId)
        .single();

    if (error || !admin?.institute_id) {
        redirect("/dashboard/profile");
    }

    return {
        session,
        admin,
        instituteId: admin.institute_id as string,
    };
}

export async function getAdminDashboardData() {
    const { instituteId } = await getCurrentAdminContext();
    const supabase = await createClient();

    const [
        { count: teacherCount },
        { count: studentCount },
        { count: subjectCount },
        { count: activeAnnouncements },
        { data: upcomingSchedules },
        { data: latestUsers },
    ] = await Promise.all([
        supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("institute_id", instituteId)
            .eq("role", "teacher")
            .eq("is_active", true),
        supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("institute_id", instituteId)
            .eq("role", "student")
            .eq("is_active", true),
        supabase
            .from("subjects")
            .select("*", { count: "exact", head: true })
            .eq("institute_id", instituteId),
        supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("institute_id", instituteId),
        supabase
            .from("subjects")
            .select("id, name, category, teacher:users!teacher_id(full_name), schedules:subject_schedules(day_of_week, start_time, end_time)")
            .eq("institute_id", instituteId)
            .order("name")
            .limit(6),
        supabase
            .from("users")
            .select("id, full_name, email, role, is_active, created_at")
            .eq("institute_id", instituteId)
            .in("role", ["teacher", "student"])
            .order("created_at", { ascending: false })
            .limit(6),
    ]);

    return {
        stats: {
            teacherCount: teacherCount || 0,
            studentCount: studentCount || 0,
            subjectCount: subjectCount || 0,
            activeAnnouncements: activeAnnouncements || 0,
        },
        upcomingSchedules: ((upcomingSchedules || []) as AdminSubjectRow[]).map(normalizeSubject),
        latestUsers: latestUsers || [],
    };
}

export async function getAdminUsersData() {
    const { instituteId } = await getCurrentAdminContext();
    const supabase = await createClient();

    const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email, phone, role, is_active, must_change_password, created_at")
        .eq("institute_id", instituteId)
        .in("role", ["teacher", "student"])
        .order("role")
        .order("full_name");

    return {
        users: users || [],
    };
}

export async function getAdminSubjectsData() {
    const { instituteId } = await getCurrentAdminContext();
    const supabase = await createClient();

    const [{ data: subjects }, { data: teachers }, { data: students }] = await Promise.all([
        supabase
            .from("subjects")
            .select("*, teacher:users!teacher_id(id, full_name, email), schedules:subject_schedules(*), enrollments(id)")
            .eq("institute_id", instituteId)
            .order("category")
            .order("name"),
        supabase
            .from("users")
            .select("id, full_name, email")
            .eq("institute_id", instituteId)
            .eq("role", "teacher")
            .eq("is_active", true)
            .order("full_name"),
        supabase
            .from("users")
            .select("id, full_name, email")
            .eq("institute_id", instituteId)
            .eq("role", "student")
            .eq("is_active", true)
            .order("full_name"),
    ]);

    return {
        subjects: ((subjects || []) as AdminSubjectRow[]).map((subject) => ({
            ...normalizeSubject(subject),
            student_count: subject.enrollments?.length || 0,
        })),
        teachers: teachers || [],
        students: students || [],
    };
}

export async function getAdminSubjectDetails(subjectId: string) {
    const { instituteId } = await getCurrentAdminContext();
    const supabase = await createClient();

    const { data: subject } = await supabase
        .from("subjects")
        .select("*, teacher:users!teacher_id(id, full_name, email), schedules:subject_schedules(*)")
        .eq("id", subjectId)
        .eq("institute_id", instituteId)
        .single();

    if (!subject) {
        redirect("/dashboard/admin/subjects");
    }

    const [{ data: enrollments }, { data: students }, { data: teachers }] = await Promise.all([
        supabase
            .from("enrollments")
            .select("id, student:users(id, full_name, email, phone)")
            .eq("subject_id", subjectId),
        supabase
            .from("users")
            .select("id, full_name, email")
            .eq("institute_id", instituteId)
            .eq("role", "student")
            .eq("is_active", true)
            .order("full_name"),
        supabase
            .from("users")
            .select("id, full_name, email")
            .eq("institute_id", instituteId)
            .eq("role", "teacher")
            .eq("is_active", true)
            .order("full_name"),
    ]);

    const roster = ((enrollments || []) as AdminEnrollmentWithStudent[])
        .flatMap((row) => (Array.isArray(row.student) ? row.student : row.student ? [row.student] : []));
    const enrolledIds = new Set(roster.map((student) => student.id));

    return {
        subject: normalizeSubject(subject as AdminSubjectRow),
        roster,
        availableStudents: ((students || []) as AdminUser[]).filter((student) => !enrolledIds.has(student.id)),
        teachers: teachers || [],
    };
}

export async function getAdminScheduleData() {
    const { instituteId } = await getCurrentAdminContext();
    const supabase = await createClient();

    const [{ data: subjects }, { data: teachers }, { data: students }] = await Promise.all([
        supabase
            .from("subjects")
            .select("id, name, category, teacher:users!teacher_id(id, full_name), schedules:subject_schedules(*)")
            .eq("institute_id", instituteId)
            .order("name"),
        supabase
            .from("users")
            .select("id, full_name, email")
            .eq("institute_id", instituteId)
            .eq("role", "teacher")
            .eq("is_active", true)
            .order("full_name"),
        supabase
            .from("users")
            .select("id, full_name, email")
            .eq("institute_id", instituteId)
            .eq("role", "student")
            .eq("is_active", true)
            .order("full_name"),
    ]);

    return {
        subjects: ((subjects || []) as AdminSubjectRow[]).map(normalizeSubject),
        teachers: teachers || [],
        students: students || [],
    };
}

export async function getAdminAnnouncementsData() {
    const { instituteId } = await getCurrentAdminContext();
    const supabase = await createClient();

    const { data: announcements } = await supabase
        .from("posts")
        .select("id, title, content, audience, created_at, author:users!author_id(full_name, email)")
        .eq("institute_id", instituteId)
        .order("created_at", { ascending: false });

    return {
        announcements: ((announcements || []) as AdminAnnouncementRow[]).map((announcement) => ({
            ...announcement,
            author: normalizeRelation(announcement.author),
        })),
    };
}
