"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Settings,
    LogOut,
    GraduationCap,
    FileText,
    Bell
} from "lucide-react";
import { logout } from "@/app/actions";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/teacher/DashboardHeader"; // Reuse header
import { NavItem } from "@/components/dashboard/shared/NavItem";
import { StudentStats } from "./StudentStats";
import { TodayClasses } from "@/components/teacher/TodayClasses"; // Reuse
import { RecentActivityLevel } from "@/components/teacher/RecentActivityLevel"; // Reuse or create student specific? Let's reuse for now, maybe data filters it

export default function StudentDashboard({ data }: { data: any }) {
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
                    role="student"
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                <div className="p-6 lg:p-10 max-w-7xl mx-auto">

                    {/* Welcome Banner */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Hola, Alumne! 👋</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Tens tasques pendents noves aquesta setmana.</p>
                        </div>
                        <div className="flex gap-2">
                             <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm active:scale-95 transition-all text-sm">
                                Lliurar tasca
                             </button>
                        </div>
                    </div>

                    <StudentStats stats={stats} />

                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                             {/* Schedule Block */}
                             <div className="h-96">
                                <TodayClasses subjects={subjects} />
                             </div>

                             {/* Grades / Progress Block */}
                             <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs">
                                 <div className="flex justify-between items-center mb-6">
                                     <h3 className="font-bold text-lg">Evolució de les notes</h3>
                                 </div>
                                 <div className="h-48 flex items-end justify-between gap-4 px-4">
                                     {['Matemáticas', 'Física', 'Historia', 'Inglés', 'Programación'].map((subj, i) => (
                                         <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                             <div className="w-full bg-indigo-50 dark:bg-indigo-900/10 rounded-t-lg relative h-32 flex items-end justify-center">
                                                 <div
                                                    style={{ height: `${[70, 85, 60, 90, 95][i]}%` }}
                                                    className="w-full mx-2 bg-indigo-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-500"
                                                 />
                                             </div>
                                             <div className="text-xs text-zinc-400 truncate w-full text-center">
                                                {subj.substring(0, 3)}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>

                        {/* Side Column (1/3) */}
                        <div className="space-y-6">
                            {/* We can reuse RecentActivity or create something simpler like 'Notifications' */}
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
