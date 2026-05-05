import AdminHome from "@/components/admin/AdminHome";
import { getAdminDashboardData } from "@/lib/admin-data";

export default async function AdminPage() {
    const data = await getAdminDashboardData();
    return <AdminHome data={data} />;
}
