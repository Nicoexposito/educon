"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    FileText,
    Newspaper,
    CalendarDays,
    Bell,
    ClipboardCheck,
    Award,
    UserCog,
    Megaphone,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    Loader2,
    UserRound,
} from "lucide-react";

interface SidebarProps {
    role: string;
    profile?: {
        full_name?: string | null;
        email?: string | null;
        avatar_url?: string | null;
    } | null;
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ role, profile, isMobileOpen, setIsMobileOpen }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [pendingHref, setPendingHref] = useState<string | null>(null);
    const profileName = profile?.full_name || profile?.email || "El meu perfil";
    const profileInitials = getInitials(profileName);
    const roleLabel = getRoleLabel(role);

    useEffect(() => {
        setPendingHref(null);
    }, [pathname]);

    const commonItems = role === 'admin'
        ? [
            { icon: LayoutDashboard, label: "Tauler", href: "/dashboard" },
        ]
        : [
            { icon: LayoutDashboard, label: "Tauler", href: "/dashboard" },
            { icon: Calendar, label: "Horari", href: "/dashboard/schedule" },
        ];

    const roleItems = role === 'admin'
        ? [
            { icon: UserCog, label: "Usuaris", href: "/dashboard/admin/users" },
            { icon: GraduationCap, label: "Cursos", href: "/dashboard/admin/courses" },
            { icon: BookOpen, label: "Assignatures", href: "/dashboard/admin/subjects" },
            { icon: CalendarDays, label: "Horaris", href: "/dashboard/admin/schedule" },
            { icon: Megaphone, label: "Anuncis", href: "/dashboard/admin/announcements" },
        ]
        : role === 'teacher'
            ? [
                { icon: BookOpen, label: "Les meves classes", href: "/dashboard/subjects" },
                { icon: FileText, label: "Tasques", href: "/dashboard/assignments" },
            ]
            : [
                { icon: BookOpen, label: "Les meves assignatures", href: "/dashboard/subjects" },
                { icon: FileText, label: "Tasques", href: "/dashboard/assignments" },
                { icon: ClipboardCheck, label: "Assistències", href: "/dashboard/attendance" },
                { icon: Award, label: "Qualificacions", href: "/dashboard/grades" },
            ];

    const extraItems = role === 'admin'
        ? [
            { icon: Newspaper, label: "Notícies", href: "/dashboard/news" },
            { icon: Bell, label: "Notificacions", href: "/dashboard/notifications" },
        ]
        : [
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
                    fixed inset-y-0 left-0 z-40 h-[100dvh] min-h-[100dvh] max-h-[100dvh] lg:sticky lg:top-0
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
                <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4 space-y-0.5" aria-label="Menú principal">
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
                <div className={`border-t border-[var(--sidebar-border)] px-2 pb-3 pt-2 ${isCollapsed ? 'space-y-2' : 'grid grid-cols-[minmax(0,1fr)_auto] gap-2'}`}>
                    <Link
                        href="/dashboard/profile"
                        onClick={() => {
                            if (!isActive("/dashboard/profile")) setPendingHref("/dashboard/profile");
                            setIsMobileOpen(false);
                        }}
                        title={isCollapsed ? `${profileName} · ${roleLabel}` : undefined}
                        aria-label={`Obrir perfil de ${profileName}`}
                        className={`
                            group/profile flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2.5
                            text-left text-white/80 transition-colors duration-150 hover:bg-white/[0.08] hover:text-white
                            focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)] focus-visible:outline-none
                            ${isCollapsed ? 'justify-center px-1.5' : 'min-w-0'}
                        `}
                    >
                        <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 bg-cover bg-center text-xs font-black text-white ring-1 ring-white/15"
                            style={profile?.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined}
                            aria-hidden="true"
                        >
                            {!profile?.avatar_url && (profileInitials || <UserRound className="h-4 w-4" aria-hidden="true" />)}
                        </span>
                        {!isCollapsed && (
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold leading-5">{profileName}</span>
                                <span className="block truncate text-xs font-medium text-white/45">{roleLabel}</span>
                            </span>
                        )}
                        {!isCollapsed && pendingHref === "/dashboard/profile" && (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/70" aria-hidden="true" />
                        )}
                    </Link>

                    {/* Collapse toggle — desktop only */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? 'Ampliar la barra lateral' : 'Contraure la barra lateral'}
                        className={`
                            hidden items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]
                            text-white/70 shadow-inner shadow-white/[0.02] transition-colors hover:bg-white/[0.11] hover:text-white
                            focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)] focus-visible:outline-none lg:flex
                            ${isCollapsed ? 'h-10 w-full' : 'min-h-[62px] w-11 self-stretch'}
                        `}
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5" aria-hidden="true" /> : <ChevronLeft className="h-5 w-5" aria-hidden="true" />}
                    </button>
                </div>
            </aside>
        </>
    );
}

function getRoleLabel(role: string) {
    const labels: Record<string, string> = {
        admin: "Administració",
        teacher: "Professorat",
        student: "Alumnat",
    };
    return labels[role] || "Perfil";
}

function getInitials(value: string) {
    return value
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
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
