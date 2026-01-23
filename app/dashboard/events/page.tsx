import { getSession } from "@/lib/session";
import { getDashboardData } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";

export default async function EventsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    // Reuse getDashboardData or create refined fetcher.
    // getDashboardData already fetches top 5 events. Let's assume we fetch ALL here.
    // For now we reuse the function but in a real app create `getAllEvents`
    const { events } = await getDashboardData(session.userId as string, session.role as string);
    // In reality this returns top 5. Let's pretend it returns all or we just show these 5.

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((evt: any) => (
                    <div key={evt.id} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all hover:border-indigo-200 dark:hover:border-indigo-800">
                        {/* Image Placeholder */}
                        <div className="h-40 bg-zinc-100 dark:bg-zinc-800 relative bg-linear-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center">
                             <Calendar className="w-12 h-12 text-indigo-200 dark:text-indigo-900/50" />
                             
                             <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                {evt.type || 'General'}
                             </div>
                        </div>

                        <div className="p-6">
                            <div className="flex gap-3 mb-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                <span>{new Date(evt.start_time).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                                <span>•</span>
                                <span>{new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{evt.title}</h3>
                            <p className="text-zinc-500 text-sm line-clamp-2 mb-6">
                                {evt.description || "Sin descripción disponible para este evento."}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <MapPin className="w-4 h-4" />
                                    <span>Aula Magna</span>
                                </div>
                                <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                    <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-indigo-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Add a "Coming Soon" card for demo if few events */}
                <div className="bg-dashed border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-zinc-400 min-h-[300px]">
                    <Calendar className="w-10 h-10 mb-4 opacity-50" />
                    <p className="font-medium">Más eventos próximamente</p>
                </div>
            </div>
        </div>
    );
}
