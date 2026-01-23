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
            {/* Sidebar */}
            <aside 
                className={`${isSidebarOpen ? 'w-72' : 'w-0 lg:w-20'} bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col fixed h-full z-20 overflow-hidden`}
            >
                <div className="p-6 h-20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                         <GraduationCap className="text-white w-5 h-5" />
                    </div>
                    <div className={`font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 transition-opacity duration-200 ${!isSidebarOpen && 'opacity-0 hidden'}`}>
                        Educon
                    </div>
                </div>

                <div className="px-3 mb-2">
                     <p className={`text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3 ${!isSidebarOpen && 'hidden'}`}>Principal</p>
                    <nav className="space-y-1">
                        <NavItem
                            icon={<LayoutDashboard className="w-5 h-5" />}
                            label="Dashboard"
                            isOpen={isSidebarOpen}
                            active={activeView === 'dashboard'}
                            onClick={() => setActiveView('dashboard')}
                        />
                         <NavItem
                            icon={<BookOpen className="w-5 h-5" />}
                            label="Mis Cursos"
                            isOpen={isSidebarOpen}
                            active={activeView === 'subjects'}
                            onClick={() => setActiveView('subjects')}
                        />
                        <NavItem
                            icon={<Users className="w-5 h-5" />}
                            label="Estudiantes"
                            isOpen={isSidebarOpen}
                            active={activeView === 'students'}
                            onClick={() => setActiveView('students')}
                        />
                         <NavItem
                            icon={<FileSpreadsheet className="w-5 h-5" />}
                            label="Calificaciones"
                            isOpen={isSidebarOpen}
                            active={activeView === 'grades'}
                            onClick={() => setActiveView('grades')}
                        />
                    </nav>
                </div>
                 <div className="px-3 mt-4">
                     <p className={`text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3 ${!isSidebarOpen && 'hidden'}`}>Gestión</p>
                    <nav className="space-y-1">
                        <NavItem
                            icon={<Calendar className="w-5 h-5" />}
                            label="Calendario"
                            isOpen={isSidebarOpen}
                            active={activeView === 'calendar'}
                            onClick={() => setActiveView('calendar')}
                        />
                        <NavItem
                            icon={<Settings className="w-5 h-5" />}
                            label="Configuración"
                            isOpen={isSidebarOpen}
                            active={activeView === 'settings'}
                            onClick={() => setActiveView('settings')}
                        />
                    </nav>
                </div>


                <div className="mt-auto p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-600 dark:text-rose-400 transition-colors w-full group">
                        <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        <span className={`${!isSidebarOpen && 'hidden'} font-medium`}>Cerrar Sesión</span>
                    </button>
                    
                    {/* User Profile Mini - Sidebar Footer */}
                    <div className={`mt-4 flex items-center gap-3 px-1 ${!isSidebarOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-300">
                            PR
                        </div>
                        <div className={`text-sm ${!isSidebarOpen && 'hidden'}`}>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">Prof. Ryan</p>
                            <p className="text-zinc-500 text-xs text-ellipsis overflow-hidden w-32">ryan@educon.com</p>
                        </div>
                    </div>
                </div>
            </aside>

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
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Hola, Profesor Ryan.</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Aquí está lo que necesitas saber hoy.</p>
                        </div>
                        <div className="flex gap-2">
                             <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm active:scale-95 transition-all text-sm">
                                Nueva Tarea
                             </button>
                             <button className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg font-medium shadow-sm transition-all text-sm">
                                Crear Incidencia
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
                                     <h3 className="font-bold text-lg">Distribución de Notas (Último Examen)</h3>
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
