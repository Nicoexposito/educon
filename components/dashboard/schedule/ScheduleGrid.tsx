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
        if (offset === 0) return "Semana Actual";
        const today = new Date();
        const day = today.getDay() || 7; 
        const mondayStr = new Date(today);
        mondayStr.setDate(today.getDate() - day + 1 + (offset * 7));
        
        const sundayStr = new Date(mondayStr);
        sundayStr.setDate(mondayStr.getDate() + 6);

        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return `${mondayStr.toLocaleDateString('es-ES', options)} - ${sundayStr.toLocaleDateString('es-ES', options)}`;
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

        // Festivos de Cataluña (Fechas fijas)
        const fixedHolidays = [
            { m: 1, d: 1, name: "Año Nuevo" },
            { m: 1, d: 6, name: "Reyes" },
            { m: 5, d: 1, name: "Día del Trabajador" },
            { m: 6, d: 24, name: "Sant Joan" },
            { m: 8, d: 15, name: "Asunción" },
            { m: 9, d: 11, name: "La Diada" },
            { m: 10, d: 12, name: "Día de la Hispanidad" },
            { m: 11, d: 1, name: "Tots Sants" },
            { m: 12, d: 6, name: "Día de la Constitución" },
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

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Horario Escolar</h1>
                    <p className="text-zinc-500">Vista semanal de clases y eventos.</p>
                </div>
                <div className="flex items-center gap-2">
                    {weekOffset !== 0 && (
                        <button 
                            onClick={() => setWeekOffset(0)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md transition-colors"
                        >
                            Hoy
                        </button>
                    )}
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <button 
                            onClick={() => setWeekOffset(prev => prev - 1)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                            title="Semana anterior"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-500" />
                        </button>
                        <span className="text-sm font-medium px-2 min-w-[120px] text-center" suppressHydrationWarning>
                            {getWeekDateRange(weekOffset)}
                        </span>
                        <button 
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                            title="Semana siguiente"
                        >
                            <ChevronRight className="w-5 h-5 text-zinc-500" />
                        </button>
                        <div className="relative flex items-center border-l border-zinc-200 dark:border-zinc-800 pl-1 ml-1">
                            <input 
                                type="date" 
                                onChange={handleDateChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title="Seleccionar fecha"
                            />
                            <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors pointer-events-none">
                                <CalendarIcon className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
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

                                        let hasDeliveries = false;
                                        if (actualSubject) {
                                            hasDeliveries = assignments.some(a => {
                                                if (a.subject_id !== actualSubject.id && a.subject?.name !== actualSubject.name) return false;
                                                const dueDate = new Date(a.due_date);
                                                return dueDate.toDateString() === dayObj.fullDate.toDateString();
                                            });
                                        }

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
                    <div className="w-full lg:w-80 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg animate-in slide-in-from-right-8 duration-300 shrink-0 self-start sticky top-8">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-indigo-50 dark:bg-indigo-900/20 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-indigo-950 dark:text-indigo-100 leading-tight">
                                    {selectedSlot.subject.name}
                                </h3>
                                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                                    {selectedSlot.day} • {timeSlots.find(t => t.id === selectedSlot.timeId)?.time}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedSlot(null)}
                                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-zinc-400" />
                                    Tareas Relacionadas
                                </h4>
                                <div className="space-y-3">
                                    {getSubjectDetails(selectedSlot.subject, selectedSlot.fullDate).length > 0 ? (
                                        getSubjectDetails(selectedSlot.subject, selectedSlot.fullDate).map((task: any, idx: number) => {
                                            const isDelivered = task.status === 'submitted' || task.status === 'entregado';
                                            const isDelayed = new Date(task.due_date) < new Date() && !isDelivered;

                                            return (
                                                <Link href={`/dashboard/assignments/${task.id}`} key={idx} className="block p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group">
                                                    <p className="font-medium text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-zinc-500">
                                                            Vence: {formatDate(task.due_date)}
                                                        </span>
                                                        {isDelivered ? (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                                Entregado
                                                            </span>
                                                        ) : isDelayed ? (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Con Retraso
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                                                Pendiente
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            )
                                        })
                                    ) : (
                                        <p className="text-sm text-zinc-500 italic">No entrega nada ese dia.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Próximos Eventos Globales</h2>
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
                    {events.length === 0 && <p className="text-zinc-500">No hay eventos próximos.</p>}
                </div>
            </div>
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}
