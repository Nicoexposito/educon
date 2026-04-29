import { getSession } from "@/lib/session";
import { getEventById } from "@/app/actions/events";
import { notFound, redirect } from "next/navigation";
import { Calendar, MapPin, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EventOwnerActions } from "@/components/dashboard/events/EventOwnerActions";

const TYPE_LABELS: Record<string, string> = {
    general: 'General',
    exam: 'Examen',
    activity: 'Activitat',
    trip: 'Excursión',
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    if (!session) redirect('/');

    const event = await getEventById(id);
    if (!event) notFound();

    const isOwner = session.role === 'teacher' && (
        event.created_by === null || event.created_by === session.userId
    );
    const typeKey = (event.type || 'general').toLowerCase();
    const typeLabel = TYPE_LABELS[typeKey] || event.type || 'General';

    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    const isSameDay = startDate.toDateString() === endDate.toDateString();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">

            {/* Hero */}
            <div className="relative w-full h-72 sm:h-96 overflow-hidden">
                {event.image_url ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${event.image_url})` }}
                    >
                        <div className="absolute inset-0 bg-black/40" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700" />
                )}

                {/* Back button */}
                <div className="absolute top-6 left-6">
                    <Link
                        href="/dashboard/events"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Tornar
                    </Link>
                </div>

                {/* Type badge */}
                <div className="absolute bottom-6 left-6">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 text-zinc-800">
                        {typeLabel}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-10">

                {/* Title + Owner actions */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <h1 className="text-4xl font-extrabold tracking-tight leading-tight">{event.title}</h1>
                    {isOwner && <EventOwnerActions eventId={event.id} />}
                </div>

                {/* Meta info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Data</p>
                            <p className="text-sm font-bold" suppressHydrationWarning>
                                {startDate.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                            {!isSameDay && (
                                <p className="text-xs text-zinc-500 mt-0.5" suppressHydrationWarning>
                                    fins a {endDate.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Horari</p>
                            <p className="text-sm font-bold" suppressHydrationWarning>
                                {startDate.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                                {' – '}
                                {endDate.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Lugar</p>
                            <p className="text-sm font-bold">{event.location || 'Per confirmar'}</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {event.description && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Descripció</h2>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
