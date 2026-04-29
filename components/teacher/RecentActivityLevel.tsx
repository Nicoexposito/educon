import React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, XCircle, Clock } from 'lucide-react';

export function RecentActivityLevel({ items = [] }: { items?: any[] }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full shadow-xs hover:shadow-md transition-shadow">
             <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Últimas Asignaturas</h3>
                    <p className="text-sm text-zinc-500">Asistencia y estado de clase</p>
                </div>
                <BookOpen className="w-5 h-5 text-zinc-400" />
            </div>
            
            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {items.map((item) => (
                        <Link 
                            key={item.id} 
                            href={item.href || '/dashboard/subjects'}
                            className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors flex gap-4 items-start group cursor-pointer block"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${item.attended === false ? 'bg-rose-100 text-rose-600' : item.attended === true ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-600'}`}>
                                {item.attended === false ? <XCircle className="w-5 h-5" /> : item.attended === true ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.schedule}</p>
                                <p className={`text-xs mt-1 font-medium ${item.attended === false ? 'text-rose-600 dark:text-rose-400' : item.attended === true ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                                    {item.attendanceLabel}
                                </p>
                            </div>
                        </Link>
                    ))}
                    {items.length === 0 && (
                        <div className="p-8 text-center text-sm text-zinc-500">No hay asignaturas para mostrar.</div>
                    )}
                </div>
            </div>
             <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 text-center">
                 <Link href="/dashboard/subjects" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors block w-full">Ver asignaturas</Link>
            </div>
        </div>
    );
}
