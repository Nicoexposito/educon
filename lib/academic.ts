const DAY_NAMES = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];

export interface ScheduleEntry {
    id?: string;
    day_of_week?: string;
    start_time?: string | null;
    end_time?: string | null;
}

export interface AcademicSubject {
    id?: string;
    name?: string;
    category?: string | null;
    description?: string | null;
    schedule?: string | null;
    schedules?: ScheduleEntry[] | null;
    activeSchedule?: ScheduleEntry;
    student_count?: number | null;
    students_count?: number | null;
    [key: string]: unknown;
}

export function getTodayName(date = new Date()) {
    return DAY_NAMES[date.getDay()];
}

export function formatSubjectSchedule(subject: AcademicSubject | null | undefined) {
    const schedules = getSubjectSchedules(subject);
    if (schedules.length > 0) {
        return schedules
            .map((schedule) => {
                const start = formatTime(schedule.start_time);
                const end = formatTime(schedule.end_time);
                return start && end ? `${schedule.day_of_week} ${start}-${end}` : schedule.day_of_week;
            })
            .join(', ');
    }

    return subject?.schedule || 'Horario no definido';
}

export function getSubjectSchedules(subject: AcademicSubject | null | undefined): ScheduleEntry[] {
    if (Array.isArray(subject?.schedules) && subject.schedules.length > 0) {
        return subject.schedules.filter(Boolean);
    }

    return parseLegacySchedule(subject?.schedule);
}

export function getClassesForDay(subjects: AcademicSubject[] = [], dayName = getTodayName()): AcademicSubject[] {
    return subjects
        .flatMap((subject) =>
            getSubjectSchedules(subject)
                .filter((schedule) => schedule.day_of_week === dayName)
                .map((schedule) => ({ ...subject, activeSchedule: schedule }))
        )
        .sort((a, b) => timeToMinutes(a.activeSchedule?.start_time) - timeToMinutes(b.activeSchedule?.start_time));
}

export function getCurrentClassForSubjects(subjects: AcademicSubject[] = [], date = new Date()) {
    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const todaysClasses = getClassesForDay(subjects, getTodayName(date));

    return todaysClasses.find((subject) => {
        const start = timeToMinutes(subject.activeSchedule?.start_time);
        const end = timeToMinutes(subject.activeSchedule?.end_time);
        return Number.isFinite(start) && Number.isFinite(end) && currentMinutes >= start && currentMinutes < end;
    }) || null;
}

export function getNextClassForSubjects(subjects: AcademicSubject[] = [], date = new Date()) {
    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const todaysClasses = getClassesForDay(subjects, getTodayName(date));
    return todaysClasses.find((subject) => timeToMinutes(subject.activeSchedule?.start_time) > currentMinutes) || null;
}

export function formatScheduleRange(schedule: ScheduleEntry | null | undefined, fallback = 'Horario no definido') {
    const start = formatTime(schedule?.start_time);
    const end = formatTime(schedule?.end_time);
    if (start && end) return `${start} - ${end}`;
    return fallback;
}

export function formatTime(value: string | null | undefined) {
    if (!value) return '';
    const match = String(value).match(/(\d{1,2}):(\d{2})/);
    if (!match) return String(value);
    return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function timeToMinutes(value: string | null | undefined) {
    const time = formatTime(value);
    const match = time.match(/^(\d{2}):(\d{2})$/);
    if (!match) return Number.POSITIVE_INFINITY;
    return Number(match[1]) * 60 + Number(match[2]);
}

function parseLegacySchedule(schedule: string | null | undefined): ScheduleEntry[] {
    if (!schedule) return [];

    const results: ScheduleEntry[] = [];
    for (const day of DAY_NAMES) {
        const dayIndex = schedule.indexOf(day);
        if (dayIndex === -1) continue;

        const afterDay = schedule.slice(dayIndex + day.length);
        const timeMatch = afterDay.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
        results.push({
            day_of_week: day,
            start_time: timeMatch?.[1] || '',
            end_time: timeMatch?.[2] || '',
        });
    }

    return results;
}
