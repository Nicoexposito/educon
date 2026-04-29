import { getSession } from "@/lib/session";
import { getAllAssignments, getTeacherSubjects } from "@/lib/data-service";
import { redirect } from "next/navigation";
import AssignmentsClient from "@/components/dashboard/shared/AssignmentsClient";

export default async function AssignmentsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const [assignments, subjects] = await Promise.all([
        getAllAssignments(session.userId as string, session.role as string),
        session.role === 'teacher' ? getTeacherSubjects(session.userId as string) : Promise.resolve([] as any[]),
    ]);

    return (
        <AssignmentsClient
            assignments={assignments}
            role={session.role as string}
            userId={session.userId as string}
            subjects={subjects}
        />
    );
}
