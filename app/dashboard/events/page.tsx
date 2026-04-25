import { getSession } from "@/lib/session";
import { getDashboardData } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { EventsClient } from "./EventsClient";

export default async function EventsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const { events } = await getDashboardData(session.userId as string, session.role as string);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-7xl mx-auto">
             <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Eventos y Actividades</h1>
                    <p className="text-zinc-500">Mantente al día con lo que ocurre en Educon.</p>
                </div>
                {session.role === 'teacher' && (
                    <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-xl font-medium text-sm">
                        + Nuevo Evento
                    </button>
                )}
            </div>

            <EventsClient initialEvents={events || []} />
        </div>
    );
}
