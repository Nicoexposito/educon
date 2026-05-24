"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar, CheckCircle2, AlertCircle, Clock,
    Search, Filter, RotateCcw, PenSquare, FileText,
    Sparkles, Loader2, X, Check, Pencil, Trash2, Save, Download
} from "lucide-react";
import Link from "next/link";
import { aiGradeSubmissionsBatch, deleteAssignment, gradeSubmission, returnSubmission, updateAssignment } from "@/lib/actions";

interface TeacherAssignmentViewProps {
    assignment: any;
    students: any[];
    teacherId: string;
}

const AI_LANGUAGE_OPTIONS = [
    { value: "ca", label: "CAT" },
    { value: "es", label: "CAS" },
    { value: "en", label: "ENG" },
] as const;

function toDatetimeLocalValue(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

function getDownloadFileName(contentDisposition: string | null, fallback: string) {
    const match = contentDisposition?.match(/filename="([^"]+)"/);
    return match?.[1] || fallback;
}

export default function TeacherAssignmentView({ assignment, students }: TeacherAssignmentViewProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isAIPending, startAITransition] = useTransition();
    const [isAssignmentPending, startAssignmentTransition] = useTransition();
    const [isApplyingAI, setIsApplyingAI] = useState(false);
    const [aiSetupOpen, setAISetupOpen] = useState(false);
    const [aiReviewOpen, setAIReviewOpen] = useState(false);
    const [aiMsg, setAiMsg] = useState("");
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
    const [aiLanguage, setAiLanguage] = useState<(typeof AI_LANGUAGE_OPTIONS)[number]["value"]>("ca");
    const [selectedDownloadIds, setSelectedDownloadIds] = useState<Set<string>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [assignmentMsg, setAssignmentMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(assignment.title || "");
    const [editDescription, setEditDescription] = useState(assignment.description || "");
    const [editDueDate, setEditDueDate] = useState(toDatetimeLocalValue(assignment.due_date));
    const [editLateDueDate, setEditLateDueDate] = useState(toDatetimeLocalValue(assignment.late_due_date));

    // Stats
    const totalStudents = students.length;
    const submittedCount = students.filter(s => s.submission && (s.submission.status === 'submitted' || s.submission.status === 'graded')).length;
    const gradedCount = students.filter(s => s.submission?.grade !== null && s.submission?.grade !== undefined).length;
    const aiCandidates = students.filter((student) => {
        const sub = student.submission;
        return sub && sub.status === "submitted" && (sub.grade === null || sub.grade === undefined);
    });

    const dueDate = new Date(assignment.due_date);

    // Filter logic
    const filteredStudents = students.filter(student => {
        const studentLabel = `${student.full_name || ""} ${student.email || ""}`.toLowerCase();
        const matchesSearch = studentLabel.includes(searchQuery.toLowerCase());
        const sub = student.submission;

        let matchesStatus = true;
        if (statusFilter === "pending_grade") {
            matchesStatus = sub && (sub.grade === null || sub.grade === undefined) && sub.status !== "returned";
        } else if (statusFilter === "graded") {
            matchesStatus = sub && sub.grade !== null && sub.grade !== undefined;
        } else if (statusFilter === "not_submitted") {
            matchesStatus = !sub || sub.status === "pending"; // Cap lliurament
        } else if (statusFilter === "returned") {
             matchesStatus = sub && sub.status === "returned";
        }

        return matchesSearch && matchesStatus;
    });

    const downloadableSubmissions = filteredStudents
        .map((student) => student.submission)
        .filter((submission) => submission?.id && getSubmissionFileUrl(submission));
    const visibleDownloadIds = downloadableSubmissions.map((submission) => submission.id);
    const allVisibleSelected = visibleDownloadIds.length > 0 && visibleDownloadIds.every((id) => selectedDownloadIds.has(id));

    const handleBulkAI = () => {
        setAiMsg("");
        setAiSuggestions([]);

        if (aiCandidates.length === 0) {
            setAiMsg("No hi ha lliuraments pendents per corregir amb IA.");
            setAISetupOpen(false);
            return;
        }

        startAITransition(async () => {
            const result = await aiGradeSubmissionsBatch({
                assignmentTitle: assignment.title,
                assignmentDescription: assignment.description,
                subjectName: assignment.subject?.name,
                feedbackLanguage: aiLanguage,
                submissions: aiCandidates.map((student) => {
                    const fileUrl = getSubmissionFileUrl(student.submission);
                    const studentComment = getSubmissionComment(student.submission);

                    return {
                        submissionId: student.submission.id,
                        studentName: student.full_name || student.email || "Alumne",
                        content: fileUrl || studentComment || "Sense contingut textual registrat.",
                        fileUrl,
                        studentComment,
                    };
                }),
            });

            if (!result.success) {
                setAiMsg(result.error);
                return;
            }

            const enriched = result.results.map((suggestion) => {
                const student = aiCandidates.find((candidate) => candidate.submission.id === suggestion.submissionId);
                return {
                    ...suggestion,
                    studentEmail: student?.email,
                };
            });

            setAiSuggestions(enriched);
            setSelectedSuggestionIds(new Set(enriched.map((item) => item.submissionId).filter((id): id is string => Boolean(id))));
            setAISetupOpen(false);
            setAIReviewOpen(true);
        });
    };

    const toggleDownloadSelection = (submissionId: string) => {
        setSelectedDownloadIds((current) => {
            const next = new Set(current);
            if (next.has(submissionId)) next.delete(submissionId);
            else next.add(submissionId);
            return next;
        });
    };

    const toggleVisibleDownloads = () => {
        setSelectedDownloadIds((current) => {
            const next = new Set(current);
            if (allVisibleSelected) {
                visibleDownloadIds.forEach((id) => next.delete(id));
            } else {
                visibleDownloadIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const downloadSelectedSubmissions = async () => {
        const submissionIds = Array.from(selectedDownloadIds);
        if (!submissionIds.length) {
            setAiMsg("Selecciona almenys un lliurament per descarregar.");
            return;
        }

        setIsDownloading(true);
        setAiMsg("");
        try {
            const response = await fetch(`/api/assignments/${assignment.id}/submissions/download`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionIds }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setAiMsg(payload?.error || "No s'han pogut descarregar els lliuraments seleccionats.");
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = getDownloadFileName(response.headers.get("content-disposition"), `${assignment.title || "tasca"}-lliuraments.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch {
            setAiMsg("Error descarregant els lliuraments seleccionats.");
        } finally {
            setIsDownloading(false);
        }
    };

    const toggleSuggestion = (submissionId: string) => {
        setSelectedSuggestionIds((current) => {
            const next = new Set(current);
            if (next.has(submissionId)) next.delete(submissionId);
            else next.add(submissionId);
            return next;
        });
    };

    const updateSuggestionGrade = (submissionId: string, value: string) => {
        setAiSuggestions((current) => current.map((suggestion) => {
            if (suggestion.submissionId !== submissionId) return suggestion;
            if (value === "") return { ...suggestion, grade: "" };

            const parsed = Number(value);
            if (!Number.isFinite(parsed)) return suggestion;
            const clamped = Math.min(10, Math.max(0, Math.round(parsed * 10) / 10));
            return { ...suggestion, grade: clamped };
        }));
    };

    const applyAISuggestions = async () => {
        const selected = aiSuggestions.filter((suggestion) => selectedSuggestionIds.has(suggestion.submissionId));
        if (selected.length === 0) return;

        const invalidGrade = selected.find((suggestion) => {
            if (suggestion.shouldReturn) return false;
            const grade = Number(suggestion.grade);
            return !Number.isFinite(grade) || grade < 0 || grade > 10;
        });

        if (invalidGrade) {
            setAiMsg("Revisa les notes abans d'aplicar: han d'estar entre 0 i 10.");
            return;
        }

        setIsApplyingAI(true);
        setAiMsg("");
        for (const suggestion of selected) {
            const finalGrade = Math.round(Number(suggestion.grade) * 10) / 10;
            const result = suggestion.shouldReturn
                ? await returnSubmission(suggestion.submissionId, suggestion.studentFeedback)
                : await gradeSubmission(suggestion.submissionId, finalGrade, suggestion.studentFeedback);

            if (!result.success) {
                setAiMsg(result.error || "No s'han pogut aplicar totes les correccions.");
                setIsApplyingAI(false);
                return;
            }
        }

        setIsApplyingAI(false);
        setAIReviewOpen(false);
        router.refresh();
    };

    const openEditModal = () => {
        setEditTitle(assignment.title || "");
        setEditDescription(assignment.description || "");
        setEditDueDate(toDatetimeLocalValue(assignment.due_date));
        setEditLateDueDate(toDatetimeLocalValue(assignment.late_due_date));
        setAssignmentMsg(null);
        setEditOpen(true);
    };

    const handleUpdateAssignment = (event: React.FormEvent) => {
        event.preventDefault();
        if (!editTitle.trim() || !editDueDate) {
            setAssignmentMsg({ type: "error", text: "El títol i la data límit són obligatoris." });
            return;
        }

        startAssignmentTransition(async () => {
            const result = await updateAssignment({
                assignmentId: assignment.id,
                title: editTitle,
                description: editDescription,
                due_date: editDueDate,
                late_due_date: editLateDueDate || null,
                subject_id: assignment.subject_id,
            });

            if (!result.success) {
                setAssignmentMsg({ type: "error", text: result.error || "No s'ha pogut modificar la tasca." });
                return;
            }

            setAssignmentMsg({ type: "success", text: "Tasca modificada correctament." });
            setEditOpen(false);
            router.refresh();
        });
    };

    const handleDeleteAssignment = () => {
        startAssignmentTransition(async () => {
            const result = await deleteAssignment(assignment.id);
            if (!result.success) {
                setAssignmentMsg({ type: "error", text: result.error || "No s'ha pogut eliminar la tasca." });
                setDeleteOpen(false);
                return;
            }

            router.push("/dashboard/assignments");
        });
    };

    return (
        <div className="space-y-6">
            {/* Header Details */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-8 justify-between">
                <div className="min-w-0">
                    <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">{assignment.title}</h1>
                    <p className="text-zinc-500 font-medium">{assignment.subject?.name}</p>
                    <div className="mt-6 flex flex-wrap gap-4">
                         <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                             <Calendar className="w-4 h-4 text-indigo-500" />
                             <span suppressHydrationWarning>Tanca el {dueDate.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={openEditModal}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                        >
                            <Pencil className="h-4 w-4" />
                            Editar tasca
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAssignmentMsg(null);
                                setDeleteOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </button>
                    </div>
                    {assignmentMsg && (
                        <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${assignmentMsg.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"}`}>
                            {assignmentMsg.text}
                        </div>
                    )}
                </div>

                {/* Progress Stats */}
                <div className="flex items-center gap-6 min-w-[300px]">
                    <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-zinc-500">Lliuraments</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{submittedCount} / {totalStudents}</span>
                        </div>
                        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-zinc-500">Corregides</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{gradedCount} / {submittedCount}</span>
                        </div>
                        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${submittedCount > 0 ? (gradedCount / submittedCount) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
                    <form onSubmit={handleUpdateAssignment} className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-6 dark:border-zinc-800">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Editar tasca</p>
                                <h2 className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">Modificar detalls</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditOpen(false)}
                                className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                aria-label="Tancar edició"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-zinc-700 dark:text-zinc-200">Títol</label>
                                <input
                                    value={editTitle}
                                    onChange={(event) => setEditTitle(event.target.value)}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-zinc-700 dark:text-zinc-200">Descripció</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(event) => setEditDescription(event.target.value)}
                                    rows={5}
                                    className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-zinc-700 dark:text-zinc-200">Data límit</label>
                                    <input
                                        type="datetime-local"
                                        value={editDueDate}
                                        onChange={(event) => setEditDueDate(event.target.value)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-zinc-700 dark:text-zinc-200">Límit amb retard</label>
                                    <input
                                        type="datetime-local"
                                        value={editLateDueDate}
                                        onChange={(event) => setEditLateDueDate(event.target.value)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setEditOpen(false)}
                                className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                                Cancel·lar
                            </button>
                            <button
                                type="submit"
                                disabled={isAssignmentPending}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-indigo-500/20 transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isAssignmentPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Desar canvis
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {deleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="border-b border-zinc-100 p-6 dark:border-zinc-800">
                            <p className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-300">Eliminar treball</p>
                            <h2 className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">Eliminar aquest treball?</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                També s&apos;eliminaran els lliuraments associats. Aquesta acció no es pot desfer.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setDeleteOpen(false)}
                                className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                                Cancel·lar
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAssignment}
                                disabled={isAssignmentPending}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-rose-500/20 transition-colors hover:bg-rose-700 disabled:opacity-50"
                            >
                                {isAssignmentPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Eliminar definitivament
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {aiSetupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-6 dark:border-zinc-800">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-300">Correcció IA</p>
                                <h2 className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">Vols analitzar els lliuraments?</h2>
                                <p className="mt-2 text-sm leading-6 text-zinc-500">
                                    Es revisaran {aiCandidates.length} lliuraments pendents. La IA només generarà propostes: després hauràs de revisar-les i decidir quines aplicar.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAISetupOpen(false)}
                                disabled={isAIPending}
                                className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                aria-label="Tancar configuració IA"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">Idioma del feedback</span>
                                <select
                                    value={aiLanguage}
                                    onChange={(event) => setAiLanguage(event.target.value as typeof aiLanguage)}
                                    disabled={isAIPending}
                                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                >
                                    {AI_LANGUAGE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>

                            <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-sm leading-6 text-violet-950 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100">
                                La IA no qualificarà automàticament. Primer veuràs les notes, el comentari privat per al professor i el feedback que rebrà cada alumne.
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setAISetupOpen(false)}
                                disabled={isAIPending}
                                className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                                Cancel·lar
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkAI}
                                disabled={isAIPending}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-violet-500/20 transition-colors hover:bg-violet-700 disabled:opacity-50"
                            >
                                {isAIPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                {isAIPending ? "Analitzant..." : "Analitzar ara"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Zona de llista d'alumnes */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Cercar alumne..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={toggleVisibleDownloads}
                            disabled={visibleDownloadIds.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Check className="h-4 w-4" />
                            {allVisibleSelected ? "Deseleccionar" : "Seleccionar visibles"}
                        </button>
                        <button
                            type="button"
                            onClick={downloadSelectedSubmissions}
                            disabled={isDownloading || selectedDownloadIds.size === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-zinc-900/10 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                        >
                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {isDownloading ? "Preparant..." : `Descargar (${selectedDownloadIds.size})`}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAiMsg("");
                                setAISetupOpen(true);
                            }}
                            disabled={isAIPending || aiCandidates.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-violet-500/20 transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none dark:disabled:bg-zinc-800"
                        >
                            <Sparkles className="h-4 w-4" />
                            Corregir amb IA
                        </button>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-zinc-400" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                            >
                                <option value="all">Veure tots</option>
                                <option value="pending_grade">Per corregir</option>
                                <option value="graded">Corregits</option>
                                <option value="not_submitted">Sense lliurar</option>
                                <option value="returned">Retornats</option>
                            </select>
                        </div>
                    </div>
                </div>
                {aiMsg && (
                    <div className="border-b border-zinc-100 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-800 dark:border-zinc-800 dark:bg-amber-500/10 dark:text-amber-300">
                        {aiMsg}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500">
                            <tr>
                                <th className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        onChange={toggleVisibleDownloads}
                                        disabled={visibleDownloadIds.length === 0}
                                        aria-label="Seleccionar lliuraments visibles"
                                        className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                                    />
                                </th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Alumne</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Estat</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Data d&apos;entrega</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Nota</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Acció</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredStudents.map((student) => {
                                const sub = student.submission;
                                const isGraded = sub && sub.grade !== null && sub.grade !== undefined;
                                const isReturned = sub && sub.status === "returned";
                                const isPendingGrade = sub && sub.status === "submitted" && !isGraded;
                                const canDownload = Boolean(sub?.id && getSubmissionFileUrl(sub));
                                const studentComment = getSubmissionComment(sub);

                                return (
                                <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={sub?.id ? selectedDownloadIds.has(sub.id) : false}
                                            onChange={() => sub?.id && toggleDownloadSelection(sub.id)}
                                            disabled={!canDownload}
                                            aria-label={`Seleccionar lliurament de ${student.full_name || student.email || "alumne"}`}
                                            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-30"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-indigo-50 bg-cover bg-center text-xs font-black text-indigo-700 dark:border-zinc-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                                style={student.avatar_url ? { backgroundImage: `url(${student.avatar_url})` } : undefined}
                                                aria-hidden="true"
                                            >
                                                {!student.avatar_url && getInitials(student.full_name || student.email || "A")}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{student.full_name}</p>
                                                <p className="text-xs text-zinc-500">{student.email}</p>
                                                {studentComment && (
                                                    <p className="mt-1 max-w-xs truncate text-xs font-medium text-sky-700 dark:text-sky-300" title={studentComment}>
                                                        Comentari: {studentComment}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isGraded ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                                <CheckCircle2 className="w-3 h-3" /> Corregit
                                            </span>
                                        ) : isReturned ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                                <RotateCcw className="w-3 h-3" /> Retornat
                                            </span>
                                        ) : isPendingGrade ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 animate-pulse">
                                                <Clock className="w-3 h-3" /> Per avaluar
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                <AlertCircle className="w-3 h-3" /> Sense lliurament
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs font-medium">
                                        <span suppressHydrationWarning>{sub?.submitted_at ? new Date(sub.submitted_at).toLocaleString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }) : '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                                        {isGraded ? <span className={sub.grade >= 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{sub.grade}/10</span> : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={sub ? `/dashboard/assignments/${assignment.id}/grade/${sub.id}` : '#'}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${!sub ? 'opacity-50 pointer-events-none bg-zinc-100 dark:bg-zinc-800 text-zinc-400' : isGraded ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20'}`}
                                        >
                                            {isGraded ? <FileText className="w-4 h-4" /> : <PenSquare className="w-4 h-4" />}
                                            {isGraded ? "Veure / Editar" : "Qualificar"}
                                        </Link>
                                    </td>
                                </tr>
                                )
                            })}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
	                                        No s&apos;han trobat alumnes amb els filtres actuals.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {aiReviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-6 dark:border-zinc-800">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-300">Revisió IA</p>
                                <h2 className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">Correccions proposades</h2>
                                <p className="mt-1 text-sm text-zinc-500">Ajusta la nota si cal i marca Sí para aplicar una propuesta. Si la IA recomienda retornar, se devolverá con el feedback del alumno.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAIReviewOpen(false)}
                                className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                aria-label="Tancar revisió IA"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                {aiSuggestions.map((suggestion) => {
                                    const selected = selectedSuggestionIds.has(suggestion.submissionId);
                                    return (
                                        <article key={suggestion.submissionId} className={`rounded-2xl border p-5 transition-colors ${selected ? "border-violet-200 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-500/10" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}>
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">{suggestion.studentName}</h3>
                                                        {suggestion.studentEmail && <span className="text-sm text-zinc-500">{suggestion.studentEmail}</span>}
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${suggestion.shouldReturn ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
                                                            {suggestion.shouldReturn ? "Retornar" : "Qualificar"}
                                                        </span>
                                                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                                                            Confiança {suggestion.confidence}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 flex w-fit items-end gap-2 rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                                                        <label htmlFor={`ai-grade-${suggestion.submissionId}`} className="pb-2 text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-300">
                                                            Nota IA
                                                        </label>
                                                        <input
                                                            id={`ai-grade-${suggestion.submissionId}`}
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            step="0.1"
                                                            value={suggestion.grade}
                                                            onChange={(event) => updateSuggestionGrade(suggestion.submissionId, event.target.value)}
                                                            className="h-12 w-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-right text-xl font-black text-zinc-950 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-950"
                                                        />
                                                        <span className="pb-2 text-sm font-black text-zinc-400">/10</span>
                                                    </div>

                                                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                                        <div>
                                                            <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Per al professor</p>
                                                            <p className="whitespace-pre-line rounded-xl bg-white p-4 text-sm leading-6 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-800">{suggestion.teacherComment}</p>
                                                        </div>
                                                        <div>
                                                            <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Per a l&apos;alumne</p>
                                                            <p className="whitespace-pre-line rounded-xl bg-white p-4 text-sm leading-6 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-800">{suggestion.studentFeedback}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleSuggestion(suggestion.submissionId)}
                                                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${selected ? "bg-violet-600 text-white hover:bg-violet-700" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
                                                >
                                                    {selected ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                    {selected ? "Sí" : "No"}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-zinc-500">
                                {selectedSuggestionIds.size} de {aiSuggestions.length} propostes seleccionades
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAIReviewOpen(false)}
                                    className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                >
                                    Cancel·lar
                                </button>
                                <button
                                    type="button"
                                    onClick={applyAISuggestions}
                                    disabled={isApplyingAI || selectedSuggestionIds.size === 0}
                                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-violet-500/20 transition-colors hover:bg-violet-700 disabled:opacity-50"
                                >
                                    {isApplyingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Aplicar seleccionades
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getSubmissionFileUrl(submission: any) {
    return getHttpUrl(submission?.file_url);
}

function getSubmissionComment(submission: any) {
    const explicitComment = typeof submission?.student_comment === "string" ? submission.student_comment.trim() : "";
    if (explicitComment) return explicitComment;

    const legacyContent = typeof submission?.file_url === "string" ? submission.file_url.trim() : "";
    if (!legacyContent || getHttpUrl(legacyContent)) return "";
    return legacyContent;
}

function getHttpUrl(value?: string | null) {
    if (!value) return "";
    try {
        const url = new URL(value.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return "";
        return url.toString();
    } catch {
        return "";
    }
}

function getInitials(value: string) {
    return value
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}
