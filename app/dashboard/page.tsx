import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard-client";
import { getDashboardData } from "@/lib/data-service";

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const data = await getDashboardData(session.userId as string, session.role as string);

    return <DashboardClient role={session.role as string} data={data} />;
}
