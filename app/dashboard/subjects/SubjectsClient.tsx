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
        const cat = subject.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(subject);
        return acc;
    }, {});

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Les meves assignatures</h1>
                    <p className="text-zinc-500 mt-2">Gestiona els teus cursos i el contingut acadèmic.</p>
                </div>
                {role === 'teacher' && (
                    <button className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
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
