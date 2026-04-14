"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    X, Plus, Calendar, FileUp, Users, Check, Loader2,
    BookOpen, AlertTriangle, Trash2, CheckSquare, Square
} from "lucide-react";
import { createAssignmentFull } from "@/lib/actions";
import { getSubjectStudents } from "@/lib/data-service";

interface CreateAssignmentModalProps {
    subjects: any[];
    teacherId: string;
    onClose: () => void;
}

export default function CreateAssignmentModal({ subjects, teacherId, onClose }: CreateAssignmentModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
    const [dueDate, setDueDate] = useState("");
    const [lateDueDate, setLateDueDate] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    // Students
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [showStudentSelector, setShowStudentSelector] = useState(false);

    // Load students when subject changes
    useEffect(() => {
        if (!subjectId) return;
        setLoadingStudents(true);
        getSubjectStudents(subjectId).then((data) => {
            setStudents(data);
            setSelectedStudentIds(new Set(data.map((s: any) => s.id)));
            setLoadingStudents(false);
        });
    }, [subjectId]);

    const allSelected = students.length > 0 && selectedStudentIds.size === students.length;

    const toggleStudent = (id: string) => {
        setSelectedStudentIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(students.map((s: any) => s.id)));
        }
    };

    const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = () => {
        setMsg(null);
        if (!title.trim()) {
            setMsg({ type: "error", text: "El título es obligatorio." });
            return;
        }
        if (!subjectId) {
            setMsg({ type: "error", text: "Selecciona una asignatura." });
            return;
        }
        if (!dueDate) {
            setMsg({ type: "error", text: "La fecha de entrega es obligatoria." });
            return;
        }

        startTransition(async () => {
            const result = await createAssignmentFull({
                title: title.trim(),
                description: description.trim(),
                due_date: new Date(dueDate).toISOString(),
                late_due_date: lateDueDate ? new Date(lateDueDate).toISOString() : undefined,
                subject_id: subjectId,
                teacher_id: teacherId,
            });

            if (result.success) {
                setMsg({ type: "success", text: "Tarea creada correctamente." });
                router.refresh();
                setTimeout(() => onClose(), 1000);
            } else {
                setMsg({ type: "error", text: result.error || "Error desconocido." });
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Nueva Tarea</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Feedback */}
                    {msg && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "success"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                            }`}>
                            {msg.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {msg.text}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ej: Trabajo de investigación sobre el Renacimiento"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400"
                        />
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                            <BookOpen className="w-4 h-4" /> Asignatura *
                        </label>
                        <select
                            value={subjectId}
                            onChange={e => setSubjectId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        >
                            {subjects.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                            {subjects.length === 0 && (
                                <option value="">No tienes asignaturas</option>
                            )}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descripción / Instrucciones</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Describe la tarea, los requisitos, las fuentes permitidas..."
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-zinc-400"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-indigo-500" /> Fecha de entrega *
                            </label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-amber-500" /> Fecha límite con retraso
                            </label>
                            <input
                                type="datetime-local"
                                value={lateDueDate}
                                onChange={e => setLateDueDate(e.target.value)}
                                min={dueDate}
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                            <p className="text-xs text-zinc-400">Opcional. Entregas después de la fecha oficial.</p>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                            <FileUp className="w-4 h-4" /> Documentos adjuntos
                        </label>
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-600">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileAdd}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center cursor-pointer py-2"
                            >
                                <FileUp className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
                                <span className="text-sm text-zinc-500">Arrastra archivos o haz click para seleccionar</span>
                                <span className="text-xs text-zinc-400 mt-1">PDF, DOCX, imágenes, etc.</span>
                            </label>
                        </div>
                        {files.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{file.name}</span>
                                        <button onClick={() => removeFile(idx)} className="text-zinc-400 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Student Selector */}
                    <div className="space-y-1.5">
                        <button
                            onClick={() => setShowStudentSelector(!showStudentSelector)}
                            className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <Users className="w-4 h-4" />
                            Alumnos asignados ({selectedStudentIds.size}/{students.length})
                            <span className="text-xs text-zinc-400 ml-1">(por defecto todos)</span>
                        </button>

                        {showStudentSelector && (
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 max-h-48 overflow-y-auto">
                                {loadingStudents ? (
                                    <div className="flex items-center gap-2 py-4 justify-center text-zinc-400">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Cargando alumnos...
                                    </div>
                                ) : students.length === 0 ? (
                                    <p className="text-sm text-zinc-400 py-4 text-center">No hay alumnos matriculados en esta asignatura.</p>
                                ) : (
                                    <>
                                        <button
                                            onClick={toggleAll}
                                            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1 transition-colors"
                                        >
                                            {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4 text-zinc-400" />}
                                            Seleccionar todos
                                        </button>
                                        {students.map((student: any) => (
                                            <button
                                                key={student.id}
                                                onClick={() => toggleStudent(student.id)}
                                                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm transition-colors"
                                            >
                                                {selectedStudentIds.has(student.id)
                                                    ? <CheckSquare className="w-4 h-4 text-indigo-500" />
                                                    : <Square className="w-4 h-4 text-zinc-400" />
                                                }
                                                <span className="text-zinc-700 dark:text-zinc-300">{student.full_name || student.email}</span>
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Crear Tarea
                    </button>
                </div>
            </div>
        </div>
    );
}
