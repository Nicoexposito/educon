'use server'

import { supabase } from "@/lib/supabase";

export async function getDashboardData(userId: string, role: string) {
    if (role === 'teacher') {
        const { data: subjects } = await supabase
            .from('subjects')
            .select('*, count:enrollments(count)') // Hacky way to count students? Supabase doesn't do simple count in select easily without rpc or simple join.
            // Let's just get subjects for now
            .eq('teacher_id', userId);

        const { data: events } = await supabase
            .from('events')
            .select('*')
            .order('start_time', { ascending: true })
            .limit(5);

        return { subjects, events };
    } else {
        // Student
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('subject:subjects(*)')
            .eq('student_id', userId);

        // Transform to list of subjects
        // @ts-ignore
        const subjects = enrollments?.map(e => e.subject) || [];

        const { data: events } = await supabase
            .from('events')
            .select('*')
            .order('start_time', { ascending: true })
            .limit(5);

        const { count: assignmentsCount } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .gt('due_date', new Date().toISOString());

        // Mock avg grade for now as we don't have a full grades system yet
        const avgGrade = "8.4";

        const { data: assignments } = await supabase
            .from('assignments')
            .select('*, subject:subjects(name)')
            .gt('due_date', new Date().toISOString())
            .order('due_date', { ascending: true })
            .limit(5);

        return { subjects, events, assignments, stats: { assignmentsPending: assignmentsCount, avgGrade } };
    }
}
