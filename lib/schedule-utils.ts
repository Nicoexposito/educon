export type ScheduleEntry = {
    day_of_week?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    room?: string | null;
    location?: string | null;
};

export type ScheduledSubject<TSubject> = TSubject & {
    activeSchedule: ScheduleEntry;
    startMinutes: number;
    endMinutes: number;
};

const FULL_DAYS = ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"];
const SHORT_DAYS = ["DG", "DL", "DM", "DC", "DJ", "DV", "DS"];

export function currentDayName(date = new Date()) {
    return FULL_DAYS[date.getDay()];
}

export function currentShortDayName(date = new Date()) {
    return SHORT_DAYS[date.getDay()];
}

export function minutesNow(date = new Date()) {
    return date.getHours() * 60 + date.getMinutes();
}

export function minutesFromTime(value?: string | null) {
    if (!value) return null;
    const match = String(value).match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
}

export function formatScheduleTime(schedule?: ScheduleEntry | null) {
    const start = schedule?.start_time ? String(schedule.start_time).slice(0, 5) : "";
    const end = schedule?.end_time ? String(schedule.end_time).slice(0, 5) : "";
    return start && end ? `${start} - ${end}` : start || "Horari pendent";
}

export function isScheduleActive(schedule: { startMinutes: number; endMinutes: number }, date = new Date()) {
    const now = minutesNow(date);
    return now >= schedule.startMinutes && now < schedule.endMinutes;
}

export function minutesUntilSchedule(schedule: { startMinutes: number }, date = new Date()) {
    return schedule.startMinutes - minutesNow(date);
}

export function flattenTodaySchedules<TSubject extends {
    schedule?: string | null;
    schedules?: ScheduleEntry[] | null;
}>(
    subjects: TSubject[],
    date = new Date(),
): ScheduledSubject<TSubject>[] {
    const day = currentDayName(date);

    return subjects
        .flatMap((subject) => {
            const schedules = subject.schedules?.length
                ? subject.schedules
                : parseLegacySchedule(subject.schedule, day);

            return schedules
                .filter((schedule) => schedule.day_of_week === day)
                .map((schedule) => {
                    const startMinutes = minutesFromTime(schedule.start_time);
                    const endMinutes = minutesFromTime(schedule.end_time);
                    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return null;

                    return {
                        ...subject,
                        activeSchedule: schedule,
                        startMinutes,
                        endMinutes,
                    };
                })
                .filter((entry): entry is ScheduledSubject<TSubject> => Boolean(entry));
        })
        .sort((a, b) => a.startMinutes - b.startMinutes);
}

function parseLegacySchedule(schedule: string | null | undefined, currentDay: string): ScheduleEntry[] {
    if (!schedule) return [];

    return schedule
        .split(",")
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.includes(currentDay))
        .map((chunk) => {
            const match = chunk.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
            return {
                day_of_week: currentDay,
                start_time: match?.[1] || null,
                end_time: match?.[2] || null,
            };
        });
}
