"use client";

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { Bell, CheckCheck, Menu, School } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { markAllNotificationsRead } from '@/lib/actions';

interface DashboardHeaderProps {
    role: string;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    user?: {
        id?: string;
        full_name?: string;
        email?: string;
        avatar_url?: string;
        institute?: { name?: string };
        courses?: Array<{ id?: string; name?: string | null; code?: string | null }>;
    };
}

type HeaderNotification = {
    id: string;
    message: string;
    read?: boolean | null;
    created_at: string;
};

export function DashboardHeader({ role, toggleSidebar, user }: DashboardHeaderProps) {
    const supabase = useMemo(() => createClient(), []);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
    const [isPending, startTransition] = useTransition();
    const userId = user?.id;
    const unreadCount = notifications.filter((notification) => !notification.read).length;
    const initials = getInitials(user?.full_name, user?.email, role);
    const courseNames = role === 'student'
        ? (user?.courses || []).map((course) => course.name || course.code).filter(Boolean)
        : [];
    const courseLabel = courseNames.length > 0
        ? `${courseNames.length > 1 ? 'Classes' : 'Classe'}: ${courseNames.join(', ')}`
        : '';
    const headerSubtitle = courseLabel || new Date().toLocaleDateString('ca-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    useEffect(() => {
        if (!userId) return;

        let active = true;
        supabase
            .from('notifications')
            .select('id, message, read, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(8)
            .then(({ data }) => {
                if (active) setNotifications(data || []);
            });

        const channel = supabase.channel(`header_notifications_${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            }, (payload) => {
                setNotifications((prev) => {
                    if (payload.eventType === 'INSERT') return [payload.new as HeaderNotification, ...prev].slice(0, 8);
                    if (payload.eventType === 'UPDATE') {
                        const nextNotification = payload.new as HeaderNotification;
                        return prev.map((item) => item.id === nextNotification.id ? nextNotification : item);
                    }
                    if (payload.eventType === 'DELETE') return prev.filter((item) => item.id !== payload.old.id);
                    return prev;
                });
            })
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel);
        };
    }, [supabase, userId]);

    const handleMarkAllRead = () => {
        if (!userId) return;
        startTransition(async () => {
            const result = await markAllNotificationsRead(userId);
            if (result.success) {
                setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
            }
        });
    };

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-3 backdrop-blur-md transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <button onClick={toggleSidebar} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg lg:hidden">
                    <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                </button>
                <div className="flex min-w-0 flex-col">
                     <span className="truncate font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                        {role === 'admin' ? 'Panell d’administració' : role === 'teacher' ? 'Panell del professor' : "Panell de l'alumne"}
                    </span>
                    <span className="max-w-[42vw] truncate text-xs text-zinc-500 sm:max-w-[48vw] md:max-w-none">
                        {headerSubtitle}
                    </span>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                {/* User info & institute */}
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {user?.full_name || (role === 'admin' ? 'Admin' : role === 'teacher' ? 'Professor' : 'Alumne')}
                    </span>
                    {user?.institute?.name && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <School className="w-3 h-3" />
                            {user.institute.name}
                        </span>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsNotificationsOpen((open) => !open)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full relative transition-colors"
                        aria-label="Obrir notificacions"
                        aria-expanded={isNotificationsOpen}
                    >
                        <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] leading-4 text-center rounded-full border-2 border-white dark:border-zinc-900">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-3 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden z-50">
                            <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Notificacions</h2>
                                    <p className="text-xs text-zinc-500">{unreadCount} sense llegir</p>
                                </div>
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={isPending || unreadCount === 0}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 disabled:text-zinc-400"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Leídas
                                </button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map((notification) => (
                                    <Link
                                        key={notification.id}
                                        href="/dashboard/notifications"
                                        onClick={() => setIsNotificationsOpen(false)}
                                        className={`block px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${notification.read ? '' : 'bg-indigo-50/60 dark:bg-indigo-900/10'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notification.read ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-indigo-500'}`} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">{notification.message}</p>
                                                <p className="text-xs text-zinc-500 mt-1">{new Date(notification.created_at).toLocaleString('ca-ES')}</p>
                                            </div>
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="p-8 text-center text-sm text-zinc-500">No hi ha notificacions.</div>
                                )}
                            </div>
                            <Link href="/dashboard/notifications" onClick={() => setIsNotificationsOpen(false)} className="block p-3 text-center text-xs font-semibold text-indigo-600 bg-zinc-50 dark:bg-zinc-800/50">
                                Veure-les totes
                            </Link>
                        </div>
                    )}
                </div>

                <Link href="/dashboard/profile" className="h-9 w-9 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform">
                    {initials}
                </Link>
            </div>
        </header>
    );
}

function getInitials(fullName?: string, email?: string, role?: string) {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    if (role === 'admin') return 'AD';
    return role === 'teacher' ? 'PR' : 'AL';
}
