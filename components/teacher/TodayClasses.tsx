import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, MoreHorizontal, ArrowRight } from 'lucide-react';
import { currentDayName, flattenTodaySchedules, formatScheduleTime, isScheduleActive, minutesUntilSchedule, type ScheduledSubject, type ScheduleEntry } from '@/lib/schedule-utils';

type SubjectScheduleCard = {
    id?: string;
    name?: string | null;
    schedule?: string | null;
    schedules?: ScheduleEntry[] | null;
    room?: string | null;
    location?: string | null;
};

type TodayClass = ScheduledSubject<SubjectScheduleCard>;

export function TodayClasses({ subjects }: { subjects: SubjectScheduleCard[] }) {
    const now = new Date();
    const todaysClasses = flattenTodaySchedules(subjects, now);
    const visibleClasses = todaysClasses
        .filter((subject) => isScheduleActive(subject, now) || minutesUntilSchedule(subject, now) > 0)
        .slice(0, 3);
    const nextClass = todaysClasses.find((subject) => minutesUntilSchedule(subject, now) > 0);
    const footerLabel = nextClass
        ? `Classe següent d'aquí a ${formatMinutesUntil(minutesUntilSchedule(nextClass, now))}`
        : todaysClasses.length > 0
            ? "No queden més classes avui"
            : "Avui no hi ha classes";

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full shadow-xs hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Classes d&apos;avui</h3>
                    <p className="text-sm text-zinc-500">{currentDayName(now).toLowerCase()}</p>
                </div>
                <Link href="/dashboard/schedule" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    Veure horari
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="p-2 flex-1 overflow-y-auto">
                {visibleClasses.length > 0 ? (
                    <div className="space-y-1">
                        {visibleClasses.map((subj) => (
                             <ClassItem key={`${subj.id || subj.name}-${subj.activeSchedule.start_time}`} subject={subj} isActive={isScheduleActive(subj, now)} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                        <Clock className="w-10 h-10 mb-3 opacity-20" />
                        <p>No hi ha classes programades</p>
                    </div>
                )}
            </div>
            {todaysClasses.length > 0 && (
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">{footerLabel}</span>
                        {nextClass && (
                            <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(8, Math.min(100, 100 - (minutesUntilSchedule(nextClass, now) / 180) * 100))}%` }} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ClassItem({ subject, isActive }: { subject: TodayClass, isActive: boolean }) {
    const scheduleLabel = formatScheduleTime(subject.activeSchedule);
    const location = subject.activeSchedule?.room || subject.activeSchedule?.location || subject.room || subject.location || "Aula pendent";
    const subjectName = subject.name || "Assignatura";

    return (
        <div className={`group p-4 rounded-xl transition-all border ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent'}`}>
            <div className="flex items-start gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs ${isActive ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>
                    {subjectName.substring(0, 2).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className={`font-semibold truncate ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {subjectName}
                        </h4>
                        {isActive && <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">Ara</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{scheduleLabel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{location}</span>
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

function formatMinutesUntil(minutes: number) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}
