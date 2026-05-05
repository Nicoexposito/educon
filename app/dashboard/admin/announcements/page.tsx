import AdminAnnouncementsClient from "@/components/admin/AdminAnnouncementsClient";
import { getAdminAnnouncementsData } from "@/lib/admin-data";

export default async function AdminAnnouncementsPage() {
    const { announcements } = await getAdminAnnouncementsData();
    return <AdminAnnouncementsClient announcements={announcements} />;
}
