"use client";

import { StudentStats } from "@/components/student/StudentStats";
import { RecentActivityLevel } from "@/components/teacher/RecentActivityLevel";
import { CurrentClassWidget } from "@/components/dashboard/shared/CurrentClassWidget";
import { AssignmentsListWidget } from "@/components/dashboard/shared/AssignmentsListWidget";
import { ScheduleWidget } from "@/components/dashboard/shared/ScheduleWidget";
import { SubjectsOverviewWidget } from "@/components/dashboard/shared/SubjectsOverviewWidget";
import Link from "next/link";
import { Award, GraduationCap, Upload } from "lucide-react";
import { useStudentDashboardRealtime } from "@/lib/hooks/useDashboardRealtime";

type StudentCourse = {
    id?: string;
    name?: string | null;
    code?: string | null;
};

type StudentDashboardData = {
    profile?: { full_name?: string | null };
    courses?: StudentCourse[];
    subjects?: Record<string, unknown>[];
    assignments?: Record<string, unknown>[];
    gradeChart?: GradeChartItem[];
    recentSubjectsAttendance?: Record<string, unknown>[];
    stats?: {
        assignmentsPending?: number;
        avgGrade?: string;
        attendanceRate?: string;
    };
};

type GradeChartItem = {
    id: string;
    subject: string;
    title: string;
    score: number;
    max: number;
    date?: string | null;
};

export default function StudentHome({ data: initialData }: { data: StudentDashboardData }) {
    const data = useStudentDashboardRealtime(initialData) as StudentDashboardData;

    const subjects = data?.subjects || [];
    const stats = data?.stats || { assignmentsPending: 0, avgGrade: "0.0" };
    const profile = data?.profile;
    const courses = data?.courses || [];
    const gradeChart = data?.gradeChart || [];
    const courseNames = courses.map((course) => course.name || course.code).filter(Boolean);
    const courseLabel = courseNames.join(", ");
    const coursePrefix = courseNames.length > 1 ? "Classes" : "Classe";
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
                        Tens <strong className="text-foreground font-semibold">{stats.assignmentsPending}</strong> treballs pendents d&apos;entregar aquesta setmana.
                    </p>
                    {courseLabel && (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <GraduationCap className="h-4 w-4" />
                            {coursePrefix}: {courseLabel}
                        </p>
                    )}
                </div>
                <Link
                    href="/dashboard/assignments"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:shrink-0"
                >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    Entregar treball
                </Link>
            </header>

            <StudentStats stats={stats} />

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column — 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:[&>*]:min-h-80">
                        <CurrentClassWidget subjects={subjects} />
                        <ScheduleWidget subjects={subjects} />
                    </div>

                    <div className="min-h-80">
                        <AssignmentsListWidget
                            items={data?.assignments || []}
                            title="Entrega de treballs"
                            role="student"
                        />
                    </div>

                    {/* Grades Bar Chart */}
                    <section aria-label="Evolució de notes" className="bg-card rounded-2xl border border-border p-6 shadow-xs">
                        <h2
                            className="font-semibold text-base text-foreground mb-6"
                            style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                        >
                            Últimes notes
                        </h2>
                        {gradeChart.length > 0 ? (
                            <div className="flex h-44 items-end justify-between gap-2 overflow-x-auto px-1 sm:gap-3">
                                {gradeChart.map((grade) => {
                                    const pct = Math.max(0, Math.min(100, (grade.score / grade.max) * 100));
                                    const label = grade.subject || grade.title;
                                    return (
                                        <div key={grade.id} className="group flex min-w-16 flex-1 flex-col items-center gap-2">
                                            <span className="text-xs font-semibold text-foreground tabular-nums">
                                                {formatGrade(grade.score)}/{formatGrade(grade.max)}
                                            </span>
                                            <div className="relative flex h-28 w-full items-end overflow-hidden rounded-lg bg-secondary">
                                                <div
                                                    style={{ height: `${pct}%` }}
                                                    className="w-full rounded-lg bg-[var(--primary)] transition-all duration-500 group-hover:opacity-90 dark:bg-[var(--accent)]"
                                                    role="img"
                                                    aria-label={`${grade.title}: ${formatGrade(grade.score)} de ${formatGrade(grade.max)}`}
                                                />
                                            </div>
                                            <span className="w-full truncate text-center text-xs text-muted-foreground" title={`${grade.subject} · ${grade.title}`}>
                                                {label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                                <Award className="mb-3 h-8 w-8 text-muted-foreground/50" />
                                <p className="font-medium text-foreground">Encara no hi ha notes publicades.</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Side Column — 1/3 */}
                <div className="space-y-6">
                    <div className="min-h-80">
                        <SubjectsOverviewWidget subjects={subjects} role="student" />
                    </div>
                    <div className="min-h-[28rem] lg:min-h-[600px]">
                        <RecentActivityLevel items={data?.recentSubjectsAttendance || []} />
                    </div>
                </div>
            </div>
        </main>
    );
}

function formatGrade(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
