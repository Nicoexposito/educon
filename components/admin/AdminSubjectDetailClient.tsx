"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock, Loader2, Plus, Trash2, UserMinus, Users } from "lucide-react";
import {
    deleteSubjectSchedule,
    enrollStudentsInSubject,
    removeStudentFromSubject,
    updateAdminSubject,
    updateSubjectSchedule,
} from "@/app/actions/admin";
import type { AdminSchedule, AdminSubject, AdminUser } from "@/lib/admin-types";

type Message = { type: "success" | "error"; text: string } | null;

const DAYS = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];

export default function AdminSubjectDetailClient({
    subject,
    roster,
    availableStudents,
    teachers,
}: {
    subject: AdminSubject;
    roster: AdminUser[];
    availableStudents: AdminUser[];
    teachers: AdminUser[];
}) {
    const [message, setMessage] = useState<Message>(null);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const selectedCount = selectedStudents.size;
    const scheduleText = useMemo(() => formatSchedule(subject), [subject]);

    const handleUpdateSubject = (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await updateAdminSubject(formData);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Assignatura actualitzada." : result.error || "No s'ha pogut actualitzar.",
            });
        });
    };

    const handleEnroll = () => {
        setMessage(null);
        startTransition(async () => {
            const result = await enrollStudentsInSubject(subject.id, Array.from(selectedStudents));
            if (result.success) setSelectedStudents(new Set());
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Alumnes matriculats." : result.error || "No s'han pogut matricular.",
            });
        });
    };

    const handleRemoveStudent = (studentId: string) => {
        setMessage(null);
        startTransition(async () => {
            const result = await removeStudentFromSubject(subject.id, studentId);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Alumne retirat de l'assignatura." : result.error || "No s'ha pogut retirar.",
            });
        });
    };

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

    const handleDeleteSchedule = (scheduleId: string) => {
        setMessage(null);
        startTransition(async () => {
            const result = await deleteSubjectSchedule(scheduleId, subject.id);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Horari eliminat." : result.error || "No s'ha pogut eliminar l'horari.",
            });
        });
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents((current) => {
            const next = new Set(current);
            if (next.has(studentId)) next.delete(studentId);
            else next.add(studentId);
            return next;
        });
    };

    return (
        <main className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <Link href="/dashboard/admin/subjects" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
                <ArrowLeft className="h-4 w-4" />
                Tornar a assignatures
            </Link>

            <header className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">{subject.category || "General"}</p>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{subject.name}</h1>
                        <p className="mt-2 max-w-2xl text-zinc-500">{subject.description || "Sense descripció."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                            <Clock className="h-4 w-4 text-zinc-400" />
                            {scheduleText}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                            <Users className="h-4 w-4 text-zinc-400" />
                            {roster.length} alumnes
                        </span>
                    </div>
                </div>
            </header>

            {message && (
                <div className={`mb-6 rounded-2xl border p-4 text-sm ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
                    <h2 className="mb-5 font-bold">Dades principals</h2>
                    <form action={handleUpdateSubject} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input type="hidden" name="subject_id" value={subject.id} />
                        <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Nom</span>
                            <input name="name" defaultValue={subject.name || ""} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Categoria</span>
                            <input name="category" defaultValue={subject.category || "General"} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                        </label>
                        <label className="space-y-1.5 md:col-span-2">
                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Professor</span>
                            <select name="teacher_id" defaultValue={subject.teacher_id || ""} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>{teacher.full_name || teacher.email}</option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-1.5 md:col-span-2">
                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Descripció</span>
                            <textarea name="description" defaultValue={subject.description || ""} rows={4} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                        </label>
                        <div className="md:col-span-2 flex justify-end">
                            <button disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Guardar canvis
                            </button>
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="mb-5 font-bold">Horaris</h2>
                    <div className="mb-5 space-y-2">
                        {(subject.schedules || []).map((schedule) => (
                            <div key={schedule.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
                                <span>{schedule.day_of_week} {String(schedule.start_time).slice(0, 5)}-{String(schedule.end_time).slice(0, 5)}</span>
                                <button onClick={() => handleDeleteSchedule(schedule.id)} disabled={isPending} className="text-rose-600 hover:text-rose-700 disabled:opacity-50">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {(!subject.schedules || subject.schedules.length === 0) && (
                            <p className="rounded-xl bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-zinc-800/60">Sense horaris.</p>
                        )}
                    </div>
                    <form action={handleAddSchedule} className="grid grid-cols-1 gap-3">
                        <input type="hidden" name="subject_id" value={subject.id} />
                        <select name="day_of_week" required defaultValue="" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                            <option value="">Dia</option>
                            {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                            <input name="start_time" required type="time" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <input name="end_time" required type="time" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                        </div>
                        <button disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900/60 dark:text-indigo-300 dark:hover:bg-indigo-950/30">
                            <Plus className="h-4 w-4" />
                            Afegir horari
                        </button>
                    </form>
                </section>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                        <h2 className="font-bold">Alumnes matriculats</h2>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {roster.map((student) => (
                            <div key={student.id} className="flex items-center justify-between gap-4 p-4">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">{student.full_name || student.email}</p>
                                    <p className="truncate text-sm text-zinc-500">{student.email} {student.phone ? `· ${student.phone}` : ""}</p>
                                </div>
                                <button onClick={() => handleRemoveStudent(student.id)} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30">
                                    <UserMinus className="h-3.5 w-3.5" />
                                    Treure
                                </button>
                            </div>
                        ))}
                        {roster.length === 0 && (
                            <p className="p-8 text-center text-sm text-zinc-500">Encara no hi ha alumnes matriculats.</p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
                        <div>
                            <h2 className="font-bold">Afegir alumnes</h2>
                            <p className="mt-1 text-sm text-zinc-500">{selectedCount} seleccionats</p>
                        </div>
                        <button onClick={handleEnroll} disabled={isPending || selectedCount === 0} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Matricular
                        </button>
                    </div>
                    <div className="max-h-[420px] divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
                        {availableStudents.map((student) => (
                            <button
                                key={student.id}
                                onClick={() => toggleStudent(student.id)}
                                className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                            >
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold">{student.full_name || student.email}</span>
                                    <span className="block truncate text-sm text-zinc-500">{student.email}</span>
                                </span>
                                <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${selectedStudents.has(student.id) ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 dark:border-zinc-700"}`}>
                                    {selectedStudents.has(student.id) && <Check className="h-3.5 w-3.5" />}
                                </span>
                            </button>
                        ))}
                        {availableStudents.length === 0 && (
                            <p className="p-8 text-center text-sm text-zinc-500">No hi ha alumnes disponibles per afegir.</p>
                        )}
                    </div>
                </section>
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
