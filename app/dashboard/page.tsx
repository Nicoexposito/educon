import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data-service";
import TeacherHome from "@/components/teacher/TeacherHome";
import StudentHome from "@/components/student/StudentHome";

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const data = await getDashboardData(session.userId as string, session.role as string);

    if (session.role === 'teacher') {
        return <TeacherHome data={data} />;
    }

    return <StudentHome data={data} />;
}
