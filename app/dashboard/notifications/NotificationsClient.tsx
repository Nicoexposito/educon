"use client";

import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Bell, Info, CheckCircle, AlertTriangle, CheckCheck } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions";
import { useTransition } from "react";

export function NotificationsClient({ initialNotifications, userId }: { initialNotifications: any[], userId: string }) {
    const { data: notifications } = useRealtimeTable({ table: 'notifications', initialData: initialNotifications });
    const [isPending, startTransition] = useTransition();

    // Sort notifications by created_at DESC
    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    disabled={isPending || sortedNotifications.every((notification) => notification.read)}
                    onClick={() => startTransition(async () => { await markAllNotificationsRead(userId); })}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:text-zinc-400"
                >
                    <CheckCheck className="w-4 h-4" />
                    Marcar-les totes com a llegides
                </button>
            </div>
            {sortedNotifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`
                        p-6 rounded-2xl border transition-all flex gap-4 items-start
                        ${notification.read
                            ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                            : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 shadow-sm'}
                    `}
                >
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center shrink-0
                        ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                          notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                          notification.type === 'system' ? 'bg-zinc-100 text-zinc-600' :
                          'bg-blue-100 text-blue-600'}
                    `}>
                        {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                         notification.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                         notification.type === 'system' ? <Info className="w-5 h-5" /> :
                         <Bell className="w-5 h-5" />}
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h3 className={`font-semibold ${!notification.read ? 'text-indigo-900 dark:text-indigo-100' : ''}`}>
                                {notification.type === 'success' ? 'Acció completada' : notification.type === 'warning' ? 'Avís' : notification.type === 'system' ? 'Sistema' : 'Notificació'}
                            </h3>
                            <span className="text-xs text-zinc-400 whitespace-nowrap ml-4">
                                {formatDateTime(notification.created_at)}
                            </span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-sm leading-relaxed">
                            {notification.message}
                        </p>
                    </div>

                    {!notification.read && (
                        <button
                            disabled={isPending}
                            onClick={() => startTransition(async () => { await markNotificationRead(notification.id); })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Leída
                        </button>
                    )}
                </div>
            ))}
            {sortedNotifications.length === 0 && (
                <p className="text-zinc-500 text-center py-10">No hi ha notificacions.</p>
            )}
        </div>
    );
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}
