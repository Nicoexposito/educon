"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardData(userId: string, role: string) {
    const supabase = await createClient();
    // Get user profile first
    const { data: profile } = await supabase
        .from('users')
        .select('full_name, email, avatar_url')
        .eq('id', userId)
        .single();

    if (role === 'teacher') {
        const { data: subjects } = await supabase
            .from('subjects')
            .select('*, schedules:subject_schedules(*)')
            .eq('teacher_id', userId);

        const { data: events } = await supabase
            .from('events')
            .select('*')
            .order('start_time', { ascending: true })
            .limit(5);

        // Calculate stats
        const { count: assignmentsPending } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .is('grade', null); // Pending grading

        // Get recent pending submissions (ungraded)
        const { data: pendingSubmissions } = await supabase
            .from('submissions')
            .select('*, assignment:assignments(title, subject:subjects(name)), student:users(full_name)')
            .is('grade', null)
            .order('submitted_at', { ascending: true })
            .limit(5);

        const activeStudents = 24;

        return {
            profile,
            subjects: subjects || [],
            events: events || [],
            pendingSubmissions: pendingSubmissions || [],
            stats: {
                assignmentsPending: assignmentsPending || 0,
                activeUsers: activeStudents
            }
        };
    } else {
        // Student
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('subject:subjects(*, schedules:subject_schedules(*))')
            .eq('student_id', userId);

        // Transform to list of subjects
        const subjects = enrollments?.map((e: any) => e.subject) || [];

        const { data: events } = await supabase
            .from('events')
            .select('*')
            .order('start_time', { ascending: true })
            .limit(5);

        const { count: assignmentsCount } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .gt('due_date', new Date().toISOString());

        // Mock avg grade
        const avgGrade = "8.4";

        const { data: assignments } = await supabase
            .from('assignments')
            .select('*, subject:subjects(name)')
            .gt('due_date', new Date().toISOString())
            .order('due_date', { ascending: true })
            .limit(5);

        return {
            profile,
            subjects,
            events: events || [],
            assignments: assignments || [],
            stats: {
                assignmentsPending: assignmentsCount || 0,
                avgGrade
            }
        };
    }
}

export async function getSubjectDetails(subjectId: string, role: string) {
    const supabase = await createClient();
    // Get subject metadata
    const { data: subject } = await supabase
        .from('subjects')
        .select('*')
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
            .select('student:users(*)')
            .eq('subject_id', subjectId);

        // @ts-ignore
        students = enrollments?.map(e => e.student) || [];
    }

    return { subject, assignments, resources, students };
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

