"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar, FileText, Download, CheckCircle2,
    AlertCircle, Clock, Loader2, Send, RotateCcw,
    FileUp, Bookmark, Upload
} from "lucide-react";
import { submitAssignment } from "@/lib/actions";

interface StudentAssignmentViewProps {
    assignment: any;
    userId: string;
}

export default function StudentAssignmentView({ assignment, userId }: StudentAssignmentViewProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Submission form
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const isGraded = assignment.status === "graded";
    const isSubmitted = assignment.status === "submitted" || isGraded;
    const isReturned = assignment.status === "returned";
    const submittedFileUrl = getSubmissionFileUrl(assignment);
    const studentComment = getSubmissionComment(assignment);

    // Dates
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const lateDueDate = assignment.late_due_date ? new Date(assignment.late_due_date) : null;
    const isLate = now > (lateDueDate || dueDate);
    const isStrictlyLate = now > dueDate;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !file) {
            setMsg({ type: "error", text: "Si us plau, afegeix algun fitxer o comentari al teu lliurament." });
            return;
        }

        setMsg(null);
        startTransition(async () => {
            const formData = new FormData();
            formData.append("assignment_id", assignment.id);
            formData.append("student_id", userId);
            if (content.trim()) formData.append("content", content.trim());
            if (file) formData.append("file", file);

            const result = await submitAssignment(formData);
            if (result.success) {
                setMsg({ type: "success", text: "Tasca lliurada correctament." });
                router.refresh();
            } else {
                setMsg({ type: "error", text: result.error || "Error en lliurar." });
            }
        });
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className={`px-8 py-10 relative overflow-hidden ${isGraded ? 'bg-emerald-600' : isSubmitted ? 'bg-blue-600' : isReturned ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                                {assignment.subject?.name}
                            </span>
                            {isStrictlyLate && !isSubmitted && !isLate && (
                                <span className="px-3 py-1 bg-rose-500/80 text-white rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md animate-pulse">
                                    Vencida - Retard permitido
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight flex items-center gap-3">
                            <Bookmark className="w-8 h-8 opacity-80" /> {assignment.title}
                        </h1>
                    </div>

                    {isGraded && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center min-w-[120px]">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Nota</span>
                            <span className={`text-4xl font-black ${assignment.grade >= 5 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {assignment.grade}
                            </span>
                            <span className="text-sm font-medium text-zinc-400">/ 10</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Left Column: Details & Instructions */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Dates block */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Data límit principal</p>
                            <div className="flex items-center gap-3 text-zinc-800 dark:text-zinc-200">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" suppressHydrationWarning>{dueDate.toLocaleDateString("ca-ES", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <p className="text-xs text-zinc-500" suppressHydrationWarning>{dueDate.toLocaleTimeString("ca-ES", { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        </div>

                        {assignment.late_due_date && (
                             <div className="bg-amber-50/50 dark:bg-amber-500/5 p-5 rounded-2xl border border-amber-100 dark:border-amber-500/10">
                                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Límite extendido</p>
                                <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" suppressHydrationWarning>{new Date(assignment.late_due_date).toLocaleDateString("ca-ES", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <p className="text-xs text-amber-600/70" suppressHydrationWarning>{new Date(assignment.late_due_date).toLocaleTimeString("ca-ES", { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Teacher Instructions */}
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" /> Instruccions del professor
                        </h3>
                        <div className="prose prose-zinc dark:prose-invert max-w-none bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 leading-relaxed text-sm">
                            {assignment.description || "No s'han proporcionat instruccions addicionals per a aquesta tasca."}
                        </div>
                    </div>

                    {/* Material assignat */}
                    {assignment.content_url && (
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                <Download className="w-5 h-5 text-indigo-500" /> Material adjunt
                            </h3>
                            <a
                                href={assignment.content_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-500/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-indigo-900 dark:text-indigo-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">Material adjunt</p>
                                        <p className="text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70">Fes clic per descarregar</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-lg transition-all">
                                    <Download className="w-5 h-5" />
                                </div>
                            </a>
                        </div>
                    )}
                </div>

                {/* Right Column: Submission Status & Action */}
                <div className="space-y-6">

                    {/* Status Card */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-6 uppercase tracking-wider">Estat del lliurament</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                                    <span className="text-sm font-medium text-zinc-500">Estat</span>
                                    {isGraded ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Qualificada
                                        </span>
                                    ) : isReturned ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                            <RotateCcw className="w-3.5 h-3.5" /> Retornada
                                        </span>
                                    ) : isSubmitted ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Lliurada
                                        </span>
                                    ) : isLate ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                                            <AlertCircle className="w-3.5 h-3.5" /> Tancada
                                        </span>
                                    ) : isStrictlyLate ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                            <AlertCircle className="w-3.5 h-3.5" /> Retard M.
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                                            <Clock className="w-3.5 h-3.5" /> Pendent
                                        </span>
                                    )}
                                </div>

                                {isSubmitted && assignment.submitted_at && (
                                     <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                                        <span className="text-sm font-medium text-zinc-500">Lliurat el</span>
                                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200" suppressHydrationWarning>
                                            {new Date(assignment.submitted_at).toLocaleDateString("ca-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"})}
                                        </span>
                                    </div>
                                )}

                                {isSubmitted && (
                                    <div className="py-2">
                                        <span className="text-sm font-medium text-zinc-500 block mb-3">Fitxers enviats</span>
                                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl">
                                            {submittedFileUrl ? (
                                                <a href={submittedFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group text-left">
                                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                                                        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">El teu fitxer entregat</p>
                                                        <p className="text-[10px] text-zinc-400">Fes clic per obrir</p>
                                                    </div>
                                                </a>
                                            ) : (
                                                <p className="text-sm italic text-zinc-500 text-center py-2">No hi ha fitxer adjunt.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isSubmitted && studentComment && (
                                    <div className="py-2">
                                        <span className="text-sm font-medium text-zinc-500 block mb-3">Comentari enviat</span>
                                        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                            {studentComment}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Retorn del professor */}
                    {(isGraded || isReturned) && assignment.feedback && (
                        <div className={`p-6 rounded-2xl border ${isGraded ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'}`}>
                            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isGraded ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                Comentaris del professor
                            </h3>
                            <div className="text-sm italic text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                                {assignment.feedback}
                            </div>
                        </div>
                    )}

                    {/* Submit Box */}
                    {(!isSubmitted || isReturned) && !isLate && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 overflow-hidden shadow-lg shadow-indigo-500/5">
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 px-6 py-4 border-b border-indigo-100 dark:border-indigo-500/20">
                                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                    <FileUp className="w-4 h-4 text-indigo-500" /> {isReturned ? 'Lliurament nou' : 'Afegir lliurament'}
                                </h3>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* File Upload */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pujar fitxer</label>
                                    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 transition-colors hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50 cursor-pointer group">
                                         <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex min-w-0 flex-col items-center justify-center p-4 text-center">
                                            {file ? (
                                                <div className="flex w-full min-w-0 items-center justify-center gap-2 px-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                                    <span className="min-w-0 max-w-full truncate" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-zinc-400 mb-2 group-hover:text-indigo-500 transition-colors" />
                                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Clic per pujar un document</p>
                                                    <p className="text-[10px] text-zinc-400 mt-1">PDF, DOCX, ZIP</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">O afegeix un enllaç/comentari</label>
                                    <textarea
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        rows={3}
                                        placeholder="URL de G.Docs o notes..."
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                                    />
                                </div>

                                {msg && (
                                    <div className={`text-xs p-3 rounded-lg flex gap-2 font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                                        {msg.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {isReturned ? 'Tornar a entregar' : 'Entregar treball'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Deadline reached */}
                    {isLate && !isSubmitted && (
                        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200 dark:border-zinc-800 opacity-80">
                            <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto mb-4 grayscale" />
                            <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-lg">Plazo finalizado</h3>
                            <p className="text-sm text-zinc-500 mt-2">
                                Ja no es permeten lliuraments per a aquesta activitat.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getSubmissionFileUrl(assignment: any) {
    return getHttpUrl(assignment.file_url);
}

function getSubmissionComment(assignment: any) {
    const explicitComment = typeof assignment.student_comment === "string" ? assignment.student_comment.trim() : "";
    if (explicitComment) return explicitComment;

    const legacyContent = typeof assignment.file_url === "string" ? assignment.file_url.trim() : "";
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
