import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getAttendanceData } from "@/lib/data-service";
import { ClipboardCheck } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
    present: "Assisteix",
    absent: "Falta",
    late: "Retard",
    excused: "Justificada",
};

const STATUS_STYLES: Record<string, string> = {
    present: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    absent: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    late: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    excused: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

export default async function AttendancePage() {
    const session = await getSession();
    if (!session) redirect("/");

    const { subjects, attendance } = await getAttendanceData(session.userId as string, session.role as string);
    const rowsBySubject = new Map<string, any[]>();
    attendance.forEach((row: any) => {
        rowsBySubject.set(row.subject_id, [...(rowsBySubject.get(row.subject_id) || []), row]);
    });

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-2">
                    {session.role === "teacher" ? "Control d'assistència" : "Les meves assistències i faltes"}
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Assistències per classe</h1>
                <p className="text-zinc-500 mt-2">
                    {session.role === "teacher"
                        ? "Consulta les llistes desades per assignatura."
                        : "Revisa les teves assistències, faltes, retards i justificades separades per assignatura."}
                </p>
            </header>

            <div className="space-y-6">
                {subjects.map((subject: any) => {
                    const rows = rowsBySubject.get(subject.id) || [];
                    const present = rows.filter((row) => row.status === "present" || row.status === "late").length;
                    const absent = rows.filter((row) => row.status === "absent").length;

                    return (
                        <section key={subject.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                        <ClipboardCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">{subject.name}</h2>
                                        <p className="text-sm text-zinc-500">{rows.length} registres</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 text-xs font-semibold">
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{present} assistències</span>
                                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">{absent} faltes</span>
                                </div>
                            </div>

                            {rows.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">Data</th>
                                                {session.role === "teacher" && <th className="px-5 py-3 font-semibold">Alumne</th>}
                                                <th className="px-5 py-3 font-semibold">Estat</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {rows.map((row: any) => (
                                                <tr key={row.id}>
                                                    <td className="px-5 py-3 whitespace-nowrap">{new Date(row.date).toLocaleDateString("ca-ES")}</td>
                                                    {session.role === "teacher" && <td className="px-5 py-3">{row.student?.full_name || row.student?.email || "Alumne"}</td>}
                                                    <td className="px-5 py-3">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[row.status] || "bg-zinc-100 text-zinc-600"}`}>
                                                            {STATUS_LABELS[row.status] || row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="p-8 text-center text-zinc-500">Encara no hi ha registres d'assistència per a aquesta assignatura.</p>
                            )}
                        </section>
                    );
                })}

                {subjects.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center text-zinc-500">
                        No hi ha assignatures associades.
                    </div>
                )}
            </div>
        </main>
    );
}
