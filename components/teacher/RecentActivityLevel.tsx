import React from 'react';
import { MessageSquare, FileText, CheckCircle2 } from 'lucide-react';

export function RecentActivityLevel() {
    const activities = [
        {
            id: 1,
            type: 'submission',
            user: 'Laura Martinez',
            action: 'entregó tarea',
            target: 'Ejercicios de Cálculo',
            time: 'hace 5 min',
            avatar: 'LM'
        },
        {
            id: 2,
            type: 'message',
            user: 'Carlos Ruiz',
            action: 'comentó en',
            target: 'Foro de Física',
            time: 'hace 24 min',
            avatar: 'CR'
        },
        {
            id: 3,
            type: 'system',
            user: 'Sistema',
            action: 'actualizó',
            target: 'Notas trimestrales',
            time: 'hace 1h',
            avatar: 'SYS'
        },
        {
            id: 4,
            type: 'submission',
            user: 'Ana Gomez',
            action: 'entregó tarde',
            target: 'Práctica Laboratorio',
            time: 'hace 2h',
            avatar: 'AG'
        }
    ];

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full shadow-xs hover:shadow-md transition-shadow">
             <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Actividad Reciente</h3>
                <button className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                   Marcar leído
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {activities.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors flex gap-4 items-start group cursor-pointer">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${activity.type === 'submission' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-600'}`}>
                                {activity.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                                    <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-medium text-indigo-600 dark:text-indigo-400">{activity.target}</span>
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">{activity.time}</p>
                            </div>
                             {activity.type === 'submission' && (
                                <div className="hidden group-hover:flex">
                                    <button className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md transition-colors font-medium">
                                        Revisar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
             <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 text-center">
                 <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Ve toda la actividad</button>
            </div>
        </div>
    );
}
