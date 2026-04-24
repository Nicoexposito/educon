'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEvent } from '@/app/actions/events';
import { CalendarDays, MapPin, Image as ImageIcon, Type, AlignLeft, BookOpen, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

// Reuse the same aesthetic as CreateEventForm but pre-filled
export function EditEventForm({ event, subjects }: {
    event: any;
    subjects: { id: string; name: string }[];
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(event.image_url || null);

    const toDatetimeLocal = (isoString: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setImageUrl(file ? URL.createObjectURL(file) : event.image_url || null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const formData = new FormData(e.currentTarget);
        const res = await updateEvent(event.id, formData);
        if (!res.success) {
            setError(res.error || 'Error al actualizar el evento.');
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => router.push(`/dashboard/events/${event.id}`), 1200);
        }
    };

    if (success) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-12 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">¡Evento Actualizado!</h2>
                <p className="text-zinc-500">Los cambios han sido guardados correctamente.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-zinc-100 dark:border-zinc-800">
            {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                            <Type className="w-4 h-4 text-indigo-500" /> Título del Evento
                        </label>
                        <input name="title" required defaultValue={event.title}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-indigo-500" /> Descripción
                        </label>
                        <textarea name="description" rows={3} defaultValue={event.description || ''}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-indigo-500" /> Inicio
                            </label>
                            <input type="datetime-local" name="start_time" required defaultValue={toDatetimeLocal(event.start_time)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" /> Fin
                            </label>
                            <input type="datetime-local" name="end_time" required defaultValue={toDatetimeLocal(event.end_time)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Tipo</label>
                            <select name="type" defaultValue={event.type || 'general'}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none">
                                <option value="general">General</option>
                                <option value="exam">Examen</option>
                                <option value="activity">Actividad</option>
                                <option value="trip">Excursión</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-500" /> Asignatura
                            </label>
                            <select name="subject_id" defaultValue={event.subject_id || ''}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none">
                                <option value="">-- Ninguna --</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-indigo-500" /> Ubicación / Lugar
                            </label>
                            <input name="location" defaultValue={event.location || ''}
                                placeholder="Ej. Museo del Prado, Madrid"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-indigo-500" /> Cambiar Foto
                            </label>
                            <input type="file" accept="image/*" name="image" onChange={handleImageChange}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-400" />
                            <p className="text-xs text-zinc-500">Deja vacío para mantener la foto actual.</p>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="hidden lg:flex flex-col">
                    <label className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-widest text-center">Vista Previa</label>
                    <div className="flex-1 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/50">
                        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            {imageUrl ? (
                                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
                            ) : (
                                <div className="h-48 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-indigo-500/30" />
                                </div>
                            )}
                            <div className="p-6">
                                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">Evento Actualizado</div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">{event.title}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                <button type="button" onClick={() => router.back()}
                    className="px-6 py-4 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                    Cancelar
                </button>
                <button disabled={loading}
                    className="bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 group shadow-xl">
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
            </div>
        </form>
    );
}
