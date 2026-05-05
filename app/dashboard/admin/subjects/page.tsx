import AdminSubjectsClient from "@/components/admin/AdminSubjectsClient";
import { getAdminSubjectsData } from "@/lib/admin-data";

export default async function AdminSubjectsPage() {
    const { subjects, teachers } = await getAdminSubjectsData();
    return <AdminSubjectsClient subjects={subjects} teachers={teachers} />;
}
