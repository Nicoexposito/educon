import { getSession } from "@/lib/session";
import { getDashboardData } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

export default async function SchedulePage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    // Reuse getDashboardData for simplicity to get subjects and events
    const { subjects, events } = await getDashboardData(session.userId as string, session.role as string);

    // Mock generating a weekly grid based on subjects' text schedule
    // In a real app, this would need parsed structured data (day_of_week, start_time, end_time)
    
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00'];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Horario Escolar</h1>
                    <p className="text-zinc-500">Vista semanal de clases y eventos.</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                        <ChevronLeft className="w-5 h-5 text-zinc-500" />
                    </button>
                    <span className="text-sm font-medium px-2">Semana Actual</span>
                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="grid grid-cols-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="p-4 text-center text-xs font-semibold text-zinc-400 uppercase border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                        Hora
                    </div>
                    {days.map(day => (
                        <div key={day} className="p-4 text-center text-sm font-bold text-zinc-700 dark:text-zinc-300 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {timeSlots.map(time => (
                        <div key={time} className="grid grid-cols-6 min-h-[5rem]">
                            <div className="p-4 text-center text-xs text-zinc-500 font-medium border-r border-zinc-100 dark:border-zinc-800 flex items-center justify-center bg-zinc-50/30 dark:bg-zinc-800/10">
                                {time}
                            </div>
                            {days.map((day, i) => {
                                // Mock logic: Find a subject that matches this day/time vaguely
                                // Real logic would check subject.schedule_structured
                                const foundSubject = subjects.find((s: any) => 
                                    s.schedule && 
                                    (s.schedule.toLowerCase().includes(day.toLowerCase()) || 
                                     s.schedule.includes(['DL', 'DM', 'DX', 'DJ', 'DV'][i])) && 
                                    s.schedule.includes(time.split(':')[0]) // check hour match
                                );

                                return (
                                    <div key={day} className="border-r border-zinc-50 dark:border-zinc-800 last:border-r-0 p-1 relative group">
                                        {foundSubject ? (
                                            <div className="h-full w-full rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-2 text-xs flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer">
                                                <div className="font-bold text-indigo-700 dark:text-indigo-300 truncate">{foundSubject.name}</div>
                                                <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>Aula 204</span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Próximos Eventos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((evt: any) => (
                        <div key={evt.id} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{evt.title}</h3>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {new Date(evt.start_time).toLocaleDateString()} at {new Date(evt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && <p className="text-zinc-500">No hay eventos próximos.</p>}
                </div>
            </div>
        </div>
    );
}
