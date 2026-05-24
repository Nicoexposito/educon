"use client";

import StudentHome from "@/components/student/StudentHome";

export default function StudentDashboard({ data }: { data: any }) {
    return <StudentHome data={data} />;
}
