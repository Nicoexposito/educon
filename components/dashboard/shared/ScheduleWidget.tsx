import React from 'react';
import { CheckCircle2 } from "lucide-react";

export function ScheduleWidget({ subjects }: { subjects: any[] }) {
    // Logic to highlight current class
    const now = new Date();
    const currentDay = ['DG', 'DL', 'DM', 'DC', 'DJ', 'DV', 'DS'][now.getDay()]; // Mapping for Catalan DB abbreviations (Dilluns, Dimarts...)
    // Or simplified: Just check string inclusion roughly for now if we don't strict parse

    // Filter subjects for today
    const todaysClasses = subjects.filter((s: any) => s.schedule && s.schedule.includes(currentDay)).sort((a: any, b: any) => {
        // Very basic sort by time string
        return a.schedule.localeCompare(b.schedule);
    });

    // Check if a class is active (mock logic: if index 0 is active for demo purposes or exact time parsing)
    // For demo, let's say the first class of the day is "Active" if it's morning.
    const activeClassIndex = todaysClasses.length > 0 ? 0 : -1;

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Horario de Hoy ({currentDay})</h3>

            <div className="flex-1 space-y-3">
                {todaysClasses.length > 0 ? todaysClasses.map((subj: any, idx: number) => (
                    <div key={subj.id} className={`flex items-center gap-3 p-2 rounded-lg ${idx === activeClassIndex ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800' : ''}`}>
                        <div className={`w-1.5 h-8 rounded-full ${subj.color || 'bg-zinc-300'}`} />
                        <div>
                            <div className="font-semibold text-sm">{subj.name}</div>
                            <div className="text-xs text-zinc-500">{subj.schedule.split(',').find((s: string) => s.includes(currentDay)) || subj.schedule}</div>
                        </div>
                        {idx === activeClassIndex && (
                            <div className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full animate-pulse">
                                En curso
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm">
                        <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                        No hay clases hoy
                    </div>
                )}
            </div>
        </div>
    );
}
