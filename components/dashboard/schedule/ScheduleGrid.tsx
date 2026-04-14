"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

export function ScheduleGrid({ subjects, events, assignments }: { subjects: any[], events: any[], assignments: any[] }) {
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, subject: any, timeId: string } | null>(null);

    const days = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];
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
    const getSubjectDetails = (subjObj: any) => {
        // In a completely real app, we'd filter by checking if assignment.subject_id === subjObj.id
        // Here we do that if the subject is real
        const relatedAssignments = assignments.filter(a => a.subject_id === subjObj.id || a.subject?.name === subjObj.name);
        return relatedAssignments;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Horario Escolar</h1>
                    <p className="text-zinc-500">Vista semanal de clases y eventos.</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                        <ChevronLeft className="w-5 h-5 text-zinc-500" />
                    </button>
                    <span className="text-sm font-medium px-2">Semana Actual</span>
                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex-1">
                    <div className="grid grid-cols-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20">
                        <div className="p-4 text-center text-xs font-semibold text-zinc-400 uppercase flex items-center justify-center border-r border-zinc-200 dark:border-zinc-800">
                            Hora
                        </div>
                        {days.map(day => (
                            <div key={day} className="p-4 text-center text-sm font-bold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0">
                                {day}
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
                                    {days.map((day) => {
                                        const actualSubject = findSubjectForSlot(day, slot.id);

                                        const isSelected = selectedSlot?.day === day && selectedSlot?.timeId === slot.id;

                                        return (
                                            <div key={day} className="border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 p-1 relative">
                                                {actualSubject ? (
                                                    <div 
                                                        onClick={() => setSelectedSlot({ day, subject: actualSubject, timeId: slot.id })}
                                                        className={`h-full w-full rounded-lg p-2 flex flex-col justify-center items-center text-center transition-all cursor-pointer select-none ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800' : 'bg-indigo-50/50 hover:bg-indigo-100/50  dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 border border-indigo-100/50 dark:border-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800'} `}
                                                    >
                                                        <div className={`font-bold text-xs ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-indigo-700 dark:text-indigo-300'}`}>
                                                            {actualSubject.name}
                                                        </div>
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
                                    {getSubjectDetails(selectedSlot.subject).length > 0 ? (
                                        getSubjectDetails(selectedSlot.subject).map((task: any, idx: number) => {
                                            const isDelivered = task.status === 'submitted' || task.status === 'entregado';
                                            const isDelayed = new Date(task.due_date) < new Date() && !isDelivered;

                                            return (
                                                <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                    <p className="font-medium text-sm mb-1">{task.title}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-zinc-500">
                                                            Vence: {new Date(task.due_date).toLocaleDateString()}
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
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <p className="text-sm text-zinc-500 italic">No hay tareas para esta asignatura.</p>
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
                                    {new Date(evt.start_time).toLocaleDateString()} at {new Date(evt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
