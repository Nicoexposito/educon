"use client";

import React, { useMemo } from 'react';
import { Clock, MapPin, ArrowRight } from "lucide-react";
import Link from 'next/link';

export function CurrentClassWidget({ subjects }: { subjects: any[] }) {
    // Logic to find current class based on time
    // For demo purposes, we'll pick the first subject as "Current" or "Next"
    // In a real app, we'd compare `new Date()` with schedule times.
    
    // Mocking "Now" as 10:00 AM on Monday for demo consistency if needed, 
    // or just showing the first available class from the list as "Coming Up / Now"
    
    const currentClass = useMemo(() => {
        if (!subjects || subjects.length === 0) return null;
        // Just pick the first one for the demo
        return subjects[0];
    }, [subjects]);

    if (!currentClass) {
        return (
             <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex items-center justify-center text-zinc-500 h-full">
                <p>No tienes clases activas en este momento.</p>
            </div>
        );
    }

    return (
        <div className="bg-linear-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden h-full flex flex-col">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-900/20 rounded-full blur-xl -ml-5 -mb-5" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse border border-white/10">
                        En curso
                    </span>
                    <span className="text-indigo-100 text-sm font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        10:00 - 11:30
                    </span>
                </div>

                <h3 className="text-2xl font-bold mb-1">{currentClass.name}</h3>
                <p className="text-indigo-100 opacity-90 mb-6">Grupo A • Bachillerato</p>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-indigo-100 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
                        <MapPin className="w-4 h-4" />
                        <span>Aula 204</span>
                    </div>

                    <Link href={`/dashboard/subjects/${currentClass.id}`} className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
