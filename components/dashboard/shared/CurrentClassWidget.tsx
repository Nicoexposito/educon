"use client";

import React, { useMemo } from 'react';
import { Clock, MapPin, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { flattenTodaySchedules, formatScheduleTime, isScheduleActive, minutesUntilSchedule, type ScheduleEntry } from '@/lib/schedule-utils';
import { useCurrentTime } from '@/lib/hooks/useCurrentTime';

type CurrentSubject = {
    id?: string;
    name?: string | null;
    category?: string | null;
    course?: { name?: string | null; code?: string | null } | null;
    schedule?: string | null;
    schedules?: ScheduleEntry[] | null;
    room?: string | null;
    location?: string | null;
};

export function CurrentClassWidget({ subjects }: { subjects: CurrentSubject[] }) {
    const now = useCurrentTime();
    const todaysClasses = useMemo(() => {
        if (!subjects || subjects.length === 0) return [];
        return flattenTodaySchedules(subjects, now);
    }, [subjects, now]);

    const currentClass = useMemo(() => {
        return todaysClasses.find((subject) => isScheduleActive(subject, now)) || null;
    }, [todaysClasses, now]);

    const nextClass = useMemo(() => {
        return todaysClasses.find((subject) => minutesUntilSchedule(subject, now) > 0) || null;
    }, [todaysClasses, now]);

    if (!currentClass) {
        const nextLabel = nextClass
            ? `Propera: ${nextClass.name || "classe"} · ${formatScheduleTime(nextClass.activeSchedule)}`
            : todaysClasses.length > 0
                ? "No queden més classes avui."
                : "Avui no tens classes programades.";

        return (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs flex h-full flex-col justify-between">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" aria-hidden="true" />
                        Sense classe ara
                    </span>
                    <h2
                        className="mt-5 text-2xl font-bold leading-tight text-foreground"
                        style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                    >
                        No tens classe ara
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">{nextLabel}</p>
                </div>
                <Link
                    href="/dashboard/schedule"
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Veure horari
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </div>
        );
    }

    const scheduleLabel = formatScheduleTime(currentClass.activeSchedule);
    const className = currentClass.name || "Classe actual";
    const detailLabel = currentClass.category || currentClass.course?.name || currentClass.course?.code || "Assignatura";
    const location = currentClass.activeSchedule?.room || currentClass.activeSchedule?.location || currentClass.room || currentClass.location || "Aula pendent";
    const href = currentClass.id ? `/dashboard/subjects/${currentClass.id}` : "/dashboard/subjects";

    return (
        <div className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-full flex flex-col"
            style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, oklch(0.26 0.06 258) 100%)',
            }}
        >
            {/* Decorative geometry */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                style={{ background: 'var(--accent)', filter: 'blur(40px)' }}
                aria-hidden="true"
            />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 border-2 border-white"
                aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Status badge */}
                <div className="flex items-center gap-3 mb-5">
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
                        En curs
                    </span>
                    <span className="text-white/70 text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <time>{scheduleLabel}</time>
                    </span>
                </div>

                <h2
                    className="text-2xl font-bold leading-tight mb-1"
                    style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                >
                    {className}
                </h2>
                <p className="text-white/60 text-sm mb-6">{detailLabel}</p>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/70 bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{location}</span>
                    </div>

                    <Link
                        href={href}
                        aria-label={`Veure detalls de ${className}`}
                        className="p-2.5 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-xl hover:opacity-90 transition-opacity shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
