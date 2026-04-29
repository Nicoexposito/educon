"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardData(userId: string, role: string) {
    const supabase = await createClient();

    if (role === 'teacher') {
        const [{ data: profile }, { data: subjects }] = await Promise.all([
            supabase
                .from('users')
                .select('full_name, email, avatar_url')
                .eq('id', userId)
                .single(),
            supabase
                .from('subjects')
                .select('*, schedules:subject_schedules(*), enrollments(id)')
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
                .select('*')
                .gte('end_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(5),
            supabase
                .from('submissions')
                .select('*, assignment:assignments!inner(teacher_id)', { count: 'exact', head: true })
                .eq('assignment.teacher_id', userId)
                .is('grade', null),
            supabase
                .from('submissions')
                .select('*, assignment:assignments!inner(title, teacher_id, subject:subjects(name)), student:users(full_name)')
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
            profile,
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
        const [{ data: profile }, { data: enrollments }] = await Promise.all([
            supabase
                .from('users')
                .select('full_name, email, avatar_url')
                .eq('id', userId)
                .single(),
            supabase
                .from('enrollments')
                .select('subject:subjects(*, schedules:subject_schedules(*), enrollments(id))')
                .eq('student_id', userId),
        ]);

        const subjects = enrollments?.map((e: any) => ({
            ...e.subject,
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
            { data: assignments },
            { data: allFutureAssignments },
            { data: attendanceRows },
        ] = await Promise.all([
            supabase
                .from('events')
                .select('*')
                .gte('end_time', now)
                .order('start_time', { ascending: true })
                .limit(5),
            supabase
                .from('submissions')
                .select('grade')
                .eq('student_id', userId)
                .not('grade', 'is', null),
            supabase
                .from('assignments')
                .select('*, subject:subjects(name)')
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
                .select('subject_id, date, status, subject:subjects(name, schedules:subject_schedules(*))')
                .eq('student_id', userId)
                .order('date', { ascending: false })
                .limit(10),
        ]);

        const avgGrade = gradedSubmissions && gradedSubmissions.length > 0
            ? (gradedSubmissions.reduce((sum: number, row: any) => sum + Number(row.grade), 0) / gradedSubmissions.length).toFixed(1)
            : "—";

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
            profile,
            subjects,
            events: events || [],
            assignments: assignments || [],
            recentSubjectsAttendance,
            stats: {
                assignmentsPending,
                avgGrade
            }
        };
    }
}

export async function getSubjectsForUser(userId: string, role: string) {
    const supabase = await createClient();

    if (role === 'teacher') {
        const { data: subjects } = await supabase
            .from('subjects')
            .select('*, schedules:subject_schedules(*), enrollments(id)')
            .eq('teacher_id', userId)
            .order('name');

        return (subjects || []).map((subject: any) => ({
            ...subject,
            student_count: subject.enrollments?.length || 0,
        }));
    }

    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subject:subjects(*, schedules:subject_schedules(*), enrollments(id))')
        .eq('student_id', userId);

    return enrollments?.map((enrollment: any) => ({
        ...enrollment.subject,
        student_count: enrollment.subject?.enrollments?.length || 0,
    })).filter(Boolean) || [];
}

export async function getUpcomingEvents(limit = 50) {
    const supabase = await createClient();
    const { data: events } = await supabase
        .from('events')
        .select('*')
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
        .select('*, schedules:subject_schedules(*)')
        .eq('id', subjectId)
        .single();

    if (!subject) return null;

    // Get assignments
    const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', subjectId)
        .order('due_date', { ascending: true });

    // Get resources
    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

    // If teacher, get students (via enrollments)
    let students: any[] = [];
    if (role === 'teacher') {
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('student:users(id, full_name, email, avatar_url)')
            .eq('subject_id', subjectId);

        // @ts-ignore
        students = enrollments?.map(e => e.student) || [];
    } else {
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('student:users(id, full_name, email, avatar_url)')
            .eq('subject_id', subjectId);

        // @ts-ignore
        students = enrollments?.map(e => e.student) || [];
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
            .select('*, subject:subjects(name), submissions(id, student_id, grade, feedback, file_url, submitted_at, status, student:users(full_name, email))')
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
            .select('*, subject:subjects(name)')
            .in('subject_id', subjectIds)
            .order('due_date', { ascending: true });

        // Get submissions status for these assignments
        const { data: submissions } = await supabase
            .from('submissions')
            .select('assignment_id, grade, status, file_url, feedback, submitted_at')
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
                grade: sub?.grade
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
        ? (await supabase.from('subjects').select('id, name, schedules:subject_schedules(*)').eq('teacher_id', userId)).data || []
        : ((await supabase.from('enrollments').select('subject:subjects(id, name, schedules:subject_schedules(*))').eq('student_id', userId)).data || []).map((e: any) => e.subject).filter(Boolean);

    const subjectIds = subjects.map((subject: any) => subject.id);
    if (subjectIds.length === 0) return { subjects: [], attendance: [] };

    const { data: attendance } = await supabase
        .from('attendance')
        .select('*, subject:subjects(name), student:users(full_name, email)')
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
