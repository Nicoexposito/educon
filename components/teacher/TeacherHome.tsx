"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TeacherStats } from "@/components/teacher/TeacherStats";
import { ScheduleWidget } from "@/components/dashboard/shared/ScheduleWidget";
import { RecentActivityLevel } from "@/components/teacher/RecentActivityLevel";
import { TodayClasses } from "@/components/teacher/TodayClasses";
import { CurrentClassWidget } from "@/components/dashboard/shared/CurrentClassWidget";
import { AssignmentsListWidget } from "@/components/dashboard/shared/AssignmentsListWidget";

export default function TeacherHome({ data }: { data: any }) {
    // Data with safe defaults
    const subjects = data?.subjects || [];
    const events = data?.events || [];
    const stats = data?.stats;
    const profile = data?.profile;

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Hola, {profile?.full_name?.split(' ')[0] || 'Profesor'}! 👋
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Aquí tienes el resumen de tu actividad académica.</p>
                </div>
                <div className="flex gap-2">
                     <Link href="/dashboard/schedule" className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm flex items-center justify-center">
                        Ver Agenda
                     </Link>
                     <Link href="/dashboard/assignments" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm active:scale-95 transition-all flex items-center gap-2 text-sm">
                        <Plus className="w-4 h-4" />
                        Nueva Tarea
                     </Link>
                </div>
            </div>

            <TeacherStats stats={stats} />

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                     {/* Schedule Block */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
                        <CurrentClassWidget subjects={subjects} />
                        <TodayClasses subjects={subjects} />
                     </div>
                     
                     {/* Pending Grading List */}
                     <div className="h-80">
                         <AssignmentsListWidget items={data?.pendingSubmissions || []} title="Trabajos por Corregir" role="teacher" />
                     </div>
                     
                     {/* Quick Actions / Recent Items */}
                     <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-lg">Accesos Rápidos</h3>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <Link href="/dashboard/events" className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium border border-zinc-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800/50 flex items-center justify-center text-center">
                                 Crear Evento
                             </Link>
                             <Link href="/dashboard/subjects" className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium border border-zinc-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800/50 flex items-center justify-center text-center">
                                 Subir Notas
                             </Link>
                             <button onClick={() => alert("Función no implementada: Enviar Mensaje")} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium border border-zinc-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800/50 flex items-center justify-center text-center">
                                 Enviar Mensaje
                             </button>
                             <button onClick={() => alert("Descargando reporte...")} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium border border-zinc-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800/50 flex items-center justify-center text-center">
                                 Reporte
                             </button>
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
