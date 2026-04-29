import { getSession } from "@/lib/session";
import { getTeacherSubjects } from "@/lib/data-service";
import { redirect } from "next/navigation";
import CreateAssignmentForm from "@/components/dashboard/shared/CreateAssignmentForm";

export default async function NewAssignmentPage({ searchParams }: { searchParams?: Promise<{ subject?: string }> }) {
    const session = await getSession();

    if (!session || session.role !== 'teacher') {
        redirect('/dashboard/assignments');
    }

    const subjects = await getTeacherSubjects(session.userId as string);
    const params = searchParams ? await searchParams : {};

    return (
        <div className="max-w-4xl mx-auto py-8">
            <CreateAssignmentForm subjects={subjects} teacherId={session.userId as string} initialSubjectId={params?.subject} />
        </div>
    );
}
