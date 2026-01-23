import React from 'react';
import { Users, Clock, MoreVertical, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface SubjectCardProps {
    subject: any;
    role: 'teacher' | 'student';
}

export function SubjectCard({ subject, role }: SubjectCardProps) {
    // Generate a consistent gradient based on subject ID or name char code?
    // For now random-ish or fixed based on index if passed, but here we just pick one.
    // Let's use a subtle border/bg approach for "Premium" feel.

    return (
        <div className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-800 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-sm">
                        {subject.name.substring(0, 2).toUpperCase()}
                    </div>
                    <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4 flex-1">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                        {subject.name}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2">
                        {subject.description || "Curso académico 2024-2025"}
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{subject.schedule || "TBA"}</span>
                    </div>
                    {role === 'teacher' && (
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>24 Alumnos</span>
                        </div>
                    )}
                </div>

                <Link 
                    href={`/dashboard/subjects/${subject.id}`}
                    className="mt-auto w-full py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all"
                >
                    {role === 'teacher' ? 'Gestionar' : 'Entrar'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
