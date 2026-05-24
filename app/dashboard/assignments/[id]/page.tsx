import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import StudentAssignmentView from "@/components/dashboard/shared/StudentAssignmentView";
import TeacherAssignmentView from "@/components/dashboard/shared/TeacherAssignmentView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AssignmentPage({ params }: { params: { id: string } }) {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    if (session.role === 'admin') {
        redirect('/dashboard/admin');
    }

    const { id } = await params;
    const supabase = await createClient();

    // Fetch assignment details
    const { data: assignment, error } = await supabase
        .from('assignments')
        .select('id, subject_id, title, description, due_date, created_at, content_url, teacher_id, start_date, is_corrected, late_due_date, subject:subjects(name)')
        .eq('id', id)
        .single();

    if (error || !assignment) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6 text-center">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Treball no trobat</h1>
                <Link href="/dashboard/assignments" className="text-indigo-600 mt-4 inline-block hover:underline">Tornar als treballs</Link>
            </div>
        );
    }

    if (session.role === 'teacher') {
        // Fetch all students in the subject and their submissions
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('student:users(id, full_name, email, avatar_url)')
            .eq('subject_id', assignment.subject_id);

        const students = enrollments?.map((e: any) => e.student).filter(Boolean) || [];

        const { data: submissions } = await supabase
            .from('submissions')
            .select('id, assignment_id, student_id, file_url, submitted_at, grade, feedback, status, student_comment')
            .eq('assignment_id', assignment.id);

        // Map submissions to students
        const studentsWithSubmissions = students.map((student: any) => {
            const submission = submissions?.find((s: any) => s.student_id === student.id) || null;
            return {
                ...student,
                submission
            };
        });

        return (
            <div className="max-w-6xl mx-auto py-8">
                <div className="mb-6">
                    <Link href="/dashboard/assignments" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Tornar
                    </Link>
                </div>
                <TeacherAssignmentView assignment={assignment} students={studentsWithSubmissions} teacherId={session.userId as string} />
            </div>
        );
    } else {
        // Fetch student's submission
        const { data: submission } = await supabase
            .from('submissions')
            .select('id, assignment_id, student_id, file_url, submitted_at, grade, feedback, status, student_comment')
            .eq('assignment_id', assignment.id)
            .eq('student_id', session.userId)
            .single();

        const assignmentWithStatus = {
            ...assignment,
            status: submission ? (submission.status === 'returned' ? 'returned' : (submission.grade !== null ? 'graded' : 'submitted')) : 'pending',
            grade: submission?.grade,
            feedback: submission?.feedback,
            file_url: submission?.file_url,
            student_comment: submission?.student_comment,
            submitted_at: submission?.submitted_at
        };

        return (
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-6">
                    <Link href="/dashboard/assignments" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Tornar
                    </Link>
                </div>
                <StudentAssignmentView assignment={assignmentWithStatus} userId={session.userId as string} />
            </div>
        );
    }
}
