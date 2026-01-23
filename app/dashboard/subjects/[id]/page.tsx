import { getSession } from "@/lib/session";
import { getSubjectDetails } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, Users, Link as LinkIcon, Download, Plus } from "lucide-react";
import Link from "next/link";
import { AIPlaceholder } from "@/components/ai/AIPlaceholder";

export default async function SubjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const data = await getSubjectDetails(id, session.role as string);

    if (!data) {
        return <div className="p-8">Asignatura no encontrada</div>;
    }

    const { subject, assignments, resources, students } = data;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-7xl mx-auto">
            <Link href="/dashboard/subjects" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Asignaturas
            </Link>

            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 mb-8 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-60" />
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                             <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                                Curso 2024-25
                             </span>
                            <h1 className="text-4xl font-bold mb-2">{subject.name}</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">{subject.description || "Sin descripción disponible."}</p>
                            
                            <div className="flex items-center gap-6 mt-6 text-sm font-medium">
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{assignments?.length || 0} Tareas</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                    <Users className="w-4 h-4" />
                                    <span>{students.length} Alumnos</span>
                                </div>
                            </div>
                        </div>
                        
                        {session.role === 'teacher' && (
                             <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-all flex item-center gap-2">
                                <Plus className="w-5 h-5" />
                                Editar Curso
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column: Content & Assignments */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Assignments */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Tareas y Entregas
                            </h2>
                             {session.role === 'teacher' && (
                                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/10 px-3 py-1.5 rounded-lg transition-colors">
                                    + Crear Tarea
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {assignments?.map((assignment: any) => (
                                <div key={assignment.id} className="group p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-zinc-50/50 dark:bg-zinc-800/30 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">{assignment.title}</h3>
                                            <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{assignment.description}</p>
                                        </div>
                                         <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                            {new Date(assignment.due_date).toLocaleDateString()}
                                         </span>
                                    </div>
                                </div>
                            ))}
                            {(!assignments || assignments.length === 0) && (
                                <div className="text-center py-8 text-zinc-400 text-sm">No hay tareas asignadas.</div>
                            )}
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                         <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-emerald-600" />
                                Contenidos y Recursos
                            </h2>
                            {session.role === 'teacher' && (
                                <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-lg transition-colors">
                                    + Subir Archivo
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                             {resources?.map((resource: any) => (
                                <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                            {resource.type === 'pdf' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{resource.title}</div>
                                            <div className="text-xs text-zinc-500 capitalize">{resource.type}</div>
                                        </div>
                                    </div>
                                    <button className="p-2 text-zinc-400 hover:text-zinc-600">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!resources || resources.length === 0) && (
                                <div className="text-center py-8 text-zinc-400 text-sm">No hay contenidos publicados.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column: Students (Teacher) or Info (Student) */}
                <div className="space-y-8">
                    {session.role === 'teacher' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Alumnos ({students.length})
                            </h2>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {students.map((student: any) => (
                                    <div key={student.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">
                                            {student.email ? student.email.substring(0, 2).toUpperCase() : 'ST'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">{student.email || "Estudiante"}</div>
                                            <div className="text-xs text-zinc-400">Online hace 2h</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {session.role === 'teacher' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4">Herramientas IA</h2>
                            <div className="space-y-3">
                                <AIPlaceholder 
                                    label="Generar Resumen" 
                                    description="Crea un resumen del contenido actual." 
                                />
                                <AIPlaceholder 
                                    label="Sugerir Tareas" 
                                    description="Genera ideas de evaluación basadas en el temario." 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
