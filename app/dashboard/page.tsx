import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data-service";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import StudentDashboard from "@/components/student/StudentDashboard";

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const data = await getDashboardData(session.userId as string, session.role as string);

    if (session.role === 'teacher') {
        return <TeacherDashboard data={data} />;
    }

    return <StudentDashboard data={data} />;
}
