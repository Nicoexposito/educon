import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const supabase = await createClient();
    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false });

    return (
        <div className="mx-auto min-h-screen max-w-4xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">Notificacions</h1>
                    <p className="text-zinc-500">Estigues al dia de les darreres novetats.</p>
                </div>
            </div>

            <NotificationsClient initialNotifications={notifications || []} userId={session.userId as string} />
        </div>
    );
}
