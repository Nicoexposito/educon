import Link from "next/link";
import { ArrowRight, Bell, BookOpen, CalendarDays, GraduationCap, Megaphone, UserCog, Users } from "lucide-react";
import type { AdminSchedule, AdminSubject, AdminUser } from "@/lib/admin-types";

type AdminHomeProps = {
    data: {
        stats: {
            teacherCount: number;
            studentCount: number;
            courseCount: number;
            subjectCount: number;
            activeAnnouncements: number;
        };
        upcomingSchedules: AdminSubject[];
        latestUsers: AdminUser[];
    };
};

export default function AdminHome({ data }: AdminHomeProps) {
    const stats = [
        { label: "Professors actius", value: data.stats.teacherCount, icon: UserCog, tone: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
        { label: "Alumnes actius", value: data.stats.studentCount, icon: Users, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
        { label: "Cursos", value: data.stats.courseCount, icon: GraduationCap, tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" },
        { label: "Assignatures", value: data.stats.subjectCount, icon: BookOpen, tone: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" },
        { label: "Anuncis", value: data.stats.activeAnnouncements, icon: Bell, tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
    ];

    const actions = [
        { href: "/dashboard/admin/users", label: "Crear usuari", description: "Alta de professors i alumnes", icon: UserCog },
        { href: "/dashboard/admin/courses", label: "Organitzar cursos", description: "Assignatures i alumnat per curs", icon: GraduationCap },
        { href: "/dashboard/admin/subjects", label: "Assignatura nova", description: "Professor i horari de classe", icon: BookOpen },
        { href: "/dashboard/admin/schedule", label: "Gestionar horaris", description: "Classes per professor i assignatura", icon: CalendarDays },
        { href: "/dashboard/admin/announcements", label: "Publicar anunci", description: "Comunicació global del centre", icon: Megaphone },
    ];

    return (
        <main className="mx-auto min-h-screen max-w-7xl bg-zinc-50 px-4 py-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Administració del centre</p>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Panell de control</h1>
                    <p className="mt-2 max-w-2xl text-zinc-500">Gestiona usuaris, assignatures, horaris i anuncis globals sense sortir del context del teu institut.</p>
                </div>
                <Link
                    href="/dashboard/admin/users"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 sm:w-auto"
                >
                    <UserCog className="h-4 w-4" />
                    Gestionar usuaris
                </Link>
            </header>

            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <article key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-black tracking-tight">{stat.value}</p>
                                </div>
                                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
                                    <Icon className="h-5 w-5" />
                                </span>
                            </div>
                        </article>
                    );
                })}
            </section>

            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                        >
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-bold">{action.label}</h2>
                                <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
                            </div>
                            <p className="mt-1 text-sm text-zinc-500">{action.description}</p>
                        </Link>
                    );
                })}
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
                    <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                        <h2 className="font-bold">Assignatures i horaris</h2>
                        <p className="mt-1 text-sm text-zinc-500">Una vista rápida de clases configuradas.</p>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {data.upcomingSchedules.map((subject) => (
                            <Link key={subject.id} href={`/dashboard/admin/subjects/${subject.id}`} className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">{subject.name}</p>
                                    <p className="mt-1 truncate text-sm text-zinc-500">{subject.teacher?.full_name || "Sense professor assignat"}</p>
                                </div>
                                <div className="hidden min-w-0 flex-1 text-right text-sm text-zinc-500 md:block">
                                    {formatSchedule(subject)}
                                </div>
                                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                            </Link>
                        ))}
                        {data.upcomingSchedules.length === 0 && (
                            <p className="p-8 text-center text-sm text-zinc-500">Encara no hi ha assignatures configurades.</p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                        <h2 className="font-bold">Últimes altes</h2>
                        <p className="mt-1 text-sm text-zinc-500">Professors i alumnes creats recentment.</p>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {data.latestUsers.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    {(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{user.full_name || user.email}</p>
                                    <p className="truncate text-xs text-zinc-500">{roleLabel(user.role)} · {user.is_active === false ? "Inactiu" : "Actiu"}</p>
                                </div>
                            </div>
                        ))}
                        {data.latestUsers.length === 0 && (
                            <p className="p-8 text-center text-sm text-zinc-500">Encara no hi ha usuaris creats.</p>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

function formatSchedule(subject: AdminSubject) {
    if (subject.schedules?.length) {
        return subject.schedules
            .map((schedule: AdminSchedule) => `${schedule.day_of_week} ${String(schedule.start_time).slice(0, 5)}-${String(schedule.end_time).slice(0, 5)}`)
            .join(", ");
    }
    return "Horari pendent";
}

function roleLabel(role: string | null | undefined) {
    if (role === "teacher") return "Professor";
    if (role === "admin") return "Admin";
    return "Alumne";
}
