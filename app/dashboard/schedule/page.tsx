import { getSession } from "@/lib/session";
import { getScheduleData } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { ScheduleGrid } from "@/components/dashboard/schedule/ScheduleGrid";

export default async function SchedulePage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const { subjects, events, assignments } = await getScheduleData(session.userId as string, session.role as string);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-7xl mx-auto">
            <ScheduleGrid subjects={subjects} events={events} assignments={assignments} />
        </div>
    );
}
