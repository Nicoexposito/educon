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
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <CreateAssignmentForm subjects={subjects} teacherId={session.userId as string} initialSubjectId={params?.subject} />
        </div>
    );
}
