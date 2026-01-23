"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Settings,
    LogOut,
    Search,
    Menu,
    ArrowRight,
    Bell,
    Clock,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function DashboardClient({ role, data }: { role: string, data: any }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const router = useRouter();

    // Data with safe defaults
    const subjects = data?.subjects || [];
    const events = data?.events || [];
    const assignments = data?.assignments || [];
    const stats = data?.stats || { assignmentsPending: 0, avgGrade: "0.0" };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">Hola, {role === 'teacher' ? 'Profesor' : 'Alumno'}! 👋</h1>
                            <p className="text-zinc-500 dark:text-zinc-400">Aquí tienes un resumen de tu actividad hoy.</p>
                        </div>

                        {/* Updated Stat Cards with Real Data */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard
                                title={role === 'teacher' ? "Alumnos Activos" : "Media del Curso"}
                                value={role === 'teacher' ? "24" : stats.avgGrade}
                                trend="+1.2"
                            />
                            <StatCard
                                title={role === 'teacher' ? "Tareas por Corregir" : "Tareas Pendientes"}
                                value={stats.assignmentsPending.toString()}
                                trend={stats.assignmentsPending > 0 ? "Pendiente" : "Al día"}
                                trendDown={stats.assignmentsPending > 0}
                            />
                            {/* Schedule Widget Card */}
                            <ScheduleWidget subjects={subjects} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Subjects List */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">{role === 'teacher' ? 'Mis Cursos' : 'Mis Asignaturas'}</h2>
                                    <button onClick={() => setActiveView('subjects')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Ver todo</button>
                                </div>
                                <div className="space-y-4">
                                    {subjects.slice(0, 3).map((subj: any) => (
                                        <div key={subj.id} className={`p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 ${subj.color || 'bg-blue-50'} dark:bg-zinc-800/50 flex justify-between items-center group cursor-pointer hover:border-indigo-200 transition-colors`}>
                                            <div>
                                                <h3 className="font-semibold">{subj.name}</h3>
                                                <p className="text-sm text-zinc-500">{subj.schedule}</p>
                                            </div>
                                            <ArrowRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                    {subjects.length === 0 && <p className="text-zinc-500">No hay asignaturas.</p>}
                                </div>
                            </div>

                            {/* Calendar / Events */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Próximos Eventos</h2>
                                    <button onClick={() => setActiveView('calendar')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Ver calendario</button>
                                </div>
                                <div className="space-y-4">
                                    {events.slice(0, 3).map((evt: any) => (
                                        <div key={evt.id} className="flex gap-4 items-start">
                                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">{evt.title}</h3>
                                                <p className="text-sm text-zinc-500">
                                                    {new Date(evt.start_time).toLocaleDateString()} - {new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!events || events.length === 0) && <p className="text-zinc-500">No hay eventos próximos.</p>}
                                </div>
                            </div>
                        </div>
                    </>
                );
            case 'subjects':
                return (
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-2xl font-bold mb-6">Todas las Asignaturas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subjects.map((subj: any) => (
                                <div key={subj.id} className={`p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 ${subj.color || 'bg-white'} bg-opacity-10 hover:shadow-lg transition-shadow cursor-pointer`}>
                                    <h3 className="text-xl font-bold mb-2">{subj.name}</h3>
                                    <p className="text-zinc-600 dark:text-zinc-400 mb-4">{subj.description}</p>
                                    <div className="flex items-center text-sm text-zinc-500">
                                        <Clock className="h-4 w-4 mr-2" />
                                        {subj.schedule}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'calendar':
                return (
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-full">
                        <h2 className="text-2xl font-bold mb-6">Calendario Académico</h2>
                        <div className="flex items-center justify-center h-64 text-zinc-400">
                            Próximamente: Vista completa de calendario
                        </div>
                    </div>
                );
            default:
                return <div>Página en construcción</div>;
        }
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
                    <NavItem
                        icon={<LayoutDashboard />}
                        label="Dashboard"
                        isOpen={isSidebarOpen}
                        active={activeView === 'dashboard'}
                        onClick={() => setActiveView('dashboard')}
                    />
                    <NavItem
                        icon={<BookOpen />}
                        label={role === 'teacher' ? 'Cursos' : 'Mis Asignaturas'}
                        isOpen={isSidebarOpen}
                        active={activeView === 'subjects'}
                        onClick={() => setActiveView('subjects')}
                    />
                    <NavItem
                        icon={<Calendar />}
                        label="Calendario"
                        isOpen={isSidebarOpen}
                        active={activeView === 'calendar'}
                        onClick={() => setActiveView('calendar')}
                    />
                    <NavItem
                        icon={<Settings />}
                        label="Configuración"
                        isOpen={isSidebarOpen}
                        active={activeView === 'settings'}
                        onClick={() => setActiveView('settings')}
                    />
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
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, isOpen, active = false, onClick }: { icon: any, label: string, isOpen: boolean, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
        >
            {icon}
            <span className={`${!isOpen && 'hidden'} whitespace-nowrap`}>{label}</span>
        </button>
    );
}

function StatCard({ title, value, trend, trendDown, sub }: { title: string, value: string, trend?: string, trendDown?: boolean, sub?: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full opacity-50" />

            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 relative z-10">{title}</h3>
            <div className="flex items-end justify-between relative z-10">
                <div>
                    <div className="text-3xl font-bold mb-1">{value}</div>
                    {sub && <div className="text-sm text-zinc-500">{sub}</div>}
                </div>
                {trend && (
                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${trendDown ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
}

function ScheduleWidget({ subjects }: { subjects: any[] }) {
    // Logic to highlight current class
    const now = new Date();
    const currentDay = ['DG', 'DL', 'DM', 'DC', 'DJ', 'DV', 'DS'][now.getDay()]; // Mapping for Catalan DB abbreviations (Dilluns, Dimarts...)
    // Or simplified: Just check string inclusion roughly for now if we don't strict parse

    // Filter subjects for today
    const todaysClasses = subjects.filter((s: any) => s.schedule && s.schedule.includes(currentDay)).sort((a: any, b: any) => {
        // Very basic sort by time string
        return a.schedule.localeCompare(b.schedule);
    });

    // Check if a class is active (mock logic: if index 0 is active for demo purposes or exact time parsing)
    // For demo, let's say the first class of the day is "Active" if it's morning.
    const activeClassIndex = todaysClasses.length > 0 ? 0 : -1;

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Horario de Hoy ({currentDay})</h3>

            <div className="flex-1 space-y-3">
                {todaysClasses.length > 0 ? todaysClasses.map((subj: any, idx: number) => (
                    <div key={subj.id} className={`flex items-center gap-3 p-2 rounded-lg ${idx === activeClassIndex ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800' : ''}`}>
                        <div className={`w-1.5 h-8 rounded-full ${subj.color || 'bg-zinc-300'}`} />
                        <div>
                            <div className="font-semibold text-sm">{subj.name}</div>
                            <div className="text-xs text-zinc-500">{subj.schedule.split(',').find((s: string) => s.includes(currentDay)) || subj.schedule}</div>
                        </div>
                        {idx === activeClassIndex && (
                            <div className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full animate-pulse">
                                En curso
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm">
                        <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                        No hay clases hoy
                    </div>
                )}
            </div>
        </div>
    );
}
