import AdminSubjectDetailClient from "@/components/admin/AdminSubjectDetailClient";
import { getAdminSubjectDetails } from "@/lib/admin-data";

export default async function AdminSubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getAdminSubjectDetails(id);

    return (
        <AdminSubjectDetailClient
            subject={data.subject}
            roster={data.roster}
            availableStudents={data.availableStudents}
            teachers={data.teachers}
        />
    );
}
