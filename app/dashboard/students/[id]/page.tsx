import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, ClipboardCheck, FileText, Mail, Phone } from "lucide-react";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { formatScheduleTime, type ScheduleEntry } from "@/lib/schedule-utils";

type StudentSubject = {
    id: string;
    name: string | null;
    category?: string | null;
    teacher_id?: string | null;
    schedule?: string | null;
    schedules?: ScheduleEntry[] | null;
    enrollments?: { id: string }[] | null;
};

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();

    if (!session) {
        redirect("/");
    }

    const supabase = await createClient();
    const { data: student } = await supabase
        .from("users")
        .select("id, full_name, email, phone, avatar_url")
        .eq("id", id)
        .eq("role", "student")
        .single();

    if (!student) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <BackLink />
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                    Alumne no trobat o sense permisos.
                </div>
            </div>
        );
    }

    const targetSubjects = await getStudentSubjects(supabase, id);
    const visibleSubjects = await filterVisibleSubjects(supabase, targetSubjects, session.userId as string, session.role as string, id);
    const subjectIds = visibleSubjects.map((subject) => subject.id);

    if (session.role !== "admin" && session.userId !== id && visibleSubjects.length === 0) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <BackLink />
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                    No tens permisos per veure aquest alumne.
                </div>
            </div>
        );
    }

    const [attendance, submissions] = await Promise.all([
        subjectIds.length > 0
            ? supabase
                .from("attendance")
                .select("id, subject_id, date, status, subject:subjects(name)")
                .eq("student_id", id)
                .in("subject_id", subjectIds)
                .order("date", { ascending: false })
                .limit(8)
            : Promise.resolve({ data: [] as any[] }),
        subjectIds.length > 0
            ? supabase
                .from("submissions")
                .select("id, assignment_id, grade, status, submitted_at, assignment:assignments!inner(id, title, due_date, subject_id, subject:subjects(name))")
                .eq("student_id", id)
                .in("assignment.subject_id", subjectIds)
                .order("submitted_at", { ascending: false })
                .limit(8)
            : Promise.resolve({ data: [] as any[] }),
    ]);

    return (
        <div className="mx-auto min-h-screen max-w-6xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <BackLink />

            <header className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <div
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 bg-cover bg-center text-xl font-black text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20"
                            style={student.avatar_url ? { backgroundImage: `url(${student.avatar_url})` } : undefined}
                            aria-hidden="true"
                        >
                            {!student.avatar_url && getInitials(student.full_name || student.email || "A")}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Fitxa de l&apos;alumne</p>
                            <h1 className="mt-1 truncate text-3xl font-black">{student.full_name || student.email || "Alumne"}</h1>
                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" aria-hidden="true" />
                                    {student.email || "Sense correu"}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone className="h-4 w-4" aria-hidden="true" />
                                    {student.phone || "Sense telèfon"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center sm:w-64">
                        <Metric label="Assignatures" value={visibleSubjects.length} />
                        <Metric label="Entregues" value={submissions.data?.length || 0} />
                    </div>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                        <BookOpen className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                        Assignatures compartides
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        {visibleSubjects.map((subject) => (
                            <Link
                                key={subject.id}
                                href={`/dashboard/subjects/${subject.id}`}
                                className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/30"
                            >
                                <p className="font-semibold">{subject.name || "Assignatura"}</p>
                                <p className="mt-1 truncate text-sm text-zinc-500">{formatSubjectSchedule(subject)}</p>
                                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{subject.enrollments?.length || 0} alumnes</p>
                            </Link>
                        ))}
                        {visibleSubjects.length === 0 && (
                            <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800">
                                No hi ha assignatures visibles.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                        <ClipboardCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                        Assistència recent
                    </h2>
                    <div className="space-y-3">
                        {(attendance.data || []).map((row: any) => (
                            <div key={row.id} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                                <p className="text-sm font-semibold">{row.subject?.name || "Assignatura"}</p>
                                <p className="mt-1 text-xs text-zinc-500">{formatDate(row.date)} · {attendanceLabel(row.status)}</p>
                            </div>
                        ))}
                        {(attendance.data || []).length === 0 && (
                            <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800">
                                Encara no hi ha registres.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                        <FileText className="h-5 w-5 text-amber-600" aria-hidden="true" />
                        Entregues recents
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        {(submissions.data || []).map((submission: any) => (
                            <Link
                                key={submission.id}
                                href={`/dashboard/assignments/${submission.assignment_id}`}
                                className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 transition-colors hover:border-amber-200 hover:bg-amber-50/60 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:border-amber-900 dark:hover:bg-amber-950/20"
                            >
                                <p className="font-semibold">{submission.assignment?.title || "Treball"}</p>
                                <p className="mt-1 text-sm text-zinc-500">{submission.assignment?.subject?.name || "Assignatura"}</p>
                                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                    {submission.submitted_at ? formatDate(submission.submitted_at) : "Sense data"} · {submission.grade ?? "Sense nota"}
                                </p>
                            </Link>
                        ))}
                        {(submissions.data || []).length === 0 && (
                            <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800">
                                Encara no hi ha entregues visibles.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

async function getStudentSubjects(supabase: Awaited<ReturnType<typeof createClient>>, studentId: string) {
    const { data } = await supabase
        .from("enrollments")
        .select("subject:subjects(id, name, category, teacher_id, schedule, schedules:subject_schedules(id, day_of_week, start_time, end_time), enrollments(id))")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

    return (data || [])
        .flatMap((row: any) => normalizeRelation<StudentSubject>(row.subject))
        .filter(Boolean);
}

async function filterVisibleSubjects(
    supabase: Awaited<ReturnType<typeof createClient>>,
    targetSubjects: StudentSubject[],
    currentUserId: string,
    role: string,
    targetStudentId: string,
) {
    if (role === "admin" || currentUserId === targetStudentId) return targetSubjects;
    if (role === "teacher") {
        return targetSubjects.filter((subject) => subject.teacher_id === currentUserId);
    }

    const { data: ownEnrollments } = await supabase
        .from("enrollments")
        .select("subject_id")
        .eq("student_id", currentUserId);

    const ownSubjectIds = new Set((ownEnrollments || []).map((row: any) => row.subject_id));
    return targetSubjects.filter((subject) => ownSubjectIds.has(subject.id));
}

function BackLink() {
    return (
        <Link href="/dashboard/subjects" className="mb-6 inline-flex items-center text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Tornar a assignatures
        </Link>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <p className="text-2xl font-black tabular-nums">{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
        </div>
    );
}

function formatSubjectSchedule(subject: StudentSubject) {
    if (subject.schedules?.length) {
        return subject.schedules
            .map((schedule) => `${schedule.day_of_week || ""} ${formatScheduleTime(schedule)}`.trim())
            .join(", ");
    }

    return subject.schedule || "Horari no definit";
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}

function attendanceLabel(status: string | null) {
    const labels: Record<string, string> = {
        present: "Present",
        absent: "Falta",
        late: "Retard",
        excused: "Justificada",
    };
    return labels[status || ""] || "Sense estat";
}

function getInitials(value: string) {
    return value
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function normalizeRelation<T>(value: T | T[] | null | undefined) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
}
