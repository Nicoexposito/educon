import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Mail, Phone, Shield, UserRound } from "lucide-react";
import type { ElementType } from "react";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) redirect("/");

    const { id } = await params;
    const supabase = await createClient();

    const [{ data: student }, { data: enrollments }] = await Promise.all([
        supabase
            .from("users")
            .select("id, full_name, email, phone, role, avatar_url")
            .eq("id", id)
            .single(),
        supabase
            .from("enrollments")
            .select("subject:subjects(id, name, schedules:subject_schedules(*))")
            .eq("student_id", id),
    ]);

    if (!student) {
        return (
            <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 text-zinc-900 dark:text-zinc-100">
                <Link href="/dashboard/subjects" className="mb-6 inline-flex items-center text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Link>
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                    Alumno no encontrado o sin permiso de acceso.
                </div>
            </main>
        );
    }

    const subjects = enrollments?.map((row: any) => row.subject).filter(Boolean) || [];

    return (
        <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 text-zinc-900 dark:text-zinc-100 sm:px-6 lg:px-8">
            <Link href="/dashboard/subjects" className="mb-6 inline-flex items-center text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a materias
            </Link>

            <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-800/30 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Página del alumno</p>
                    <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black text-white shadow-lg shadow-indigo-500/20">
                            {student.full_name
                                ? student.full_name.split(" ").map((part: string) => part[0]).slice(0, 2).join("").toUpperCase()
                                : student.email?.slice(0, 2).toUpperCase() || "AL"}
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-3xl font-black">{student.full_name || "Alumno"}</h1>
                            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
                                <Shield className="h-4 w-4" />
                                {student.role === "student" ? "Alumno" : "Usuario"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-100 p-5 dark:border-zinc-800">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-zinc-500">
                            <UserRound className="h-4 w-4" />
                            Contacto
                        </h2>
                        <div className="space-y-3">
                            <InfoLine icon={Mail} label="Correo" value={student.email || "Sin correo"} />
                            <InfoLine icon={Phone} label="Teléfono" value={student.phone || "Sin teléfono"} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-100 p-5 dark:border-zinc-800">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-zinc-500">
                            <BookOpen className="h-4 w-4" />
                            Asignaturas
                        </h2>
                        <div className="space-y-2">
                            {subjects.map((subject: any) => (
                                <Link
                                    key={subject.id}
                                    href={`/dashboard/subjects/${subject.id}`}
                                    className="block rounded-xl bg-zinc-50 px-3 py-2 text-sm font-semibold transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:bg-zinc-800/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                                >
                                    {subject.name}
                                </Link>
                            ))}
                            {subjects.length === 0 && (
                                <p className="text-sm text-zinc-500">No hay asignaturas visibles.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

function InfoLine({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
            <Icon className="h-4 w-4 text-zinc-400" />
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</p>
                <p className="truncate text-sm font-semibold">{value}</p>
            </div>
        </div>
    );
}
