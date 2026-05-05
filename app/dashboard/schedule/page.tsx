import { getSession } from "@/lib/session";
import { getScheduleData } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { ScheduleGrid } from "@/components/dashboard/schedule/ScheduleGrid";

export default async function SchedulePage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    if (session.role === 'admin') {
        redirect('/dashboard/admin/schedule');
    }

    const { subjects, events, assignments } = await getScheduleData(session.userId as string, session.role as string);

    return (
        <div className="min-h-screen bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:mx-auto lg:max-w-7xl lg:px-8 lg:py-8">
            <ScheduleGrid subjects={subjects} events={events} assignments={assignments} />
        </div>
    );
}
