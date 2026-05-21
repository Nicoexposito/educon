import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ClientLayoutWrapper } from "./ClientLayoutWrapper";
import { createClient } from "@/lib/supabase/server";
import { NotificationListener } from "@/components/notifications/NotificationListener";

type CourseSummary = {
    id: string;
    name: string | null;
    code: string | null;
};

type CourseStudentRow = {
    course: CourseSummary | CourseSummary[] | null;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, role, institute_id, institute:institutes(name)')
        .eq('id', session.userId)
        .single();

    let courses: CourseSummary[] = [];
    if (session.role === 'student') {
        const { data: courseRows, error } = await supabase
            .from('course_students')
            .select('course:courses(id, name, code)')
            .eq('student_id', session.userId);

        if (!isMissingCoursesSchemaError(error?.message)) {
            courses = Array.from(
                new Map(
                    ((courseRows || []) as CourseStudentRow[])
                        .flatMap((row) => normalizeCourseRelation(row.course))
                        .filter(Boolean)
                        .map((course) => [course.id, { id: course.id, name: course.name, code: course.code }]),
                ).values(),
            );
        }
    }

    const profileWithCourses = profile && session.role === 'student'
        ? { ...profile, courses }
        : profile;

    return (
        <ClientLayoutWrapper session={session} profile={profileWithCourses}>
            <NotificationListener userId={session.userId as string} />
            {children}
        </ClientLayoutWrapper>
    );
}

function normalizeCourseRelation(value: CourseSummary | CourseSummary[] | null | undefined) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
}

function isMissingCoursesSchemaError(message?: string | null) {
    if (!message) return false;
    return /courses|course_students|course_subjects|schema cache|relationship/i.test(message);
}
