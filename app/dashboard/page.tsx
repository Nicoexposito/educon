import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard-client";

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    return <DashboardClient role={session.role as string} />;
}
