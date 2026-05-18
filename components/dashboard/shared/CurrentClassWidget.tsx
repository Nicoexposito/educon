"use client";

import React, { useMemo } from 'react';
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import Link from 'next/link';
import { formatScheduleRange, getCurrentClassForSubjects, getNextClassForSubjects } from "@/lib/academic";

export function CurrentClassWidget({ subjects }: { subjects: any[] }) {
    const { currentClass, nextClass } = useMemo(() => {
        if (!subjects || subjects.length === 0) return { currentClass: null, nextClass: null };
        const now = new Date();
        return {
            currentClass: getCurrentClassForSubjects(subjects, now),
            nextClass: getNextClassForSubjects(subjects, now),
        };
    }, [subjects]);

    if (!currentClass) {
        return (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs flex h-full flex-col">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">La clase actual</p>
                        <h2 className="mt-1 text-lg font-bold text-foreground">Sin clase en curso</h2>
                    </div>
                    <div className="rounded-xl bg-secondary p-2 text-muted-foreground">
                        <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-8 text-center">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">No hay una clase activa ahora mismo.</p>
                        {nextClass && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Próxima: <span className="font-semibold text-foreground">{nextClass.name}</span> a las {formatScheduleRange(nextClass.activeSchedule)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const scheduleLabel = formatScheduleRange(currentClass.activeSchedule, currentClass.schedule || 'Horario no definido');

    return (
        <div className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-full flex flex-col"
            style={{
                background: 'linear-gradient(135deg, oklch(0.31 0.08 245) 0%, oklch(0.52 0.12 185) 100%)',
            }}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-white/25" aria-hidden="true" />

            <div className="relative z-10 flex flex-col h-full">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-white/65">La clase actual</p>

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
                    {currentClass.name}
                </h2>
                <p className="text-white/65 text-sm mb-6">
                    {currentClass.category || currentClass.description || 'Asignatura en curso'}
                </p>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/75 bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg">
                        <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{currentClass.student_count ?? currentClass.students_count ?? 0} alumnos</span>
                    </div>

                    <Link
                        href={`/dashboard/subjects/${currentClass.id}`}
                        aria-label={`Veure detalls de ${currentClass.name}`}
                        className="p-2.5 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-xl hover:opacity-90 transition-opacity shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
