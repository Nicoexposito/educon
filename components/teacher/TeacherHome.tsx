"use client";

import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { TeacherStats } from "@/components/teacher/TeacherStats";
import { TodayClasses } from "@/components/teacher/TodayClasses";
import { CurrentClassWidget } from "@/components/dashboard/shared/CurrentClassWidget";
import { AssignmentsListWidget } from "@/components/dashboard/shared/AssignmentsListWidget";
import { SubjectsSummaryWidget } from "@/components/dashboard/shared/SubjectsSummaryWidget";
import { useTeacherDashboardRealtime } from "@/lib/hooks/useDashboardRealtime";

export default function TeacherHome({ data: initialData }: { data: any }) {
    const data = useTeacherDashboardRealtime(initialData);

    const subjects = data?.subjects || [];
    const stats = data?.stats;
    const profile = data?.profile;
    const firstName = profile?.full_name?.split(' ')[0] || 'Professor';

    return (
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10 lg:py-10">

            {/* Page Header */}
            <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                        Panell del Professor
                    </p>
                    <h1
                        className="text-3xl font-bold leading-tight text-foreground sm:text-4xl"
                        style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                    >
                        Bon dia, {firstName}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Tienes a mano la clase actual, el horario, tus asignaturas y los trabajos por corregir.
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
                    <Link
                        href="/dashboard/schedule"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <CalendarDays className="w-4 h-4" aria-hidden="true" />
                        Veure agenda
                    </Link>
                    <Link
                        href="/dashboard/assignments"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Tasca nova
                    </Link>
                </div>
            </header>

            <TeacherStats stats={stats} />

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column — 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:[&>*]:min-h-80">
                        <CurrentClassWidget subjects={subjects} />
                        <TodayClasses subjects={subjects} />
                    </div>

                    <div className="min-h-80">
                        <AssignmentsListWidget
                            items={data?.pendingSubmissions || []}
                            title="Pendientes de corregir"
                            role="teacher"
                        />
                    </div>

                    {/* Quick Actions */}
                    <section aria-label="Accesos ràpids" className="bg-card rounded-2xl border border-border p-6 shadow-xs">
                        <h2
                            className="font-semibold text-base text-foreground mb-4"
                            style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                        >
                            Accesos Ràpids
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Crear esdeveniment', href: '/dashboard/events/new' },
                                { label: 'Pujar notes', href: '/dashboard/subjects' },
                            ].map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="p-4 rounded-xl bg-secondary hover:bg-accent/10 hover:text-accent-foreground border border-border hover:border-accent/30 transition-colors duration-150 text-sm font-medium text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    {label}
                                </Link>
                            ))}
                            <button
                                onClick={() => window.alert('Funció no implementada: enviar missatge')}
                                className="p-4 rounded-xl bg-secondary hover:bg-accent/10 hover:text-accent-foreground border border-border hover:border-accent/30 transition-colors duration-150 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                Enviar missatge
                            </button>
                            <button
                                onClick={() => window.alert('Descarregant informe...')}
                                className="p-4 rounded-xl bg-secondary hover:bg-accent/10 hover:text-accent-foreground border border-border hover:border-accent/30 transition-colors duration-150 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                Informe
                            </button>
                        </div>
                    </section>
                </div>

                {/* Side Column — 1/3 */}
                <div className="space-y-6">
                    <div className="min-h-[28rem] lg:min-h-[600px]">
                        <SubjectsSummaryWidget subjects={subjects} role="teacher" />
                    </div>
                </div>
            </div>
        </main>
    );
}
