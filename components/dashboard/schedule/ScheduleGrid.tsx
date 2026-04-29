"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
import { useRealtimeTable } from '@/lib/hooks/useRealtimeTable';
import Link from 'next/link';

export function ScheduleGrid({ subjects: initialSubjects, events: initialEvents, assignments: initialAssignments }: { subjects: any[], events: any[], assignments: any[] }) {
    const { data: subjects } = useRealtimeTable({ table: 'subjects', initialData: initialSubjects });
    const { data: events } = useRealtimeTable({ table: 'events', initialData: initialEvents });
    const { data: assignments } = useRealtimeTable({ table: 'assignments', initialData: initialAssignments });
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, subject: any, timeId: string, fullDate: Date } | null>(null);

    const days = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];

    const getWeekDateRange = (offset: number) => {
        if (offset === 0) return "Setmana actual";
        const today = new Date();
        const day = today.getDay() || 7;
        const mondayStr = new Date(today);
        mondayStr.setDate(today.getDate() - day + 1 + (offset * 7));

        const sundayStr = new Date(mondayStr);
        sundayStr.setDate(mondayStr.getDate() + 6);

        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return `${mondayStr.toLocaleDateString('ca-ES', options)} - ${sundayStr.toLocaleDateString('ca-ES', options)}`;
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = new Date(e.target.value);
        if (!isNaN(selectedDate.getTime())) {
            const today = new Date();
            const getMonday = (d: Date) => {
                const day = d.getDay() || 7;
                const result = new Date(d);
                result.setDate(d.getDate() - day + 1);
                result.setHours(0, 0, 0, 0);
                return result;
            };
            const todayMonday = getMonday(today);
            const selectedMonday = getMonday(selectedDate);
            const diffTime = selectedMonday.getTime() - todayMonday.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            setWeekOffset(Math.round(diffDays / 7));
        }
    };

    const checkDayStatus = (date: Date) => {
        const month = date.getMonth() + 1; // 1 to 12
        const day = date.getDate();

        // Vacaciones de verano (aprox 22 de Junio a 12 de Septiembre)
        if (
            (month === 6 && day >= 22) ||
            month === 7 ||
            month === 8 ||
            (month === 9 && day <= 12)
        ) {
            return { isHoliday: true, name: "Vacaciones de Verano" };
        }

        // Vacaciones de Navidad (aprox 22 de Diciembre a 7 de Enero)
        if (
            (month === 12 && day >= 22) ||
            (month === 1 && day <= 7)
        ) {
            return { isHoliday: true, name: "Vacaciones de Navidad" };
        }

        // Festivos de Cataluña (Datas fijas)
        const fixedHolidays = [
            { m: 1, d: 1, name: "Cap d'Any" },
            { m: 1, d: 6, name: "Reyes" },
            { m: 5, d: 1, name: "Dia del Treballador" },
            { m: 6, d: 24, name: "Sant Joan" },
            { m: 8, d: 15, name: "Asunción" },
            { m: 9, d: 11, name: "La Diada" },
            { m: 10, d: 12, name: "Dia de la Hispanitat" },
            { m: 11, d: 1, name: "Tots Sants" },
            { m: 12, d: 6, name: "Dia de la Constitució" },
            { m: 12, d: 8, name: "Inmaculada" },
            { m: 12, d: 25, name: "Nadal" },
            { m: 12, d: 26, name: "Sant Esteve" },
        ];

        const holiday = fixedHolidays.find(h => h.m === month && h.d === day);
        if (holiday) {
            return { isHoliday: true, name: holiday.name };
        }

        return { isHoliday: false, name: "" };
    };

    const getDaysWithDates = () => {
        const today = new Date();
        const day = today.getDay() || 7;
        const mondayStr = new Date(today);
        mondayStr.setDate(today.getDate() - day + 1 + (weekOffset * 7));

        return days.map((dayName, index) => {
            const dateStr = new Date(mondayStr);
            dateStr.setDate(mondayStr.getDate() + index);
            const status = checkDayStatus(dateStr);
            return {
                name: dayName,
                date: dateStr.getDate(),
                fullDate: dateStr,
                isToday: dateStr.toDateString() === today.toDateString(),
                status
            };
        });
    };

    const daysWithDates = getDaysWithDates();
    const timeSlots = [
        { time: '08:00 - 09:00', id: '08:00' },
        { time: '09:00 - 10:00', id: '09:00' },
        { time: '10:00 - 11:00', id: '10:00' },
        { time: '11:00 - 11:30', id: 'patio', isBreak: true, label: 'PATI' },
        { time: '11:30 - 12:30', id: '11:30' },
        { time: '12:30 - 13:30', id: '12:30' },
    ];

    // We no longer need static schedules or placeholder mappings.
    // Instead we dynamically search the subjects array and their relational schedules list.
    const findSubjectForSlot = (day: string, timeId: string) => {
        if (!subjects || subjects.length === 0) return null;
        return subjects.find(subj =>
            subj.schedules && subj.schedules.some((s: any) =>
                s.day_of_week === day && s.start_time.startsWith(timeId)
            )
        );
    };

    // Filter assignments/events by selected subject if one is selected
    const getSubjectDetails = (subjObj: any, selectedDate: Date) => {
        // In a completely real app, we'd filter by checking if assignment.subject_id === subjObj.id
        // Here we do that if the subject is real
        const relatedAssignments = assignments.filter(a => {
            const isMatch = a.subject_id === subjObj.id || a.subject?.name === subjObj.name;
            if (!isMatch) return false;

            const dueDate = new Date(a.due_date);
            return dueDate.toDateString() === selectedDate.toDateString();
        });
        return relatedAssignments;
    };

    const hasDeliveriesForSlot = (subject: any, date: Date) => {
        if (!subject) return false;
        return assignments.some(a => {
            if (a.subject_id !== subject.id && a.subject?.name !== subject.name) return false;
            const dueDate = new Date(a.due_date);
            return dueDate.toDateString() === date.toDateString();
        });
    };

    const selectedTasks = selectedSlot ? getSubjectDetails(selectedSlot.subject, selectedSlot.fullDate) : [];
    const selectedTimeLabel = selectedSlot ? timeSlots.find(t => t.id === selectedSlot.timeId)?.time || "" : "";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Horari Escolar</h1>
                    <p className="mt-2 text-sm text-zinc-500 sm:text-base">Vista setmanal de classes i esdeveniments.</p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    {weekOffset !== 0 && (
                        <button
                            onClick={() => setWeekOffset(0)}
                            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Avui
                        </button>
                    )}
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-none sm:gap-2">
                        <button
                            onClick={() => setWeekOffset(prev => prev - 1)}
                            className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Setmana anterior"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-500" />
                        </button>
                        <span className="min-w-0 flex-1 px-2 text-center text-sm font-semibold sm:min-w-[120px]" suppressHydrationWarning>
                            {getWeekDateRange(weekOffset)}
                        </span>
                        <button
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Setmana següent"
                        >
                            <ChevronRight className="w-5 h-5 text-zinc-500" />
                        </button>
                        <div className="relative ml-1 flex items-center border-l border-zinc-200 pl-1 dark:border-zinc-800">
                            <input
                                type="date"
                                onChange={handleDateChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title="Seleccionar data"
                            />
                            <button className="pointer-events-none rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <CalendarIcon className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:hidden">
                {daysWithDates.map((dayObj) => (
                    <section key={dayObj.name} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className={`flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800 ${dayObj.status.isHoliday ? 'bg-red-50/70 dark:bg-red-900/10' : dayObj.isToday ? 'bg-indigo-50/70 dark:bg-indigo-900/10' : 'bg-zinc-50 dark:bg-zinc-800/30'}`}>
                            <div>
                                <h2 className={`text-base font-black ${dayObj.status.isHoliday ? 'text-red-700 dark:text-red-400' : dayObj.isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {dayObj.name}
                                </h2>
                                <p className="text-sm font-semibold text-zinc-500" suppressHydrationWarning>{dayObj.date}</p>
                            </div>
                            {dayObj.status.isHoliday && (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 dark:bg-red-500/10 dark:text-red-400">
                                    Festiu
                                </span>
                            )}
                            {dayObj.isToday && !dayObj.status.isHoliday && (
                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                    Avui
                                </span>
                            )}
                        </div>

                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {timeSlots.map((slot) => {
                                if (slot.isBreak) {
                                    return (
                                        <div key={slot.id} className="flex items-center justify-between bg-zinc-50 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-zinc-400 dark:bg-zinc-950/30">
                                            <span className="tracking-normal">{slot.time}</span>
                                            <span>{slot.label}</span>
                                        </div>
                                    );
                                }

                                const actualSubject = !dayObj.status.isHoliday ? findSubjectForSlot(dayObj.name, slot.id) : null;
                                const hasDeliveries = actualSubject ? hasDeliveriesForSlot(actualSubject, dayObj.fullDate) : false;
                                const isSelected = selectedSlot?.day === dayObj.name && selectedSlot?.timeId === slot.id;

                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        disabled={!actualSubject}
                                        onClick={() => actualSubject && setSelectedSlot({ day: dayObj.name, subject: actualSubject, timeId: slot.id, fullDate: dayObj.fullDate })}
                                        className={`flex w-full items-center gap-4 px-4 py-3 text-left transition ${actualSubject ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40' : 'cursor-default opacity-60'} ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                    >
                                        <span className="w-24 shrink-0 text-xs font-bold text-zinc-500">{slot.time}</span>
                                        <span className="min-w-0 flex-1">
                                            {dayObj.status.isHoliday ? (
                                                <span className="text-sm font-semibold text-red-400">{dayObj.status.name}</span>
                                            ) : actualSubject ? (
                                                <>
                                                    <span className={`block truncate text-sm font-black ${hasDeliveries ? 'text-orange-800 dark:text-orange-200' : 'text-indigo-800 dark:text-indigo-200'}`}>
                                                        {actualSubject.name}
                                                    </span>
                                                    {hasDeliveries && <span className="mt-0.5 block text-xs font-semibold text-orange-500">Entrega aquest dia</span>}
                                                </>
                                            ) : (
                                                <span className="text-sm text-zinc-400">Sense classe</span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {selectedSlot && (
                <SelectedSlotPanel
                    selectedSlot={selectedSlot}
                    selectedTimeLabel={selectedTimeLabel}
                    tasks={selectedTasks}
                    onClose={() => setSelectedSlot(null)}
                    className="lg:hidden"
                />
            )}

            <div className="hidden flex-col gap-6 lg:flex lg:flex-row">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex-1">
                    <div className="grid grid-cols-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20">
                        <div className="p-4 text-center text-xs font-semibold text-zinc-400 uppercase flex items-center justify-center border-r border-zinc-200 dark:border-zinc-800">
                            Hora
                        </div>
                        {daysWithDates.map(dayObj => (
                            <div key={dayObj.name} className={`p-4 text-center flex flex-col items-center justify-center border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 ${dayObj.status.isHoliday ? 'bg-red-50/50 dark:bg-red-900/10' : dayObj.isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                <span className={`text-sm font-bold ${dayObj.status.isHoliday ? 'text-red-700 dark:text-red-400' : dayObj.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                    {dayObj.name}
                                </span>
                                <span className={`text-xs mt-0.5 ${dayObj.status.isHoliday ? 'text-red-500/80 dark:text-red-500/60 font-medium' : dayObj.isToday ? 'text-indigo-500 dark:text-indigo-400 font-medium' : 'text-zinc-400'}`} suppressHydrationWarning>
                                    {dayObj.date}
                                </span>
                                {dayObj.status.isHoliday && (
                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-1 uppercase tracking-wider text-center leading-tight">
                                        Festivo
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {timeSlots.map((slot) => {
                            if (slot.isBreak) {
                                return (
                                    <div key={slot.id} className="grid grid-cols-6 min-h-[3rem] bg-zinc-100/50 dark:bg-zinc-900/30">
                                        <div className="p-3 text-center text-xs text-zinc-500 font-medium flex items-center justify-center border-r border-zinc-200 dark:border-zinc-800">
                                            {slot.time}
                                        </div>
                                        <div className="col-span-5 flex items-center justify-center p-3">
                                            <span className="font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.3em] uppercase text-xs">
                                                {slot.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={slot.id} className="grid grid-cols-6 min-h-[6rem]">
                                    <div className="p-4 text-center text-xs text-zinc-500 font-medium border-r border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/10">
                                        {slot.time}
                                    </div>
                                    {daysWithDates.map((dayObj) => {
                                        const day = dayObj.name;

                                        if (dayObj.status.isHoliday) {
                                            return (
                                                <div key={day} className="border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 p-2 relative bg-red-50/30 dark:bg-red-900/5 flex items-center justify-center overflow-hidden">
                                                    <span className="text-red-400/60 dark:text-red-500/30 text-[10px] font-bold uppercase tracking-widest text-center leading-tight">
                                                        {dayObj.status.name}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        const actualSubject = findSubjectForSlot(day, slot.id);
                                        const isSelected = selectedSlot?.day === day && selectedSlot?.timeId === slot.id;

                                        const hasDeliveries = hasDeliveriesForSlot(actualSubject, dayObj.fullDate);

                                        return (
                                            <div key={day} className={`border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 p-1 relative ${dayObj.isToday ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : ''}`}>
                                                {actualSubject ? (
                                                    <div
                                                        onClick={() => setSelectedSlot({ day, subject: actualSubject, timeId: slot.id, fullDate: dayObj.fullDate })}
                                                        className={`h-full w-full rounded-lg p-2 flex flex-col justify-center items-center text-center transition-all cursor-pointer select-none
                                                        ${isSelected
                                                            ? 'ring-2 ring-indigo-500 bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800'
                                                            : hasDeliveries
                                                                ? 'bg-orange-100/80 hover:bg-orange-200/80 dark:bg-orange-900/40 dark:hover:bg-orange-800/50 border border-orange-200 dark:border-orange-800 shadow-sm'
                                                                : 'bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 border border-indigo-100/50 dark:border-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800'}
                                                        `}
                                                    >
                                                        <div className={`font-bold text-xs ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : hasDeliveries ? 'text-orange-900 dark:text-orange-200' : 'text-indigo-700 dark:text-indigo-300'}`}>
                                                            {actualSubject.name}
                                                        </div>
                                                        {hasDeliveries && (
                                                            <div className="mt-1 flex items-center justify-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Side Panel for Selected Subject Details */}
                {selectedSlot && (
                    <SelectedSlotPanel
                        selectedSlot={selectedSlot}
                        selectedTimeLabel={selectedTimeLabel}
                        tasks={selectedTasks}
                        onClose={() => setSelectedSlot(null)}
                        className="w-80 shrink-0 self-start sticky top-8 animate-in slide-in-from-right-8 duration-300"
                    />
                )}
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Próximos Esdeveniments Globales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((evt: any) => (
                        <div key={evt.id} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{evt.title}</h3>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {formatDateTime(evt.start_time)}
                                </p>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && <p className="text-zinc-500">No hi ha esdeveniments propers.</p>}
                </div>
            </div>
        </div>
    );
}

function SelectedSlotPanel({
    selectedSlot,
    selectedTimeLabel,
    tasks,
    onClose,
    className = "",
}: {
    selectedSlot: { day: string, subject: any, timeId: string, fullDate: Date };
    selectedTimeLabel: string;
    tasks: any[];
    onClose: () => void;
    className?: string;
}) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
            <div className="flex items-start justify-between border-b border-zinc-200 bg-indigo-50 p-4 dark:border-zinc-800 dark:bg-indigo-900/20">
                <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold leading-tight text-indigo-950 dark:text-indigo-100">
                        {selectedSlot.subject.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {selectedSlot.day} • {selectedTimeLabel}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    aria-label="Tancar detall"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto p-4">
                <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        Tasques relacionades
                    </h4>
                    <div className="space-y-3">
                        {tasks.length > 0 ? (
                            tasks.map((task: any, idx: number) => {
                                const isDelivered = task.status === 'submitted' || task.status === 'entregado';
                                const isDelayed = new Date(task.due_date) < new Date() && !isDelivered;

                                return (
                                    <Link href={`/dashboard/assignments/${task.id}`} key={task.id || idx} className="group block rounded-xl border border-zinc-100 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80">
                                        <p className="mb-1 text-sm font-medium transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{task.title}</p>
                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <span className="text-xs text-zinc-500">
                                                Vence: {formatDate(task.due_date)}
                                            </span>
                                            {isDelivered ? (
                                                <span className="w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    Lliurat
                                                </span>
                                            ) : isDelayed ? (
                                                <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Amb retard
                                                </span>
                                            ) : (
                                                <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    Pendent
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <p className="text-sm italic text-zinc-500">No hi ha lliuraments aquest dia.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}
