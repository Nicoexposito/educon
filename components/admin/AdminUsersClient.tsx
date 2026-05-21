"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Check, KeyRound, Loader2, Plus, Save, Search, ShieldOff, UserCheck, UserCog, Users, X } from "lucide-react";
import { activateAdminUser, createAdminUser, deactivateAdminUser, resetTemporaryPassword, updateAdminUser, updateStudentSubjectEnrollments } from "@/app/actions/admin";
import type { AdminSchedule, AdminStudentSubjectMap, AdminSubject, AdminUser } from "@/lib/admin-types";

type Message = { type: "success" | "error"; text: string } | null;

export default function AdminUsersClient({
    users,
    subjects,
    studentSubjectIds,
}: {
    users: AdminUser[];
    subjects: AdminSubject[];
    studentSubjectIds: AdminStudentSubjectMap;
}) {
    const [activeRole, setActiveRole] = useState<"teacher" | "student">("teacher");
    const [query, setQuery] = useState("");
    const [message, setMessage] = useState<Message>(null);
    const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
    const [localUserActive, setLocalUserActive] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(users.map((user) => [user.id, user.is_active !== false])),
    );
    const [localStudentSubjectIds, setLocalStudentSubjectIds] = useState<AdminStudentSubjectMap>(studentSubjectIds);
    const [subjectEditorStudent, setSubjectEditorStudent] = useState<AdminUser | null>(null);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const filteredUsers = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return users
            .filter((user) => user.role === activeRole)
            .filter((user) => {
                if (!normalizedQuery) return true;
                return [user.full_name, user.email, user.phone]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
            });
    }, [activeRole, query, users]);

    const teacherCount = users.filter((user) => user.role === "teacher").length;
    const studentCount = users.filter((user) => user.role === "student").length;
    const groupedSubjects = useMemo(() => {
        return subjects.reduce((groups: Record<string, AdminSubject[]>, subject) => {
            const category = subject.category || "General";
            groups[category] = [...(groups[category] || []), subject];
            return groups;
        }, {});
    }, [subjects]);

    const handleCreate = (formData: FormData) => {
        setMessage(null);
        setTemporaryPassword(null);
        startTransition(async () => {
            const result = await createAdminUser(formData);
            if (result.success) {
                setMessage({ type: "success", text: "Usuari creat correctament." });
                setTemporaryPassword(result.temporaryPassword || null);
            } else {
                setMessage({ type: "error", text: result.error || "No s'ha pogut crear l'usuari." });
            }
        });
    };

    const handleUpdate = (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await updateAdminUser(formData);
            if (result.success) {
                const userId = String(formData.get("user_id") || "");
                if (userId) {
                    setLocalUserActive((current) => ({
                        ...current,
                        [userId]: formData.get("is_active") !== "false",
                    }));
                }
            }
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Usuari actualitzat." : result.error || "No s'ha pogut actualitzar.",
            });
        });
    };

    const handleDeactivate = (userId: string) => {
        setMessage(null);
        startTransition(async () => {
            const result = await deactivateAdminUser(userId);
            if (result.success) {
                setLocalUserActive((current) => ({ ...current, [userId]: false }));
            }
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Usuari desactivat." : result.error || "No s'ha pogut desactivar.",
            });
        });
    };

    const handleActivate = (userId: string) => {
        setMessage(null);
        startTransition(async () => {
            const result = await activateAdminUser(userId);
            if (result.success) {
                setLocalUserActive((current) => ({ ...current, [userId]: true }));
            }
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Usuari activat." : result.error || "No s'ha pogut activar.",
            });
        });
    };

    const handleResetPassword = (userId: string) => {
        setMessage(null);
        setTemporaryPassword(null);
        startTransition(async () => {
            const result = await resetTemporaryPassword(userId);
            if (result.success) {
                setMessage({ type: "success", text: "Contrasenya temporal reiniciada." });
                setTemporaryPassword(result.temporaryPassword || null);
            } else {
                setMessage({ type: "error", text: result.error || "No s'ha pogut reiniciar la contrasenya." });
            }
        });
    };

    const openSubjectEditor = (student: AdminUser) => {
        setSubjectEditorStudent(student);
        setSelectedSubjectIds(new Set(localStudentSubjectIds[student.id] || []));
    };

    const closeSubjectEditor = () => {
        if (isPending) return;
        setSubjectEditorStudent(null);
        setSelectedSubjectIds(new Set());
    };

    const toggleSubject = (subjectId: string) => {
        setSelectedSubjectIds((current) => {
            const next = new Set(current);
            if (next.has(subjectId)) next.delete(subjectId);
            else next.add(subjectId);
            return next;
        });
    };

    const handleSaveStudentSubjects = () => {
        if (!subjectEditorStudent) return;

        const student = subjectEditorStudent;
        const nextSubjectIds = Array.from(selectedSubjectIds);
        setMessage(null);
        startTransition(async () => {
            const result = await updateStudentSubjectEnrollments(student.id, nextSubjectIds);
            if (result.success) {
                setLocalStudentSubjectIds((current) => ({
                    ...current,
                    [student.id]: nextSubjectIds,
                }));
                setSubjectEditorStudent(null);
                setSelectedSubjectIds(new Set());
            }
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Assignatures de l'alumne actualitzades." : result.error || "No s'han pogut actualitzar les assignatures.",
            });
        });
    };

    return (
        <main className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Administració</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Usuaris del centre</h1>
                <p className="mt-2 max-w-2xl text-zinc-500">Crea professors i alumnes amb contrasenya temporal, edita dades bàsiques i desactiva comptes sense perdre el registre acadèmic.</p>
            </header>

            {(message || temporaryPassword) && (
                <div className={`mb-6 rounded-2xl border p-4 text-sm ${message?.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                    {message?.text}
                    {temporaryPassword && (
                        <div className="mt-3 rounded-xl bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
                            Contrasenya temporal: {temporaryPassword}
                        </div>
                    )}
                </div>
            )}

            <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold">Alta nova</h2>
                </div>
                <form action={handleCreate} className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.9fr_auto]">
                    <input name="full_name" required placeholder="Nom complet" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <input name="email" required type="email" placeholder="correu@centre.cat" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <input name="phone" placeholder="Telèfon" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <select name="role" defaultValue={activeRole} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                        <option value="teacher">Professor</option>
                        <option value="student">Alumne</option>
                    </select>
                    <input name="temporary_password" placeholder="Contrasenya temporal" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <button disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Crear
                    </button>
                </form>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/70">
                        <button
                            onClick={() => setActiveRole("teacher")}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeRole === "teacher" ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white" : "text-zinc-500"}`}
                        >
                            <UserCog className="h-4 w-4" />
                            Professors
                            <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">{teacherCount}</span>
                        </button>
                        <button
                            onClick={() => setActiveRole("student")}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeRole === "student" ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white" : "text-zinc-500"}`}
                        >
                            <Users className="h-4 w-4" />
                            Alumnes
                            <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">{studentCount}</span>
                        </button>
                    </div>
                    <div className="relative w-full lg:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar per nom, correu o telèfon"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                        />
                    </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredUsers.map((user) => {
                        const isUserActive = localUserActive[user.id] ?? user.is_active !== false;

                        return (
                        <form key={user.id} action={handleUpdate} className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1.2fr_1.2fr_0.75fr_0.75fr_0.6fr_auto] lg:items-center">
                            <input type="hidden" name="user_id" value={user.id} />
                            <input name="full_name" defaultValue={user.full_name || ""} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <input name="email" type="email" defaultValue={user.email || ""} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <input name="phone" defaultValue={user.phone || ""} placeholder="Telèfon" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <select name="role" defaultValue={user.role === "teacher" ? "teacher" : "student"} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                                <option value="teacher">Professor</option>
                                <option value="student">Alumne</option>
                            </select>
                            <select key={String(isUserActive)} name="is_active" defaultValue={isUserActive ? "true" : "false"} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                                <option value="true">Actiu</option>
                                <option value="false">Inactiu</option>
                            </select>
                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                {user.role === "student" && (
                                    <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => openSubjectEditor(user)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900/60 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                                    >
                                        <BookOpen className="h-3.5 w-3.5" />
                                        Assignatures
                                        <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                                            {localStudentSubjectIds[user.id]?.length || 0}
                                        </span>
                                    </button>
                                )}
                                <button disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleResetPassword(user.id)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:border-amber-900/60 dark:text-amber-300 dark:hover:bg-amber-950/30"
                                >
                                    <KeyRound className="h-3.5 w-3.5" />
                                    Reset
                                </button>
                                {isUserActive ? (
                                    <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => handleDeactivate(user.id)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                                    >
                                        <ShieldOff className="h-3.5 w-3.5" />
                                        Baixa
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => handleActivate(user.id)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-40 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                                    >
                                        <UserCheck className="h-3.5 w-3.5" />
                                        Alta
                                    </button>
                                )}
                            </div>
                        </form>
                        );
                    })}
                    {filteredUsers.length === 0 && (
                        <p className="p-10 text-center text-sm text-zinc-500">No hi ha usuaris en aquesta vista.</p>
                    )}
                </div>
            </section>

            {subjectEditorStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <button
                        type="button"
                        aria-label="Tancar selector d'assignatures"
                        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-sm"
                        onClick={closeSubjectEditor}
                    />
                    <section role="dialog" aria-modal="true" className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                        <header className="flex flex-col gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Assignatures de l'alumne</p>
                                <h2 className="mt-1 truncate text-xl font-bold">{subjectEditorStudent.full_name || subjectEditorStudent.email}</h2>
                                <p className="mt-1 truncate text-sm text-zinc-500">{subjectEditorStudent.email}</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Tancar"
                                onClick={closeSubjectEditor}
                                disabled={isPending}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="flex-1 space-y-6 overflow-y-auto p-5">
                            {Object.entries(groupedSubjects).map(([category, categorySubjects]) => (
                                <section key={category}>
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <h3 className="font-bold">{category}</h3>
                                        <span className="text-xs font-semibold text-zinc-400">{categorySubjects.length} assignatures</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {categorySubjects.map((subject) => {
                                            const selected = selectedSubjectIds.has(subject.id);
                                            return (
                                                <button
                                                    key={subject.id}
                                                    type="button"
                                                    onClick={() => toggleSubject(subject.id)}
                                                    className={`flex min-h-[88px] items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${selected ? "border-indigo-300 bg-indigo-50 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-100" : "border-zinc-200 bg-white hover:border-indigo-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-900 dark:hover:bg-zinc-900"}`}
                                                >
                                                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 dark:border-zinc-700"}`}>
                                                        {selected && <Check className="h-3.5 w-3.5" />}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-sm font-bold">{subject.name || "Assignatura"}</span>
                                                        <span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">{formatSchedule(subject)}</span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}

                            {subjects.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
                                    Encara no hi ha assignatures creades.
                                </div>
                            )}
                        </div>

                        <footer className="flex flex-col gap-3 border-t border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-zinc-500">{selectedSubjectIds.size} assignatures seleccionades</p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSubjectIds(new Set())}
                                    disabled={isPending || selectedSubjectIds.size === 0}
                                    className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                >
                                    Netejar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveStudentSubjects}
                                    disabled={isPending}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar assignatures
                                </button>
                            </div>
                        </footer>
                    </section>
                </div>
            )}
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
