"use client";

import { useMemo, useState, useTransition } from "react";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { BookOpen, FileText, Users, Link as LinkIcon, Download, Plus, Check, Loader2, ClipboardCheck } from "lucide-react";
import { AIPlaceholder } from "@/components/ai/AIPlaceholder";
import Link from "next/link";
import { createResource, saveAttendance } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function SubjectDetailsClient({
    initialSubject,
    initialAssignments,
    initialResources,
    initialStudents,
    initialAttendance,
    role
}: {
    initialSubject: any,
    initialAssignments: any[],
    initialResources: any[],
    initialStudents: any[],
    initialAttendance: any[],
    role: string
}) {
    const router = useRouter();
    const [isResourceOpen, setIsResourceOpen] = useState(false);
    const [resourceMsg, setResourceMsg] = useState<string | null>(null);
    const [isPendingResource, startResourceTransition] = useTransition();
    const [isPendingAttendance, startAttendanceTransition] = useTransition();
    const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null);

    // Only subscribe to assignments and resources related to this subject
    const { data: assignments } = useRealtimeTable({ table: 'assignments', initialData: initialAssignments });
    const { data: resources } = useRealtimeTable({ table: 'resources', initialData: initialResources });
    // For students, the relation is through enrollments, which is harder to track purely via useRealtimeTable without custom filters, so we keep initialStudents static or just don't make it real-time for now to keep it simple.

    const filteredAssignments = assignments.filter(a => a.subject_id === initialSubject.id);
    const filteredResources = resources.filter(r => r.subject_id === initialSubject.id);
    const initialAttendanceMap = useMemo(() => new Map(initialAttendance.map((row: any) => [row.student_id, row.status])), [initialAttendance]);
    const [attendance, setAttendance] = useState<Record<string, string>>(() => {
        const result: Record<string, string> = {};
        initialStudents.forEach((student: any) => {
            result[student.id] = initialAttendanceMap.get(student.id) || 'present';
        });
        return result;
    });

    const scheduleText = initialSubject.schedules?.length
        ? initialSubject.schedules.map((s: any) => `${s.day_of_week} ${String(s.start_time).slice(0, 5)}-${String(s.end_time).slice(0, 5)}`).join(', ')
        : initialSubject.schedule || 'Horari no definit';

    const handleResourceSubmit = (formData: FormData) => {
        setResourceMsg(null);
        formData.set('subject_id', initialSubject.id);
        startResourceTransition(async () => {
            const result = await createResource(formData);
            setResourceMsg(result.success ? 'Contingut publicat.' : result.error || "No s'ha pogut publicar.");
            if (result.success) {
                setIsResourceOpen(false);
                router.refresh();
            }
        });
    };

    const handleAttendanceSave = () => {
        setAttendanceMsg(null);
        const entries = initialStudents.map((student: any) => ({
            student_id: student.id,
            status: attendance[student.id] || 'present',
        }));
        startAttendanceTransition(async () => {
            const result = await saveAttendance(initialSubject.id, entries);
            setAttendanceMsg(result.success ? 'Llista desada per avui.' : result.error || "No s'ha pogut desar la llista.");
            if (result.success) router.refresh();
        });
    };

    return (
        <>
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 mb-8 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-60" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                             <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                                Curs 2024-25
                             </span>
                            <h1 className="text-4xl font-bold mb-2">{initialSubject.name}</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">{initialSubject.description || "No hi ha cap descripció disponible."}</p>

                            <div className="flex items-center gap-6 mt-6 text-sm font-medium">
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{filteredAssignments.length} Tasques</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                    <Users className="w-4 h-4" />
                                    <span>{initialStudents.length} Alumnes</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                    <ClipboardCheck className="w-4 h-4" />
                                    <span>{scheduleText}</span>
                                </div>
                            </div>
                        </div>

                        {role === 'teacher' && (
                             <Link href={`/dashboard/assignments/new?subject=${initialSubject.id}`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Crear tasca
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column: Content & Assignments */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Assignments */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Tasques y Lliuraments
                            </h2>
                             {role === 'teacher' && (
                                <Link href={`/dashboard/assignments/new?subject=${initialSubject.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/10 px-3 py-1.5 rounded-lg transition-colors">
                                    + Crear tasca
                                </Link>
                            )}
                        </div>

                        <div className="space-y-3">
                            {filteredAssignments.map((assignment: any) => (
                                <Link href={`/dashboard/assignments/${assignment.id}`} key={assignment.id} className="block group p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-zinc-50/50 dark:bg-zinc-800/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">{assignment.title}</h3>
                                            <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{assignment.description}</p>
                                        </div>
                                         <span suppressHydrationWarning className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                            {formatDate(assignment.due_date)}
                                         </span>
                                    </div>
                                </Link>
                            ))}
                            {filteredAssignments.length === 0 && (
                                <div className="text-center py-8 text-zinc-400 text-sm">No hi ha tasques assignades.</div>
                            )}
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                         <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-emerald-600" />
                                Continguts i recursos
                            </h2>
                            {role === 'teacher' && (
                                <button onClick={() => setIsResourceOpen((value) => !value)} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-lg transition-colors">
                                    + Pujar fitxer
                                </button>
                            )}
                        </div>
                        {isResourceOpen && (
                            <form action={handleResourceSubmit} className="mb-5 grid grid-cols-1 md:grid-cols-[1fr_140px_1fr_auto] gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-900/10 p-4">
                                <input name="title" required placeholder="Títol del contingut" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-emerald-500" />
                                <select name="type" defaultValue="link" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-emerald-500">
                                    <option value="link">Enllaç</option>
                                    <option value="pdf">PDF</option>
                                    <option value="video">Video</option>
                                    <option value="file">Fitxer</option>
                                </select>
                                <input name="file_url" required placeholder="URL del fitxer, guia, horari o anunci" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-emerald-500" />
                                <button disabled={isPendingResource} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold">
                                    {isPendingResource ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Desar
                                </button>
                            </form>
                        )}
                        {resourceMsg && <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">{resourceMsg}</p>}
                        <div className="space-y-3">
                             {filteredResources.map((resource: any) => (
                                <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                            {resource.type === 'pdf' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{resource.title}</div>
                                            <div className="text-xs text-zinc-500 capitalize">{resource.type}</div>
                                        </div>
                                    </div>
                                    <a href={resource.file_url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-zinc-600">
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            ))}
                            {filteredResources.length === 0 && (
                                <div className="text-center py-8 text-zinc-400 text-sm">No hi ha continguts publicats.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column: Students (Teacher) or Info (Student) */}
                <div className="space-y-8">
                    {(role === 'teacher' || role === 'student') && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Alumnes ({initialStudents.length})
                            </h2>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {initialStudents.map((student: any) => (
                                    <div key={student.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">
                                            {student.full_name ? student.full_name.split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase() : student.email ? student.email.substring(0, 2).toUpperCase() : 'ST'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">{student.full_name || "Estudiant"}</div>
                                            <div className="text-xs text-zinc-400 truncate">{student.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {role === 'teacher' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                                    Passar llista de hoy
                                </h2>
                                <button
                                    onClick={handleAttendanceSave}
                                    disabled={isPendingAttendance}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold"
                                >
                                    {isPendingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Desar
                                </button>
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {initialStudents.map((student: any) => (
                                    <div key={student.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 p-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{student.full_name || student.email}</p>
                                            <p className="text-xs text-zinc-500 truncate">{student.email}</p>
                                        </div>
                                        <select
                                            value={attendance[student.id] || 'present'}
                                            onChange={(event) => setAttendance((prev) => ({ ...prev, [student.id]: event.target.value }))}
                                            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs font-medium"
                                        >
                                            <option value="present">Assisteix</option>
                                            <option value="absent">Falta</option>
                                            <option value="late">Retard</option>
                                            <option value="excused">Justificada</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                            {attendanceMsg && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{attendanceMsg}</p>}
                        </div>
                    )}

                    {role === 'teacher' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4">Eines d'IA</h2>
                            <div className="space-y-3">
                                <AIPlaceholder
                                    label="Generar resum"
                                    description="Crea un resum del contingut actual."
                                />
                                <AIPlaceholder
                                    label="Suggerir tasques"
                                    description="Genera idees d'avaluació basades en el temari."
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}
