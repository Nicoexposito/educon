'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteEvent } from '@/app/actions/events';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function EventOwnerActions({ eventId }: { eventId: string }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setDeleting(true);
        setError('');
        const res = await deleteEvent(eventId);
        if (!res.success) {
            setError(res.error || 'Error al eliminar');
            setDeleting(false);
            setShowConfirm(false);
        } else {
            router.push('/dashboard/events');
        }
    };

    return (
        <>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
                <Link
                    href={`/dashboard/events/${eventId}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                >
                    <Pencil className="w-4 h-4" />
                    Editar
                </Link>
                <button
                    onClick={() => setShowConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-sm"
                >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
            )}

            {/* Confirmation modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !deleting && setShowConfirm(false)}
                    />

                    {/* Dialog */}
                    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-sm w-full text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Trash2 className="w-7 h-7 text-red-500 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                            ¿Eliminar este evento?
                        </h2>
                        <p className="text-zinc-500 text-sm mb-8">
                            Esta acción no se puede deshacer. El evento desaparecerá del calendario de todos tus alumnos.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={deleting}
                                className="flex-1 px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" /> Sí, eliminar</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
