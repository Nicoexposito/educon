import AdminCoursesClient from "@/components/admin/AdminCoursesClient";
import { getAdminCoursesData } from "@/lib/admin-data";

export default async function AdminCoursesPage() {
    const { courses, subjects, students, teachers, schemaReady } = await getAdminCoursesData();
    return <AdminCoursesClient courses={courses} subjects={subjects} students={students} teachers={teachers} schemaReady={schemaReady} />;
}
