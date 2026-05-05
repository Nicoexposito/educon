import { getSession } from "@/lib/session";
import { getSubjectsForUser } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { SubjectsClient } from "./SubjectsClient";

export default async function SubjectsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    if (session.role === 'admin') {
        redirect('/dashboard/admin/subjects');
    }

    const subjects = await getSubjectsForUser(session.userId as string, session.role as string);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <SubjectsClient initialSubjects={subjects} role={session.role as string} />
        </div>
    );
}
