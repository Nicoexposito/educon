"use client";

import { StudentStats } from "@/components/student/StudentStats";
import { TodayClasses } from "@/components/teacher/TodayClasses"; 
import { RecentActivityLevel } from "@/components/teacher/RecentActivityLevel";
import { CurrentClassWidget } from "@/components/dashboard/shared/CurrentClassWidget";
import { AssignmentsListWidget } from "@/components/dashboard/shared/AssignmentsListWidget";

export default function StudentHome({ data }: { data: any }) {
    const subjects = data?.subjects || [];
    const stats = data?.stats || { assignmentsPending: 0, avgGrade: "0.0" };
    const profile = data?.profile;

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
            
            {/* Welcome Banner */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                         Hola, {profile?.full_name?.split(' ')[0] || 'Alumno'}! 👋
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Tienes {stats.assignmentsPending} tareas pendientes esta semana.</p>
                </div>
                <div className="flex gap-2">
                     <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm active:scale-95 transition-all text-sm">
                        Entregar Tarea
                     </button>
                </div>
            </div>

            <StudentStats stats={stats} />

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                     {/* Schedule Block */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
                        <CurrentClassWidget subjects={subjects} />
                        <TodayClasses subjects={subjects} />
                     </div>
                     
                     {/* Assignments List */}
                     <div className="h-80">
                         <AssignmentsListWidget items={data?.assignments || []} title="Tareas Pendientes" role="student" />
                     </div>
                     
                     {/* Grades / Progress Block */}
                     <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs">
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="font-bold text-lg">Evolución de Notas</h3>
                         </div>
                         <div className="h-48 flex items-end justify-between gap-4 px-4">
                             {['Mates', 'Física', 'Hist', 'Inglés', 'Prog'].map((subj, i) => (
                                 <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                     <div className="w-full bg-indigo-50 dark:bg-indigo-900/10 rounded-t-lg relative h-32 flex items-end justify-center">
                                         <div 
                                            style={{ height: `${[70, 85, 60, 90, 95][i]}%` }} 
                                            className="w-full mx-2 bg-indigo-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-500" 
                                         />
                                     </div>
                                     <div className="text-xs text-zinc-400 truncate w-full text-center">
                                        {subj}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                </div>

                {/* Side Column (1/3) */}
                <div className="space-y-6">
                    <div className="h-[600px]">
                        <RecentActivityLevel />
                    </div>
                </div>
            </div>
        </div>
    );
}
