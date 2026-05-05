"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, KeyRound, Loader2, Plus, Search, ShieldOff, UserCog, Users } from "lucide-react";
import { createAdminUser, deactivateAdminUser, resetTemporaryPassword, updateAdminUser } from "@/app/actions/admin";
import type { AdminUser } from "@/lib/admin-types";

type Message = { type: "success" | "error"; text: string } | null;

export default function AdminUsersClient({ users }: { users: AdminUser[] }) {
    const [activeRole, setActiveRole] = useState<"teacher" | "student">("teacher");
    const [query, setQuery] = useState("");
    const [message, setMessage] = useState<Message>(null);
    const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
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
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Usuari desactivat." : result.error || "No s'ha pogut desactivar.",
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
                    {filteredUsers.map((user) => (
                        <form key={user.id} action={handleUpdate} className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1.2fr_1.2fr_0.75fr_0.75fr_0.6fr_auto] lg:items-center">
                            <input type="hidden" name="user_id" value={user.id} />
                            <input name="full_name" defaultValue={user.full_name || ""} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <input name="email" type="email" defaultValue={user.email || ""} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <input name="phone" defaultValue={user.phone || ""} placeholder="Telèfon" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <select name="role" defaultValue={user.role === "teacher" ? "teacher" : "student"} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                                <option value="teacher">Professor</option>
                                <option value="student">Alumne</option>
                            </select>
                            <select name="is_active" defaultValue={user.is_active === false ? "false" : "true"} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                                <option value="true">Actiu</option>
                                <option value="false">Inactiu</option>
                            </select>
                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                                <button
                                    type="button"
                                    disabled={isPending || user.is_active === false}
                                    onClick={() => handleDeactivate(user.id)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                                >
                                    <ShieldOff className="h-3.5 w-3.5" />
                                    Baixa
                                </button>
                            </div>
                        </form>
                    ))}
                    {filteredUsers.length === 0 && (
                        <p className="p-10 text-center text-sm text-zinc-500">No hi ha usuaris en aquesta vista.</p>
                    )}
                </div>
            </section>
        </main>
    );
}
