import AdminScheduleClient from "@/components/admin/AdminScheduleClient";
import { getAdminScheduleData } from "@/lib/admin-data";

export default async function AdminSchedulePage() {
    const { subjects } = await getAdminScheduleData();
    return <AdminScheduleClient subjects={subjects} />;
}
