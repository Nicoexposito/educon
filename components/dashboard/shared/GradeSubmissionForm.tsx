"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Save, FileText, CheckCircle2, AlertCircle, RotateCcw,
    Bot, Download, Link as LinkIcon, Loader2
} from "lucide-react";
import { gradeSubmission, returnSubmission, aiGradeEstimate } from "@/lib/actions";

interface GradeSubmissionFormProps {
    submission: any;
}

const AI_LANGUAGE_OPTIONS = [
    { value: "ca", label: "CAT" },
    { value: "es", label: "CAS" },
    { value: "en", label: "ENG" },
] as const;

export default function GradeSubmissionForm({ submission }: GradeSubmissionFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isAIGrading, setIsAIGrading] = useState(false);
    const [aiTeacherComment, setAiTeacherComment] = useState("");
    const [aiConfidence, setAiConfidence] = useState("");
    const [aiLanguage, setAiLanguage] = useState<(typeof AI_LANGUAGE_OPTIONS)[number]["value"]>("ca");

    // Set initial states
    const [grade, setGrade] = useState<string>(submission.grade !== null ? String(submission.grade) : "");
    const [feedback, setFeedback] = useState<string>(submission.feedback || "");
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const isGraded = submission.grade !== null && submission.grade !== undefined;
    const isReturned = submission.status === "returned";
    const submittedFileUrl = getSubmissionFileUrl(submission);
    const studentComment = getSubmissionComment(submission);

    const handleGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        const numGrade = parseFloat(grade);

        if (isNaN(numGrade) || numGrade < 0 || numGrade > 10) {
            setMsg({ type: "error", text: "La nota ha de ser un número entre 0 i 10." });
            return;
        }

        setMsg(null);
        startTransition(async () => {
            const result = await gradeSubmission(submission.id, numGrade, feedback);
            if (result.success) {
                setMsg({ type: "success", text: "Qualificació desada correctament." });
                router.refresh();
                setTimeout(() => router.push(`/dashboard/assignments/${submission.assignment_id}`), 1000);
            } else {
                setMsg({ type: "error", text: result.error || "Error en qualificar." });
            }
        });
    };

    const handleReturn = async () => {
        if (!feedback) {
            setMsg({ type: "error", text: "Has d'escriure un comentari per retornar la tasca." });
            return;
        }

        if (!confirm("Segur que vols retornar aquest lliurament? L'alumne haurà de repetir-lo.")) {
            return;
        }

        setMsg(null);
        startTransition(async () => {
            const result = await returnSubmission(submission.id, feedback);
            if (result.success) {
                setMsg({ type: "success", text: "Lliurament retornat per corregir." });
                router.refresh();
                setTimeout(() => router.push(`/dashboard/assignments/${submission.assignment_id}`), 1000);
            } else {
                setMsg({ type: "error", text: result.error || "Error en retornar." });
            }
        });
    };

    const handleAIGrade = async () => {
        setIsAIGrading(true);
        setMsg(null);
        try {
            // Check if there is text content or file URL. For now, AI might only grade text or needs to know there is a file.
            // If the system expects text content in file_url currently, we use that.
            const contentToGrade = submittedFileUrl || studentComment || "No s'ha adjuntat contingut de text.";
            const criteria = submission.assignment?.description || "Criteris d'avaluació generals";

            const result = await aiGradeEstimate(contentToGrade, criteria, aiLanguage, studentComment);
            if (result.success) {
                setGrade(String(result.grade));
                setFeedback(result.studentFeedback);
                setAiTeacherComment(result.teacherComment);
                setAiConfidence(result.confidence);
                setMsg({ type: "success", text: "Estimació d'IA completada. Revisa els resultats abans de desar." });
            } else {
                setMsg({ type: "error", text: result.error || "No s'ha pogut completar l'estimació d'IA." });
            }
        } catch (error) {
            setMsg({ type: "error", text: "Error en el servei d'IA." });
        } finally {
            setIsAIGrading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 grid md:grid-cols-2">
            {/* Left side: Student Info and Submission Content */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src={submission.student?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.student?.full_name || 'A')}&background=random`}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm"
                    />
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{submission.student?.full_name}</h2>
                        <p className="text-sm text-zinc-500">{submission.student?.email}</p>
                    </div>
                </div>

                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4" /> Lliurable
                </h3>

                {submittedFileUrl ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 flex items-center justify-center">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4 border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Fitxer enviat</h4>
                            <p className="text-sm text-zinc-500 mb-4" suppressHydrationWarning>{formatDateTime(submission.submitted_at)}</p>
                            <a
                                href={submittedFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                <Download className="w-4 h-4" /> Descarregar / Obrir
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 flex flex-col items-center justify-center text-center opacity-70">
                        <AlertCircle className="w-12 h-12 text-zinc-400 mb-4 grayscale" />
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Sense fitxer adjunt</h4>
                        <p className="text-sm text-zinc-500 mt-1">L'alumne no ha inclòs cap document ni enllaç.</p>
                    </div>
                )}

                {studentComment && (
                    <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/70 p-5 dark:border-sky-500/20 dark:bg-sky-500/10">
                        <p className="mb-2 text-xs font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">Comentari de l'alumne</p>
                        <p className="whitespace-pre-line text-sm leading-6 text-zinc-700 dark:text-zinc-200">{studentComment}</p>
                    </div>
                )}
            </div>

            {/* Right side: Grading Form */}
            <div className="p-8 flex flex-col h-full bg-white dark:bg-zinc-900">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Qualificació</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                            Idioma IA
                            <select
                                value={aiLanguage}
                                onChange={(event) => setAiLanguage(event.target.value as typeof aiLanguage)}
                                disabled={isAIGrading || isPending}
                                className="bg-transparent text-sm font-black tracking-normal text-zinc-900 outline-none dark:text-zinc-100"
                            >
                                {AI_LANGUAGE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={handleAIGrade}
                            disabled={isAIGrading || isPending}
                            className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-5 py-2.5 text-sm font-black text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20"
                        >
                            {isAIGrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                            {isAIGrading ? "Analitzant..." : "Análisis IA"}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleGrade} className="flex flex-col flex-1 gap-6">
                    <div className="flex items-center gap-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <div className="flex-1 space-y-2">
                             <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nota final (0-10)</label>
                             <input
                                type="number"
                                min="0" max="10" step="0.1"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full text-3xl font-black px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:font-normal"
                                placeholder="--"
                                required
                            />
                        </div>
                        {isGraded && (
                            <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-8 h-8 mb-1" />
                                <span className="text-xs font-bold">Ya avaluado</span>
                            </div>
                        )}
                    </div>

                    {aiTeacherComment && (
                        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-950 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-xs font-black uppercase tracking-widest text-violet-700 dark:text-violet-300">Comentari privat per al professor</p>
                                {aiConfidence && (
                                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-white/10 dark:text-violet-200">
                                        Confiança: {aiConfidence}
                                    </span>
                                )}
                            </div>
                            <p className="whitespace-pre-line text-sm leading-6">{aiTeacherComment}</p>
                        </div>
                    )}

                    <div className="flex flex-col space-y-2">
                         <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Feedback per a l'alumne</label>
                         <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={9}
                            className="min-h-56 w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base leading-7 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
                            placeholder="Escriu aquí què ha fet mal l'alumne, què ha de corregir i com pot millorar..."
                        />
                    </div>

                    {msg && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                            msg.type === "success"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                                : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
                        }`}>
                            {msg.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {msg.text}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                        <button
                            type="button"
                            onClick={handleReturn}
                            disabled={isPending || isGraded}
                            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                        >
                            <RotateCcw className="w-5 h-5" /> Retornar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Desar Nota
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function getSubmissionFileUrl(submission: any) {
    return getHttpUrl(submission.file_url);
}

function getSubmissionComment(submission: any) {
    const explicitComment = typeof submission.student_comment === "string" ? submission.student_comment.trim() : "";
    if (explicitComment) return explicitComment;

    const legacyContent = typeof submission.file_url === "string" ? submission.file_url.trim() : "";
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

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}
