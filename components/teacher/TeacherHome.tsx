"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { TeacherStats } from "@/components/teacher/TeacherStats";
import { ScheduleWidget } from "@/components/dashboard/shared/ScheduleWidget";
import { RecentActivityLevel } from "@/components/teacher/RecentActivityLevel";
import { TodayClasses } from "@/components/teacher/TodayClasses";
import { CurrentClassWidget } from "@/components/dashboard/shared/CurrentClassWidget";
import { AssignmentsListWidget } from "@/components/dashboard/shared/AssignmentsListWidget";
import { useTeacherDashboardRealtime } from "@/lib/hooks/useDashboardRealtime";

export default function TeacherHome({ data: initialData }: { data: any }) {
    const data = useTeacherDashboardRealtime(initialData);

    const subjects = data?.subjects || [];
    const stats = data?.stats;
    const profile = data?.profile;
    const firstName = profile?.full_name?.split(' ')[0] || 'Professor';

    return (
        <main className="p-6 lg:p-10 max-w-7xl mx-auto">

            {/* Page Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                        Panell del Professor
                    </p>
                    <h1
                        className="text-4xl font-bold text-foreground leading-tight"
                        style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                    >
                        Bon dia, {firstName}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Aquí tens el resum de la teva activitat acadèmica d&apos;avui.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Link
                        href="/dashboard/schedule"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-medium text-sm hover:bg-secondary transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <CalendarDays className="w-4 h-4" aria-hidden="true" />
                        Veure agenda
                    </Link>
                    <Link
                        href="/dashboard/assignments"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl font-medium text-sm shadow-sm transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                        <CurrentClassWidget subjects={subjects} />
                        <TodayClasses subjects={subjects} />
                    </div>

                    <div className="h-80">
                        <AssignmentsListWidget
                            items={data?.pendingSubmissions || []}
                            title="Treballs per corregir"
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
                    <div className="h-[600px]">
                        <RecentActivityLevel items={data?.recentSubjectsAttendance || []} />
                    </div>
                </div>
            </div>
        </main>
    );
}
