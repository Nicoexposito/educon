import { useRealtimeTable } from './useRealtimeTable';

export function useTeacherDashboardRealtime(initialData: any) {
    // Escuchar nuevas asignaturas o cambios
    const { data: subjects } = useRealtimeTable({
        table: 'subjects',
        initialData: initialData.subjects || [],
    });

    // Escuchar entregas pendientes
    const { data: pendingSubmissions } = useRealtimeTable({
        table: 'submissions',
        initialData: initialData.pendingSubmissions || [],
        // En una app real podríamos filtrar por is_grade_null u otros. 
        // Supabase Realtime no soporta filtros muy complejos en el cliente sin eq., 
        // pero podemos filtrar localmente si es necesario, o mantener el estado sincronizado.
    });

    // Escuchar eventos
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

    // TODO: Escuchar calificaciones actualizadas desde submissions

    return {
        ...initialData,
        assignments,
        events,
        profile
    };
}
