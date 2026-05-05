import AdminUsersClient from "@/components/admin/AdminUsersClient";
import { getAdminUsersData } from "@/lib/admin-data";

export default async function AdminUsersPage() {
    const { users } = await getAdminUsersData();
    return <AdminUsersClient users={users} />;
}
