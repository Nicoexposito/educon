"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    LogOut,
    FileText,
    Newspaper,
    CalendarDays,
    Bell,
    ClipboardCheck,
    Award,
    ChevronLeft,
    ChevronRight,
    Loader2,
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
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    useEffect(() => {
        setPendingHref(null);
    }, [pathname]);

    const commonItems = [
        { icon: LayoutDashboard, label: "Tauler", href: "/dashboard" },
        { icon: Calendar, label: "Horari", href: "/dashboard/schedule" },
    ];

    const roleItems = role === 'teacher' ? [
        { icon: BookOpen, label: "Les meves classes", href: "/dashboard/subjects" },
        { icon: FileText, label: "Tasques", href: "/dashboard/assignments" },
    ] : [
        { icon: BookOpen, label: "Les meves assignatures", href: "/dashboard/subjects" },
        { icon: FileText, label: "Tasques", href: "/dashboard/assignments" },
        { icon: ClipboardCheck, label: "Assistències", href: "/dashboard/attendance" },
        { icon: Award, label: "Qualificacions", href: "/dashboard/grades" },
    ];

    const extraItems = [
        { icon: CalendarDays, label: "Esdeveniments", href: "/dashboard/events" },
        { icon: Newspaper, label: "Notícies", href: "/dashboard/news" },
        { icon: Bell, label: "Notificacions", href: "/dashboard/notifications" },
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    flex flex-col
                    bg-[var(--sidebar)] text-[var(--sidebar-foreground)]
                    border-r border-[var(--sidebar-border)]
                    transition-[width,transform] duration-300 ease-in-out
                    ${isCollapsed ? 'w-[68px]' : 'w-64'}
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
                aria-label="Navegació principal"
            >
                {/* Logo */}
                <div className={`flex items-center gap-3 px-4 h-16 border-b border-[var(--sidebar-border)] shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="relative h-9 w-9 shrink-0">
                        <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain drop-shadow-md" sizes="36px" priority />
                    </div>
                    {!isCollapsed && (
                        <span
                            className="font-semibold text-lg tracking-tight text-white"
                            style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                        >
                            Educon
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5" aria-label="Menú principal">
                    {!isCollapsed && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 px-3 mb-2 mt-1">
                            Acadèmic
                        </p>
                    )}
                    {commonItems.concat(roleItems).map((item) => (
                        <SidebarNavItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            isActive={isActive(item.href)}
                            isPending={pendingHref === item.href}
                            isCollapsed={isCollapsed}
                            onNavigate={() => {
                                if (!isActive(item.href)) setPendingHref(item.href);
                                setIsMobileOpen(false);
                            }}
                        />
                    ))}

                    <div className={`${isCollapsed ? 'my-3' : 'my-4'} border-t border-[var(--sidebar-border)]`} />

                    {!isCollapsed && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 px-3 mb-2">
                            Comunitat
                        </p>
                    )}
                    {extraItems.map((item) => (
                        <SidebarNavItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            isActive={isActive(item.href)}
                            isPending={pendingHref === item.href}
                            isCollapsed={isCollapsed}
                            onNavigate={() => {
                                if (!isActive(item.href)) setPendingHref(item.href);
                                setIsMobileOpen(false);
                            }}
                        />
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-2 pb-3 pt-2 border-t border-[var(--sidebar-border)] space-y-0.5">
                    <button
                        onClick={async () => await logout()}
                        title="Tancar sessió"
                        aria-label="Tancar sessió"
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-rose-300/80 hover:text-rose-300 hover:bg-rose-500/10
                            transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                    >
                        <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
                        {!isCollapsed && <span className="text-sm font-medium">Tancar sessió</span>}
                    </button>

                    {/* Collapse toggle — desktop only */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? 'Ampliar la barra lateral' : 'Contraure la barra lateral'}
                        className="hidden lg:flex w-full items-center justify-center p-2 mt-1 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)] focus-visible:outline-none"
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
                    </button>
                </div>
            </aside>
        </>
    );
}

function SidebarNavItem({ icon: Icon, label, href, isActive, isPending, isCollapsed, onNavigate }: {
    icon: React.ElementType;
    label: string;
    href: string;
    isActive: boolean;
    isPending: boolean;
    isCollapsed: boolean;
    onNavigate: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            title={isCollapsed ? label : undefined}
            aria-label={isCollapsed ? label : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-colors duration-150 text-sm group
                focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)] focus-visible:outline-none
                ${isActive || isPending
                    ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] font-semibold shadow-sm'
                    : 'text-white/60 hover:bg-[var(--sidebar-accent)] hover:text-white'
                }
                ${isCollapsed ? 'justify-center' : ''}
            `}
        >
            {isPending && isCollapsed ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--sidebar-primary-foreground)]" aria-hidden="true" />
            ) : (
                <Icon
                    className={`w-5 h-5 shrink-0 ${isActive || isPending ? 'text-[var(--sidebar-primary-foreground)]' : 'text-white/50 group-hover:text-white'}`}
                    aria-hidden="true"
                />
            )}
            {!isCollapsed && <span className="truncate">{label}</span>}
            {isPending && !isCollapsed && (
                <Loader2
                    className="ml-auto h-4 w-4 animate-spin text-[var(--sidebar-primary-foreground)]"
                    aria-hidden="true"
                />
            )}
            {isActive && !isPending && !isCollapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--sidebar-primary-foreground)] opacity-70" aria-hidden="true" />
            )}
        </Link>
    );
}
