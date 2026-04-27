import { getSession } from "@/lib/session";
import { getEventById } from "@/app/actions/events";
import { getTeacherSubjects } from "@/lib/data-service";
import { redirect, notFound } from "next/navigation";
import { EditEventForm } from "@/components/dashboard/events/EditEventForm";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();

    if (!session || session.role !== 'teacher') {
        redirect('/dashboard');
    }

    const [event, subjects] = await Promise.all([
        getEventById(id),
        getTeacherSubjects(session.userId as string),
    ]);

    if (!event) notFound();

    // Only the creator can edit
    if (event.created_by && event.created_by !== session.userId) {
        redirect('/dashboard/events');
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-3xl">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
                        Editar Evento
                    </h1>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400">
                        Modifica los detalles de <span className="font-semibold text-zinc-700 dark:text-zinc-300">{event.title}</span>.
                    </p>
                </div>

                <EditEventForm event={event} subjects={subjects} />
            </div>
        </div>
    );
}
