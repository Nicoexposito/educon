"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Settings,
    LogOut,
    Bell,
    Search,
    Menu
} from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function DashboardClient({ role }: { role: string }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans text-zinc-900 dark:text-zinc-100">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col fixed h-full z-20`}>
                <div className="p-4 h-16 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                    <div className={`font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 ${!isSidebarOpen && 'hidden'}`}>
                        Educon
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem icon={<LayoutDashboard />} label="Dashboard" isOpen={isSidebarOpen} active />
                    <NavItem icon={<BookOpen />} label={role === 'teacher' ? 'Cursos' : 'Mis Asignaturas'} isOpen={isSidebarOpen} />
                    <NavItem icon={<Calendar />} label="Calendario" isOpen={isSidebarOpen} />
                    <NavItem icon={<Settings />} label="Configuración" isOpen={isSidebarOpen} />
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 transition-colors w-full">
                        <LogOut className="h-5 w-5" />
                        <span className={`${!isSidebarOpen && 'hidden'}`}>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Header */}
                <header className="h-16 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-zinc-500">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {role === 'teacher' ? 'Panel del Profesor' : 'Panel del Alumno'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="pl-10 pr-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm w-64"
                            />
                        </div>
                        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            {role === 'teacher' ? 'P' : 'A'}
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Hola, {role === 'teacher' ? 'Profesor' : 'Alumno'}! 👋</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Aquí tienes un resumen de tu actividad hoy.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            title={role === 'teacher' ? "Alumnos Activos" : "Media del Curso"}
                            value={role === 'teacher' ? "124" : "8.4"}
                            trend="+12%"
                        />
                        <StatCard
                            title={role === 'teacher' ? "Tareas por Corregir" : "Tareas Pendientes"}
                            value={role === 'teacher' ? "15" : "3"}
                            trend="-2"
                            trendDown
                        />
                        <StatCard
                            title="Próxima Clase"
                            value="10:00 AM"
                            sub="Matemáticas"
                        />
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 h-96 flex items-center justify-center text-zinc-400">
                        Contenido del Dashboard en desarrollo...
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, isOpen, active = false }: { icon: any, label: string, isOpen: boolean, active?: boolean }) {
    return (
        <button className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
            {icon}
            <span className={`${!isOpen && 'hidden'} whitespace-nowrap`}>{label}</span>
        </button>
    );
}

function StatCard({ title, value, trend, trendDown, sub }: { title: string, value: string, trend?: string, trendDown?: boolean, sub?: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">{title}</h3>
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-3xl font-bold mb-1">{value}</div>
                    {sub && <div className="text-sm text-zinc-500">{sub}</div>}
                </div>
                {trend && (
                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${trendDown ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
}
