import { getSession } from "@/lib/session";
import { getAllAssignments } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default async function AssignmentsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const assignments = await getAllAssignments(session.userId as string, session.role as string);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {session.role === 'teacher' ? 'Gestión de Tareas' : 'Mis Tareas'}
                </h1>
                <p className="text-zinc-500">
                    {session.role === 'teacher' 
                        ? 'Revisa y califica las entregas de tus alumnos.' 
                        : 'Consulta tus tareas pendientes y entregadas.'}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">Título</th>
                                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">Asignatura</th>
                                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">Fecha de Entrega</th>
                                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">Estado</th>
                                <th className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {assignments.map((assignment: any) => (
                                <tr key={assignment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{assignment.title}</div>
                                        <div className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{assignment.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                            {assignment.subject?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        {new Date(assignment.due_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {session.role === 'teacher' ? (
                                             <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                <UsersCount count={assignment.submissions?.[0]?.count || 0} />
                                             </div>
                                        ) : (
                                            <StatusBadge status={assignment.status} grade={assignment.grade} />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                                            {session.role === 'teacher' ? 'Calificar' : (assignment.status === 'submitted' ? 'Ver corrección' : 'Entregar')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {assignments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No hay tareas disponibles.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, grade }: { status: string, grade?: number }) {
    if (grade !== undefined && grade !== null) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${grade >= 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                Note: {grade}
            </span>
        );
    }
    if (status === 'submitted') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Entregado
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
             <AlertCircle className="w-3.5 h-3.5" /> Pendiente
        </span>
    );
}

function UsersCount({ count }: { count: number }) {
    return (
        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
            {count} entregas
        </span>
    )
}
