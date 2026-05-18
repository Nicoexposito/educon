import { getSession } from "@/lib/session";
import { getAllAssignments, getTeacherSubjects } from "@/lib/data-service";
import { redirect } from "next/navigation";
import AssignmentsClient from "@/components/dashboard/shared/AssignmentsClient";

export default async function AssignmentsPage({ searchParams }: { searchParams?: Promise<{ subject?: string }> }) {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    if (session.role === 'admin') {
        redirect('/dashboard/admin');
    }

    const [assignments, subjects] = await Promise.all([
        getAllAssignments(session.userId as string, session.role as string),
        session.role === 'teacher' ? getTeacherSubjects(session.userId as string) : Promise.resolve([] as any[]),
    ]);
    const resolvedSearchParams = searchParams ? await searchParams : {};

    return (
        <AssignmentsClient
            assignments={assignments}
            role={session.role as string}
            subjects={subjects}
            subjectFilter={resolvedSearchParams.subject}
        />
    );
}
