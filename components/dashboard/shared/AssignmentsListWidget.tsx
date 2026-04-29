"use client";

import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface PendingItem {
    id: string;
    title: string;
    subtitle: string;
    date: string; // Due date or submitted date
    status?: 'pending' | 'submitted' | 'late' | 'ungraded';
    type: 'assignment' | 'submission';
}

export function AssignmentsListWidget({ items, title, role }: { items: any[], title: string, role: string }) {
    
    // Transform items to standard format based on role
    const displayItems: PendingItem[] = items.map(item => {
        if (role === 'teacher') {
            // Item is a submission to grade
            return {
                id: item.id,
                title: item.assignment?.title || 'Tarea sin título',
                subtitle: `Por ${item.student?.full_name || 'Estudiante'} • ${item.assignment?.subject?.name || 'Materia'}`,
                date: formatDate(item.submitted_at),
                status: 'ungraded',
                type: 'submission'
            }
        } else {
            // Item is an assignment to submit
            const isSubmitted = item.status === 'submitted';
            return {
                id: item.id,
                title: item.title,
                subtitle: item.subject?.name || 'Asignatura',
                date: formatDate(item.due_date),
                status: isSubmitted ? 'submitted' : 'pending',
                type: 'assignment'
            }
        }
    });

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full shadow-xs hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{title}</h3>
                <Link href="/dashboard/assignments" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                    Ver todo
                </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {displayItems.length > 0 ? displayItems.map((item) => (
                        <Link 
                            href="/dashboard/assignments"
                            key={item.id} 
                            className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors flex gap-4 items-center group cursor-pointer block"
                        >
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                ${item.status === 'submitted' ? 'bg-emerald-100 text-emerald-600' :
                                  item.status === 'ungraded' ? 'bg-amber-100 text-amber-600' :
                                  'bg-indigo-100 text-indigo-600'}
                            `}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{item.title}</h4>
                                <p className="text-xs text-zinc-500 truncate mt-0.5">{item.subtitle}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span suppressHydrationWarning className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    item.status === 'submitted' ? 'bg-emerald-50 text-emerald-600' :
                                    item.status === 'ungraded' ? 'bg-amber-50 text-amber-600' :
                                    'bg-zinc-100 text-zinc-600'
                                }`}>
                                    {item.status === 'ungraded' ? 'Por corregir' : item.date}
                                </span>
                            </div>
                        </Link>
                    )) : (
                         <div className="p-8 text-center text-zinc-400 text-sm">
                            <p>¡Estás al día! No hay tareas pendientes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatDate(value: string) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}
