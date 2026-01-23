"use server";

import { supabase } from "@/lib/supabase";

export async function getDashboardData(userId: string, role: string) {
    // Get user profile first
    const { data: profile } = await supabase
        .from('users')
        .select('full_name, email, avatar_url')
        .eq('id', userId)
        .single();

    if (role === 'teacher') {
        const { data: subjects } = await supabase
            .from('subjects')
            .select('*')
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
            .select('subject:subjects(*)')
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
    if (role === 'teacher') {
        const { data: assignments } = await supabase
            .from('assignments')
            .select('*, subject:subjects(name), submissions(count)')
            .eq('teacher_id', userId)
            .order('due_date', { ascending: true });
        return assignments || [];
    } else {
        // For students, get assignments for their enrolled subjects
        // First get subject IDs
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

        // Filter out those already submitted? Or show status?
        // Let's get submissions status for these assignments
        const { data: submissions } = await supabase
            .from('submissions')
            .select('assignment_id, grade')
            .eq('student_id', userId)
            .in('assignment_id', assignments?.map((a: any) => a.id) || []);

        const submittedIds = new Set(submissions?.map((s: any) => s.assignment_id));

        // Enhance assignments with status
        return assignments?.map((a: any) => ({
            ...a,
            status: submittedIds.has(a.id) ? 'submitted' : 'pending',
            grade: submissions?.find((s: any) => s.assignment_id === a.id)?.grade
        })) || [];
    }
}
