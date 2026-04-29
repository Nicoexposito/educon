import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, MoreHorizontal, ArrowRight } from 'lucide-react';

export function TodayClasses({ subjects }: { subjects: any[] }) {
    const now = new Date();
    const currentDay = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'][now.getDay()];
    
    const todaysClasses = subjects.flatMap((subject: any) => {
        const schedules = subject.schedules?.length
            ? subject.schedules
            : parseLegacySchedule(subject.schedule, currentDay);
        return schedules
            .filter((schedule: any) => schedule.day_of_week === currentDay)
            .map((schedule: any) => ({ ...subject, activeSchedule: schedule }));
    }).sort((a: any, b: any) => String(a.activeSchedule.start_time).localeCompare(String(b.activeSchedule.start_time)));

    const upcomingClasses = todaysClasses.slice(0, 3); // Show top 3

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full shadow-xs hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Clases de Hoy</h3>
                    <p className="text-sm text-zinc-500">{new Date().toLocaleDateString('es-ES', { weekday: 'long' })}</p>
                </div>
                <Link href="/dashboard/schedule" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    Ver horario
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
            
            <div className="p-2 flex-1 overflow-y-auto">
                {upcomingClasses.length > 0 ? (
                    <div className="space-y-1">
                        {upcomingClasses.map((subj: any, index: number) => (
                             <ClassItem key={index} subject={subj} isActive={index === 0} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                        <Clock className="w-10 h-10 mb-3 opacity-20" />
                        <p>No hay clases programadas</p>
                    </div>
                )}
            </div>
            {upcomingClasses.length > 0 && (
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Siguiente clase en 45 min</span>
                        <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 w-2/3 rounded-full" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ClassItem({ subject, isActive }: { subject: any, isActive: boolean }) {
    const start = subject.activeSchedule?.start_time ? String(subject.activeSchedule.start_time).slice(0, 5) : '';
    const end = subject.activeSchedule?.end_time ? String(subject.activeSchedule.end_time).slice(0, 5) : '';
    const scheduleLabel = start && end ? `${start} - ${end}` : subject.schedule || 'Horario no definido';

    return (
        <div className={`group p-4 rounded-xl transition-all border ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent'}`}>
            <div className="flex items-start gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs ${isActive ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>
                    {subject.name.substring(0, 2).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className={`font-semibold truncate ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {subject.name}
                        </h4>
                        {isActive && <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">Ahora</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{scheduleLabel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Aula 204</span>
                        </div>
                    </div>
                 </div>
                 <button className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                     <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                 </button>
            </div>
        </div>
    )
}

function parseLegacySchedule(schedule: string | null | undefined, currentDay: string) {
    if (!schedule) return [];
    return schedule.includes(currentDay)
        ? [{ day_of_week: currentDay, start_time: schedule, end_time: '' }]
        : [];
}
