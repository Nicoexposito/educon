"use client";

import { StudentStats } from "@/components/student/StudentStats";
import { TodayClasses } from "@/components/teacher/TodayClasses";
import { RecentActivityLevel } from "@/components/teacher/RecentActivityLevel";
import { CurrentClassWidget } from "@/components/dashboard/shared/CurrentClassWidget";
import { AssignmentsListWidget } from "@/components/dashboard/shared/AssignmentsListWidget";
import Link from "next/link";
import { Upload } from "lucide-react";

export default function StudentHome({ data }: { data: any }) {
    const subjects = data?.subjects || [];
    const stats = data?.stats || { assignmentsPending: 0, avgGrade: "0.0" };
    const profile = data?.profile;
    const firstName = profile?.full_name?.split(' ')[0] || 'Alumno';

    return (
        <main className="p-6 lg:p-10 max-w-7xl mx-auto">

            {/* Page Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                        Espai de l&apos;Alumne
                    </p>
                    <h1
                        className="text-4xl font-bold text-foreground leading-tight"
                        style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                    >
                        Bon dia, {firstName}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Tens <strong className="text-foreground font-semibold">{stats.assignmentsPending}</strong> tasques pendents aquesta setmana.
                    </p>
                </div>
                <Link
                    href="/dashboard/assignments"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl font-medium text-sm shadow-sm transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none shrink-0"
                >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    Entregar Tarea
                </Link>
            </header>

            <StudentStats stats={stats} />

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
                            items={data?.assignments || []}
                            title="Tareas Pendientes"
                            role="student"
                        />
                    </div>

                    {/* Grades Bar Chart */}
                    <section aria-label="Evolució de notes" className="bg-card rounded-2xl border border-border p-6 shadow-xs">
                        <h2
                            className="font-semibold text-base text-foreground mb-6"
                            style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                        >
                            Evolució de Notes
                        </h2>
                        <div className="flex items-end justify-between gap-3 h-36 px-1">
                            {[
                                { label: 'Mates', pct: 70 },
                                { label: 'Física', pct: 85 },
                                { label: 'Hist.', pct: 60 },
                                { label: 'Anglès', pct: 90 },
                                { label: 'Prog.', pct: 95 },
                            ].map(({ label, pct }) => (
                                <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
                                    <span className="text-xs font-semibold text-foreground opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                                        {pct}%
                                    </span>
                                    <div className="w-full bg-secondary rounded-lg relative h-28 overflow-hidden flex items-end">
                                        <div
                                            style={{ height: `${pct}%` }}
                                            className="w-full bg-[var(--primary)] dark:bg-[var(--accent)] rounded-lg transition-all duration-500 group-hover:opacity-90"
                                            role="img"
                                            aria-label={`${label}: ${pct}%`}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate w-full text-center">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Side Column — 1/3 */}
                <div className="space-y-6">
                    <div className="h-[600px]">
                        <RecentActivityLevel />
                    </div>
                </div>
            </div>
        </main>
    );
}
}
