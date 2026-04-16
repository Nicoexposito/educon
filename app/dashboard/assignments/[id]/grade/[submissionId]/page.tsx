import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabase as legacySupabase } from "@/lib/supabase";
import GradeSubmissionForm from "@/components/dashboard/shared/GradeSubmissionForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function GradeSubmissionPage({ params }: { params: { id: string, submissionId: string } }) {
    const session = await getSession();

    if (!session || session.role !== 'teacher') {
        redirect('/');
    }

    const { id, submissionId } = await params;

    // Fetch submission with student and assignment details
    const { data: submission, error } = await legacySupabase
        .from('submissions')
        .select(`
            *,
            student:users!student_id(full_name, email, avatar_url),
            assignment:assignments!assignment_id(title, subject:subjects(name))
        `)
        .eq('id', submissionId)
        .eq('assignment_id', id)
        .single();

    if (error || !submission) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6 text-center">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Entrega no encontrada</h1>
                <Link href={`/dashboard/assignments/${id}`} className="text-indigo-600 mt-4 inline-block hover:underline">Volver a la tarea</Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="mb-6">
                <Link href={`/dashboard/assignments/${id}`} className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Volver a {submission.assignment?.title}
                </Link>
            </div>
            {/* The old assignment structure expects certain fields */}
            <GradeSubmissionForm 
                submission={submission}
            />
        </div>
    );
}
