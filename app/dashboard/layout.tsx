import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ClientLayoutWrapper } from "./ClientLayoutWrapper";
import { createClient } from "@/lib/supabase/server";
import { NotificationListener } from "@/components/notifications/NotificationListener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
        .from('users')
        .select('*, institute:institutes(name)')
        .eq('id', session.userId)
        .single();

    return (
        <ClientLayoutWrapper session={session} profile={profile}>
            <NotificationListener userId={session.userId as string} />
            {children}
        </ClientLayoutWrapper>
    );
}
