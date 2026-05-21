import { useRealtimeTable } from './useRealtimeTable';

export function useTeacherDashboardRealtime(initialData: any) {
    const userId = initialData.profile?.id;
    const instituteId = initialData.profile?.institute_id;

    // Escoltar només les assignatures del professor.
    const { data: subjects } = useRealtimeTable({
        table: 'subjects',
        initialData: initialData.subjects || [],
        filter: userId ? `teacher_id=eq.${userId}` : undefined,
        enabled: Boolean(userId),
    });

    // Els lliuraments pendents es carreguen del servidor. Evitem escoltar tota la taula submissions.
    const { data: pendingSubmissions } = useRealtimeTable({
        table: 'submissions',
        initialData: initialData.pendingSubmissions || [],
        enabled: false,
    });

    // Escoltar només els esdeveniments del centre.
    const { data: events } = useRealtimeTable({
        table: 'events',
        initialData: initialData.events || [],
        filter: instituteId ? `institute_id=eq.${instituteId}` : undefined,
        enabled: Boolean(instituteId),
    });

    // Perfil (users) - només aquest usuari
    const { data: profileList } = useRealtimeTable({
        table: 'users',
        initialData: initialData.profile ? [initialData.profile] : [],
        filter: userId ? `id=eq.${userId}` : undefined,
        enabled: Boolean(userId),
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
    const userId = initialData.profile?.id;
    const instituteId = initialData.profile?.institute_id;

    // Les tasques de l'alumne poden venir de diversos cursos/assignatures; no obrim un canal global.
    const { data: assignments } = useRealtimeTable({
        table: 'assignments',
        initialData: initialData.assignments || [],
        enabled: false,
    });

    const { data: events } = useRealtimeTable({
        table: 'events',
        initialData: initialData.events || [],
        filter: instituteId ? `institute_id=eq.${instituteId}` : undefined,
        enabled: Boolean(instituteId),
    });

    // Perfil
    const { data: profileList } = useRealtimeTable({
        table: 'users',
        initialData: initialData.profile ? [initialData.profile] : [],
        filter: userId ? `id=eq.${userId}` : undefined,
        enabled: Boolean(userId),
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
