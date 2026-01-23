import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ClientLayoutWrapper } from "./ClientLayoutWrapper";
import { supabase } from "@/lib/supabase";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.userId)
        .single();

    return (
        <ClientLayoutWrapper session={session} profile={profile}>
            {children}
        </ClientLayoutWrapper>
    );
}
