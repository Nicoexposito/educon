"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Settings,
    LogOut,
    Menu,
    GraduationCap,
    Users,
    FileSpreadsheet
} from "lucide-react";
import { logout } from "@/app/actions";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "./DashboardHeader";
import { TeacherStats } from "./TeacherStats";
import { TodayClasses } from "./TodayClasses";
import { RecentActivityLevel } from "./RecentActivityLevel";
import { NavItem } from "@/components/dashboard/shared/NavItem";

export default function TeacherDashboard({ data }: { data: any }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const router = useRouter();

    const subjects = data?.subjects || [];
    const stats = data?.stats || { assignmentsPending: 0, avgGrade: "0.0" };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans text-zinc-900 dark:text-zinc-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>

                <DashboardHeader
                    role="teacher"
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                <div className="p-6 lg:p-10 max-w-7xl mx-auto">

                    {/* Welcome Banner */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Hola, Professor Pedro.</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Aquí tens el que has de saber avui.</p>
                        </div>
                        <div className="flex gap-2">
                             <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm active:scale-95 transition-all text-sm">
                                Tasca nova
                             </button>
                             <button className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg font-medium shadow-sm transition-all text-sm">
                                Crear incidència
                             </button>
                        </div>
                    </div>

                    <TeacherStats stats={stats} />

                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                             {/* Schedule Block */}
                             <div className="h-96">
                                <TodayClasses subjects={subjects} />
                             </div>

                             {/* Quick Chart Placeholder (Mock) - Grade Distribution */}
                             <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs">
                                 <div className="flex justify-between items-center mb-6">
                                     <h3 className="font-bold text-lg">Distribució de notes (últim examen)</h3>
                                     <select className="text-sm border-none bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-1 focus:ring-0">
                                         <option>Matemáticas 4A</option>
                                         <option>Física 2B</option>
                                     </select>
                                 </div>
                                 <div className="h-48 flex items-end justify-between gap-2 px-4">
                                     {[35, 55, 75, 60, 45, 80, 20].map((h, i) => (
                                         <div key={i} className="w-full bg-indigo-50 dark:bg-indigo-900/10 rounded-t-lg relative group">
                                             <div
                                                style={{ height: `${h}%` }}
                                                className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg opacity-80 group-hover:opacity-100 transition-all duration-500"
                                             />
                                             <div className="absolute -bottom-6 w-full text-center text-xs text-zinc-400">
                                                {['0-4', '5', '6', '7', '8', '9', '10'][i]}
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
            </main>
        </div>
    );
}
