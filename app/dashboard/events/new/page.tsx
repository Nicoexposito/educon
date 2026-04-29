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
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:px-6 lg:px-12">
            <div className="w-full max-w-3xl">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                        Crear esdeveniment nou
                    </h1>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 sm:text-lg">
                        Afegeix un esdeveniment, reunió o lliurament especial nou al calendari dels teus alumnes.
                    </p>
                </div>

                <CreateEventForm subjects={subjects} />
            </div>
        </div>
    );
}
