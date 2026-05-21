"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, GraduationCap, Loader2, Plus, Save, Search, UserRound, Users, X } from "lucide-react";
import { createAdminCourse, updateAdminCourse, updateAdminCourseMembership } from "@/app/actions/admin";
import type { AdminCourse, AdminSchedule, AdminSubject, AdminUser } from "@/lib/admin-types";

type Message = { type: "success" | "error"; text: string } | null;

export default function AdminCoursesClient({
    courses,
    subjects,
    students,
    teachers,
    schemaReady,
}: {
    courses: AdminCourse[];
    subjects: AdminSubject[];
    students: AdminUser[];
    teachers: AdminUser[];
    schemaReady?: boolean;
}) {
    const router = useRouter();
    const [message, setMessage] = useState<Message>(null);
    const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [subjectSearch, setSubjectSearch] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [isPending, startTransition] = useTransition();

    const filteredGroupedSubjects = useMemo(() => {
        const query = normalizeSearch(subjectSearch);
        const matchingSubjects = query
            ? subjects.filter((subject) => normalizeSearch([
                subject.name,
                subject.category,
                subject.schedule,
                formatSchedule(subject),
                subject.teacher?.full_name,
                subject.teacher?.email,
            ].filter(Boolean).join(" ")).includes(query))
            : subjects;

        return matchingSubjects.reduce((groups: Record<string, AdminSubject[]>, subject) => {
            const category = subject.category || "General";
            groups[category] = [...(groups[category] || []), subject];
            return groups;
        }, {});
    }, [subjects, subjectSearch]);
    const filteredStudents = useMemo(() => {
        const query = normalizeSearch(studentSearch);
        if (!query) return students;

        return students.filter((student) => normalizeSearch([
            student.full_name,
            student.email,
            student.phone,
        ].filter(Boolean).join(" ")).includes(query));
    }, [students, studentSearch]);
    const teachersById = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher])), [teachers]);
    const autoTutoringSubjectId = editingCourse?.tutor_id && editingCourse.tutoring_subject_id
        ? editingCourse.tutoring_subject_id
        : null;

    const handleCreate = (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await createAdminCourse(formData);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Curs creat." : result.error || "No s'ha pogut crear el curs.",
            });
            if (result.success) router.refresh();
        });
    };

    const handleUpdate = (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await updateAdminCourse(formData);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Curs actualitzat." : result.error || "No s'ha pogut actualitzar el curs.",
            });
            if (result.success) router.refresh();
        });
    };

    const openMembershipEditor = (course: AdminCourse) => {
        const subjectIds = new Set(course.subject_ids || []);
        if (course.tutor_id && course.tutoring_subject_id) subjectIds.add(course.tutoring_subject_id);
        setEditingCourse(course);
        setSelectedSubjectIds(subjectIds);
        setSelectedStudentIds(new Set(course.student_ids || []));
        setSubjectSearch("");
        setStudentSearch("");
    };

    const closeMembershipEditor = () => {
        if (isPending) return;
        setEditingCourse(null);
        setSelectedSubjectIds(new Set());
        setSelectedStudentIds(new Set());
        setSubjectSearch("");
        setStudentSearch("");
    };

    const toggleSubject = (subjectId: string) => {
        if (autoTutoringSubjectId === subjectId) return;
        setSelectedSubjectIds((current) => toggleSetValue(current, subjectId));
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudentIds((current) => toggleSetValue(current, studentId));
    };

    const handleSaveMembership = () => {
        if (!editingCourse) return;

        const course = editingCourse;
        const subjectIds = Array.from(selectedSubjectIds);
        const studentIds = Array.from(selectedStudentIds);
        setMessage(null);
        startTransition(async () => {
            const result = await updateAdminCourseMembership(course.id, subjectIds, studentIds);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Curs sincronitzat amb assignatures i alumnes." : result.error || "No s'ha pogut sincronitzar el curs.",
            });
            if (result.success) {
                setEditingCourse(null);
                router.refresh();
            }
        });
    };

    return (
        <main className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Administració</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cursos del centre</h1>
                <p className="mt-2 max-w-2xl text-zinc-500">Agrupa assignatures i alumnes per curs. Els alumnes veuran les assignatures del seu curs; els professors continuen treballant per classe.</p>
            </header>

            {message && (
                <div className={`mb-6 rounded-2xl border p-4 text-sm ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                    {message.text}
                </div>
            )}

            <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold">Curs nou</h2>
                </div>
                <form action={handleCreate} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_0.45fr_1fr_0.8fr_auto]">
                    <input name="name" required placeholder="Nom del curs (DAW, SMX, Batxillerat...)" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <input name="code" placeholder="Codi" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <input name="description" placeholder="Descripció curta" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <select name="tutor_id" defaultValue="" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                        <option value="">Sense tutor</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>{formatUserName(teacher)}</option>
                        ))}
                    </select>
                    <button disabled={isPending || schemaReady === false} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Crear
                    </button>
                </form>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {courses.map((course) => {
                    const tutor = course.tutor_id ? teachersById.get(course.tutor_id) : null;

                    return (
                    <article key={course.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                        <GraduationCap className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="truncate font-bold">{course.name}</h2>
                                        <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{course.code || "Sense codi"}</p>
                                    </div>
                                </div>
                                <p className="line-clamp-2 text-sm text-zinc-500">{course.description || "Sense descripció."}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${course.is_active === false ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
                                {course.is_active === false ? "Inactiu" : "Actiu"}
                            </span>
                        </div>

                        <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                                <BookOpen className="h-4 w-4 text-zinc-400" />
                                <span>{course.subject_ids?.length || 0} assignatures</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                                <Users className="h-4 w-4 text-zinc-400" />
                                <span>{course.student_ids?.length || 0} alumnes</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                                <UserRound className="h-4 w-4 text-zinc-400" />
                                <span className="truncate">{tutor ? `Tutor: ${formatUserName(tutor)}` : "Sense tutor assignat"}</span>
                            </div>
                        </div>

                        <form action={handleUpdate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input type="hidden" name="course_id" value={course.id} />
                            <input name="name" defaultValue={course.name || ""} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <input name="code" defaultValue={course.code || ""} placeholder="Codi" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                            <select name="tutor_id" defaultValue={course.tutor_id || ""} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                                <option value="">Sense tutor</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>{formatUserName(teacher)}</option>
                                ))}
                            </select>
                            <select name="is_active" defaultValue={course.is_active === false ? "false" : "true"} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950">
                                <option value="true">Actiu</option>
                                <option value="false">Inactiu</option>
                            </select>
                            <textarea name="description" defaultValue={course.description || ""} placeholder="Descripció" rows={2} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 sm:col-span-2" />
                            <div className="sm:col-span-2 sm:flex sm:justify-end">
                                <button disabled={isPending || schemaReady === false} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 sm:w-auto">
                                    Guardar
                                </button>
                            </div>
                        </form>

                        <button
                            type="button"
                            onClick={() => openMembershipEditor(course)}
                            disabled={schemaReady === false}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-900/60 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                        >
                            <GraduationCap className="h-4 w-4" />
                            Gestionar assignatures i alumnes
                        </button>
                    </article>
                    );
                })}

                {courses.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 xl:col-span-2">
                        Encara no hi ha cursos creats.
                    </div>
                )}
            </section>

            {editingCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <button type="button" aria-label="Tancar gestor de curs" className="absolute inset-0 bg-zinc-950/45 backdrop-blur-sm" onClick={closeMembershipEditor} />
                    <section role="dialog" aria-modal="true" className="relative grid max-h-[90vh] w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                        <header className="flex flex-col gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Gestió de curs</p>
                                <h2 className="mt-1 truncate text-xl font-bold">{editingCourse.name}</h2>
                                <p className="mt-1 text-sm text-zinc-500">{selectedSubjectIds.size} assignatures · {selectedStudentIds.size} alumnes</p>
                            </div>
                            <button type="button" aria-label="Tancar" onClick={closeMembershipEditor} disabled={isPending} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-100">
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="grid min-h-0 grid-cols-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                            <div className="min-h-0 p-5">
                                <h3 className="mb-4 font-bold">Assignatures del curs</h3>
                                <SearchField
                                    value={subjectSearch}
                                    onChange={setSubjectSearch}
                                    placeholder="Buscar assignatura, categoria o professor"
                                />
                                <div className="space-y-6">
                                    {Object.entries(filteredGroupedSubjects).map(([category, categorySubjects]) => (
                                        <section key={category}>
                                            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">{category}</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {categorySubjects.map((subject) => (
                                                    <CheckRow
                                                        key={subject.id}
                                                        selected={selectedSubjectIds.has(subject.id) || autoTutoringSubjectId === subject.id}
                                                        title={subject.name || "Assignatura"}
                                                        subtitle={autoTutoringSubjectId === subject.id ? `${formatSchedule(subject)} · Tutoria automàtica` : formatSchedule(subject)}
                                                        badge={autoTutoringSubjectId === subject.id ? "Auto" : undefined}
                                                        disabled={autoTutoringSubjectId === subject.id}
                                                        onClick={() => toggleSubject(subject.id)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                    {subjects.length === 0 && <EmptyPanel text="Encara no hi ha assignatures." />}
                                    {subjects.length > 0 && Object.keys(filteredGroupedSubjects).length === 0 && <EmptyPanel text="No hi ha assignatures que coincideixin." />}
                                </div>
                            </div>

                            <div className="min-h-0 p-5">
                                <h3 className="mb-4 font-bold">Alumnes del curs</h3>
                                <SearchField
                                    value={studentSearch}
                                    onChange={setStudentSearch}
                                    placeholder="Buscar alumne, correu o telèfon"
                                />
                                <div className="grid grid-cols-1 gap-3">
                                    {filteredStudents.map((student) => (
                                        <CheckRow
                                            key={student.id}
                                            selected={selectedStudentIds.has(student.id)}
                                            title={student.full_name || student.email || "Alumne"}
                                            subtitle={student.email || "Sense correu"}
                                            onClick={() => toggleStudent(student.id)}
                                        />
                                    ))}
                                    {students.length === 0 && <EmptyPanel text="Encara no hi ha alumnes actius." />}
                                    {students.length > 0 && filteredStudents.length === 0 && <EmptyPanel text="No hi ha alumnes que coincideixin." />}
                                </div>
                            </div>
                        </div>

                        <footer className="flex flex-col gap-3 border-t border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-zinc-500">Guardar sincronitza les matrícules; la tutoria del tutor queda inclosa automàticament.</p>
                            <button type="button" onClick={handleSaveMembership} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Guardar curs
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </main>
    );
}

function SearchField({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <label className="mb-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-500 shadow-xs focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:ring-indigo-950/60">
            <Search className="h-4 w-4 shrink-0" />
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="min-w-0 flex-1 bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
        </label>
    );
}

function CheckRow({
    selected,
    title,
    subtitle,
    badge,
    disabled,
    onClick,
}: {
    selected: boolean;
    title: string;
    subtitle: string;
    badge?: string;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex min-h-[74px] items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${selected ? "border-indigo-300 bg-indigo-50 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-100" : "border-zinc-200 bg-white hover:border-indigo-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-900 dark:hover:bg-zinc-900"} ${disabled ? "cursor-not-allowed opacity-80" : ""}`}
        >
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 dark:border-zinc-700"}`}>
                {selected && <Check className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-2">
                    <span className="block truncate text-sm font-bold">{title}</span>
                    {badge && <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">{badge}</span>}
                </span>
                <span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</span>
            </span>
        </button>
    );
}

function EmptyPanel({ text }: { text: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
            {text}
        </div>
    );
}

function toggleSetValue(current: Set<string>, value: string) {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
}

function formatUserName(user: AdminUser) {
    return user.full_name || user.email || "Professor";
}

function normalizeSearch(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function formatSchedule(subject: AdminSubject) {
    if (subject.schedules?.length) {
        return subject.schedules
            .map((schedule: AdminSchedule) => `${schedule.day_of_week} ${String(schedule.start_time).slice(0, 5)}-${String(schedule.end_time).slice(0, 5)}`)
            .join(", ");
    }
    return subject.schedule || "Horari pendent";
}
