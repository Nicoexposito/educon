import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/dashboard/shared/ProfileClient";

async function getProfileData(userId: string, role: string) {
    // 1. User + institute (use SELECT * to match the rest of the codebase)
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*, institute:institutes(name)')
        .eq('id', userId)
        .single();

    if (userError) console.error('Profile fetch error:', userError);

    if (!user) return null;

    let stats = {
        avgGrade: "—",
        totalSubjects: 0,
        submittedAssignments: 0,
        pendingAssignments: 0,
    };

    let recentGrades: Array<{
        subject: string;
        grade: number | null;
        date: string;
        assignmentTitle: string;
    }> = [];

    if (role === 'student') {
        // Count enrolled subjects
        const { count: subjectCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', userId);

        // Get all submissions with grades for this student
        const { data: submissions } = await supabase
            .from('submissions')
            .select('grade, submitted_at, assignment:assignments(title, due_date, subject:subjects(name))')
            .eq('student_id', userId)
            .order('submitted_at', { ascending: false })
            .limit(10);

        const graded = submissions?.filter((s: any) => s.grade !== null) || [];
        const avgGrade = graded.length > 0
            ? (graded.reduce((sum: number, s: any) => sum + Number(s.grade), 0) / graded.length).toFixed(1)
            : "—";

        // Count pending assignments (enrolled subjects, not yet submitted)
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('subject_id')
            .eq('student_id', userId);

        const subjectIds = enrollments?.map((e: any) => e.subject_id) || [];

        let pendingCount = 0;
        if (subjectIds.length > 0) {
            const { data: allAssignments } = await supabase
                .from('assignments')
                .select('id')
                .in('subject_id', subjectIds)
                .gt('due_date', new Date().toISOString());

            const { data: submittedAssignments } = await supabase
                .from('submissions')
                .select('assignment_id')
                .eq('student_id', userId);

            const submittedIds = new Set(submittedAssignments?.map((s: any) => s.assignment_id) || []);
            pendingCount = allAssignments?.filter((a: any) => !submittedIds.has(a.id)).length || 0;
        }

        stats = {
            avgGrade,
            totalSubjects: subjectCount || 0,
            submittedAssignments: submissions?.length || 0,
            pendingAssignments: pendingCount,
        };

        // Recent grades
        recentGrades = (submissions || []).map((s: any) => ({
            subject: s.assignment?.subject?.name || "Sin asignatura",
            grade: s.grade,
            date: s.submitted_at
                ? new Date(s.submitted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : "—",
            assignmentTitle: s.assignment?.title || "Sin título",
        }));

    } else {
        // Teacher
        const { count: subjectCount } = await supabase
            .from('subjects')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', userId);

        const { count: pendingToGrade } = await supabase
            .from('submissions')
            .select('*, assignment:assignments!inner(teacher_id)', { count: 'exact', head: true })
            .eq('assignment.teacher_id', userId)
            .is('grade', null);

        stats = {
            avgGrade: "—",
            totalSubjects: subjectCount || 0,
            submittedAssignments: 0,
            pendingAssignments: pendingToGrade || 0,
        };
    }

    return { user, stats, recentGrades };
}

export default async function ProfilePage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const data = await getProfileData(session.userId as string, session.role as string);

    if (!data || !data.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500">
                Usuario no encontrado
            </div>
        );
    }

    return (
        <ProfileClient
            user={data.user}
            userId={session.userId as string}
            stats={data.stats}
            recentGrades={data.recentGrades}
        />
    );
}
