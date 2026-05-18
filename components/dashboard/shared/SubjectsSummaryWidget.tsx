"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Users } from "lucide-react";
import { type AcademicSubject, formatSubjectSchedule } from "@/lib/academic";

export function SubjectsSummaryWidget({ subjects = [], role }: { subjects?: AcademicSubject[]; role: string }) {
    const visibleSubjects = subjects.slice(0, 6);

    return (
        <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900" aria-label="Asignaturas">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 p-6 dark:border-zinc-800">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Asignaturas</p>
                    <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {role === "teacher" ? "Tus materias" : "Tus asignaturas"}
                    </h3>
                </div>
                <BookOpen className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                    {visibleSubjects.map((subject) => (
                        <Link
                            key={subject.id}
                            href={`/dashboard/subjects/${subject.id}`}
                            className="group flex items-center gap-4 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-black text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                                {String(subject.name || "AS").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-zinc-900 group-hover:text-sky-700 dark:text-zinc-100 dark:group-hover:text-sky-300">
                                    {subject.name}
                                </p>
                                <p className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500">
                                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{formatSubjectSchedule(subject)}</span>
                                </p>
                            </div>
                            <div className="hidden shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:flex">
                                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                {subject.student_count ?? subject.students_count ?? 0}
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-600" aria-hidden="true" />
                        </Link>
                    ))}

                    {visibleSubjects.length === 0 && (
                        <div className="p-8 text-center text-sm text-zinc-500">
                            No hay asignaturas para mostrar.
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
                <Link href="/dashboard/subjects" className="block w-full text-xs font-semibold text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100">
                    Ver todas
                </Link>
            </div>
        </section>
    );
}
