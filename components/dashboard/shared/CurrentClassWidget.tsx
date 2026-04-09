"use client";

import React, { useMemo } from 'react';
import { Clock, MapPin, ArrowRight } from "lucide-react";
import Link from 'next/link';

export function CurrentClassWidget({ subjects }: { subjects: any[] }) {
    const currentClass = useMemo(() => {
        if (!subjects || subjects.length === 0) return null;
        return subjects[0];
    }, [subjects]);

    if (!currentClass) {
        return (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs flex items-center justify-center text-muted-foreground h-full">
                <p className="text-sm text-center">No tens classes actives en aquest moment.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-full flex flex-col"
            style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, oklch(0.26 0.06 258) 100%)',
            }}
        >
            {/* Decorative geometry */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                style={{ background: 'var(--accent)', filter: 'blur(40px)' }}
                aria-hidden="true"
            />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 border-2 border-white"
                aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Status badge */}
                <div className="flex items-center gap-3 mb-5">
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
                        En curs
                    </span>
                    <span className="text-white/70 text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <time>10:00&nbsp;&ndash;&nbsp;11:30</time>
                    </span>
                </div>

                <h2
                    className="text-2xl font-bold leading-tight mb-1"
                    style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                >
                    {currentClass.name}
                </h2>
                <p className="text-white/60 text-sm mb-6">Grup A &nbsp;&bull;&nbsp; Batxillerat</p>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/70 bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Aula 204</span>
                    </div>

                    <Link
                        href={`/dashboard/subjects/${currentClass.id}`}
                        aria-label={`Veure detalls de ${currentClass.name}`}
                        className="p-2.5 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-xl hover:opacity-90 transition-opacity shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
