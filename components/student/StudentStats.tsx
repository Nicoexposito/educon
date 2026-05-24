"use client";

import React from 'react';
import { BookOpen, CalendarCheck, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, TrendingUp, CheckCircle2 } from 'lucide-react';

type StudentStatsData = {
    assignmentsPending?: number;
    avgGrade?: string;
    attendanceRate?: string;
};

type StatsColor = "indigo" | "emerald" | "amber" | "violet" | "rose";

type StatsCardProps = {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    color: StatsColor;
    correction?: boolean;
};

export function StudentStats({ stats }: { stats: StudentStatsData }) {
    const assignmentsPending = stats?.assignmentsPending || 0;
    const avgGrade = stats?.avgGrade || "—";
    const attendanceRate = stats?.attendanceRate || "—";

    // Calculate remaining days until June 22, 2026
    const endDate = new Date(2026, 5, 22); // Month is 0-indexed, so 5 = June
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const courseFinished = daysRemaining <= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
                title="Mitjana global"
                value={avgGrade}
                icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
                trend={avgGrade === "—" ? "Sense notes" : "Notes reals"}
                trendUp={avgGrade !== "—"}
                color="indigo"
            />
             <StatsCard
                title="Entrega de treballs"
                value={assignmentsPending.toString()}
                icon={<BookOpen className="w-5 h-5 text-amber-600" />}
                trend={assignmentsPending > 0 ? "Per entregar" : "Al dia"}
                trendUp={assignmentsPending === 0} // Up is good (no pending)
                color="amber"
                correction={assignmentsPending > 0}
            />
             <StatsCard
                title="Assistència"
                value={attendanceRate}
                icon={<Clock className="w-5 h-5 text-emerald-600" />}
                trend={attendanceRate === "—" ? "Sense dades" : "Registres reals"}
                trendUp={attendanceRate !== "—"}
                color="emerald"
            />
             <StatsCard
                title="Dies restants de curs"
                value={courseFinished ? "Acabat" : `${daysRemaining} dies`}
                icon={courseFinished
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : <CalendarCheck className="w-5 h-5 text-violet-600" />
                }
                trend={courseFinished ? "Curs finalitzat" : `Fins al 22 de juny`}
                trendUp={true}
                color={courseFinished ? "emerald" : "violet"}
            />
        </div>
    );
}

function StatsCard({ title, value, icon, trend, trendUp, color, correction }: StatsCardProps) {
    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
        violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
        rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    }[color] || "bg-zinc-100 text-zinc-600";

    return (
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${colorStyles}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'} ${correction ? 'bg-amber-50 text-amber-700' : ''}`}>
                        {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : (correction ? <AlertCircle className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />)}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{value}</h3>
            </div>
        </div>
    )
}
