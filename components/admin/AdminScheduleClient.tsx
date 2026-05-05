"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Check, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { deleteSubjectSchedule, updateSubjectSchedule } from "@/app/actions/admin";
import type { AdminSchedule, AdminSubject } from "@/lib/admin-types";

type Message = { type: "success" | "error"; text: string } | null;

const DAYS = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];

type AdminScheduleRow = AdminSchedule & { subject: AdminSubject };

export default function AdminScheduleClient({ subjects }: { subjects: AdminSubject[] }) {
    const [message, setMessage] = useState<Message>(null);
    const [isPending, startTransition] = useTransition();

    const scheduleRows = useMemo(() => {
        return subjects.flatMap((subject): AdminScheduleRow[] =>
            (subject.schedules || []).map((schedule) => ({
                ...schedule,
                subject,
            })),
        );
    }, [subjects]);

    const handleAddSchedule = (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await updateSubjectSchedule(formData);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Horari afegit." : result.error || "No s'ha pogut afegir l'horari.",
            });
        });
    };

    const handleDeleteSchedule = (scheduleId: string, subjectId: string) => {
        setMessage(null);
        startTransition(async () => {
            const result = await deleteSubjectSchedule(scheduleId, subjectId);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Horari eliminat." : result.error || "No s'ha pogut eliminar l'horari.",
            });
        });
    };

    return (
        <main className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Administració</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Horaris del centre</h1>
                <p className="mt-2 max-w-2xl text-zinc-500">Controla les franges de cada assignatura. Els canvis impacten en la vista de professor i alumne.</p>
            </header>

            {message && (
                <div className={`mb-6 rounded-2xl border p-4 text-sm ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                    {message.text}
                </div>
            )}

            <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold">Afegir franja</h2>
                </div>
                <form action={handleAddSchedule} className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_auto]">
                    <select name="subject_id" required defaultValue="" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                        <option value="">Assignatura</option>
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                    </select>
                    <select name="day_of_week" required defaultValue="" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                        <option value="">Dia</option>
                        {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                    <input name="start_time" required type="time" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <input name="end_time" required type="time" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <button disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Guardar
                    </button>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                    <h2 className="font-bold">Franges configurades</h2>
                    <p className="mt-1 text-sm text-zinc-500">{scheduleRows.length} horaris actius</p>
                </div>
                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Dia</th>
                                <th className="px-5 py-3 font-semibold">Hora</th>
                                <th className="px-5 py-3 font-semibold">Assignatura</th>
                                <th className="px-5 py-3 font-semibold">Professor</th>
                                <th className="px-5 py-3 text-right font-semibold">Acció</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {scheduleRows.map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                    <td className="px-5 py-3 font-semibold">{row.day_of_week}</td>
                                    <td className="px-5 py-3 text-zinc-500">{String(row.start_time).slice(0, 5)}-{String(row.end_time).slice(0, 5)}</td>
                                    <td className="px-5 py-3">
                                        <Link href={`/dashboard/admin/subjects/${row.subject.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">{row.subject.name}</Link>
                                    </td>
                                    <td className="px-5 py-3 text-zinc-500">{row.subject.teacher?.full_name || "Sense professor"}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => handleDeleteSchedule(row.id, row.subject.id)} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30">
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid gap-3 p-4 lg:hidden">
                    {scheduleRows.map((row) => (
                        <article key={row.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-bold">{row.subject.name}</p>
                                    <p className="mt-1 text-sm text-zinc-500">{row.subject.teacher?.full_name || "Sense professor"}</p>
                                </div>
                                <CalendarDays className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                                <Clock className="h-4 w-4 text-zinc-400" />
                                {row.day_of_week} {String(row.start_time).slice(0, 5)}-{String(row.end_time).slice(0, 5)}
                            </div>
                            <button onClick={() => handleDeleteSchedule(row.id, row.subject.id)} disabled={isPending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30">
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar
                            </button>
                        </article>
                    ))}
                </div>

                {scheduleRows.length === 0 && (
                    <p className="p-10 text-center text-sm text-zinc-500">Encara no hi ha horaris configurats.</p>
                )}
            </section>
        </main>
    );
}
