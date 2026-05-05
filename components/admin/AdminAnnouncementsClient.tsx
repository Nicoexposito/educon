"use client";

import { useState, useTransition } from "react";
import { Bell, Loader2, Megaphone, Plus, Users } from "lucide-react";
import { createAnnouncement } from "@/app/actions/admin";
import type { AdminAnnouncement } from "@/lib/admin-types";

type Message = { type: "success" | "error"; text: string } | null;

export default function AdminAnnouncementsClient({ announcements }: { announcements: AdminAnnouncement[] }) {
    const [message, setMessage] = useState<Message>(null);
    const [isPending, startTransition] = useTransition();

    const handleCreate = (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await createAnnouncement(formData);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Anunci publicat i notificacions generades." : result.error || "No s'ha pogut publicar l'anunci.",
            });
        });
    };

    return (
        <main className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Administració</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Anuncis globals</h1>
                <p className="mt-2 max-w-2xl text-zinc-500">Publica comunicacions del centre per a tothom, professorat o alumnat. També es creen notificacions internes.</p>
            </header>

            {message && (
                <div className={`mb-6 rounded-2xl border p-4 text-sm ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                    {message.text}
                </div>
            )}

            <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold">Nou anunci</h2>
                </div>
                <form action={handleCreate} className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                        <input name="title" required placeholder="Títol de l'anunci" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                        <select name="audience" defaultValue="all" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                            <option value="all">Tothom</option>
                            <option value="teachers">Professorat</option>
                            <option value="students">Alumnat</option>
                        </select>
                    </div>
                    <textarea name="content" required rows={5} placeholder="Escriu el missatge del centre..." className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <div className="flex justify-end">
                        <button disabled={isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:w-auto">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                            Publicar
                        </button>
                    </div>
                </form>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                    <h2 className="font-bold">Històric dels anuncis</h2>
                    <p className="mt-1 text-sm text-zinc-500">{announcements.length} publicacions</p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {announcements.map((announcement) => (
                        <article key={announcement.id} className="p-5">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <h3 className="font-bold">{announcement.title}</h3>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        {announcement.author?.full_name || "Administració"} · {formatDate(announcement.created_at)}
                                    </p>
                                </div>
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    {announcement.audience === "teachers" ? <Bell className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                                    {audienceLabel(announcement.audience)}
                                </span>
                            </div>
                            <p className="whitespace-pre-line text-sm leading-6 text-zinc-600 dark:text-zinc-300">{announcement.content}</p>
                        </article>
                    ))}
                    {announcements.length === 0 && (
                        <p className="p-10 text-center text-sm text-zinc-500">Encara no hi ha anuncis publicats.</p>
                    )}
                </div>
            </section>
        </main>
    );
}

function audienceLabel(audience: string | null) {
    if (audience === "teachers") return "Professorat";
    if (audience === "students") return "Alumnat";
    return "Tothom";
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}
