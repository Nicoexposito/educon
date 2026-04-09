import React from 'react';
import { Users, BookOpen, Clock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export function TeacherStats({ stats }: { stats: any }) {
    const pendingTasks = stats?.assignmentsPending || 12;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
                title="Estudiantes Activos"
                value="24"
                icon={<Users className="w-4 h-4" aria-hidden="true" />}
                trend="+2.5%"
                trendUp={true}
                color="navy"
            />
            <KpiCard
                title="Asistencia Media"
                value="94%"
                icon={<Clock className="w-4 h-4" aria-hidden="true" />}
                trend="+0.8%"
                trendUp={true}
                color="amber"
            />
            <KpiCard
                title="Tareas Pendientes"
                value={pendingTasks.toString()}
                icon={<BookOpen className="w-4 h-4" aria-hidden="true" />}
                trend="-4"
                trendUp={true}
                color="emerald"
            />
            <KpiCard
                title="Incidencias"
                value="3"
                icon={<AlertCircle className="w-4 h-4" aria-hidden="true" />}
                trend="+1"
                trendUp={false}
                color="rose"
            />
        </div>
    );
}

function KpiCard({ title, value, icon, trend, trendUp, color }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    trendUp: boolean;
    color: 'navy' | 'amber' | 'emerald' | 'rose';
}) {
    const iconColors = {
        navy:    'bg-blue-950/10 text-blue-900 dark:bg-blue-400/10 dark:text-blue-300',
        amber:   'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
        rose:    'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
    }[color];

    const borderColors = {
        navy:    'border-l-blue-900 dark:border-l-blue-500',
        amber:   'border-l-amber-500',
        emerald: 'border-l-emerald-500',
        rose:    'border-l-rose-500',
    }[color];

    return (
        <div className={`bg-card rounded-2xl border border-border border-l-4 ${borderColors} p-5 shadow-xs hover:shadow-sm transition-shadow duration-200`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${iconColors}`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    trendUp
                        ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-400/10'
                        : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-400/10'
                }`}>
                    {trendUp
                        ? <TrendingUp className="w-3 h-3" aria-hidden="true" />
                        : <TrendingDown className="w-3 h-3" aria-hidden="true" />
                    }
                    <span>{trend}</span>
                </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1 truncate">{title}</p>
            <p
                className="text-2xl font-bold text-foreground tabular-nums"
                style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
            >
                {value}
            </p>
        </div>
    );
}
