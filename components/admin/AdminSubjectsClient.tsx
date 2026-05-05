"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowRight, BookOpen, Check, Clock, Loader2, Plus, Users } from "lucide-react";
import { createAdminSubject } from "@/app/actions/admin";
import type { AdminSchedule, AdminSubject, AdminUser } from "@/lib/admin-types";

type Message = { type: "success" | "error"; text: string } | null;

const DAYS = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];

export default function AdminSubjectsClient({ subjects, teachers }: { subjects: AdminSubject[]; teachers: AdminUser[] }) {
    const [message, setMessage] = useState<Message>(null);
    const [isPending, startTransition] = useTransition();

    const groupedSubjects = useMemo(() => {
        return subjects.reduce((groups: Record<string, AdminSubject[]>, subject) => {
            const category = subject.category || "General";
            groups[category] = [...(groups[category] || []), subject];
            return groups;
        }, {});
    }, [subjects]);

    const handleCreate = (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await createAdminSubject(formData);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Assignatura creada." : result.error || "No s'ha pogut crear l'assignatura.",
            });
        });
    };

    return (
        <main className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Administració</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Assignatures del centre</h1>
                <p className="mt-2 max-w-2xl text-zinc-500">Organitza matèries per categoria, assigna professor, defineix horari i revisa alumnat matriculat.</p>
            </header>

            {message && (
                <div className={`mb-6 rounded-2xl border p-4 text-sm ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                    {message.text}
                </div>
            )}

            <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold">Assignatura nova</h2>
                </div>
                <form action={handleCreate} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_0.8fr_1fr_0.7fr_0.7fr_0.7fr_auto]">
                    <input name="name" required placeholder="Nom de l'assignatura" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <input name="category" placeholder="Categoria" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <select name="teacher_id" required className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                        <option value="">Professor</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>{teacher.full_name || teacher.email}</option>
                        ))}
                    </select>
                    <select name="day_of_week" defaultValue="" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                        <option value="">Dia</option>
                        {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                    <input name="start_time" type="time" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <input name="end_time" type="time" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <button disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Crear
                    </button>
                </form>
            </section>

            <div className="space-y-10">
                {Object.entries(groupedSubjects).map(([category, categorySubjects]) => (
                    <section key={category}>
                        <div className="mb-4 flex items-center gap-2">
                            <span className="h-6 w-1.5 rounded-full bg-indigo-600" />
                            <h2 className="text-xl font-bold">{category}</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {categorySubjects.map((subject) => (
                                <Link
                                    key={subject.id}
                                    href={`/dashboard/admin/subjects/${subject.id}`}
                                    className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
                                >
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 font-black text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                            {String(subject.name || "AS").slice(0, 2).toUpperCase()}
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold">{subject.name}</h3>
                                    <p className="mt-1 truncate text-sm text-zinc-500">{subject.teacher?.full_name || "Sense professor assignat"}</p>
                                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                                            <Clock className="h-4 w-4 text-zinc-400" />
                                            <span className="truncate">{formatSchedule(subject)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                                            <Users className="h-4 w-4 text-zinc-400" />
                                            <span>{subject.student_count || 0} alumnes</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}

                {subjects.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                        <BookOpen className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                        No hi ha assignatures creades.
                    </div>
                )}
            </div>
        </main>
    );
}

function formatSchedule(subject: AdminSubject) {
    if (subject.schedules?.length) {
        return subject.schedules
            .map((schedule: AdminSchedule) => `${schedule.day_of_week} ${String(schedule.start_time).slice(0, 5)}-${String(schedule.end_time).slice(0, 5)}`)
            .join(", ");
    }
    return subject.schedule || "Horari pendent";
}
