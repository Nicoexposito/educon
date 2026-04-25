"use client";

import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Bell, Info, CheckCircle, AlertTriangle } from "lucide-react";

export function NotificationsClient({ initialNotifications }: { initialNotifications: any[] }) {
    const { data: notifications } = useRealtimeTable({ table: 'notifications', initialData: initialNotifications });

    // Sort notifications by created_at DESC
    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="space-y-4">
            {sortedNotifications.map((notification) => (
                <div 
                    key={notification.id} 
                    className={`
                        p-6 rounded-2xl border transition-all flex gap-4 items-start
                        ${notification.is_read 
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
                            <h3 className={`font-semibold ${!notification.is_read ? 'text-indigo-900 dark:text-indigo-100' : ''}`}>
                                {notification.title}
                            </h3>
                            <span className="text-xs text-zinc-400 whitespace-nowrap ml-4">
                                {new Date(notification.created_at).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-sm leading-relaxed">
                            {notification.message}
                        </p>
                    </div>
                    
                    {!notification.is_read && (
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 shrink-0 animate-pulse" />
                    )}
                </div>
            ))}
            {sortedNotifications.length === 0 && (
                <p className="text-zinc-500 text-center py-10">No hay notificaciones.</p>
            )}
        </div>
    );
}
