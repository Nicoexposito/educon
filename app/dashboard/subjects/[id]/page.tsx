import { getSession } from "@/lib/session";
import { getSubjectDetails } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SubjectDetailsClient } from "./SubjectDetailsClient";

export default async function SubjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const data = await getSubjectDetails(id, session.role as string);

    if (!data) {
        return <div className="p-4 sm:p-6 lg:p-8">Assignatura no encontrada</div>;
    }

    const { subject, assignments, resources, students, attendance } = data;

    return (
        <div className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <Link href="/dashboard/subjects" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tornar a assignatures
            </Link>

            <SubjectDetailsClient
                initialSubject={subject}
                initialAssignments={assignments || []}
                initialResources={resources || []}
                initialStudents={students || []}
                initialAttendance={attendance || []}
                role={session.role as string}
            />
        </div>
    );
}
