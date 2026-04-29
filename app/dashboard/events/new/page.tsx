import { getSession } from "@/lib/session";
import { getTeacherSubjects } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { CreateEventForm } from "@/components/dashboard/events/CreateEventForm";

export default async function NewEventPage() {
    const session = await getSession();

    if (!session || session.role !== 'teacher') {
        redirect('/dashboard');
    }

    const subjects = await getTeacherSubjects(session.userId as string);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-3xl">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
                        Crear esdeveniment nou
                    </h1>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400">
                        Afegeix un esdeveniment, reunió o lliurament especial nou al calendari dels teus alumnes.
                    </p>
                </div>

                <CreateEventForm subjects={subjects} />
            </div>
        </div>
    );
}
