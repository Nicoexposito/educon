import React from 'react';
import { Bell, Menu, School } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
    role: string;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    user?: { full_name?: string; email?: string; avatar_url?: string; institute?: { name?: string } };
}

export function DashboardHeader({ role, isSidebarOpen, toggleSidebar, user }: DashboardHeaderProps) {
    return (
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 px-6 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-4">
                 <button onClick={toggleSidebar} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg lg:hidden">
                    <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                </button>
                <div className="flex flex-col">
                     <span className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {role === 'teacher' ? 'Panel del Profesor' : 'Panel del Alumno'}
                    </span>
                    <span className="text-xs text-zinc-500 hidden sm:block">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* User info & institute */}
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {user?.full_name || (role === 'teacher' ? 'Profesor' : 'Alumno')}
                    </span>
                    {user?.institute?.name && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <School className="w-3 h-3" />
                            {user.institute.name}
                        </span>
                    )}
                </div>
                
                <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full relative transition-colors">
                    <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                </button>
                
                <Link href="/dashboard/profile" className="h-9 w-9 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform">
                    {user?.full_name 
                        ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : (role === 'teacher' ? 'P' : 'A')}
                </Link>
            </div>
        </header>
    );
}
