"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    X, Calendar, FileText, Download, CheckCircle2,
    AlertCircle, Clock, Loader2, Send, RotateCcw,
    FileUp, ExternalLink, Bookmark
} from "lucide-react";
import { submitAssignment } from "@/lib/actions";

interface StudentAssignmentModalProps {
    assignment: any;
    userId: string;
    onClose: () => void;
}

export default function StudentAssignmentModal({ assignment, userId, onClose }: StudentAssignmentModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Submission form
    const [content, setContent] = useState("");
    
    const isGraded = assignment.status === "graded";
    const isSubmitted = assignment.status === "submitted" || isGraded;
    const isReturned = assignment.status === "returned";
    
    // Dates
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const lateDueDate = assignment.late_due_date ? new Date(assignment.late_due_date) : null;
    const isLate = now > (lateDueDate || dueDate);
    const isStrictlyLate = now > dueDate;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setMsg({ type: "error", text: "Por favor, introduce el contenido o el enlace de tu entrega." });
            return;
        }

        setMsg(null);
        startTransition(async () => {
            const formData = new FormData();
            formData.append("assignment_id", assignment.id);
            formData.append("student_id", userId);
            formData.append("content", content.trim());

            const result = await submitAssignment(formData);
            if (result.success) {
                setMsg({ type: "success", text: "Tarea entregada correctamente." });
                router.refresh();
                // We keep modal open to show success, or close after a delay
                setTimeout(() => onClose(), 1500);
            } else {
                setMsg({ type: "error", text: result.error || "Error al entregar." });
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Tarea: {assignment.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Top Stats/Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Asignatura</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded text-sm font-medium">
                                    {assignment.subject?.name}
                                </span>
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Fecha límite</p>
                            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-medium">
                                    {dueDate.toLocaleDateString("es-ES", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {assignment.late_due_date && (
                                <p className="text-[10px] text-amber-500 mt-1 font-medium">
                                    Permite retraso hasta: {new Date(assignment.late_due_date).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Description & Resources */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-zinc-400" /> Instrucciones del profesor
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none bg-zinc-50/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                {assignment.description || "No hay instrucciones adicionales."}
                            </div>
                        </div>

                        {assignment.content_url && (
                            <div className="flex items-center justify-between p-4 bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                        <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Material de la actividad</p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400">Descarga los archivos necesarios para realizar la tarea.</p>
                                    </div>
                                </div>
                                <a 
                                    href={assignment.content_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                    Descargar
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Grade & Feedback (Current Submission Status) */}
                    {isSubmitted && (
                        <div className={`p-6 rounded-2xl border ${isGraded ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20' : 'bg-blue-50/30 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/20'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    {isGraded ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-blue-500" />
                                    )}
                                    {isGraded ? 'Tarea Calificada' : 'Tarea Entregada'}
                                </h3>
                                {isGraded && (
                                    <div className={`px-4 py-1.5 rounded-full font-bold text-xl ${assignment.grade >= 5 ? 'text-emerald-600 bg-emerald-100/50' : 'text-rose-600 bg-rose-100/50'}`}>
                                        {assignment.grade}/10
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Tu entrega</p>
                                    <div className="bg-white dark:bg-zinc-900/50 p-3 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800">
                                        {assignment.file_url?.startsWith('http') ? (
                                            <a href={assignment.file_url} target="_blank" className="text-indigo-600 underline flex items-center gap-1.5">
                                                <ExternalLink className="w-3.5 h-3.5" /> Ver archivo entregado
                                            </a>
                                        ) : (
                                            assignment.file_url || "Sin contenido registrado."
                                        )}
                                    </div>
                                </div>

                                {isGraded && assignment.feedback && (
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Feedback del profesor</p>
                                        <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl text-sm italic text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                                            "{assignment.feedback}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Returning Message */}
                    {isReturned && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex gap-3">
                            <RotateCcw className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Tarea devuelta</p>
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                    El profesor ha devuelto tu entrega. Revisa el feedback y vuelve a entregarla cuando esté lista.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Submission Form (Only if not graded and (not submitted or returned)) */}
                    {(!isSubmitted || isReturned) && !isLate && (
                        <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                                    <FileUp className="w-4 h-4 text-indigo-500" /> {isReturned ? 'Nueva entrega' : 'Realizar entrega'}
                                </h3>
                                {isStrictlyLate && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold animate-pulse">
                                        ENTREGA FUERA DE PLAZO
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500">Contenido o Enlace URL de la tarea</label>
                                    <textarea
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        rows={4}
                                        placeholder="Copia aquí el enlace a tu documento (Google Docs, PDF, etc.) o escribe la respuesta a la actividad."
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                                    />
                                </div>

                                {msg && (
                                    <div className={`text-xs p-3 rounded-lg ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                        {msg.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {isReturned ? 'Volver a entregar' : 'Enviar Tarea'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Late / Closed Message */}
                    {isLate && !isSubmitted && (
                        <div className="p-8 text-center bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                            <h3 className="font-bold text-rose-900 dark:text-rose-200">Plazo finalizado</h3>
                            <p className="text-sm text-rose-600 dark:text-rose-400 mt-2">
                                Ya no se permiten entregas para esta actividad. Ponte en contacto con tu profesor si has tenido algún problema.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
