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
        return <div className="p-8">Asignatura no encontrada</div>;
    }

    const { subject, assignments, resources, students } = data;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-7xl mx-auto">
            <Link href="/dashboard/subjects" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Asignaturas
            </Link>

            <SubjectDetailsClient 
                initialSubject={subject} 
                initialAssignments={assignments || []} 
                initialResources={resources || []} 
                initialStudents={students || []} 
                role={session.role as string} 
            />
        </div>
    );
}
