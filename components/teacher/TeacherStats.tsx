import React from 'react';
import { Users, BookOpen, Clock, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function TeacherStats({ stats }: { stats: any }) {
    // Mock data if stats are missing
    const pendingTasks = stats?.assignmentsPending || 12;
    const activeStudents = 24; // Mock
    const avgAttendance = "94%"; // Mock
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard 
                title="Estudiantes Activos" 
                value={activeStudents.toString()} 
                icon={<Users className="w-5 h-5 text-indigo-600" />}
                trend="+2.5%"
                trendUp={true}
                color="indigo"
            />
             <StatsCard 
                title="Asistencia Media" 
                value={avgAttendance}
                icon={<Clock className="w-5 h-5 text-emerald-600" />}
                trend="+0.8%"
                trendUp={true}
                color="emerald"
            />
             <StatsCard 
                title="Tareas Pendientes" 
                value={pendingTasks.toString()} 
                icon={<BookOpen className="w-5 h-5 text-amber-600" />}
                trend="-4"
                trendUp={false} // Less is better for pending tasks, but contextually "down"
                correction={true}
                color="amber"
            />
             <StatsCard 
                title="Incidencias" 
                value="3" 
                icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
                trend="+1"
                trendUp={false} // More is bad
                color="rose"
            />
        </div>
    );
}

function StatsCard({ title, value, icon, trend, trendUp, color, correction }: any) {
    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
        rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    }[color as string] || "bg-zinc-100 text-zinc-600";

    return (
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${colorStyles}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'} ${correction ? 'bg-amber-50 text-amber-700' : ''}`}>
                        {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
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
