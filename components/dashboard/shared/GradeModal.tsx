"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    X, ChevronRight, ChevronLeft, Star, MessageSquare,
    RotateCcw, Check, Loader2, Sparkles, AlertTriangle,
    User, Clock, FileText
} from "lucide-react";
import { gradeSubmission, returnSubmission, aiGradeEstimate } from "@/lib/actions";

interface GradeModalProps {
    assignment: any;
    onClose: () => void;
}

export default function GradeModal({ assignment, onClose }: GradeModalProps) {
    const router = useRouter();
    const submissions: any[] = assignment.submissions || [];
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const selectedSubmission = selectedIdx !== null ? submissions[selectedIdx] : null;

    // Grading form
    const [grade, setGrade] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // AI grading
    const [showAI, setShowAI] = useState(false);
    const [aiCriteria, setAiCriteria] = useState("");
    const [aiResult, setAiResult] = useState<{ grade: number; justification: string } | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);

    const handleSelectSubmission = (idx: number) => {
        setSelectedIdx(idx);
        const sub = submissions[idx];
        setGrade(sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : "");
        setFeedback(sub.feedback || "");
        setMsg(null);
        setAiResult(null);
        setShowAI(false);
    };

    const handleGrade = () => {
        if (!selectedSubmission) return;
        const numGrade = parseFloat(grade);
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 10) {
            setMsg({ type: "error", text: "La nota ha de ser un número entre 0 i 10." });
            return;
        }
        setMsg(null);
        startTransition(async () => {
            const result = await gradeSubmission(selectedSubmission.id, numGrade, feedback);
            if (result.success) {
                setMsg({ type: "success", text: "Qualificació desada correctament." });
                router.refresh();
            } else {
                setMsg({ type: "error", text: result.error || "Error desconegut." });
            }
        });
    };

    const handleReturn = () => {
        if (!selectedSubmission) return;
        if (!feedback.trim()) {
            setMsg({ type: "error", text: "Has d'escriure un comentari abans de retornar el lliurament." });
            return;
        }
        setMsg(null);
        startTransition(async () => {
            const result = await returnSubmission(selectedSubmission.id, feedback);
            if (result.success) {
                setMsg({ type: "success", text: "Lliurament retornat. L'alumne podrà tornar a lliurar." });
                router.refresh();
            } else {
                setMsg({ type: "error", text: result.error || "Error desconegut." });
            }
        });
    };

    const handleAIGrade = async () => {
        if (!selectedSubmission || !aiCriteria.trim()) return;
        setIsAILoading(true);
        setAiResult(null);
        try {
            const result = await aiGradeEstimate(selectedSubmission.file_url || "", aiCriteria);
            if (result.success) {
                setAiResult({ grade: result.grade, justification: result.justification });
            }
        } catch {
            setMsg({ type: "error", text: "Error en contactar amb la IA." });
        }
        setIsAILoading(false);
    };

    const acceptAIGrade = () => {
        if (aiResult) {
            setGrade(String(aiResult.grade));
            setFeedback(aiResult.justification);
            setShowAI(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Qualificar: {assignment.title}</h2>
                        <p className="text-sm text-zinc-500">{assignment.subject?.name} · {submissions.length} lliuraments</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Submissions list */}
                    <div className="w-72 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto shrink-0">
                        <div className="p-3">
                            <p className="text-xs font-semibold uppercase text-zinc-400 px-2 mb-2">Lliuraments</p>
                            {submissions.length === 0 && (
                                <p className="text-sm text-zinc-400 px-2 py-4">Encara no hi ha lliuraments.</p>
                            )}
                            {submissions.map((sub: any, idx: number) => {
                                const isSelected = selectedIdx === idx;
                                const isGraded = sub.grade !== null && sub.grade !== undefined;
                                const isReturned = sub.status === "returned";
                                return (
                                    <button
                                        key={sub.id}
                                        onClick={() => handleSelectSubmission(idx)}
                                        className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all ${isSelected
                                            ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30"
                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                                {sub.student?.full_name || "Alumne"}
                                            </span>
                                            {isGraded && (
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${sub.grade >= 5 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10"}`}>
                                                    {sub.grade}
                                                </span>
                                            )}
                                            {isReturned && (
                                                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                                            <Clock className="w-3 h-3" />
                                            {sub.submitted_at
                                                ? new Date(sub.submitted_at).toLocaleDateString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                                : "—"}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Submission detail + grading */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedSubmission ? (
                            <div className="space-y-6">
                                {/* Student info */}
                                <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedSubmission.student?.full_name || "Alumne"}</p>
                                        <p className="text-xs text-zinc-500">{selectedSubmission.student?.email}</p>
                                    </div>
                                </div>

                                {/* Submission content */}
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4" /> Contingut del lliurament
                                    </h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto border border-zinc-100 dark:border-zinc-700">
                                        {selectedSubmission.file_url ? (
                                            selectedSubmission.file_url.startsWith('http') ? (
                                                <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium underline">
                                                    <FileText className="w-4 h-4" /> Veure el fitxer lliurat
                                                </a>
                                            ) : (
                                                selectedSubmission.file_url
                                            )
                                        ) : "Sense contingut en el lliurament."}
                                    </div>
                                </div>

                                {/* Missatge de retorn */}
                                {msg && (
                                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "success"
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                        }`}>
                                        {msg.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                        {msg.text}
                                    </div>
                                )}

                                {/* Grading Form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                            <Star className="w-4 h-4 text-amber-500" /> Nota (0-10)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={grade}
                                            onChange={e => setGrade(e.target.value)}
                                            placeholder="8.5"
                                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                            <MessageSquare className="w-4 h-4 text-indigo-500" /> Comentari / Retorn
                                        </label>
                                        <textarea
                                            value={feedback}
                                            onChange={e => setFeedback(e.target.value)}
                                            rows={3}
                                            placeholder="Escriu un comentari per a l'alumne..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        onClick={handleGrade}
                                        disabled={isPending}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Desar Nota
                                    </button>
                                    <button
                                        onClick={handleReturn}
                                        disabled={isPending}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Retornar
                                    </button>
                                    <button
                                        onClick={() => setShowAI(!showAI)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 ml-auto ${showAI
                                            ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                                            : "border border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                                            }`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Qualificar amb IA
                                    </button>
                                </div>

                                {/* AI Grading Panel */}
                                {showAI && (
                                    <div className="bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/20 rounded-2xl p-5 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                            <h3 className="font-semibold text-violet-900 dark:text-violet-200">Qualificació assistida per IA</h3>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-violet-700 dark:text-violet-300">
                                                Criteris d'avaluació (rúbriques, esquemes, taules...)
                                            </label>
                                            <textarea
                                                value={aiCriteria}
                                                onChange={e => setAiCriteria(e.target.value)}
                                                rows={4}
                                                placeholder={"Exemple:\n- Contingut (40%): profunditat, exactitud\n- Estructura (30%): organització, claredat\n- Presentació (20%): format, ortografia\n- Originalitat (10%): aportacions pròpies"}
                                                className="w-full px-4 py-2.5 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all resize-none text-sm"
                                            />
                                        </div>

                                        <button
                                            onClick={handleAIGrade}
                                            disabled={isAILoading || !aiCriteria.trim()}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-md shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isAILoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {isAILoading ? "Analitzant..." : "Generar estimació"}
                                        </button>

                                        {/* AI Result */}
                                        {aiResult && (
                                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-violet-200 dark:border-violet-500/20 p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Nota estimada per IA:</span>
                                                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">{aiResult.grade}/10</span>
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                                                    {aiResult.justification}
                                                </div>
                                                <div className="flex items-center gap-3 pt-1">
                                                    <button
                                                        onClick={acceptAIGrade}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all active:scale-95"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Acceptar nota
                                                    </button>
                                                    <button
                                                        onClick={() => setAiResult(null)}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                                                    >
                                                        Rebutjar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-16">
                                <ChevronLeft className="w-10 h-10 mb-3 opacity-30" />
                                <p className="font-medium">Selecciona un lliurament</p>
                                <p className="text-sm mt-1">Fes clic en un alumne de la llista per veure el seu lliurament i qualificar-lo.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
