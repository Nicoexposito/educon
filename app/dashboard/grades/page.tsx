import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getGradesData } from "@/lib/data-service";
import { Award } from "lucide-react";

export default async function GradesPage() {
    const session = await getSession();
    if (!session) redirect("/");
    if (session.role !== "student") redirect("/dashboard");

    const { submissions, gradeRows } = await getGradesData(session.userId as string);
    const allGrades = [
        ...submissions.map((row: any) => ({
            id: `submission-${row.id}`,
            subject: row.assignment?.subject?.name || "Sense assignatura",
            title: row.assignment?.title || "Treball",
            score: Number(row.grade),
            max: 10,
            feedback: row.feedback,
            date: row.submitted_at,
        })),
        ...gradeRows.map((row: any) => ({
            id: `grade-${row.id}`,
            subject: row.grade_item?.subject?.name || "Sense assignatura",
            title: row.grade_item?.name || "Qualificació",
            score: Number(row.score),
            max: Number(row.grade_item?.max_score || 10),
            feedback: row.feedback,
            date: null,
        })),
    ];

    const average = allGrades.length
        ? (allGrades.reduce((sum, grade) => sum + (grade.score / grade.max) * 10, 0) / allGrades.length).toFixed(1)
        : "—";

    return (
        <main className="mx-auto min-h-screen max-w-6xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-2">Finestra de qualificacions</p>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notes finals</h1>
                    <p className="text-zinc-500 mt-2">Totes les teves notes publicades per assignatura i treballs corregits.</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 py-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mitjana global</p>
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{average}</p>
                </div>
            </header>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {allGrades.length > 0 ? (
                    <>
                    <div className="grid gap-3 p-4 md:hidden">
                        {allGrades.map((grade) => (
                            <article key={grade.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{grade.subject}</p>
                                        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{grade.title}</p>
                                    </div>
                                    <span className={`inline-flex shrink-0 justify-center rounded-full px-3 py-1 text-sm font-bold ${grade.score >= grade.max / 2 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                                        {grade.score}/{grade.max}
                                    </span>
                                </div>
                                {grade.feedback && <p className="mt-3 line-clamp-2 text-xs text-zinc-500">{grade.feedback}</p>}
                                <p className="mt-3 text-xs font-semibold text-zinc-400">
                                    {grade.date ? new Date(grade.date).toLocaleDateString("ca-ES") : "—"}
                                </p>
                            </article>
                        ))}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Assignatura</th>
                                    <th className="px-6 py-4 font-semibold">Elemento</th>
                                    <th className="px-6 py-4 font-semibold">Data</th>
                                    <th className="px-6 py-4 font-semibold text-right">Nota</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {allGrades.map((grade) => (
                                    <tr key={grade.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                        <td className="px-6 py-4 font-semibold">{grade.subject}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{grade.title}</p>
                                            {grade.feedback && <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{grade.feedback}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                                            {grade.date ? new Date(grade.date).toLocaleDateString("ca-ES") : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex min-w-16 justify-center px-3 py-1 rounded-full text-sm font-bold ${grade.score >= grade.max / 2 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                                                {grade.score}/{grade.max}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </>
                ) : (
                    <div className="p-14 text-center text-zinc-500">
                        <Award className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                        <p className="font-semibold">Encara no hi ha qualificacions publicades.</p>
                    </div>
                )}
            </section>
        </main>
    );
}
