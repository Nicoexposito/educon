'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/app/actions/events';
import { CalendarDays, MapPin, Image as ImageIcon, Type, AlignLeft, BookOpen, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export function CreateEventForm({ subjects }: { subjects: { id: string; name: string }[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Live preview state
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageUrl(URL.createObjectURL(file));
        } else {
            setImageUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const res = await createEvent(formData);

        if (!res.success) {
            setError(res.error || "Error en crear l'esdeveniment.");
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard/events');
            }, 1500);
        }
    };

    if (success) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-12 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Esdeveniment creat!</h2>
                <p className="text-zinc-500">L'esdeveniment s'ha publicat correctament per als teus alumnes.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-zinc-100 dark:border-zinc-800 transition-all">
            {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Form Fields */}
                <div className="space-y-6">

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                            <Type className="w-4 h-4 text-indigo-500" /> Títol de l'esdeveniment
                        </label>
                        <input
                            name="title"
                            required
                            placeholder="Ex. Sortida al museu d'història"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-indigo-500" /> Descripció
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Detalls sobre l'esdeveniment..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-indigo-500" /> Inici
                            </label>
                            <input
                                type="datetime-local"
                                name="start_time"
                                required
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" /> Fi
                            </label>
                            <input
                                type="datetime-local"
                                name="end_time"
                                required
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Type & Subject */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Tipus</label>
                            <select
                                name="type"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                            >
                                <option value="general">General</option>
                                <option value="exam">Examen</option>
                                <option value="activity">Activitat</option>
                                <option value="trip">Excursión</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-500" /> Assignatura (opcional)
                            </label>
                            <select
                                name="subject_id"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                            >
                                <option value="">-- Cap --</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location & Image */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-indigo-500" /> Ubicació / Lloc
                            </label>
                            <input
                                name="location"
                                placeholder="Ex. Museu del Prado, Madrid"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-indigo-500" /> Foto de portada
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                name="image"
                                onChange={handleImageChange}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-400"
                            />
                            <p className="text-xs text-zinc-500 mt-1">Puja una foto que representi aquest esdeveniment.</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Preview */}
                <div className="hidden lg:flex flex-col">
                    <label className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-widest text-center">Vista Previa</label>
                    <div className="flex-1 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/50">

                        {/* Mock Event Card */}
                        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            {imageUrl ? (
                                <div
                                    className="h-48 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${imageUrl})` }}
                                />
                            ) : (
                                <div className="h-48 bg-linear-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-indigo-500/30" />
                                </div>
                            )}
                            <div className="p-6">
                                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">
                                    PRÓXIMAMENTE
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                    {title || "T\u00edtol de l'esdeveniment"}
                                </h3>
                                <div className="mt-6 flex items-center justify-between text-zinc-400">
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <MapPin className="w-4 h-4" /> Ubicació
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                    disabled={loading}
                    className="bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group shadow-xl shadow-zinc-200 dark:shadow-indigo-900/20"
                >
                    {loading ? 'Creant esdeveniment...' : 'Publicar esdeveniment'}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
            </div>
        </form>
    );
}
