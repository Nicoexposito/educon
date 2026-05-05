export type AdminRole = "teacher" | "student";
export type UserRole = AdminRole | "admin";
export type AnnouncementAudience = "all" | "teachers" | "students";

export type AdminUser = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone?: string | null;
    role?: UserRole | string | null;
    is_active?: boolean | null;
    must_change_password?: boolean | null;
    created_at?: string | null;
};

export type AdminSchedule = {
    id: string;
    subject_id?: string | null;
    day_of_week: string | null;
    start_time: string | null;
    end_time: string | null;
};

export type AdminSubject = {
    id: string;
    name: string | null;
    category?: string | null;
    description?: string | null;
    teacher_id?: string | null;
    schedule?: string | null;
    color?: string | null;
    teacher?: Pick<AdminUser, "id" | "full_name" | "email"> | null;
    schedules?: AdminSchedule[] | null;
    enrollments?: { id: string }[] | null;
    student_count?: number;
};

export type AdminAnnouncement = {
    id: string;
    title: string | null;
    content: string | null;
    audience: AnnouncementAudience | string | null;
    created_at: string;
    author?: Pick<AdminUser, "full_name" | "email"> | null;
};

export type AdminEnrollmentWithStudent = {
    id: string;
    student: AdminUser | AdminUser[] | null;
};
