import { getSession } from "@/lib/session";
import { getAllAssignments, getTeacherSubjects } from "@/lib/data-service";
import { redirect } from "next/navigation";
import AssignmentsClient from "@/components/dashboard/shared/AssignmentsClient";

export default async function AssignmentsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const assignments = await getAllAssignments(session.userId as string, session.role as string);

    // For teachers, also fetch their subjects for the create modal
    let subjects: any[] = [];
    if (session.role === 'teacher') {
        subjects = await getTeacherSubjects(session.userId as string);
    }

    return (
        <AssignmentsClient
            assignments={assignments}
            role={session.role as string}
            userId={session.userId as string}
            subjects={subjects}
        />
    );
}
