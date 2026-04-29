import { getSession } from "@/lib/session";
import { getUpcomingEvents } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { Calendar, MapPin, ArrowRight, Pencil } from "lucide-react";
import Link from "next/link";

export default async function EventsPage() {
    const session = await getSession();
    if (!session) redirect('/');

    if (!session) {
        redirect('/');
    }

    const events = await getUpcomingEvents(50);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Esdeveniments y Activitates</h1>
                    <p className="text-zinc-500">Estigues al dia del que passa a Educon.</p>
                </div>
                {session.role === 'teacher' && (
                    <Link
                        href="/dashboard/events/new"
                        className="bg-zinc-900 dark:bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        + Esdeveniment nou
                    </Link>
                )}
            </div>

            {events.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-24 text-zinc-400">
                    <Calendar className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-xl font-semibold">No hi ha esdeveniments propers</p>
                    {session.role === 'teacher' && (
                        <Link href="/dashboard/events/new" className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                            Crea el primer
                        </Link>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((evt: any) => {
                    const isOwner = session.role === 'teacher' && evt.created_by === session.userId;
                    return (
                        <Link
                            key={evt.id}
                            href={`/dashboard/events/${evt.id}`}
                            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                            title="Veure detalls"
                        >
                            <div className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all hover:border-indigo-200 dark:hover:border-indigo-800 flex flex-col">
                                {/* Image or placeholder */}
                            {evt.image_url ? (
                                <div
                                    className="h-44 bg-cover bg-center relative"
                                    style={{ backgroundImage: `url(${evt.image_url})` }}
                                >
                                    <div className="absolute inset-0 bg-black/10" />
                                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                        {evt.type || 'General'}
                                    </div>
                                    {isOwner && (
                                        <Link href={`/dashboard/events/${evt.id}/edit`}
                                            className="absolute top-3 left-3 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                                            title="Editar esdeveniment">
                                            <Pencil className="w-3.5 h-3.5 text-zinc-700" />
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="h-44 bg-zinc-100 dark:bg-zinc-800 relative bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center">
                                    <Calendar className="w-12 h-12 text-indigo-200 dark:text-indigo-900/50" />
                                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                        {evt.type || 'General'}
                                    </div>
                                    {isOwner && (
                                        <Link href={`/dashboard/events/${evt.id}/edit`}
                                            className="absolute top-3 left-3 p-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full shadow-sm transition-colors"
                                            title="Editar esdeveniment">
                                            <Pencil className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                                        </Link>
                                    )}
                                </div>
                            )}

                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex gap-3 mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    <span suppressHydrationWarning>{new Date(evt.start_time).toLocaleDateString('ca-ES', { month: 'short', day: 'numeric' })}</span>
                                    <span>•</span>
                                    <span suppressHydrationWarning>{new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                                    {evt.title}
                                </h3>
                                <p className="text-zinc-500 text-sm line-clamp-2 mb-4 flex-1">
                                    {evt.description || "No hi ha cap descripció disponible."}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-sm text-zinc-400 truncate">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{evt.location || "Per confirmar"}</span>
                                    </div>

                                        <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />

                                </div>
                            </div>
                        </div></Link>
                    );
                })}

            </div>
        </div>
    );
}
