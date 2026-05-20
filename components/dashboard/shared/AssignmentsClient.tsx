"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FileText, Plus, ArrowUpDown, ArrowUp, ArrowDown,
    CheckCircle2, Clock, AlertCircle, RotateCcw, Filter
} from "lucide-react";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { createClient } from "@/lib/supabase/client";

type SortKey = "title" | "subject" | "due_date" | "status";
type SortDir = "asc" | "desc";
type TabKey = "pending" | "submitted" | "not_submitted";

// Tab definitions change based on role
const TEACHER_TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "pending", label: "Pendents de corregir", icon: Clock },
    { key: "submitted", label: "Corregides", icon: CheckCircle2 },
    { key: "not_submitted", label: "Totes", icon: Filter },
];

const STUDENT_TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "pending", label: "Per lliurar", icon: Clock },
    { key: "submitted", label: "Lliurades", icon: CheckCircle2 },
    { key: "not_submitted", label: "Sense lliurar", icon: AlertCircle },
];

interface AssignmentsClientProps {
    assignments: any[];
    role: string;
    userId: string;
    subjects: any[];
}

function getAssignmentStatusForTab(assignment: any, role: string): TabKey {
    if (role === "teacher") {
        const submissions = assignment.submissions || [];
        if (submissions.length === 0) return "not_submitted";

        const ungraded = submissions.filter((s: any) => s.grade === null || s.grade === undefined);
        if (ungraded.length > 0) return "pending";
        return "submitted"; // all graded
    } else {
        // Alumnes
        if (assignment.status === "submitted" || assignment.status === "graded") {
            return "submitted"; // Pestaña "Lliurades"
        }

        const now = new Date();
        const dueDate = assignment.due_date ? new Date(assignment.due_date) : new Date(0);
        const lateDate = assignment.late_due_date ? new Date(assignment.late_due_date) : null;

        // El límit absolut després del qual la tasca es considera "perduda"
        const absoluteMaxLimit = lateDate || dueDate;

        if (now > absoluteMaxLimit) {
            return "not_submitted"; // Pestaña "Sense lliurar" (Vencida definitivamente)
        }

        return "pending";
    }
}

export default function AssignmentsClient({ assignments: initialAssignments, role, userId, subjects }: AssignmentsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>("pending");
    const [sortKey, setSortKey] = useState<SortKey>("due_date");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Realtime state
    const [assignments, setAssignments] = useState(initialAssignments);
    const supabase = createClient();

    useEffect(() => {
        setAssignments(initialAssignments);
    }, [initialAssignments]);

    useEffect(() => {
        // Listen for new assignments
        const assignmentsChannel = supabase.channel('realtime:assignments_client')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setAssignments(prev => {
                        if (prev.some(a => a.id === payload.new.id)) return prev;
                        // For a new assignment, we don't have the subject join, so this is a simplified approach.
                        // In a real robust implementation, we might fetch the specific relation or invalidate cache.
                        return [...prev, { ...payload.new, subject: subjects.find(s => s.id === payload.new.subject_id), submissions: [] }];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setAssignments(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
                } else if (payload.eventType === 'DELETE') {
                    setAssignments(prev => prev.filter(a => a.id !== payload.old.id));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
                const newSubmission = payload.new as any;
                const oldSubmission = payload.old as any;
                // When a submission happens, update the assignment's submissions list
                if (role === 'teacher') {
                    setAssignments(prev => prev.map(a => {
                        if (a.id === newSubmission.assignment_id || (oldSubmission && a.id === oldSubmission.assignment_id)) {
                            const submissions = a.submissions ? [...a.submissions] : [];
                            if (payload.eventType === 'INSERT') {
                                if (!submissions.some((s: any) => s.id === newSubmission.id)) submissions.push(newSubmission);
                            } else if (payload.eventType === 'UPDATE') {
                                const idx = submissions.findIndex((s: any) => s.id === newSubmission.id);
                                if (idx > -1) submissions[idx] = { ...submissions[idx], ...newSubmission };
                            }
                            return { ...a, submissions };
                        }
                        return a;
                    }));
                } else {
                    // For student, update status
                    setAssignments(prev => prev.map(a => {
                        if (a.id === newSubmission.assignment_id) {
                            return {
                                ...a,
                                status: newSubmission.grade !== null ? 'graded' : 'submitted',
                                grade: newSubmission.grade,
                                feedback: newSubmission.feedback,
                                file_url: newSubmission.file_url,
                                student_comment: newSubmission.student_comment,
                                submitted_at: newSubmission.submitted_at
                            };
                        }
                        return a;
                    }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(assignmentsChannel);
        };
    }, [supabase, subjects, role]);

    const tabs = role === "teacher" ? TEACHER_TABS : STUDENT_TABS;

    // Filter by tab
    const filteredAssignments = useMemo(() => {
        if (role === "teacher" && activeTab === "not_submitted") return assignments; // "Totes"
        return assignments.filter(a => getAssignmentStatusForTab(a, role) === activeTab);
    }, [assignments, activeTab, role]);

    // Sort
    const sortedAssignments = useMemo(() => {
        return [...filteredAssignments].sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case "title":
                    cmp = (a.title || "").localeCompare(b.title || "");
                    break;
                case "subject":
                    cmp = (a.subject?.name || "").localeCompare(b.subject?.name || "");
                    break;
                case "due_date":
                    cmp = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    break;
                case "status":
                    cmp = (a.status || "").localeCompare(b.status || "");
                    break;
            }
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filteredAssignments, sortKey, sortDir]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
        return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
    };

    // Tab counts
    const tabCounts = useMemo(() => {
        const counts: Record<TabKey, number> = { pending: 0, submitted: 0, not_submitted: 0 };
        if (role === "teacher") {
            counts.not_submitted = assignments.length; // "Totes"
        }
        assignments.forEach(a => {
            const tab = getAssignmentStatusForTab(a, role);
            counts[tab]++;
        });
        return counts;
    }, [assignments, role]);

    return (
        <div className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl">
                        {role === "teacher" ? "Gestió de tasques" : "Les meves tasques"}
                    </h1>
                    <p className="text-zinc-500">
                        {role === "teacher"
                            ? "Revisa, qualifica i crea tasques per als teus alumnes."
                            : "Consulta les teves tasques pendents i lliurades."}
                    </p>
                </div>
                {role === "teacher" && (
                    <button
                        onClick={() => router.push('/dashboard/assignments/new')}
                        className="flex w-full items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-md shadow-indigo-500/20 transition-colors hover:bg-indigo-700 active:scale-95 sm:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Tasca nova
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/50 sm:max-w-fit">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.key;
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`
                                flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                }
                            `}
                        >
                            <TabIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${isActive
                                ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                                }`}>
                                {tabCounts[tab.key]}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="grid gap-4 lg:hidden">
                {sortedAssignments.map((assignment: any) => (
                    <AssignmentMobileCard
                        key={assignment.id}
                        assignment={assignment}
                        role={role}
                        onOpen={() => router.push(`/dashboard/assignments/${assignment.id}`)}
                    />
                ))}
                {sortedAssignments.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                        <p className="font-medium text-zinc-500">No hi ha tasques en aquesta categoria.</p>
                        <p className="mt-1 text-sm text-zinc-400">Prova canviant de pestanya.</p>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                            <tr>
                                <SortableHeader label="Títol" column="title" onSort={handleSort} sortIcon={<SortIcon column="title" />} />
                                <SortableHeader label="Assignatura" column="subject" onSort={handleSort} sortIcon={<SortIcon column="subject" />} />
                                <SortableHeader label="Data de lliurament" column="due_date" onSort={handleSort} sortIcon={<SortIcon column="due_date" />} />
                                <SortableHeader label="Estat" column="status" onSort={handleSort} sortIcon={<SortIcon column="status" />} />
                                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {sortedAssignments.map((assignment: any) => (
                                <tr key={assignment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{assignment.title}</div>
                                        <div className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{assignment.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                            {assignment.subject?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                                        <div>{new Date(assignment.due_date).toLocaleDateString("ca-ES", { day: "numeric", month: "short", year: "numeric" })}</div>
                                        {assignment.late_due_date && (
                                            <div className="text-xs text-amber-500 mt-0.5">
                                                Retard: {new Date(assignment.late_due_date).toLocaleDateString("ca-ES", { day: "numeric", month: "short" })}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {role === "teacher" ? (
                                            <TeacherStatusBadge submissions={assignment.submissions || []} />
                                        ) : (
                                            <StudentStatusBadge
                                                status={assignment.status}
                                                grade={assignment.grade}
                                                dueDate={assignment.due_date}
                                                lateDueDate={assignment.late_due_date}
                                            />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => router.push(`/dashboard/assignments/${assignment.id}`)}
                                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm hover:underline transition-colors"
                                        >
                                            {role === "teacher" ? "Veure tasca" : (assignment.status === "graded" ? "Veure nota" : assignment.status === "submitted" ? "Veure lliurament" : "Lliurar")}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sortedAssignments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <FileText className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                                        <p className="text-zinc-500 font-medium">No hi ha tasques en aquesta categoria.</p>
                                        <p className="text-zinc-400 text-sm mt-1">Prueba cambiando de pestaña.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Sub-components ---

function AssignmentMobileCard({ assignment, role, onOpen }: { assignment: any; role: string; onOpen: () => void }) {
    return (
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="line-clamp-2 font-bold text-zinc-900 dark:text-zinc-100">{assignment.title}</h2>
                    {assignment.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{assignment.description}</p>
                    )}
                </div>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {assignment.subject?.name || "Sense assignatura"}
                </span>
            </div>

            <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-zinc-500">Entrega</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {new Date(assignment.due_date).toLocaleDateString("ca-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                </div>
                {assignment.late_due_date && (
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-zinc-500">Retard</span>
                        <span className="font-bold text-amber-500">
                            {new Date(assignment.late_due_date).toLocaleDateString("ca-ES", { day: "numeric", month: "short" })}
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-zinc-500">Estat</span>
                    {role === "teacher" ? (
                        <TeacherStatusBadge submissions={assignment.submissions || []} />
                    ) : (
                        <StudentStatusBadge
                            status={assignment.status}
                            grade={assignment.grade}
                            dueDate={assignment.due_date}
                            lateDueDate={assignment.late_due_date}
                        />
                    )}
                </div>
            </div>

            <button
                onClick={onOpen}
                className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
            >
                {role === "teacher" ? "Veure tasca" : (assignment.status === "graded" ? "Veure nota" : assignment.status === "submitted" ? "Veure lliurament" : "Lliurar")}
            </button>
        </article>
    );
}

function SortableHeader({ label, column, onSort, sortIcon }: {
    label: string;
    column: SortKey;
    onSort: (key: SortKey) => void;
    sortIcon: React.ReactNode;
}) {
    return (
        <th className="px-6 py-4">
            <button
                onClick={() => onSort(column)}
                className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/sort"
            >
                {label}
                <span className="group-hover/sort:opacity-100 transition-opacity">{sortIcon}</span>
            </button>
        </th>
    );
}

function TeacherStatusBadge({ submissions }: { submissions: any[] }) {
    const total = submissions.length;
    const graded = submissions.filter((s: any) => s.grade !== null && s.grade !== undefined).length;
    const returned = submissions.filter((s: any) => s.status === "returned").length;

    if (total === 0) {
        return <span className="text-xs text-zinc-400">Sense lliuraments</span>;
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden w-20">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(graded / total) * 100}%` }}
                    />
                </div>
                <span className="text-xs text-zinc-500 tabular-nums">{graded}/{total}</span>
            </div>
            {returned > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-500">
                    <RotateCcw className="w-3 h-3" /> {returned} retornades
                </span>
            )}
        </div>
    );
}

function StudentStatusBadge({ status, grade, dueDate, lateDueDate }: {
    status: string;
    grade?: number;
    dueDate: string;
    lateDueDate?: string;
}) {
    if (grade !== undefined && grade !== null) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${grade >= 5 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"}`}>
                Nota: {grade}
            </span>
        );
    }
    if (status === "submitted") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lliurat
            </span>
        );
    }
    if (status === "returned") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <RotateCcw className="w-3.5 h-3.5" /> Devuelta
            </span>
        );
    }

    const now = new Date();
    const isPastOiginal = now > new Date(dueDate);

    if (isPastOiginal) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" /> Sense lliurar
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
             <Clock className="w-3.5 h-3.5" /> Pendent
        </span>
    );
}
