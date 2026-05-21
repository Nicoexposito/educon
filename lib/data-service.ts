"use server";

import { createClient } from "@/lib/supabase/server";

const SUBJECT_WITH_SCHEDULES_SELECT = "id, name, description, teacher_id, institute_id, schedule, color, category, schedules:subject_schedules(id, day_of_week, start_time, end_time)";
const SUBJECT_WITH_COUNTS_SELECT = `${SUBJECT_WITH_SCHEDULES_SELECT}, enrollments(id)`;
const EVENT_LIST_SELECT = "id, title, description, start_time, end_time, type, institute_id, subject_id, image_url, location, created_by";
const ASSIGNMENT_LIST_SELECT = "id, subject_id, title, description, due_date, created_at, content_url, teacher_id, start_date, is_corrected, late_due_date";
const RESOURCE_LIST_SELECT = "id, subject_id, title, file_url, type, created_at";

export async function getDashboardData(userId: string, role: string) {
    const supabase = await createClient();

    if (role === 'teacher') {
        const [{ data: profile }, { data: subjects }] = await Promise.all([
            supabase
                .from('users')
                .select('id, full_name, email, avatar_url, institute_id')
                .eq('id', userId)
                .single(),
            supabase
                .from('subjects')
                .select(SUBJECT_WITH_COUNTS_SELECT)
                .eq('teacher_id', userId),
        ]);

        const normalizedSubjects = (subjects || []).map((subject: any) => ({
            ...subject,
            student_count: subject.enrollments?.length || 0,
        }));
        const subjectIds = normalizedSubjects.map((s: any) => s.id);
        const today = new Date().toISOString().slice(0, 10);

        const [
            { data: events },
            { count: assignmentsPending },
            { data: pendingSubmissions },
            { data: enrollments },
            { data: todayAttendance },
        ] = await Promise.all([
            supabase
                .from('events')
                .select(EVENT_LIST_SELECT)
                .gte('end_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(5),
            supabase
                .from('submissions')
                .select('id, assignment:assignments!inner(teacher_id)', { count: 'exact', head: true })
                .eq('assignment.teacher_id', userId)
                .is('grade', null),
            supabase
                .from('submissions')
                .select('id, assignment_id, student_id, file_url, submitted_at, grade, feedback, status, student_comment, assignment:assignments!inner(title, teacher_id, subject:subjects(name)), student:users(full_name)')
                .eq('assignment.teacher_id', userId)
                .is('grade', null)
                .order('submitted_at', { ascending: true })
                .limit(5),
            subjectIds.length > 0
                ? supabase
                .from('enrollments')
                .select('student_id')
                .in('subject_id', subjectIds)
                : Promise.resolve({ data: [] as any[] }),
            subjectIds.length > 0
                ? supabase
                .from('attendance')
                .select('subject_id, status')
                .in('subject_id', subjectIds)
                .eq('date', today)
                : Promise.resolve({ data: [] as any[] }),
        ]);

        const uniqueStudents = new Set(enrollments?.map((e: any) => e.student_id)).size;

        const attendanceBySubject = new Map<string, any[]>();
        (todayAttendance || []).forEach((row: any) => {
            attendanceBySubject.set(row.subject_id, [...(attendanceBySubject.get(row.subject_id) || []), row]);
        });

        const recentSubjectsAttendance = normalizedSubjects.slice(0, 5).map((subject: any) => {
            const rows = attendanceBySubject.get(subject.id) || [];
            const present = rows.filter((row: any) => row.status === 'present' || row.status === 'late').length;
            return {
                id: subject.id,
                name: subject.name,
                schedule: formatSubjectSchedule(subject),
                href: `/dashboard/subjects/${subject.id}`,
                attendanceLabel: rows.length > 0 ? `${present}/${rows.length} assistents avui` : 'Llista pendent avui',
                attended: rows.length > 0,
            };
        });

        return {
            profile: profile || undefined,
            subjects: normalizedSubjects,
            events: events || [],
            pendingSubmissions: pendingSubmissions || [],
            recentSubjectsAttendance,
            stats: {
                assignmentsPending: assignmentsPending || 0,
                activeUsers: uniqueStudents,
                totalSubjects: normalizedSubjects.length,
                upcomingEvents: events?.length || 0
            }
        };
    } else {
        const [{ data: profile }, enrollmentsResult, courseRowsResult] = await Promise.all([
            supabase
                .from('users')
                .select('id, full_name, email, avatar_url, institute_id')
                .eq('id', userId)
                .single(),
            supabase
                .from('enrollments')
                .select(`subject:subjects(${SUBJECT_WITH_COUNTS_SELECT}), course:courses(id, name, code)`)
                .eq('student_id', userId),
            supabase
                .from('course_students')
                .select('course:courses(id, name, code, course_subjects(subject_id))')
                .eq('student_id', userId),
        ]);
        let enrollments: any[] | null | undefined = enrollmentsResult.data as any[] | null;
        let courseRows: any[] | null | undefined = courseRowsResult.data as any[] | null;

        if (isMissingCoursesSchemaError(enrollmentsResult.error?.message) || isMissingCoursesSchemaError(courseRowsResult.error?.message)) {
            const { data: fallbackEnrollments } = await supabase
                .from('enrollments')
                .select(`subject:subjects(${SUBJECT_WITH_COUNTS_SELECT})`)
                .eq('student_id', userId);

            enrollments = fallbackEnrollments;
            courseRows = [];
        }

        const { courses, courseBySubjectId } = buildStudentCourseContext(courseRows);
        const subjects = enrollments?.map((e: any) => ({
            ...e.subject,
            course: e.course || courseBySubjectId.get(e.subject?.id),
            student_count: e.subject?.enrollments?.length || 0,
        })) || [];
        const studentSubjectIds = subjects.map((subject: any) => subject.id).filter(Boolean);
        const querySubjectIds = studentSubjectIds.length > 0
            ? studentSubjectIds
            : ['00000000-0000-0000-0000-000000000000'];
        const now = new Date().toISOString();

        const [
            { data: events },
            { data: gradedSubmissions },
            { data: gradeRows },
            { data: assignments },
            { data: allFutureAssignments },
            { data: attendanceSummaryRows },
            { data: attendanceRows },
        ] = await Promise.all([
            supabase
                .from('events')
                .select(EVENT_LIST_SELECT)
                .gte('end_time', now)
                .order('start_time', { ascending: true })
                .limit(5),
            supabase
                .from('submissions')
                .select('id, grade, feedback, submitted_at, assignment:assignments(title, due_date, subject:subjects(id, name))')
                .eq('student_id', userId)
                .not('grade', 'is', null)
                .order('submitted_at', { ascending: false }),
            supabase
                .from('student_grades')
                .select('id, score, feedback, created_at, grade_item:grade_items(name, max_score, subject:subjects(id, name))')
                .eq('student_id', userId)
                .order('created_at', { ascending: false }),
            supabase
                .from('assignments')
                .select(`${ASSIGNMENT_LIST_SELECT}, subject:subjects(name)`)
                .in('subject_id', querySubjectIds)
                .gt('due_date', now)
                .order('due_date', { ascending: true })
                .limit(5),
            supabase
                .from('assignments')
                .select('id')
                .in('subject_id', querySubjectIds)
                .gt('due_date', now),
            supabase
                .from('attendance')
                .select('status')
                .eq('student_id', userId),
            supabase
                .from('attendance')
                .select('subject_id, date, status, subject:subjects(name, schedules:subject_schedules(id, day_of_week, start_time, end_time))')
                .eq('student_id', userId)
                .order('date', { ascending: false })
                .limit(10),
        ]);

        const gradeItems = buildStudentGradeItems(
            (gradedSubmissions || []) as GradeSubmissionRow[],
            (gradeRows || []) as ManualGradeRow[],
        );
        const avgGrade = gradeItems.length > 0
            ? (gradeItems.reduce((sum, row) => sum + (row.score / row.max) * 10, 0) / gradeItems.length).toFixed(1)
            : "—";
        const gradeChart = gradeItems
            .slice()
            .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
            .slice(-6);

        const assignmentIds = allFutureAssignments?.map((assignment: any) => assignment.id) || [];
        const { data: currentSubmissions } = assignmentIds.length > 0
            ? await supabase
                .from('submissions')
                .select('assignment_id')
                .eq('student_id', userId)
                .in('assignment_id', assignmentIds)
            : { data: [] as any[] };
        const submittedIds = new Set((currentSubmissions || []).map((row: any) => row.assignment_id));
        const assignmentsPending = (allFutureAssignments || []).filter((assignment: any) => !submittedIds.has(assignment.id)).length;
        const attendanceTotal = attendanceSummaryRows?.length || 0;
        const attendancePresent = (attendanceSummaryRows || [])
            .filter((row: { status?: string | null }) => row.status === 'present' || row.status === 'late')
            .length;
        const attendanceRate = attendanceTotal > 0
            ? `${Math.round((attendancePresent / attendanceTotal) * 100)}%`
            : "—";

        const attendanceBySubject = new Map<string, any>();
        (attendanceRows || []).forEach((row: any) => {
            if (!attendanceBySubject.has(row.subject_id)) {
                attendanceBySubject.set(row.subject_id, row);
            }
        });

        const recentSubjectsAttendance = subjects.slice(0, 5).map((subject: any) => {
            const row = attendanceBySubject.get(subject.id);
            return {
                id: subject.id,
                name: subject.name,
                schedule: formatSubjectSchedule(subject),
                href: `/dashboard/subjects/${subject.id}`,
                attendanceLabel: row ? attendanceStatusLabel(row.status) : 'Encara sense registre',
                attended: row ? row.status === 'present' || row.status === 'late' : null,
                date: row?.date,
            };
        });

        return {
            profile: profile || undefined,
            courses,
            subjects,
            events: events || [],
            assignments: assignments || [],
            gradeChart,
            recentSubjectsAttendance,
            stats: {
                assignmentsPending,
                avgGrade,
                attendanceRate,
            }
        };
    }
}

export async function getSubjectsForUser(userId: string, role: string) {
    const supabase = await createClient();

    if (role === 'teacher') {
        const { data: subjects } = await supabase
            .from('subjects')
            .select(SUBJECT_WITH_COUNTS_SELECT)
            .eq('teacher_id', userId)
            .order('name');

        return (subjects || []).map((subject: any) => ({
            ...subject,
            student_count: subject.enrollments?.length || 0,
        }));
    }

    const [enrollmentsResult, courseRowsResult] = await Promise.all([
        supabase
            .from('enrollments')
            .select(`subject:subjects(${SUBJECT_WITH_COUNTS_SELECT}), course:courses(id, name, code)`)
            .eq('student_id', userId),
        supabase
            .from('course_students')
            .select('course:courses(id, name, code, course_subjects(subject_id))')
            .eq('student_id', userId),
    ]);
    let enrollments: any[] | null | undefined = enrollmentsResult.data as any[] | null;
    let courseRows: any[] | null | undefined = courseRowsResult.data as any[] | null;

    if (isMissingCoursesSchemaError(enrollmentsResult.error?.message) || isMissingCoursesSchemaError(courseRowsResult.error?.message)) {
        const { data: fallbackEnrollments } = await supabase
            .from('enrollments')
            .select(`subject:subjects(${SUBJECT_WITH_COUNTS_SELECT})`)
            .eq('student_id', userId);

        enrollments = fallbackEnrollments;
        courseRows = [];
    }

    const { courseBySubjectId } = buildStudentCourseContext(courseRows);

    return enrollments?.map((enrollment: any) => ({
        ...enrollment.subject,
        course: enrollment.course || courseBySubjectId.get(enrollment.subject?.id),
        student_count: enrollment.subject?.enrollments?.length || 0,
    })).filter(Boolean) || [];
}

export async function getUpcomingEvents(limit = 50) {
    const supabase = await createClient();
    const { data: events } = await supabase
        .from('events')
        .select(EVENT_LIST_SELECT)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit);

    return events || [];
}

export async function getScheduleData(userId: string, role: string) {
    const subjects = await getSubjectsForUser(userId, role);
    const subjectIds = subjects.map((subject: any) => subject.id).filter(Boolean);

    const [events, assignments] = await Promise.all([
        getUpcomingEvents(50),
        getScheduleAssignments(userId, role, subjectIds),
    ]);

    return { subjects, events, assignments };
}

async function getScheduleAssignments(userId: string, role: string, subjectIds: string[]) {
    const supabase = await createClient();

    if (role === 'teacher') {
        const { data: assignments } = await supabase
            .from('assignments')
            .select('id, title, subject_id, due_date, subject:subjects(name)')
            .eq('teacher_id', userId)
            .order('due_date', { ascending: true });

        return assignments || [];
    }

    if (subjectIds.length === 0) return [];

    const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, subject_id, due_date, subject:subjects(name)')
        .in('subject_id', subjectIds)
        .order('due_date', { ascending: true });

    return assignments || [];
}

export async function getSubjectDetails(subjectId: string, role: string) {
    const supabase = await createClient();
    // Get subject metadata
    const { data: subject } = await supabase
        .from('subjects')
        .select(SUBJECT_WITH_SCHEDULES_SELECT)
        .eq('id', subjectId)
        .single();

    if (!subject) return null;

    // Get assignments
    const { data: assignments } = await supabase
        .from('assignments')
        .select(ASSIGNMENT_LIST_SELECT)
        .eq('subject_id', subjectId)
        .order('due_date', { ascending: true });

    // Get resources
    const { data: resources } = await supabase
        .from('resources')
        .select(RESOURCE_LIST_SELECT)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

    // If teacher, get students (via enrollments)
    let students: any[] = [];
    if (role === 'teacher') {
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('student:users(id, full_name, email, avatar_url)')
            .eq('subject_id', subjectId);

        students = (enrollments || [])
            .flatMap((enrollment: any) => firstRelation(enrollment.student) || []);
    } else {
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('student:users(id, full_name, email, avatar_url)')
            .eq('subject_id', subjectId);

        students = (enrollments || [])
            .flatMap((enrollment: any) => firstRelation(enrollment.student) || []);
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: attendance } = await supabase
        .from('attendance')
        .select('id, student_id, date, status')
        .eq('subject_id', subjectId)
        .eq('date', today);

    return { subject, assignments, resources, students, attendance: attendance || [] };
}

export async function getAllAssignments(userId: string, role: string) {
    const supabase = await createClient();
    if (role === 'teacher') {
        // For teachers: get assignments with full submission details
        const { data: assignments, error } = await supabase
            .from('assignments')
            .select(`${ASSIGNMENT_LIST_SELECT}, subject:subjects(name), submissions(id, assignment_id, student_id, grade, feedback, file_url, student_comment, submitted_at, status, student:users(full_name, email))`)
            .eq('teacher_id', userId)
            .order('due_date', { ascending: true });
        if (error) console.error('Teacher assignments query error:', error);
        return assignments || [];
    } else {
        // For students, get assignments for their enrolled subjects
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('subject_id')
            .eq('student_id', userId);

        const subjectIds = enrollments?.map((e: any) => e.subject_id) || [];

        if (subjectIds.length === 0) return [];

        const { data: assignments } = await supabase
            .from('assignments')
            .select(`${ASSIGNMENT_LIST_SELECT}, subject:subjects(name)`)
            .in('subject_id', subjectIds)
            .order('due_date', { ascending: true });

        // Get submissions status for these assignments
        const { data: submissions } = await supabase
            .from('submissions')
            .select('assignment_id, grade, status, file_url, student_comment, feedback, submitted_at')
            .eq('student_id', userId)
            .in('assignment_id', assignments?.map((a: any) => a.id) || []);

        const submissionMap = new Map(submissions?.map((s: any) => [s.assignment_id, s]) || []);

        // Enhance assignments with status
        return assignments?.map((a: any) => {
            const sub = submissionMap.get(a.id);
            let status = 'pending';
            if (sub) {
                if (sub.status === 'returned') status = 'returned';
                else if (sub.grade !== null && sub.grade !== undefined) status = 'graded';
                else status = 'submitted';
            }
            return {
                ...a,
                status,
                grade: sub?.grade,
                feedback: sub?.feedback,
                file_url: sub?.file_url,
                student_comment: sub?.student_comment,
                submitted_at: sub?.submitted_at
            };
        }) || [];
    }
}

export async function getTeacherSubjects(teacherId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('teacher_id', teacherId)
        .order('name');
    return data || [];
}

export async function getSubjectStudents(subjectId: string) {
    const supabase = await createClient();
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student:users(id, full_name, email)')
        .eq('subject_id', subjectId);
    return enrollments?.map((e: any) => e.student) || [];
}

export async function getAttendanceData(userId: string, role: string) {
    const supabase = await createClient();
    const subjects = role === 'teacher'
        ? (await supabase.from('subjects').select('id, name, schedule, schedules:subject_schedules(id, day_of_week, start_time, end_time)').eq('teacher_id', userId)).data || []
        : ((await supabase.from('enrollments').select('subject:subjects(id, name, schedule, schedules:subject_schedules(id, day_of_week, start_time, end_time))').eq('student_id', userId)).data || []).map((e: any) => e.subject).filter(Boolean);

    const subjectIds = subjects.map((subject: any) => subject.id);
    if (subjectIds.length === 0) return { subjects: [], attendance: [] };

    const { data: attendance } = await supabase
        .from('attendance')
        .select('id, subject_id, student_id, date, status, subject:subjects(name), student:users(full_name, email)')
        .in('subject_id', subjectIds)
        .order('date', { ascending: false });

    const filteredAttendance = role === 'student'
        ? (attendance || []).filter((row: any) => row.student_id === userId)
        : attendance || [];

    return { subjects, attendance: filteredAttendance };
}

export async function getGradesData(userId: string) {
    const supabase = await createClient();
    const { data: submissions } = await supabase
        .from('submissions')
        .select('id, grade, feedback, submitted_at, assignment:assignments(title, due_date, subject:subjects(id, name))')
        .eq('student_id', userId)
        .not('grade', 'is', null)
        .order('submitted_at', { ascending: false });

    const { data: gradeRows } = await supabase
        .from('student_grades')
        .select('id, score, feedback, grade_item:grade_items(name, max_score, weight, subject:subjects(id, name))')
        .eq('student_id', userId);

    return { submissions: submissions || [], gradeRows: gradeRows || [] };
}

type GradeSubjectReference = {
    id?: string | null;
    name?: string | null;
};

type GradeAssignmentReference = {
    title?: string | null;
    due_date?: string | null;
    subject?: GradeSubjectReference | GradeSubjectReference[] | null;
};

type GradeItemReference = {
    name?: string | null;
    max_score?: number | string | null;
    subject?: GradeSubjectReference | GradeSubjectReference[] | null;
};

type GradeSubmissionRow = {
    id: string;
    grade: number | string | null;
    submitted_at?: string | null;
    assignment?: GradeAssignmentReference | GradeAssignmentReference[] | null;
};

type ManualGradeRow = {
    id: string;
    score: number | string | null;
    created_at?: string | null;
    grade_item?: GradeItemReference | GradeItemReference[] | null;
};

type StudentGradeItem = {
    id: string;
    subject: string;
    title: string;
    score: number;
    max: number;
    date: string | null;
};

function buildStudentGradeItems(submissions: GradeSubmissionRow[], gradeRows: ManualGradeRow[]): StudentGradeItem[] {
    return [
        ...submissions
            .map((row) => {
                const assignment = firstRelation(row.assignment);
                const subject = firstRelation(assignment?.subject);
                return {
                    id: `submission-${row.id}`,
                    subject: subject?.name || "Sense assignatura",
                    title: assignment?.title || "Treball",
                    score: Number(row.grade),
                    max: 10,
                    date: row.submitted_at || assignment?.due_date || null,
                };
            }),
        ...gradeRows
            .map((row) => {
                const gradeItem = firstRelation(row.grade_item);
                const subject = firstRelation(gradeItem?.subject);
                return {
                    id: `grade-${row.id}`,
                    subject: subject?.name || "Sense assignatura",
                    title: gradeItem?.name || "Qualificació",
                    score: Number(row.score),
                    max: Number(gradeItem?.max_score || 10),
                    date: row.created_at || null,
                };
            }),
    ].filter((item) => Number.isFinite(item.score) && Number.isFinite(item.max) && item.max > 0);
}

function firstRelation<T>(value: T | T[] | null | undefined) {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

function buildStudentCourseContext(courseRows: any[] | null | undefined) {
    const rawCourses = Array.from(
        new Map(
            (courseRows || [])
                .map((row: any) => row.course)
                .filter(Boolean)
                .map((course: any) => [course.id, course]),
        ).values(),
    );
    const courseBySubjectId = new Map<string, any>();

    rawCourses.forEach((course: any) => {
        (course.course_subjects || []).forEach((row: any) => {
            if (row.subject_id && !courseBySubjectId.has(row.subject_id)) {
                courseBySubjectId.set(row.subject_id, {
                    id: course.id,
                    name: course.name,
                    code: course.code,
                });
            }
        });
    });

    return {
        courses: rawCourses.map((course: any) => ({
            id: course.id,
            name: course.name,
            code: course.code,
        })),
        courseBySubjectId,
    };
}

function isMissingCoursesSchemaError(message?: string | null) {
    if (!message) return false;
    return /courses|course_students|course_subjects|schema cache|relationship/i.test(message);
}

function formatSubjectSchedule(subject: any) {
    if (subject?.schedules?.length) {
        return subject.schedules
            .map((s: any) => `${s.day_of_week} ${String(s.start_time).slice(0, 5)}-${String(s.end_time).slice(0, 5)}`)
            .join(', ');
    }
    return subject?.schedule || 'Horari no definit';
}

function attendanceStatusLabel(status: string) {
    const labels: Record<string, string> = {
        present: 'Asistió',
        absent: 'Falta',
        late: 'Retard',
        excused: 'Justificada',
    };
    return labels[status] || 'Sense registre';
}
