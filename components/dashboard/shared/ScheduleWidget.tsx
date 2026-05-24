"use client";

import React from 'react';
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { currentShortDayName, flattenTodaySchedules, formatScheduleTime, isScheduleActive, type ScheduleEntry } from '@/lib/schedule-utils';
import { useCurrentTime } from '@/lib/hooks/useCurrentTime';

type ScheduleSubject = {
    id?: string;
    name?: string | null;
    color?: string | null;
    schedule?: string | null;
    schedules?: ScheduleEntry[] | null;
};

export function ScheduleWidget({ subjects }: { subjects: ScheduleSubject[] }) {
    const now = useCurrentTime();
    const currentDay = currentShortDayName(now);
    const todaysClasses = flattenTodaySchedules(subjects, now);

    return (
        <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Horari</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Avui ({currentDay})</p>
                </div>
                <Link
                    href="/dashboard/schedule"
                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    Veure
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
            </div>

            <div className="flex-1 space-y-3">
                {todaysClasses.length > 0 ? todaysClasses.map((subj, idx) => (
                    <div key={`${subj.id || subj.name}-${subj.activeSchedule.start_time}-${idx}`} className={`flex items-center gap-3 p-2 rounded-lg ${isScheduleActive(subj, now) ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800' : ''}`}>
                        <div className={`w-1.5 h-8 rounded-full ${subj.color || 'bg-zinc-300'}`} />
                        <div>
                            <div className="font-semibold text-sm">{subj.name || "Assignatura"}</div>
                            <div className="text-xs text-zinc-500">{formatScheduleTime(subj.activeSchedule)}</div>
                        </div>
                        {isScheduleActive(subj, now) && (
                            <div className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full animate-pulse">
                                En curs
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm">
                        <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                        Avui no hi ha classes
                    </div>
                )}
            </div>
        </div>
    );
}
