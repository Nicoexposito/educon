"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Users } from "lucide-react";
import { formatScheduleTime, type ScheduleEntry } from "@/lib/schedule-utils";

type DashboardSubject = {
    id?: string;
    name?: string | null;
    category?: string | null;
    schedule?: string | null;
    schedules?: ScheduleEntry[] | null;
    student_count?: number | null;
    students_count?: number | null;
    course?: { name?: string | null; code?: string | null } | null;
};

export function SubjectsOverviewWidget({
    subjects,
    role,
}: {
    subjects: DashboardSubject[];
    role: "teacher" | "student";
}) {
    const visibleSubjects = subjects.slice(0, 5);
    const title = role === "teacher" ? "Assignatures" : "Assignatures";
    const subtitle = role === "teacher"
        ? "Les classes que imparteixes"
        : "Les matèries on estàs matriculat";

    return (
        <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 p-6 dark:border-zinc-800">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
                    <p className="text-sm text-zinc-500">{subtitle}</p>
                </div>
                <Link
                    href="/dashboard/subjects"
                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    Veure
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {visibleSubjects.length > 0 ? (
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                        {visibleSubjects.map((subject) => {
                            const label = role === "student"
                                ? subject.course?.name || subject.course?.code || subject.category || "Sense curs"
                                : subject.category || "General";
                            const count = subject.student_count ?? subject.students_count ?? 0;

                            return (
                                <Link
                                    key={subject.id || subject.name}
                                    href={subject.id ? `/dashboard/subjects/${subject.id}` : "/dashboard/subjects"}
                                    className="group flex gap-4 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
                                        {(subject.name || "AS").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-300">
                                                {subject.name || "Assignatura"}
                                            </p>
                                            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                {label}
                                            </span>
                                        </div>
                                        <div className="mt-2 grid gap-1 text-xs text-zinc-500">
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                <span className="truncate">{formatSubjectSchedule(subject)}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                {count} alumnes
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex h-52 flex-col items-center justify-center p-8 text-center text-sm text-zinc-500">
                        <BookOpen className="mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-700" aria-hidden="true" />
                        No hi ha assignatures per mostrar.
                    </div>
                )}
            </div>
        </section>
    );
}

function formatSubjectSchedule(subject: DashboardSubject) {
    if (subject.schedules?.length) {
        return subject.schedules
            .map((schedule) => `${schedule.day_of_week || ""} ${formatScheduleTime(schedule)}`.trim())
            .join(", ");
    }

    return subject.schedule || "Horari no definit";
}
