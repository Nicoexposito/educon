"use client";

import React, { useState } from 'react';
import { Users, Clock, MoreVertical, ArrowRight, FileText, ClipboardCheck, FolderOpen } from 'lucide-react';
import Link from 'next/link';

interface SubjectCardProps {
    subject: any;
    role: 'teacher' | 'student';
}

export function SubjectCard({ subject, role }: SubjectCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const scheduleText = subject.schedules?.length
        ? subject.schedules.map((s: any) => `${s.day_of_week} ${String(s.start_time).slice(0, 5)}-${String(s.end_time).slice(0, 5)}`).join(', ')
        : subject.schedule || "Horari no definit";

    return (
        <div className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-800 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-sm">
                        {subject.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen((open) => !open)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label="Opcions de l'assignatura"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-8 z-20 w-48 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
                                <MenuLink href={`/dashboard/subjects/${subject.id}`} icon={FolderOpen} label="Veure assignatura" />
                                {role === 'teacher' ? (
                                    <>
                                        <MenuLink href={`/dashboard/assignments/new?subject=${subject.id}`} icon={FileText} label="Crear tasca" />
                                        <MenuLink href={`/dashboard/subjects/${subject.id}`} icon={ClipboardCheck} label="Passar llista" />
                                    </>
                                ) : (
                                    <>
                                        <MenuLink href={`/dashboard/subjects/${subject.id}`} icon={FileText} label="Lliurar tasques" />
                                        <MenuLink href="/dashboard/attendance" icon={ClipboardCheck} label="Veure assistencia" />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-4 flex-1">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                        {subject.name}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2">
                        {subject.description || "Curs acadèmic 2024-2025"}
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span className="line-clamp-1">{scheduleText}</span>
                    </div>
                    {role === 'teacher' && (
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>{subject.student_count ?? subject.students_count ?? "—"} Alumnes</span>
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

function MenuLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    return (
        <Link href={href} className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <Icon className="w-4 h-4 text-zinc-400" />
            {label}
        </Link>
    );
}
