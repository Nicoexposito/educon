"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Save, Clock, FileText, Settings, Upload, CheckCircle2, ArrowLeft } from "lucide-react";
import { createAssignment } from "@/lib/actions";
import Link from "next/link";

export default function CreateAssignmentForm({ subjects, teacherId, initialSubjectId }: { subjects: any[], teacherId: string, initialSubjectId?: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [lateDueDate, setLateDueDate] = useState("");
    const [subjectId, setSubjectId] = useState(initialSubjectId || "");
    const [allowLate, setAllowLate] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title || !dueDate || !subjectId) {
            setMsg({ type: "error", text: "Por favor, completa todos los campos obligatorios." });
            return;
        }

        setMsg(null);
        startTransition(async () => {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("due_date", dueDate);
            formData.append("subject_id", subjectId);
            formData.append("teacher_id", teacherId);
            
            if (allowLate && lateDueDate) {
                formData.append("late_due_date", lateDueDate);
            }

            if (file) {
                formData.append("file", file);
            }

            const result = await createAssignment(formData);
            if (result.success) {
                setMsg({ type: "success", text: "Tarea creada correctamente." });
                setTimeout(() => router.push('/dashboard/assignments'), 1000);
            } else {
                setMsg({ type: "error", text: result.error || "Error al crear la tarea." });
            }
        });
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/assignments" className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Crear Nueva Tarea</h2>
                        <p className="text-sm text-zinc-500">Configura los detalles de la actividad para tus alumnos.</p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {msg && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                        msg.type === "success" 
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" 
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
                    }`}>
                        {msg.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* General Info */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Información General
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Asignatura</label>
                                <select
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Selecciona una asignatura</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Título de la Tarea</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej: Ensayo sobre la Revolución Francesa"
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Instrucciones / Descripción</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Describe qué deben hacer los alumnos, formato de entrega, etc."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-4">
                         <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Material Adjunto (Opcional)
                        </h3>
                        
                        <div className="relative group border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors overflow-hidden">
                            <input 
                                type="file" 
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            />
                            <div className="flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${file ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                                    {file ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                </div>
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {file ? file.name : "Subir archivo de instrucciones o material"}
                                </h4>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Haz click o arrastra y suelta un PDF, DOC, ZIP (Max 10MB)"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dates & Configuration */}
                    <div className="space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Configuración de Entrega
                        </h3>

                        <div className="bg-zinc-50/80 dark:bg-zinc-800/30 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    <Clock className="w-4 h-4 text-indigo-500" /> Fecha y hora límite principal
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                    required
                                />
                            </div>

                            <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50">
                                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={allowLate}
                                            onChange={(e) => setAllowLate(e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                                        Permitir entregas con retraso
                                    </span>
                                </label>

                                {allowLate && (
                                    <div className="mt-4 pl-14 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-2">Fecha límite definitiva</label>
                                        <input
                                            type="datetime-local"
                                            value={lateDueDate}
                                            onChange={(e) => setLateDueDate(e.target.value)}
                                            className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50/30 dark:bg-amber-900/10 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm text-amber-900 dark:text-amber-100"
                                            required={allowLate}
                                        />
                                        <p className="text-[10px] text-amber-600/80 mt-1.5 ml-1">Pasada la fecha principal, los alumnos verán que entregan con retraso hasta esta fecha definitiva.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                        <Link
                            href="/dashboard/assignments"
                            className="px-6 py-3 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isPending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Crear Tarea
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
