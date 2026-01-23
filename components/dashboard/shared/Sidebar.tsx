"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Settings,
    LogOut,
    GraduationCap,
    FileText,
    Menu,
    Newspaper,
    CalendarDays,
    Bell
} from "lucide-react";
import { logout } from "@/app/actions";

interface SidebarProps {
    role: string;
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ role, isMobileOpen, setIsMobileOpen }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Common Nav Items
    const commonItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Calendar, label: "Horario", href: "/dashboard/schedule" },
    ];

    // Role Specific Items
    const roleItems = role === 'teacher' ? [
        { icon: BookOpen, label: "Mis Clases", href: "/dashboard/subjects" },
        { icon: FileText, label: "Tareas", href: "/dashboard/assignments" },
    ] : [
        { icon: BookOpen, label: "Mis Asignaturas", href: "/dashboard/subjects" },
        { icon: FileText, label: "Tareas", href: "/dashboard/assignments" },
    ];

    const extraItems = [
        { icon: CalendarDays, label: "Eventos", href: "/dashboard/events" },
        { icon: Newspaper, label: "Noticias", href: "/dashboard/news" },
        { icon: Bell, label: "Notificaciones", href: "/dashboard/notifications" },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard' && pathname === '/dashboard') return true;
        if (href !== '/dashboard' && pathname?.startsWith(href)) return true;
        return false;
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside 
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
                    transition-all duration-300 flex flex-col
                    ${isCollapsed ? 'w-20' : 'w-72'}
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="p-6 h-20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                         <GraduationCap className="text-white w-5 h-5" />
                    </div>
                    <div className={`font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : ''}`}>
                        Educon
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    <p className={`text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3 ${isCollapsed && 'hidden'}`}>Académico</p>
                    {commonItems.concat(roleItems).map((item) => (
                        <NavItem 
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            isActive={isActive(item.href)}
                            isCollapsed={isCollapsed}
                        />
                    ))}

                    <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <p className={`text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3 ${isCollapsed && 'hidden'}`}>Comunidad</p>
                        {extraItems.map((item) => (
                            <NavItem 
                                key={item.href}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                isActive={isActive(item.href)}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </div>
                </div>

                <div className="p-3 mt-auto border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                     <NavItem 
                        icon={Settings}
                        label="Configuración"
                        href="/dashboard/profile"
                        isActive={isActive('/dashboard/profile')}
                        isCollapsed={isCollapsed}
                    />
                    
                    <button 
                        onClick={async () => await logout()}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
                    </button>

                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex w-full items-center justify-center p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors mt-2"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </aside>
        </>
    );
}

function NavItem({ icon: Icon, label, href, isActive, isCollapsed }: any) {
    return (
        <Link 
            href={href}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }
                ${isCollapsed ? 'justify-center' : ''}
            `}
        >
            <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'}`} />
            {!isCollapsed && <span>{label}</span>}
            {isCollapsed && isActive && <div className="absolute left-16 bg-indigo-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{label}</div>}
        </Link>
    );
}
