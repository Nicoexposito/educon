import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false });

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

            <NotificationsClient initialNotifications={notifications || []} />
        </div>
    );
}
