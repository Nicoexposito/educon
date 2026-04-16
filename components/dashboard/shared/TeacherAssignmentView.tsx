"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar, CheckCircle2, AlertCircle, Clock,
    Search, Filter, RotateCcw, PenSquare, FileText
} from "lucide-react";
import Link from "next/link";

interface TeacherAssignmentViewProps {
    assignment: any;
    students: any[];
    teacherId: string;
}

export default function TeacherAssignmentView({ assignment, students }: TeacherAssignmentViewProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Stats
    const totalStudents = students.length;
    const submittedCount = students.filter(s => s.submission && (s.submission.status === 'submitted' || s.submission.status === 'graded')).length;
    const gradedCount = students.filter(s => s.submission?.grade !== null && s.submission?.grade !== undefined).length;
    
    const dueDate = new Date(assignment.due_date);

    // Filter logic
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        const sub = student.submission;
        
        let matchesStatus = true;
        if (statusFilter === "pending_grade") {
            matchesStatus = sub && (sub.grade === null || sub.grade === undefined) && sub.status !== "returned";
        } else if (statusFilter === "graded") {
            matchesStatus = sub && sub.grade !== null && sub.grade !== undefined;
        } else if (statusFilter === "not_submitted") {
            matchesStatus = !sub || sub.status === "pending"; // No submission at all
        } else if (statusFilter === "returned") {
             matchesStatus = sub && sub.status === "returned";
        }

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header Details */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-8 justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">{assignment.title}</h1>
                    <p className="text-zinc-500 font-medium">{assignment.subject?.name}</p>
                    <div className="mt-6 flex flex-wrap gap-4">
                         <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                             <Calendar className="w-4 h-4 text-indigo-500" />
                             Cierra el {dueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                         </div>
                    </div>
                </div>

                {/* Progress Stats */}
                <div className="flex items-center gap-6 min-w-[300px]">
                    <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-zinc-500">Entregas</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{submittedCount} / {totalStudents}</span>
                        </div>
                        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-zinc-500">Corregidas</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{gradedCount} / {submittedCount}</span>
                        </div>
                        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${submittedCount > 0 ? (gradedCount / submittedCount) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students List area */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar alumno..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-zinc-400" />
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value)}
                            className="text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
                        >
                            <option value="all">Ver Todos</option>
                            <option value="pending_grade">Por Corregir</option>
                            <option value="graded">Corregidos</option>
                            <option value="not_submitted">Sin entregar</option>
                            <option value="returned">Devueltos</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Alumno</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Estado</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Fecha Entrega</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Nota</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredStudents.map((student) => {
                                const sub = student.submission;
                                const isGraded = sub && sub.grade !== null && sub.grade !== undefined;
                                const isReturned = sub && sub.status === "returned";
                                const isPendingGrade = sub && sub.status === "submitted" && !isGraded;

                                return (
                                <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=random`} alt={student.full_name} className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700" />
                                            <div>
                                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{student.full_name}</p>
                                                <p className="text-xs text-zinc-500">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isGraded ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                                <CheckCircle2 className="w-3 h-3" /> Corregido
                                            </span>
                                        ) : isReturned ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                                <RotateCcw className="w-3 h-3" /> Devuelto
                                            </span>
                                        ) : isPendingGrade ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 animate-pulse">
                                                <Clock className="w-3 h-3" /> Por Evaluar
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                <AlertCircle className="w-3 h-3" /> Sin entrega
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs font-medium">
                                        {sub?.submitted_at ? new Date(sub.submitted_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }) : '-'}
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
                                            {isGraded ? "Ver / Editar" : "Calificar"}
                                        </Link>
                                    </td>
                                </tr>
                                )
                            })}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                                        No se encontraron alumnos con los filtros actuales.
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
