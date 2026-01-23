import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Bell, Info, CheckCircle, AlertTriangle } from "lucide-react";

export default async function NotificationsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    // Mock Notifications Data
    const notifications = [
        {
            id: 1,
            title: "Nuevo trabajo asignado",
            message: "El profesor ha publicado 'Ejercicios de Cálculo' para Matemáticas.",
            time: "Hace 2 horas",
            type: "info",
            read: false
        },
        {
            id: 2,
            title: "Tarea entregada con éxito",
            message: "Has entregado la tarea de Historia correctamente.",
            time: "Hace 5 horas",
            type: "success",
            read: true
        },
        {
            id: 3,
            title: "Recordatorio de evento",
            message: "Mañana es la excursión al Museo de Ciencias.",
            time: "Ayer",
            type: "warning",
            read: true
        },
         {
            id: 4,
            title: "Mantenimiento del sistema",
            message: "La plataforma estará en mantenimiento este sábado de 22:00 a 00:00.",
            time: "Hace 2 días",
            type: "system",
            read: true
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Notificaciones</h1>
                    <p className="text-zinc-500">Mantente al día con las últimas novedades.</p>
                </div>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    Marcar todas como leídas
                </button>
            </div>

            <div className="space-y-4">
                {notifications.map((notification) => (
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
                                    {notification.title}
                                </h3>
                                <span className="text-xs text-zinc-400 whitespace-nowrap ml-4">{notification.time}</span>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-sm leading-relaxed">
                                {notification.message}
                            </p>
                        </div>
                        
                        {!notification.read && (
                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 shrink-0 animate-pulse" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
