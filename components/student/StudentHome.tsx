"use client";

import { StudentStats } from "@/components/student/StudentStats";
import { TodayClasses } from "@/components/teacher/TodayClasses";
import { CurrentClassWidget } from "@/components/dashboard/shared/CurrentClassWidget";
import { AssignmentsListWidget } from "@/components/dashboard/shared/AssignmentsListWidget";
import { SubjectsSummaryWidget } from "@/components/dashboard/shared/SubjectsSummaryWidget";
import Link from "next/link";
import { Upload } from "lucide-react";
import { useStudentDashboardRealtime } from "@/lib/hooks/useDashboardRealtime";

export default function StudentHome({ data: initialData }: { data: any }) {
    const data = useStudentDashboardRealtime(initialData);

    const subjects = data?.subjects || [];
    const stats = data?.stats || { assignmentsPending: 0, avgGrade: "0.0" };
    const profile = data?.profile;
    const firstName = profile?.full_name?.split(' ')[0] || 'Alumne';

    return (
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10 lg:py-10">

            {/* Page Header */}
            <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                        Espai de l&apos;Alumne
                    </p>
                    <h1
                        className="text-3xl font-bold leading-tight text-foreground sm:text-4xl"
                        style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                    >
                        Bon dia, {firstName}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Tienes <strong className="text-foreground font-semibold">{stats.assignmentsPending}</strong> trabajos pendientes de entregar.
                    </p>
                </div>
                <Link
                    href="/dashboard/assignments"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:shrink-0"
                >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    Lliurar tasca
                </Link>
            </header>

            <StudentStats stats={stats} />

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
                            items={data?.assignments || []}
                            title="Pendientes de entregar"
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
                        <div className="flex h-36 items-end justify-between gap-2 overflow-x-auto px-1 sm:gap-3">
                            {[
                                { label: 'Mates', pct: 70 },
                                { label: 'Física', pct: 85 },
                                { label: 'Hist.', pct: 60 },
                                { label: 'Anglès', pct: 90 },
                                { label: 'Prog.', pct: 95 },
                            ].map(({ label, pct }) => (
                                <div key={label} className="group flex min-w-14 flex-1 flex-col items-center gap-2">
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
                    <div className="min-h-[28rem] lg:min-h-[600px]">
                        <SubjectsSummaryWidget subjects={subjects} role="student" />
                    </div>
                </div>
            </div>
        </main>
    );
}
