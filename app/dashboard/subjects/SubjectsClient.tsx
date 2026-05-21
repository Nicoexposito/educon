"use client";

import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { SubjectCard } from "@/components/teacher/SubjectCard";
import { Plus } from "lucide-react";

export function SubjectsClient({ initialSubjects, role }: { initialSubjects: any[], role: string }) {
    const { data: subjects } = useRealtimeTable({
        table: 'subjects',
        initialData: initialSubjects,
    });

    const groupedSubjects = subjects.reduce((acc: any, subject: any) => {
        const cat = role === 'student'
            ? subject.course?.name || subject.category || 'Sense curs'
            : subject.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(subject);
        return acc;
    }, {});

    return (
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Les meves assignatures</h1>
                    <p className="text-zinc-500 mt-2">{role === 'student' ? 'Assignatures agrupades pel teu curs o classe.' : 'Gestiona les teves classes i el contingut acadèmic.'}</p>
                </div>
                {role === 'teacher' && (
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 font-medium text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto">
                        <Plus className="w-5 h-5" />
                        Assignatura nova
                    </button>
                )}
            </div>

            <div className="space-y-12">
                {Object.entries(groupedSubjects).map(([category, categorySubjects]: [string, any]) => (
                    <div key={category}>
                        <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}>
                            <span className="w-1.5 h-6 bg-[var(--primary)] rounded-full"></span>
                            {category}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categorySubjects.map((subject: any) => (
                                <SubjectCard key={subject.id} subject={subject} role={role as any} />
                            ))}
                        </div>
                    </div>
                ))}

                {subjects.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-dashed border-border">
                        <p className="text-muted-foreground">No tens assignatures assignades.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
