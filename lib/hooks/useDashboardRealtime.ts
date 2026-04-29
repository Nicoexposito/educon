import { useRealtimeTable } from './useRealtimeTable';

export function useTeacherDashboardRealtime(initialData: any) {
    // Escoltar assignatures noves o canvis
    const { data: subjects } = useRealtimeTable({
        table: 'subjects',
        initialData: initialData.subjects || [],
    });

    // Escoltar lliuraments pendents
    const { data: pendingSubmissions } = useRealtimeTable({
        table: 'submissions',
        initialData: initialData.pendingSubmissions || [],
        // En una app real podríamos filtrar por is_grade_null u otros.
        // Supabase Realtime no admet filtres gaire complexos al client sense eq.,
        // per? podem filtrar localment si cal o mantenir l'estat sincronitzat.
    });

    // Escoltar esdeveniments
    const { data: events } = useRealtimeTable({
        table: 'events',
        initialData: initialData.events || [],
    });

    // Perfil (users) - solo este usuario
    const { data: profileList } = useRealtimeTable({
        table: 'users',
        initialData: initialData.profile ? [initialData.profile] : [],
        filter: initialData.profile?.id ? `id=eq.${initialData.profile.id}` : undefined,
    });

    const profile = profileList.length > 0 ? profileList[0] : initialData.profile;

    return {
        ...initialData,
        subjects,
        pendingSubmissions,
        events,
        profile
    };
}

export function useStudentDashboardRealtime(initialData: any) {
    const { data: assignments } = useRealtimeTable({
        table: 'assignments',
        initialData: initialData.assignments || [],
    });

    const { data: events } = useRealtimeTable({
        table: 'events',
        initialData: initialData.events || [],
    });

    // Para profile
    const { data: profileList } = useRealtimeTable({
        table: 'users',
        initialData: initialData.profile ? [initialData.profile] : [],
        filter: initialData.profile?.id ? `id=eq.${initialData.profile.id}` : undefined,
    });

    const profile = profileList.length > 0 ? profileList[0] : initialData.profile;

    // TODO: Escoltar qualificacions actualitzades des de submissions

    return {
        ...initialData,
        assignments,
        events,
        profile
    };
}
